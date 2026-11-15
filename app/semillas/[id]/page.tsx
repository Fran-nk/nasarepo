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
    <Suspense fallback={<div className="animate-pulse rounded-2xl bg-white p-4 text-lg text-stone-400">Cargando…</div>}>
      <Ficha params={params} />
    </Suspense>
  );
}
