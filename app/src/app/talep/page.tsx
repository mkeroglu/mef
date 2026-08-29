import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RequestForm from "@/components/RequestForm";

export default function TalepPage() {
  return (
    <>
      <Navbar />
      <section className="container" style={{ padding: "20px 0 80px", maxWidth: 720, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <p className="eyebrow">İletişime Geçin</p>
          <h1 className="font-display" style={{ fontSize: "clamp(28px, 4vw, 40px)", margin: "10px 0" }}>
            Organizasyon Talebi
          </h1>
          <p style={{ color: "var(--ink-soft)" }}>
            Tarihinizi ve konseptinizi seçin, ekibimiz sizin için o günü ayırsın.
          </p>
        </div>
        <Suspense fallback={null}>
          <RequestForm />
        </Suspense>
      </section>
      <Footer />
    </>
  );
}
