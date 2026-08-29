import AdminShell from "@/components/AdminShell";
import ConceptForm from "@/components/ConceptForm";

export default function NewConceptPage() {
  return (
    <AdminShell>
      <h1 className="font-display" style={{ marginTop: 0 }}>
        Yeni Konsept
      </h1>
      <ConceptForm />
    </AdminShell>
  );
}
