import type { Priority } from "../types";

export type FacilityInfo = {
  name: string;
  type: "Hospital" | "Clinic" | "Pharmacy";
  distance: string;
  hours: string;
  phone: string;
};

const FACILITY_LOOKUP: Record<string, FacilityInfo> = {
  colombo: {
    name: "National Hospital Colombo",
    type: "Hospital",
    distance: "0.8 km",
    hours: "Open 24/7",
    phone: "0112 691 111",
  },
  galle: {
    name: "Karapitiya Teaching Hospital",
    type: "Hospital",
    distance: "1.2 km",
    hours: "Open 24/7",
    phone: "0912 234 567",
  },
  kandy: {
    name: "Kandy Teaching Hospital",
    type: "Hospital",
    distance: "0.9 km",
    hours: "Open 24/7",
    phone: "0812 222 261",
  },
  matara: {
    name: "Matara General Hospital",
    type: "Hospital",
    distance: "1.5 km",
    hours: "Open 24/7",
    phone: "0412 222 261",
  },
  jaffna: {
    name: "Jaffna Teaching Hospital",
    type: "Hospital",
    distance: "1.1 km",
    hours: "Open 24/7",
    phone: "0212 222 261",
  },
  default: {
    name: "Nearest Regional Hospital",
    type: "Hospital",
    distance: "~2 km",
    hours: "Open 24/7",
    phone: "011",
  },
};

export function facilityByLocation(location: string, priority: Priority): FacilityInfo {
  const lower = location.toLowerCase();
  let base = FACILITY_LOOKUP.default;
  for (const key of ["colombo", "galle", "kandy", "matara", "jaffna"]) {
    if (lower.includes(key)) {
      base = FACILITY_LOOKUP[key];
      break;
    }
  }

  if (priority === "P1") {
    return { ...base, type: "Hospital" };
  }
  if (priority === "P2") {
    return { ...base, type: base.type === "Hospital" ? "Hospital" : "Clinic" };
  }
  return {
    ...base,
    name: base.name.includes("Pharmacy") ? base.name : `${base.name} Area Clinic`,
    type: "Pharmacy",
  };
}

export function recommendedFacilityType(priority: Priority): string {
  if (priority === "P1") return "Nearest HOSPITAL (emergency capable)";
  if (priority === "P2") return "Nearest CLINIC or HOSPITAL";
  return "Nearest PHARMACY or CLINIC";
}
