import { describe, it, expect } from "vitest";
import {
  ROLES, ROLE_LABEL, CANONICAL_ROLES_FOR_COMPLETE_BUILD,
  roleKey, roleDisplay,
  ROLE_SHORT, ROLE_FROM_SHORT,
  encodeProjectShare, parseShareHash,
} from "./roles.js";

describe("roleKey", () => {
  it("maps canonical keys to themselves", () => {
    expect(roleKey("upper-radiator")).toBe("upper-radiator");
    expect(roleKey("bypass")).toBe("bypass");
  });
  it("collapses any custom:... variant to 'custom'", () => {
    expect(roleKey("custom")).toBe("custom");
    expect(roleKey("custom:My Role")).toBe("custom");
  });
  it("returns null for empty/null", () => {
    expect(roleKey("")).toBe(null);
    expect(roleKey(null)).toBe(null);
    expect(roleKey(undefined)).toBe(null);
  });
});

describe("roleDisplay", () => {
  it("uses the canonical label", () => {
    expect(roleDisplay("upper-radiator")).toBe("Upper radiator");
  });
  it("expands custom:<text> to the text", () => {
    expect(roleDisplay("custom:Coolant Recovery")).toBe("Coolant Recovery");
  });
  it("defaults plain 'custom' to 'Custom'", () => {
    expect(roleDisplay("custom")).toBe("Custom");
  });
  it("returns empty string for empty input", () => {
    expect(roleDisplay("")).toBe("");
    expect(roleDisplay(null)).toBe("");
  });
});

describe("ROLES structure", () => {
  it("has exactly 8 canonical entries", () => {
    expect(ROLES.length).toBe(8);
  });
  it("ROLE_LABEL covers every role key", () => {
    for (const r of ROLES) expect(ROLE_LABEL[r.key]).toBe(r.label);
  });
  it("canonical build roles are a subset of ROLES", () => {
    for (const k of CANONICAL_ROLES_FOR_COMPLETE_BUILD) {
      expect(ROLES.some((r) => r.key === k)).toBe(true);
    }
  });
  it("ROLE_SHORT and ROLE_FROM_SHORT are bijective", () => {
    for (const [key, short] of Object.entries(ROLE_SHORT)) {
      expect(ROLE_FROM_SHORT[short]).toBe(key);
    }
  });
});

describe("encodeProjectShare / parseShareHash round-trip", () => {
  it("round-trips name + partNos + roles", () => {
    const project = {
      name: "1967 Camaro rebuild",
      partNos: ["24183", "24276", "12021"],
      roles: {
        "24183": "upper-radiator",
        "24276": "lower-radiator",
        "12021": "heater-feed",
      },
    };
    const hash = encodeProjectShare(project);
    expect(hash.startsWith("#/share?")).toBe(true);
    const back = parseShareHash(hash);
    expect(back.name).toBe(project.name);
    expect(back.partNos).toEqual(project.partNos);
    expect(back.roles).toEqual(project.roles);
  });

  it("omits roles on parts without an assignment", () => {
    const project = { name: "Plain", partNos: ["11111", "22222"], roles: {} };
    const hash = encodeProjectShare(project);
    const back = parseShareHash(hash);
    expect(back.partNos).toEqual(["11111", "22222"]);
    expect(back.roles).toEqual({});
  });

  it("encodes custom roles as the generic 'c' short code", () => {
    // Custom labels are dropped on share intentionally — they're too free-form
    const project = {
      name: "Custom labels",
      partNos: ["11111"],
      roles: { "11111": "custom:Coolant Recovery" },
    };
    const hash = encodeProjectShare(project);
    const back = parseShareHash(hash);
    expect(back.roles["11111"]).toBe("custom");
  });

  it("typical 6-hose build fits well under 320 chars", () => {
    const project = {
      name: "SBC 350 cooling rebuild",
      partNos: ["24183", "24276", "12021", "23260", "18010", "24198"],
      roles: {
        "24183": "upper-radiator",
        "24276": "lower-radiator",
        "12021": "heater-feed",
        "23260": "heater-return",
        "18010": "bypass",
        "24198": "degas-overflow",
      },
    };
    const hash = encodeProjectShare(project);
    expect(hash.length).toBeLessThan(320);
  });
});

describe("parseShareHash edge cases", () => {
  it("returns null for non-share hashes", () => {
    expect(parseShareHash("#/project/abc")).toBe(null);
    expect(parseShareHash("")).toBe(null);
    expect(parseShareHash("#anything")).toBe(null);
  });

  it("returns null when no partNos present", () => {
    expect(parseShareHash("#/share?n=Empty&h=")).toBe(null);
    expect(parseShareHash("#/share?n=Empty")).toBe(null);
  });

  it("ignores unknown short role codes silently, keeping the part", () => {
    const hash = "#/share?n=Test&h=12345:zz,67890:ur";
    const out = parseShareHash(hash);
    expect(out.partNos).toEqual(["12345", "67890"]);
    expect(out.roles["12345"]).toBeUndefined();
    expect(out.roles["67890"]).toBe("upper-radiator");
  });

  it("trims name and caps length at 60", () => {
    const longName = "x".repeat(200);
    const hash = `#/share?n=${encodeURIComponent(longName)}&h=1`;
    const out = parseShareHash(hash);
    expect(out.name.length).toBe(60);
  });
});
