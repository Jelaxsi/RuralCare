export const hospitalConfig = {
  name: process.env.NEXT_PUBLIC_HOSPITAL_NAME?.trim() || "",
  location: process.env.NEXT_PUBLIC_HOSPITAL_LOCATION?.trim() || "",
  primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR ?? "#6C63FF",
  logoUrl: process.env.NEXT_PUBLIC_HOSPITAL_LOGO ?? "",
};

export const hasHospitalName = Boolean(hospitalConfig.name);

export const WARD_OPTIONS = [
  "Emergency",
  "General Medicine",
  "Pediatrics",
  "Maternity",
  "Surgery",
  "ICU",
  "Outpatient",
  "Rural Outreach",
] as const;
