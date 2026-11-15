import { Suspense } from "react";
import { FichaSemilla } from "@/components/semillas/FichaSemilla";
import catalogo from "@/mocks/semillas.json";

export function generateStaticParams() {
  return catalogo.semillas.map((s) => ({ id: s.id }));
}

async function Ficha({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FichaSemilla id={id} />;
}

export default function PaginaSemilla({ params }: PageProps<"/semillas/[id]">) {
  return (
    <Suspense fallback={<div className="animate-pulse rounded-[20px] bg-white p-4 text-lg text-secundario/70">Cargando…</div>}>
      <Ficha params={params} />
    </Suspense>
  );
}
