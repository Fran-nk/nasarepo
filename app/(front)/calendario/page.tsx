import { SeccionCalendario } from "@/app/front/components/secciones/SeccionCalendario";
import { Titulo } from "@/app/front/components/Titulo";

export default function Calendario() {
  return (
    <div className="flex flex-col gap-6">
      <Titulo texto="Calendario de mis cultivos" bajada="Cuándo sembraste, cuándo cosechas y lo que hiciste." />
      <SeccionCalendario />
    </div>
  );
}
