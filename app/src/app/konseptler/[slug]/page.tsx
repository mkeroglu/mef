import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import ConceptGalleryViewer from "@/components/ConceptGalleryViewer";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ConceptPage({ params }: { params: { slug: string } }) {
  const concept = await prisma.concept.findUnique({
    where: { slug: params.slug },
    include: { images: { orderBy: { order: "asc" }, select: { id: true } } },
  });
  if (!concept || !concept.active) notFound();

  const images = [concept.imageUrl, ...concept.images.map((img) => `/api/images/concept-gallery/${img.id}`)];

  return (
    <>
      <Navbar />
      <section className="container" style={{ padding: "20px 0 80px" }}>
        <div className="hero-grid">
          <Reveal>
            <ConceptGalleryViewer images={images} alt={concept.name} />
          </Reveal>
          <Reveal delay={150}>
            <div className="hero-text-block">
              <p className="eyebrow">Sahne Tasarımı</p>
              <h1 className="font-display" style={{ fontSize: "clamp(30px, 4vw, 44px)", margin: "10px 0 16px" }}>
                {concept.name}
              </h1>
              <p style={{ fontSize: 20, color: "var(--gold-deep)", marginBottom: 18 }}>{concept.subtitle}</p>
              <p style={{ color: "var(--ink-soft)", fontSize: 19, whiteSpace: "pre-line" }}>{concept.description}</p>
              <div className="cta-row" style={{ display: "flex" }}>
                <a href={`/talep?konsept=${concept.slug}`} className="btn" style={{ marginTop: 28 }}>
                  Bu Konsept İçin Talep Oluştur
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      <Footer />
    </>
  );
}
