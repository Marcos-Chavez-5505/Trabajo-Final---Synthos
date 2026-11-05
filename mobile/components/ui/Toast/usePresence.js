import { useEffect, useRef, useState } from "react";

/**
 * Port de `hooks/use-presence.ts` de beUI Native.
 *
 * Mantiene montados los valores reemplazados mientras animan su salida, como
 * `AnimatePresence`. Una clave que vuelve mientras está saliendo se reanuda.
 */
export function usePresence(key, value, exitDuration) {
	const [items, setItems] = useState(() =>
		key === null ? [] : [{ key, value, appear: false, exiting: false }],
	);
	const [currentKey, setCurrentKey] = useState(key);
	const exitDurationRef = useRef(exitDuration);

	useEffect(() => {
		exitDurationRef.current = exitDuration;
	}, [exitDuration]);

	// Se ajusta durante el render para que el nuevo ítem y las salidas
	// arranquen en el mismo frame.
	if (key !== currentKey) {
		setCurrentKey(key);
		setItems((previous) => {
			const next = previous.map((item) =>
				item.key === key
					? { ...item, value, exiting: false }
					: { ...item, exiting: true },
			);
			if (key !== null && !previous.some((item) => item.key === key)) {
				next.push({ key, value, appear: true, exiting: false });
			}
			return next;
		});
	}

	const exitingKeys = items
		.filter((item) => item.exiting)
		.map((item) => item.key)
		.join("\n");

	useEffect(() => {
		if (!exitingKeys) return undefined;
		const timers = items
			.filter((item) => item.exiting)
			.map((item) =>
				setTimeout(() => {
					setItems((previous) =>
						previous.filter(
							(candidate) =>
								!(candidate.key === item.key && candidate.exiting),
						),
					);
				}, exitDurationRef.current(item.value)),
			);
		return () => {
			for (const timer of timers) clearTimeout(timer);
		};
		// Los timers de remoción solo se reinician si cambia el conjunto.
	}, [exitingKeys, items]);

	return items;
}
