import { Suspense } from "react";
import { FichaSemilla } from "@/app/frontcode/components/semillas/FichaSemilla";
import catalogo from "@/app/frontcode/datos/semillas.json";

export function generateStaticParams() {
  return catalogo.semillas.map((s) => ({ id: s.id }));
}

async function Ficha({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FichaSemilla id={id} />;
}

export default function PaginaSemilla({ params }: PageProps<"/semillas/[id]">) {
  return (
    <Suspense fallback={<div role="status" className="esqueleto h-40 rounded-[16px]"><span className="sr-only">Cargando…</span></div>}>
      <Ficha params={params} />
    </Suspense>
  );
}
