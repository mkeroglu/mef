import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const concepts = [
  {
    slug: "incili-konsept",
    name: "İncili Konsept",
    subtitle: "Zarafet ve sadeliğin incilerle buluşması",
    description:
      "Zarafet ve sadeliği incinin ışıltısıyla buluşturan İncili Konsept, beyaz ve ekru tonlarının ferahlığını, incilerin zarif dokunuşuyla taçlandırıyor. İnci detaylı perde düzeni, şık ışıklandırmalar ve minimal dekor öğeleriyle unutulmaz anlara ev sahipliği yapıyor.",
    imageUrl: "/images/concepts/incili-konsept.jpg",
    order: 1,
  },
  {
    slug: "kum-saati-labirent-konsept",
    name: "Kum Saati Labirent Konsept",
    subtitle: "Zamanın zarafeti, sonsuz aşk yolculuğu",
    description:
      "Kum saatinin zarafeti ile labirent formunun modern çizgilerini buluşturan bu konsept, eşsiz bir sahne tasarımı sunuyor. Labirent detayları sonsuz aşk yolculuğunu simgelerken, kum saati formu zamanın kıymetini ve birlikte geçirilen her anın özel olduğunu vurguluyor.",
    imageUrl: "/images/concepts/kum-saati-labirent-konsept.jpg",
    order: 2,
  },
  {
    slug: "perdeli-konsept",
    name: "Perdeli Konsept",
    subtitle: "Akıcı kumaşlar, romantik bir atmosfer",
    description:
      "Zarafet ve sadeliği modern bir dokunuşla buluşturan Perdeli Konsept, akıcı kumaş dokuları, şık ışıklandırmalar ve zarif çiçek detaylarıyla romantik bir atmosfer sunuyor. Perdelerin yumuşaklığı ve ışığın büyüsüyle unutulmaz anlara ev sahipliği yapıyor.",
    imageUrl: "/images/concepts/perdeli-konsept.jpg",
    order: 3,
  },
  {
    slug: "sirius-model-1",
    name: "Sirius Model 1",
    subtitle: "Şık kemer tasarımı, romantik ambiyans",
    description:
      "Zarafet ve sadeliğin modern dokunuşlarla buluştuğu Sirius Konsept, beyaz tonların ferahlığını canlı çiçek detayları ve sıcak ışıklarla tamamlıyor. Şık kemer tasarımı, romantik ambiyansı ve minimal dekor öğeleriyle söz, nişan ve özel davetlerinize unutulmaz bir atmosfer katıyor.",
    imageUrl: "/images/concepts/sirius-model-1.jpg",
    order: 4,
  },
  {
    slug: "sirius-kum-saati-konsept",
    name: "Sirius Kum Saati Konsept",
    subtitle: "Zamansız bir atmosfer",
    description:
      "Zarafet ve sadeliğin modern dokunuşlarla buluştuğu Sirius Kum Saati Konsept, beyaz tonların ferahlığını kum saati formunun estetik çizgileriyle birleştiriyor. Işıklı detaylar, çiçek düzenlemeleri ve minimal dekor öğeleriyle zamansız bir atmosfer oluşturarak unutulmaz anlara ev sahipliği yapıyor.",
    imageUrl: "/images/concepts/sirius-kum-saati-konsept.jpg",
    order: 5,
  },
];

const optionGroups: {
  key: string;
  label: string;
  type: "SINGLE_SELECT" | "BOOLEAN";
  helpText?: string;
  required: boolean;
  order: number;
  options?: { label: string; order: number }[];
}[] = [
  {
    key: "sehpa",
    label: "Orta Sehpa ve Yan Sehpa Seçimi",
    type: "SINGLE_SELECT",
    required: true,
    order: 1,
    options: [
      { label: "Silindir", order: 1 },
      { label: "Kum Saati", order: 2 },
      { label: "Dikdörtgen Sütun", order: 3 },
    ],
  },
  {
    key: "cicek",
    label: "Konsept Çiçek Seçimi",
    type: "SINGLE_SELECT",
    required: true,
    order: 2,
    options: [
      { label: "Labirent Beyaz Çiçek", order: 1 },
      { label: "Labirent Pembe Çiçek", order: 2 },
      { label: "Perdeli Pembe Çiçek", order: 3 },
      { label: "Aura Model Çiçeği", order: 4 },
    ],
  },
  {
    key: "sandalye-tipi",
    label: "Oturulan Sandalye Tipi",
    type: "SINGLE_SELECT",
    required: false,
    order: 3,
    options: [
      { label: "Puf", order: 1 },
      { label: "Pleksi Sandalye", order: 2 },
    ],
  },
  {
    key: "neon-yazi",
    label: "Neon Yazı Tipi",
    type: "SINGLE_SELECT",
    required: true,
    order: 4,
    options: [
      { label: "Better Together", order: 1 },
      { label: "Daima Aşk İle", order: 2 },
      { label: "Hikayemiz Başlıyor", order: 3 },
    ],
  },
  {
    key: "tepsi",
    label: "Kahve Tepsisi ve Yüzük Tepsisi",
    type: "SINGLE_SELECT",
    required: true,
    order: 5,
    options: [
      { label: "Gold Model", order: 1 },
      { label: "Gümüş Model", order: 2 },
      { label: "İstemiyorum", order: 3 },
    ],
  },
  {
    key: "ekstra-ayna",
    label: "Ekstra: Karşılama Aynası ve Yazıları",
    type: "BOOLEAN",
    helpText: "500 TL",
    required: true,
    order: 6,
  },
  {
    key: "ekstra-sandalye",
    label: "Ekstra: Misafir Sandalyesi",
    type: "BOOLEAN",
    helpText: "Adet başı 100 TL — istiyorsanız notunuza kaç adet istediğinizi yazın",
    required: true,
    order: 7,
  },
  {
    key: "ekstra-ses-sistemi",
    label: "Ekstra: Ses Sistemi (Polosmart FS117)",
    type: "BOOLEAN",
    helpText: "500 TL",
    required: false,
    order: 8,
  },
];

async function main() {
  for (const c of concepts) {
    await prisma.concept.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    });
  }

  for (const g of optionGroups) {
    const group = await prisma.optionGroup.upsert({
      where: { key: g.key },
      update: {
        label: g.label,
        type: g.type,
        helpText: g.helpText,
        required: g.required,
        order: g.order,
      },
      create: {
        key: g.key,
        label: g.label,
        type: g.type,
        helpText: g.helpText,
        required: g.required,
        order: g.order,
      },
    });

    for (const o of g.options ?? []) {
      const existing = await prisma.option.findFirst({ where: { groupId: group.id, label: o.label } });
      if (existing) {
        await prisma.option.update({ where: { id: existing.id }, data: { order: o.order } });
      } else {
        await prisma.option.create({ data: { groupId: group.id, label: o.label, order: o.order } });
      }
    }
  }

  const adminEmail = process.env.ADMIN_EMAIL || "admin@mef-organizasyon.com";
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error("ADMIN_PASSWORD env var is required to seed the admin user");
  }
  const existingAdmin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.adminUser.create({ data: { email: adminEmail, passwordHash } });
  }
  // Intentionally does not overwrite the password on re-seed: the admin may
  // have changed it via the admin panel since the initial seed.

  console.log("Seed complete:", concepts.length, "concepts,", optionGroups.length, "option groups,", "admin:", adminEmail);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
