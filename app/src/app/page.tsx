import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ConceptCard from "@/components/ConceptCard";
import Reveal from "@/components/Reveal";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const concepts = await prisma.concept.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });

  return (
    <>
      <Navbar />

      <section className="container" style={{ padding: "40px 0 70px" }}>
        <div className="hero-grid">
          <Reveal>
            <div className="hero-text-block">
              <p className="eyebrow">Nişan &middot; Söz &middot; Özel Davetler</p>
              <h1
                className="font-display"
                style={{ fontSize: "clamp(36px, 5vw, 58px)", margin: "14px 0 20px", color: "var(--ink)" }}
              >
                Hikayeniz İçin <span style={{ color: "var(--gold-deep)" }}>Eşsiz Konseptler</span>
              </h1>
              <p style={{ fontSize: 20, color: "var(--ink-soft)", maxWidth: 520 }}>
                MEF Organizasyon olarak, nişan ve söz törenleriniz için zarafeti sadelikle
                buluşturan sahne tasarımları hazırlıyoruz. Her anınız, özel ve unutulmaz olsun.
              </p>
              <div className="cta-row" style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 32 }}>
                <a href="/talep" className="btn">
                  Organizasyon Talep Et
                </a>
                <a href="#konseptler" className="btn btn-outline">
                  Konseptleri Gör
                </a>
              </div>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div
              className="card"
              style={{ position: "relative", aspectRatio: "3 / 5", overflow: "hidden", maxWidth: 360, margin: "0 auto" }}
            >
              <Image src="/images/mef-hero.jpg" alt="MEF Organizasyon" fill style={{ objectFit: "cover" }} priority />
            </div>
          </Reveal>
        </div>
      </section>

      <section id="konseptler" className="container" style={{ padding: "20px 0 80px" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <p className="eyebrow">Sahne Tasarımları</p>
            <h2 className="font-display" style={{ fontSize: "clamp(28px, 4vw, 40px)", margin: "10px 0" }}>
              Konseptlerimiz
            </h2>
            <div className="gold-divider" />
          </div>
        </Reveal>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 28,
          }}
        >
          {concepts.map((c, i) => (
            <Reveal key={c.id} delay={(i % 3) * 100}>
              <ConceptCard slug={c.slug} name={c.name} subtitle={c.subtitle} imageUrl={c.imageUrl} />
            </Reveal>
          ))}
        </div>
      </section>

      <section id="hakkimizda" className="container" style={{ padding: "20px 0 80px" }}>
        <Reveal>
          <div
            className="card"
            style={{ padding: "clamp(24px, 6vw, 48px) clamp(20px, 5vw, 40px)", textAlign: "center", maxWidth: 800, margin: "0 auto" }}
          >
            <p className="eyebrow">Hakkımızda</p>
            <h2 className="font-display" style={{ fontSize: 30, margin: "10px 0 16px" }}>
              MEF Organizasyon
            </h2>
            <p style={{ color: "var(--ink-soft)", fontSize: 20 }}>
              Nişan ve söz törenleriniz için özenle tasarlanmış sahne konseptleri, zarif çiçek
              düzenlemeleri ve sıcak ışıklandırmalarla unutulmaz anlar yaratıyoruz. Seçtiğiniz
              konsept, talep ettiğiniz tarih için size özel olarak ayrılır.
            </p>
          </div>
        </Reveal>
      </section>

      <Footer />
    </>
  );
}
