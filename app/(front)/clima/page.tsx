import { SeccionClima } from "@/app/front/components/secciones/SeccionClima";
import { Titulo } from "@/app/front/components/Titulo";
import { Volver } from "@/app/front/components/Volver";

export default function Clima() {
  return (
    <div className="flex flex-col gap-4">
      <Volver href="/" texto="Mi cultivo" />
      <Titulo texto="El clima en tu cultivo" />
      <SeccionClima />
    </div>
  );
}
