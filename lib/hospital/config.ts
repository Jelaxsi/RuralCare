export const hospitalConfig = {
  name: process.env.NEXT_PUBLIC_HOSPITAL_NAME ?? "Kandy Teaching Hospital",
  location: process.env.NEXT_PUBLIC_HOSPITAL_LOCATION ?? "Kandy, Sri Lanka",
  primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR ?? "#1e3a5f",
  logoUrl: process.env.NEXT_PUBLIC_HOSPITAL_LOGO ?? "",
};

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
