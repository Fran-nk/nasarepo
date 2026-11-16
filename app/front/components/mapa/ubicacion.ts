import { crearCultivo } from "@/app/front/lib/almacen";
import type { ApiMapa } from "./ContextoMapa";

/**
 * Guarda la ubicación actual del celular como un cultivo nuevo y mueve el mapa allí.
 * `onExito` recibe el id del cultivo ya guardado. Si `vigente()` da false cuando llega
 * la respuesta del GPS (el agricultor canceló mientras buscaba), no se guarda nada.
 */
export function usarUbicacionActual(
  api: ApiMapa | null,
  onError: (mensaje: string) => void,
  onExito?: (cultivoId: number) => void,
  vigente: () => boolean = () => true,
  nombre?: string | null,
) {
  if (!("geolocation" in navigator)) {
    onError("Tu celular no permite saber la ubicación.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      if (!vigente()) return;
      const { latitude: lat, longitude: lon } = pos.coords;
      void crearCultivo({ lat, lon, origen: "ubicacion" }, nombre).then((id) => onExito?.(id));
      api?.irA(lat, lon);
    },
    () => vigente() && onError("No pudimos saber dónde estás. Revisa que el GPS esté prendido y da permiso."),
    { enableHighAccuracy: true, timeout: 15_000 },
  );
}
