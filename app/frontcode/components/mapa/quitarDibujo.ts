/**
 * Al desmontar el mapa (cambio de página, recarga o el doble montaje de React en desarrollo), Mapbox
 * borra su estilo antes de que React quite el control de dibujo. MapboxDraw.onRemove pregunta entonces
 * por sus capas (`map.getLayer` / `map.getSource`) a un estilo que ya no existe y lanza
 * "Cannot read properties of undefined (reading 'getOwnLayer')".
 *
 * Esto envuelve onRemove: si el estilo ya no está, sus capas tampoco, así que esas dos preguntas
 * responden "no hay" mientras dura la limpieza. El resto (eventos, botones, clases) se limpia igual.
 */
interface MapaQuitable {
  style?: unknown;
  getLayer: unknown;
  getSource: unknown;
}

type Quitar = (map: MapaQuitable) => unknown;

export function protegerQuitar<C extends { onRemove(map: never): unknown }>(control: C): C {
  const quitar = (control.onRemove as unknown as Quitar).bind(control);
  const protegido: Quitar = (map) => {
    if (map.style) return quitar(map);
    const { getLayer, getSource } = map;
    map.getLayer = () => undefined;
    map.getSource = () => undefined;
    try {
      return quitar(map);
    } finally {
      map.getLayer = getLayer;
      map.getSource = getSource;
    }
  };
  (control as unknown as { onRemove: Quitar }).onRemove = protegido;
  return control;
}
