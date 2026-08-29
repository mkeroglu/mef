"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import ConceptForm from "@/components/ConceptForm";

export default function EditConceptPage({ params }: { params: { id: string } }) {
  const [concept, setConcept] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/admin/concepts/${params.id}`)
      .then((r) => r.json())
      .then(setConcept);
  }, [params.id]);

  return (
    <AdminShell>
      <h1 className="font-display" style={{ marginTop: 0 }}>
        Konsepti Düzenle
      </h1>
      {concept && <ConceptForm initial={concept} />}
    </AdminShell>
  );
}
