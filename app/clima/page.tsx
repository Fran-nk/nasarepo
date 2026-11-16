import { SeccionClima } from "@/app/frontcode/components/secciones/SeccionClima";
import { Titulo } from "@/app/frontcode/components/Titulo";

export default function Clima() {
  return (
    <div className="flex flex-col gap-6">
      <Titulo texto="El clima en tu cultivo" />
      <SeccionClima />
    </div>
  );
}
