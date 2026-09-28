import { prisma } from "./db";
import { encryptSecret } from "./crypto";

const SETTINGS_ID = "singleton";

// MySQL doesn't allow a DEFAULT on TEXT columns, so these two live here
// instead of in the schema and are only applied when the singleton row is
// first created.
const DEFAULT_EMAIL_BODY_TEMPLATE =
  "Yeni bir organizasyon talebi geldi, detaylar aşağıda. Admin panelden onaylayabilir veya reddedebilirsiniz.";
const DEFAULT_CUSTOMER_CONFIRM_BODY_TEMPLATE =
  "Merhaba {{customerName}}, {{eventDate}} tarihli {{concept}} konsept talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz. Bizi tercih ettiğiniz için teşekkür ederiz.";

export async function getSettings() {
  const settings = await prisma.settings.findUnique({ where: { id: SETTINGS_ID } });
  if (settings) return settings;
  return prisma.settings.create({
    data: {
      id: SETTINGS_ID,
      emailBodyTemplate: DEFAULT_EMAIL_BODY_TEMPLATE,
      customerConfirmBodyTemplate: DEFAULT_CUSTOMER_CONFIRM_BODY_TEMPLATE,
    },
  });
}

export type SettingsUpdateInput = {
  smtpHost?: string | null;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string | null;
  smtpPassword?: string; // plaintext, only present when the admin sets/changes it
  smtpFromEmail?: string | null;
  smtpFromName?: string;
  notifyToEmail?: string | null;
  emailSubjectTemplate?: string;
  emailBodyTemplate?: string;
  customerConfirmSubjectTemplate?: string;
  customerConfirmBodyTemplate?: string;
  whatsappBusinessNumber?: string | null;
};

export async function updateSettings(input: SettingsUpdateInput) {
  const { smtpPassword, ...rest } = input;
  const data: Record<string, unknown> = { ...rest };
  if (smtpPassword) {
    data.smtpPasswordEnc = encryptSecret(smtpPassword);
  }
  return prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    update: data,
    create: {
      id: SETTINGS_ID,
      emailBodyTemplate: DEFAULT_EMAIL_BODY_TEMPLATE,
      customerConfirmBodyTemplate: DEFAULT_CUSTOMER_CONFIRM_BODY_TEMPLATE,
      ...data,
    },
  });
}

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}
