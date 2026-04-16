// Project store: holds the user's projects (BOM-style hose lists), the
// active selection, per-part roles + notes, and shortlist operations.
// Persists to localStorage and migrates from the legacy single-shortlist
// key on first load. Deletion is soft for ~5s so the toast Undo can
// restore. UI orchestration (e.g. opening the shortlist tray, mobile
// exclusivity) is parameterised via the `onShortlistAdded` callback so
// this hook stays decoupled from the compare/shortlist mutex.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bookmark, Trash2 } from "lucide-react";

export const SHORTLIST_LIMIT = 20;
export const PROJECTS_LIMIT = 12;
const SHORTLIST_KEY = "hosefinder-shortlist";
const PROJECTS_KEY = "hosefinder-projects";
const ACTIVE_PROJECT_KEY = "hosefinder-active-project";
const DEFAULT_PROJECT_NAME = "Shortlist";

export function makeProjectId() {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function loadProjectsState() {
  if (typeof window === "undefined") {
    const empty = { id: makeProjectId(), name: DEFAULT_PROJECT_NAME, createdAt: Date.now(), partNos: [] };
    return { projects: [empty], activeId: empty.id };
  }
  try {
    const rawProjects = window.localStorage.getItem(PROJECTS_KEY);
    if (rawProjects) {
      const projects = JSON.parse(rawProjects);
      if (Array.isArray(projects) && projects.length > 0) {
        const activeId = window.localStorage.getItem(ACTIVE_PROJECT_KEY) || projects[0].id;
        const found = projects.find((p) => p.id === activeId);
        return { projects, activeId: found ? activeId : projects[0].id };
      }
    }
    const rawShortlist = window.localStorage.getItem(SHORTLIST_KEY);
    const partNos = rawShortlist ? JSON.parse(rawShortlist) : [];
    const first = {
      id: makeProjectId(),
      name: DEFAULT_PROJECT_NAME,
      createdAt: Date.now(),
      partNos: Array.isArray(partNos) ? partNos.filter((p) => typeof p === "string") : [],
    };
    return { projects: [first], activeId: first.id };
  } catch {
    const empty = { id: makeProjectId(), name: DEFAULT_PROJECT_NAME, createdAt: Date.now(), partNos: [] };
    return { projects: [empty], activeId: empty.id };
  }
}

/**
 * @param {{
 *   pushToast: (message: string, opts?: any) => void,
 *   onShortlistAdded?: () => void,
 * }} opts
 */
export function useProjects({ pushToast, onShortlistAdded }) {
  const [{ projects, activeId: activeProjectId }, setProjectsState] = useState(loadProjectsState);
  const [shortlistWarning, setShortlistWarning] = useState("");
  const [pendingDeletion, setPendingDeletion] = useState(null);

  const setProjects = useCallback((updater) => {
    setProjectsState((prev) => {
      const nextList = typeof updater === "function" ? updater(prev.projects) : updater;
      let nextActive = prev.activeId;
      if (!nextList.some((p) => p.id === nextActive)) nextActive = nextList[0]?.id ?? null;
      return { projects: nextList, activeId: nextActive };
    });
  }, []);

  const setActiveProjectId = useCallback((id) => {
    setProjectsState((prev) => prev.projects.some((p) => p.id === id) ? { ...prev, activeId: id } : prev);
  }, []);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || projects[0],
    [projects, activeProjectId],
  );
  const shortlist = useMemo(() => new Set(activeProject?.partNos || []), [activeProject]);

  // ── Persistence ────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
      if (activeProjectId) window.localStorage.setItem(ACTIVE_PROJECT_KEY, activeProjectId);
      const active = projects.find((p) => p.id === activeProjectId);
      window.localStorage.setItem(SHORTLIST_KEY, JSON.stringify(active?.partNos || []));
    } catch {}
  }, [projects, activeProjectId]);

  // ── Shortlist warning auto-clear ───────────────────────────────────────
  useEffect(() => {
    if (!shortlistWarning) return undefined;
    const t = setTimeout(() => setShortlistWarning(""), 2800);
    return () => clearTimeout(t);
  }, [shortlistWarning]);

  // ── Pending-deletion cleanup on unmount ────────────────────────────────
  useEffect(() => {
    return () => { if (pendingDeletion?.timeoutId) clearTimeout(pendingDeletion.timeoutId); };
  }, [pendingDeletion]);

  // ── Per-part editors ───────────────────────────────────────────────────
  const updateProjectNote = useCallback((projectId, partNo, text) => {
    setProjects((prev) => prev.map((p) => {
      if (p.id !== projectId) return p;
      const nextNotes = { ...(p.notes || {}) };
      if (text) nextNotes[partNo] = text;
      else delete nextNotes[partNo];
      return { ...p, notes: nextNotes };
    }));
  }, [setProjects]);

  const updateProjectRole = useCallback((projectId, partNo, role) => {
    setProjects((prev) => prev.map((p) => {
      if (p.id !== projectId) return p;
      const nextRoles = { ...(p.roles || {}) };
      if (role) nextRoles[partNo] = role;
      else delete nextRoles[partNo];
      return { ...p, roles: nextRoles };
    }));
  }, [setProjects]);

  const dismissMissingBanner = useCallback((projectId) => {
    setProjects((prev) => prev.map((p) =>
      p.id === projectId ? { ...p, dismissedMissingBanner: true } : p,
    ));
  }, [setProjects]);

  const clearProjectNotes = useCallback((projectId) => {
    if (!window.confirm("Clear all notes on this project?")) return;
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, notes: {} } : p));
  }, [setProjects]);

  const removeFromProject = useCallback((projectId, partNo) => {
    setProjects((prev) => prev.map((p) => {
      if (p.id !== projectId) return p;
      const nextNotes = { ...(p.notes || {}) };
      delete nextNotes[partNo];
      return { ...p, partNos: p.partNos.filter((x) => x !== partNo), notes: nextNotes };
    }));
  }, [setProjects]);

  // ── Shortlist (active project) ─────────────────────────────────────────
  const toggleShortlist = useCallback((partNo) => {
    let outcome = "noop";
    setProjectsState((prev) => {
      const active = prev.projects.find((p) => p.id === prev.activeId) || prev.projects[0];
      if (!active) return prev;
      const set = new Set(active.partNos);
      if (set.has(partNo)) {
        set.delete(partNo);
        outcome = "removed";
      } else if (set.size >= SHORTLIST_LIMIT) {
        outcome = "full";
        return prev;
      } else {
        set.add(partNo);
        outcome = "added";
      }
      const nextProjects = prev.projects.map((p) =>
        p.id === active.id ? { ...p, partNos: [...set] } : p,
      );
      return { ...prev, projects: nextProjects };
    });
    const name = activeProject?.name || "shortlist";
    if (outcome === "removed") {
      pushToast(`Removed ${partNo} from ${name}`, { icon: Bookmark });
    } else if (outcome === "added") {
      onShortlistAdded?.();
      setShortlistWarning("");
      pushToast(`Saved ${partNo} to ${name}`, { icon: Bookmark });
    } else if (outcome === "full") {
      setShortlistWarning(`Project full. Remove a part before adding more than ${SHORTLIST_LIMIT}.`);
      pushToast(`Project full (${SHORTLIST_LIMIT})`, { tone: "warning" });
    }
  }, [activeProject, onShortlistAdded, pushToast]);

  const clearShortlist = useCallback(() => {
    if (shortlist.size === 0) return;
    if (!window.confirm(`Clear all parts from "${activeProject?.name || "shortlist"}"?`)) return;
    setProjects((prev) => prev.map((p) =>
      p.id === activeProjectId ? { ...p, partNos: [] } : p,
    ));
  }, [shortlist.size, activeProject, activeProjectId, setProjects]);

  // ── Project CRUD ───────────────────────────────────────────────────────
  const createProject = useCallback((name, seedPartNos = []) => {
    const trimmed = (name || "").trim() || `Project ${projects.length + 1}`;
    if (projects.length >= PROJECTS_LIMIT) {
      pushToast(`Project limit reached (${PROJECTS_LIMIT}). Delete one first.`, { tone: "warning" });
      return null;
    }
    const project = { id: makeProjectId(), name: trimmed, createdAt: Date.now(), partNos: [...seedPartNos] };
    setProjectsState((prev) => ({ projects: [...prev.projects, project], activeId: project.id }));
    pushToast(`Created "${trimmed}"`, { icon: Bookmark });
    return project.id;
  }, [projects.length, pushToast]);

  const renameProject = useCallback((id, name) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, name: trimmed } : p));
  }, [setProjects]);

  const duplicateProject = useCallback((id) => {
    const src = projects.find((p) => p.id === id);
    if (!src) return;
    if (projects.length >= PROJECTS_LIMIT) {
      pushToast(`Project limit reached (${PROJECTS_LIMIT}).`, { tone: "warning" });
      return;
    }
    const copy = { id: makeProjectId(), name: `${src.name} (copy)`, createdAt: Date.now(), partNos: [...src.partNos] };
    setProjectsState((prev) => ({ projects: [...prev.projects, copy], activeId: copy.id }));
    pushToast(`Duplicated "${src.name}"`, { icon: Bookmark });
  }, [projects, pushToast]);

  const deleteProject = useCallback((id) => {
    const target = projects.find((p) => p.id === id);
    if (!target) return;
    if (projects.length === 1) {
      if (!window.confirm(`"${target.name}" is the only project. Clear its parts instead?`)) return;
      setProjects((prev) => prev.map((p) => p.id === id ? { ...p, partNos: [] } : p));
      return;
    }
    setProjectsState((prev) => {
      const remaining = prev.projects.filter((p) => p.id !== id);
      const nextActive = prev.activeId === id ? remaining[0]?.id : prev.activeId;
      return { projects: remaining, activeId: nextActive };
    });
    const timeoutId = setTimeout(() => setPendingDeletion(null), 5000);
    setPendingDeletion({ project: target, timeoutId });
    pushToast(`Deleted "${target.name}"`, {
      icon: Trash2,
      action: {
        label: "Undo",
        onClick: () => {
          clearTimeout(timeoutId);
          setPendingDeletion(null);
          setProjectsState((prev) => ({ projects: [...prev.projects, target], activeId: target.id }));
        },
      },
    });
  }, [projects, setProjects, pushToast]);

  const addImportedProject = useCallback((payload) => {
    if (projects.length >= PROJECTS_LIMIT) {
      pushToast(`Project limit reached (${PROJECTS_LIMIT}). Delete one first.`, { tone: "warning" });
      return false;
    }
    const newProject = {
      id: makeProjectId(),
      name: payload.name,
      createdAt: Date.now(),
      partNos: [...payload.partNos],
      roles: { ...payload.roles },
      notes: {},
    };
    setProjectsState((prev) => ({ projects: [...prev.projects, newProject], activeId: newProject.id }));
    window.location.hash = `#/project/${newProject.id}`;
    return true;
  }, [projects.length, pushToast]);

  return {
    projects, activeProjectId, activeProject, shortlist,
    setProjects, setProjectsState, setActiveProjectId,
    shortlistWarning, setShortlistWarning,
    pendingDeletion,
    updateProjectNote, updateProjectRole, dismissMissingBanner,
    clearProjectNotes, removeFromProject,
    toggleShortlist, clearShortlist,
    createProject, renameProject, duplicateProject, deleteProject,
    addImportedProject,
  };
}
