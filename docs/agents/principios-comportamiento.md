Cuándo leer este documento: refactor, feature grande o tarea ambigua donde dudas del alcance o del enfoque.
Origen: AGENTS.md original §6 (guía Karpathy). Resumen en AGENTS.md, sección "Comportamiento".

# Principios de comportamiento

Sesgan hacia la cautela sobre la velocidad. En tareas triviales (typo, one-liner obvio) usar criterio: no todo cambio necesita este rigor.

## 6.1 Pensar antes de codificar

No asumir. No esconder la confusión. Exponer tradeoffs.

- Declarar los supuestos antes de implementar. Si hay duda, preguntar en vez de adivinar.
- Si hay varias interpretaciones posibles, presentarlas; no elegir una en silencio.
- Si existe un enfoque más simple, decirlo y discutirlo antes de avanzar.
- Si algo no está claro, parar, nombrar lo que no se entiende y preguntar.

## 6.2 Simplicidad primero

El mínimo código que resuelve el problema. Nada especulativo.

- Nada más allá de lo pedido: sin features, flexibilidad ni configurabilidad no solicitadas.
- Sin abstracciones para código de un solo uso, ni manejo de errores para escenarios imposibles.
- Reutilizar lo existente (regla 2: `MediaCard` y variantes; regla 8: revisar `features/`) antes de crear algo nuevo.
- Si 200 líneas pueden ser 50, reescribir. Test: ¿diría un senior que esto está sobrecomplicado?

## 6.3 Cambios quirúrgicos

Tocar solo lo necesario. Limpiar solo el desorden propio.

- No "mejorar" código, comentarios ni formato adyacentes. No refactorizar lo que no está roto.
- Respetar el estilo existente aunque se prefiera otro.
- Código muerto ajeno: mencionarlo, no borrarlo.
- Sí eliminar imports, variables o funciones que los cambios propios dejaron sin uso.
- Test: cada línea modificada debe poder rastrearse a lo que pidió el usuario.

## 6.4 Ejecución orientada a objetivos

Definir criterio de éxito y repetir hasta verificarlo.

| En vez de…            | Convertir en…                                              |
| --------------------- | ---------------------------------------------------------- |
| "Agregar validación"  | "Escribir tests con entradas inválidas y hacerlos pasar"   |
| "Arreglar el bug"     | "Escribir un test que lo reproduzca y hacerlo pasar"       |
| "Refactorizar X"      | "Verificar que los tests pasan antes y después"            |

En tareas de varios pasos, plan breve: `1. [paso] → verificar: [chequeo]`. Verificación mínima en este repo: lint y build de `Frontend` (ver 12.1 en `docs/agents/git-ramas-y-pr.md`).