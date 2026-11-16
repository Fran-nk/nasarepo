"""
Extrae de ECOCROP (FAO) los rangos agronómicos de las semillas del catálogo y los guarda en
app/back/datos/ecocrop.json. Es la fuente real que pide docs/plan-modelo.md (capa 1).

Fuente: base ECOCROP de la FAO, tal como la publica el paquete de R Recocrop
(https://github.com/cropmodels/Recocrop, archivo inst/parameters/ecocrop.rds).

Uso (fuera de la app, una sola vez; el JSON resultante sí va en el repositorio):
    python -m venv .venv && .venv/bin/pip install pyreadr pandas
    curl -L -o ecocrop.rds https://raw.githubusercontent.com/cropmodels/Recocrop/master/inst/parameters/ecocrop.rds
    .venv/bin/python scripts/ecocrop/extraer_ecocrop.py ecocrop.rds
"""
import json
import sys
from datetime import date
from pathlib import Path

import pyreadr

# id del catálogo -> (nombre científico en ECOCROP, nombre común en ECOCROP para desempatar o None).
# Se eligió la variedad más cercana a lo que se siembra en el Perú.
EQUIVALENCIAS = {
    "papa": ("Solanum tuberosum L.", None),
    "maiz_amilaceo": ("Zea mays v. amylacea Sturt", None),  # maíz amiláceo ("soft maize"): choclo, mote
    "maiz_amarillo": ("Zea mays v. indurata Sturt", None),  # maíz duro ("flint")
    "haba": ("Vicia faba L.", None),
    "arveja": ("Pisum sativum L.", None),
    "frijol": ("Phaseolus vulgaris L.", None),
    "quinua": ("Chenopodium quinoa Willden.", None),
    "kiwicha": ("Amaranthus caudatus L.", None),
    "canihua": ("Chenopodium pallidicaule H.", None),
    "tarwi": ("Lupinus mutabilis Sweet", None),
    "oca": ("Oxalis tuberosa Molina", None),
    "olluco": ("Ullucus tuberosus Caldas", None),
    "mashua": ("Tropaeolum tuberosum R.& P.", None),
    "cebada": ("Hordeum vulgare L.", None),
    "trigo": ("Triticum aestivum L.", None),
    "avena": ("Avena sativa L.", None),
    "yuca": ("Manihot esculenta Crantz.", None),
    "platano": ("Musa acuminata x M. balbis.", None),  # plátano = híbrido acuminata × balbisiana
    "cafe": ("Coffea arabica L.", None),
    "cacao": ("Theobroma cacao L.", None),
    "arroz": ("Oryza sativa L. s. indica", "Rice, paddy (Indica)"),
    "camote": ("Ipomoea batatas (L.) Lam.", None),
    "cebolla": ("Allium cepa L. v cepa", None),
    "zanahoria": ("Daucus carota L.", None),
    "tomate": ("Lycopersicon esculentum M.", None),  # nombre antiguo de Solanum lycopersicum
    "aji": ("Capsicum baccatum L.v pend.", None),  # ají amarillo
    "yacon": ("Polymnia sonchifolia P.& E.", None),  # nombre antiguo de Smallanthus sonchifolius
    "maca": ("Lepidium meyenii Walpers", None),
    "mango": ("Mangifera indica L.", None),
}
# No están en ECOCROP: sacha_inchi (Plukenetia volubilis), choloque (Sapindus saponaria),
# camu_camu (Myrciaria dubia). Sus datos siguen siendo los curados por el equipo.


def numero(valor):
    try:
        n = float(valor)
    except (TypeError, ValueError):
        return None
    return None if n != n else (int(n) if n.is_integer() else n)


def main(ruta_rds: str) -> None:
    df = list(pyreadr.read_r(ruta_rds).values())[0]
    especies = {}
    for id_semilla, (cientifico, comun) in EQUIVALENCIAS.items():
        filas = df[df["SCIENTNAME"] == cientifico]
        if comun:
            filas = filas[filas["NAME"] == comun]
        if len(filas) != 1:
            raise SystemExit(f"{id_semilla}: se esperaba 1 fila de ECOCROP para {cientifico!r}, hay {len(filas)}")
        f = filas.iloc[0]
        especies[id_semilla] = {
            "cientifico_ecocrop": str(f["SCIENTNAME"]),
            "nombre_ecocrop": str(f["NAME"]).replace(" *", ""),
            "ciclo_dias": [numero(f["GMIN"]), numero(f["GMAX"])],
            "temperatura_mata_c": numero(f["KTMP"]),
            "temperatura_c": {
                "min": numero(f["TMIN"]),
                "optima_min": numero(f["TOPMN"]),
                "optima_max": numero(f["TOPMX"]),
                "max": numero(f["TMAX"]),
            },
            "lluvia_ciclo_mm": {
                "min": numero(f["RMIN"]),
                "optima_min": numero(f["ROPMN"]),
                "optima_max": numero(f["ROPMX"]),
                "max": numero(f["RMAX"]),
            },
            "ph": {
                "min": numero(f["PHMIN"]),
                "optimo_min": numero(f["PHOPMN"]),
                "optimo_max": numero(f["PHOPMX"]),
                "max": numero(f["PHMAX"]),
            },
        }
    salida = {
        "fuente": "FAO ECOCROP",
        "via": "Paquete de R Recocrop, inst/parameters/ecocrop.rds",
        "url": "https://github.com/cropmodels/Recocrop",
        "extraido": date.today().isoformat(),
        "notas": (
            "temperatura_c: temperatura promedio en que crece (Recocrop la compara con la media). "
            "temperatura_mata_c: mínima que la mata (Recocrop la compara con la mínima). "
            "lluvia_ciclo_mm: lluvia durante el ciclo (Recocrop la reparte por mes según la duración). "
            "ciclo_dias: [más corto, más largo] entre todas las variedades."
        ),
        "especies": especies,
    }
    destino = Path(__file__).resolve().parents[2] / "app" / "back" / "datos" / "ecocrop.json"
    destino.write_text(json.dumps(salida, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(especies)} especies -> {destino}")


if __name__ == "__main__":
    main(sys.argv[1])
