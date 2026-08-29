export default function Footer() {
  return (
    <footer style={{ padding: "48px 0 32px", marginTop: 60 }}>
      <div className="container" style={{ textAlign: "center" }}>
        <div className="gold-divider" />
        <p className="font-display" style={{ fontSize: 22, color: "var(--gold-deep)" }}>
          MEF Organizasyon
        </p>
        <p style={{ color: "var(--ink-soft)" }}>Her anınız, özel ve unutulmaz olsun.</p>
        <p style={{ color: "var(--ink-soft)", fontSize: 15, marginTop: 18 }}>
          &copy; {new Date().getFullYear()} MEF Organizasyon. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  );
}
