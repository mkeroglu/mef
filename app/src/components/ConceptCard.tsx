import Image from "next/image";
import Link from "next/link";

export default function ConceptCard({
  slug,
  name,
  subtitle,
  imageUrl,
}: {
  slug: string;
  name: string;
  subtitle: string;
  imageUrl: string;
}) {
  return (
    <Link
      href={`/konseptler/${slug}`}
      className="card"
      style={{
        display: "block",
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3" }}>
        <Image src={imageUrl} alt={name} fill style={{ objectFit: "cover" }} sizes="(max-width: 768px) 100vw, 33vw" />
      </div>
      <div style={{ padding: "20px 22px 26px" }}>
        <h3 className="font-display" style={{ fontSize: 24, margin: "0 0 6px", color: "var(--gold-deep)" }}>
          {name}
        </h3>
        <p style={{ margin: 0, color: "var(--ink-soft)" }}>{subtitle}</p>
      </div>
    </Link>
  );
}
