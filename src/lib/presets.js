// Common application presets — "SBC 350 upper radiator" etc. Each preset
// pre-fills dimension + tolerance + flow state so a builder who knows their
// platform can skip the calipers. The `why` string is the contract with the
// user: it explains where the numbers came from, so picking a preset is
// never a blind action.
//
// Cross-check against `data/hoses.json` before adding: a useful preset
// should return 8–30 matches. If it returns zero, widen tolerances until it
// does — or drop the preset.

/**
 * @typedef {{
 *   label: string,
 *   sub: string,
 *   why: string,
 *   targetId1: string,
 *   targetId2: string,
 *   targetLen: string,
 *   lenTol: number,
 *   idTol: number,
 *   flow: "single" | "reducer" | "branched",
 *   icon: "engine" | "heater" | "bottle" | "branch",
 * }} Preset
 */

/** @type {Preset[]} */
export const PRESETS = [
  {
    label: "SBC 350/305",
    sub: "Upper radiator",
    why: "Chevy small-block factory neck: 1.50\" water-pump outlet stepping up to a 1.75\" radiator inlet.",
    targetId1: "1.50", targetId2: "1.75", targetLen: "17",
    lenTol: 3, idTol: 0.06, flow: "reducer", icon: "engine",
  },
  {
    label: "LS swap",
    sub: "Upper radiator",
    why: "GM LS-series has matched 1.50\" necks on both ends — typical swap into a small-block chassis.",
    targetId1: "1.50", targetId2: "1.50", targetLen: "18",
    lenTol: 4, idTol: 0.06, flow: "single", icon: "engine",
  },
  {
    label: "BBC 454",
    sub: "Upper radiator",
    why: "Big-block Chevy runs larger 1.75\" necks both sides to move the higher coolant volume.",
    targetId1: "1.75", targetId2: "1.75", targetLen: "22",
    lenTol: 4, idTol: 0.08, flow: "single", icon: "engine",
  },
  {
    label: "Heater bypass",
    sub: "Small block",
    why: "Short 3/4\" line routing heater-delete coolant back to the water pump — keeps thermostat happy when the heater core is bypassed.",
    targetId1: "0.75", targetId2: "", targetLen: "8",
    lenTol: 3, idTol: 0.06, flow: "single", icon: "heater",
  },
  {
    label: "Heater core",
    sub: "Universal",
    why: "Standard 3/4\" heater-core run from engine to firewall. Length is the big variable — adjust to your routing.",
    targetId1: "0.75", targetId2: "", targetLen: "20",
    lenTol: 5, idTol: 0.06, flow: "single", icon: "heater",
  },
  {
    label: "Degas / overflow",
    sub: "Universal",
    why: "Thin 5/8\" line to the coolant recovery / degas bottle. Slight wall pressure, low flow — small I.D. is fine.",
    targetId1: "0.63", targetId2: "", targetLen: "15",
    lenTol: 5, idTol: 0.08, flow: "single", icon: "bottle",
  },
  {
    label: "Bypass tee",
    sub: "Branched universal",
    why: "Y-split for bypass circuits — 3/4\" feed branching to a 5/8\" leg. Common on cross-flow radiators with auxiliary takeoffs.",
    targetId1: "0.75", targetId2: "0.63", targetLen: "9",
    lenTol: 3, idTol: 0.08, flow: "branched", icon: "branch",
  },
];
