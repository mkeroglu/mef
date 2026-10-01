/**
 * Single source of truth for organization types and the "who are we asking
 * about" name-field labels that depend on them. Imported by both the public
 * request form (client) and the server (requests API, admin detail page,
 * notification emails) so the labeling always stays consistent everywhere.
 */

export const ORG_TYPE_OPTIONS = [
  { value: "SOZ", label: "Söz" },
  { value: "NISAN", label: "Nişan" },
  { value: "DUGUN", label: "Düğün" },
  { value: "KINA", label: "Kına" },
  { value: "SUNNET", label: "Sünnet" },
  { value: "DOGUM_GUNU", label: "Doğum Günü" },
  { value: "BRIDE_TO_BE", label: "Bride to Be" },
  { value: "DIGER", label: "Diğer" },
] as const;

export type OrganizationTypeValue = (typeof ORG_TYPE_OPTIONS)[number]["value"];

export const ORG_TYPE_VALUES = ORG_TYPE_OPTIONS.map((o) => o.value) as [
  OrganizationTypeValue,
  ...OrganizationTypeValue[]
];

export const ORG_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  ORG_TYPE_OPTIONS.map((o) => [o.value, o.label])
);

export type NameFieldConfig = { primary: string; secondary: string | null };

const NAME_FIELD_CONFIG: Record<string, NameFieldConfig> = {
  SOZ: { primary: "Gelin Adı Soyadı", secondary: "Damat Adı Soyadı" },
  NISAN: { primary: "Gelin Adı Soyadı", secondary: "Damat Adı Soyadı" },
  DUGUN: { primary: "Gelin Adı Soyadı", secondary: "Damat Adı Soyadı" },
  KINA: { primary: "Kına Sahibinin Adı Soyadı", secondary: "Eşinin/Nişanlısının Adı Soyadı" },
  BRIDE_TO_BE: { primary: "Gelin Adayının Adı Soyadı", secondary: null },
  SUNNET: { primary: "Çocuğun Adı Soyadı", secondary: null },
  DOGUM_GUNU: { primary: "Davet Sahibinin Adı Soyadı", secondary: null },
  DIGER: { primary: "Ad Soyad", secondary: null },
};

const DEFAULT_NAME_FIELDS: NameFieldConfig = { primary: "Ad Soyad", secondary: "2. Ad Soyad (opsiyonel)" };

export function getNameFieldConfig(orgType: string | null | undefined): NameFieldConfig {
  if (!orgType) return DEFAULT_NAME_FIELDS;
  return NAME_FIELD_CONFIG[orgType] || DEFAULT_NAME_FIELDS;
}

/** Builds the customer's display name from the two collected name fields,
 * omitting the second one when the event type doesn't use it. */
export function buildCustomerName(primary: string, secondary: string | null | undefined): string {
  const p = primary.trim();
  const s = secondary?.trim();
  return s ? `${p} & ${s}` : p;
}
