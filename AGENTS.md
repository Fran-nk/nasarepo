
NOTAS SOBRE MENTORES
Mentor 01:
Considerar las plantas que no se siembran y estan desapareciendo (se mencionó la planta Choloque jabón natural), se recomienta buscar nuevas plantas que no se han registrado en el banco de semillas
* Considerar que el usuario principal son los agricultores
Nota: El proyecto se puede slevar a proinnóvate por ser interdisciplinario enfocado a la

Mentor 02 (Edwin Morales):
Definir las variables, no es bueno llenarse de variables, recomienda de 10 a 15 variables
Categorizar las semillas porque hay demasiadas semillas existentes.
Si se va a utilizar IA, usar algoritmo NN (red neuronal?) para determinar la selección de la siguiente semilla a cultivar.


Notas personales:
Los agricultores podrìan requerir diferentes niveles de complejidad del sistema, pero enfocarse en lo esencial para la vista más simplificada
Se puede ofrecer información sobre los diferentes formatos de cultivos posibles según la geografía del terreno donde se encuentre


Reqs F

RF 1: Se debe mostrar un mapa, será interactivo según los otros requerimientos
RF 3: El usuario puede seleccionar un polígono en el terreno para trabajarlo, O determinar la ubicación de los cultivos, si no lo selecciona, se solicitará su ubicación actual
RF 5: El usuario debe seleccionar el cultivo actual sembrado (puede ser tambien para simular una rotación escojer otros cultivos)

RF 7: El sistema en base a todas las demás fuentes de datos (SMAP, datos de la nasa, datos del país, etc) debe brindar al usuario una lista de recomendaciones de cultivos a realizar.

RF 8: El sistema permite al usuario el uso continuo mediante registro de las actividades, riegos y enriquecimiento del suelo (qué componentes ha echado en la tierra) si quemó la hierba sobrante, etc. Esto para dar una mejor recomendación al usuario
RF 9: El sistema brinda al usuario un reporte tipo dashboard para visualizar las probabilidades de lluvia en los siguientes dias, meses, etc, entre otros datos que se puedan mostrar para el área seleccionada.
RF 10: El sistema debe ofrecer diferentes niveles de complejidad de la interfaces para facilitar el uso del usuario que no conoce del tema y experimentado.
RF 12: En la selección de opciones, los agricultores podrían no distinguir los sonidos de las letras del alfabeto, considerar sonidos "I" "Y" "LL" como similares, asi como omitir la "H" como búsqueda estricta, entre otros factores que no permitan realizar la búsqueda de palabras
RF 6: El usuario selecciona los cultivos que se suelen sembrar en esa ubicación 
RF 13: El sistema utiliza una red neuronal entrenada para decidir qué semilla se va a utilizar después según las variables de entrada definidas
RF 7 Despues de seleccionado los cultivos y las recomendaciones, los requerimientos de actividades a realizar en cada cultivo (abono, agua, acidos, bases, etc, quimicos) (opcional)

Variables del sistema:
 - Lluvia NASA GPM
 - Nasa Power
 - 3 Tipos de semillas sembradas previamela cantidad de tipos de semillas podría variar (el usuario coloca las semillas que cultivó)
 - Humedad del suelo


Prioridad del proyecto:
 - Semillas
 - Clima