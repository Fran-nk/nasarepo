import { SeccionClima } from "@/app/frontcode/components/secciones/SeccionClima";
import { Titulo } from "@/app/frontcode/components/Titulo";
import { Volver } from "@/app/frontcode/components/Volver";

export default function Clima() {
  return (
    <div className="flex flex-col gap-4">
      <Volver href="/" texto="Mi cultivo" />
      <Titulo texto="El clima en tu cultivo" />
      <SeccionClima />
    </div>
  );
}
