// Port de beUI Native (`components/toast/toast-store.ts`), sin tipos.
// Mantiene el contrato público: toast(), toast.success/error/info/loading,
// toast.update, toast.dismiss y toast.promise.

const DEFAULT_DURATION = 4000;

let items = [];
let paused = false;
let seed = 0;
const timers = new Map();
const listeners = new Set();

function emit() {
	for (const listener of listeners) listener();
}

function lifetime(item) {
	return item.status === "loading" ? 0 : item.duration;
}

function startTimer(id, ms) {
	stopTimer(id);
	if (ms <= 0) return;
	const timer = { handle: null, remaining: ms, startedAt: Date.now() };
	if (!paused) timer.handle = setTimeout(() => dismiss(id), ms);
	timers.set(id, timer);
}

function stopTimer(id) {
	const timer = timers.get(id);
	if (timer?.handle) clearTimeout(timer.handle);
	timers.delete(id);
}

function show(title, options = {}) {
	const id = options.id ?? `toast-${Date.now()}-${seed++}`;
	if (items.some((item) => item.id === id)) {
		update(id, { ...options, title });
		return id;
	}
	const item = {
		id,
		title,
		description: options.description,
		status: options.status ?? "neutral",
		action: options.action,
		duration: options.duration ?? DEFAULT_DURATION,
		dismissible: options.dismissible ?? true,
		dismissed: false,
	};
	items = [...items, item];
	startTimer(id, lifetime(item));
	emit();
	return id;
}

function update(id, patch) {
	let changed;
	items = items.map((item) => {
		if (item.id !== id) return item;
		changed = {
			...item,
			...patch,
			id,
			duration: patch.duration ?? item.duration,
			status: patch.status ?? item.status,
		};
		return changed;
	});
	// Un estado o una duración nuevos reinician el reloj.
	if (changed && (patch.status || patch.duration !== undefined)) {
		startTimer(id, lifetime(changed));
	}
	emit();
}

function dismiss(id) {
	const ids = id ? [id] : items.map((item) => item.id);
	for (const each of ids) stopTimer(each);
	items = items.map((item) =>
		ids.includes(item.id) ? { ...item, dismissed: true } : item,
	);
	emit();
}

function promise(task, messages, options = {}) {
	const id = show(messages.loading, { ...options, status: "loading" });
	task.then(
		(value) =>
			update(id, {
				status: "success",
				title:
					typeof messages.success === "function"
						? messages.success(value)
						: messages.success,
			}),
		(error) =>
			update(id, {
				status: "error",
				title:
					typeof messages.error === "function"
						? messages.error(error)
						: messages.error,
			}),
	);
	return task;
}

const withStatus = (status) => (title, options) =>
	show(title, { ...options, status });

/**
 * Muestra un toast desde cualquier lugar. Hay que montar un `<Toaster />` una
 * sola vez cerca de la raíz de la app.
 */
export const toast = Object.assign(
	(title, options) => show(title, options),
	{
		success: withStatus("success"),
		error: withStatus("error"),
		info: withStatus("info"),
		loading: withStatus("loading"),
		update,
		dismiss,
		promise,
	},
);

/** Interno: la vista del store que consume el Toaster. */
export const toastStore = {
	subscribe(listener) {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	},
	getSnapshot: () => items,
	/** Elimina un toast una vez que terminó su salida. */
	remove(id) {
		stopTimer(id);
		items = items.filter((item) => item.id !== id);
		emit();
	},
	/** Frena todos los timers mientras hay un dedo abajo o la pila está abierta. */
	pause() {
		if (paused) return;
		paused = true;
		const now = Date.now();
		for (const timer of timers.values()) {
			if (timer.handle) clearTimeout(timer.handle);
			timer.handle = null;
			timer.remaining = Math.max(0, timer.remaining - (now - timer.startedAt));
		}
	},
	resume() {
		if (!paused) return;
		paused = false;
		for (const [id, timer] of timers) {
			timer.startedAt = Date.now();
			timer.handle = setTimeout(() => dismiss(id), timer.remaining);
		}
	},
};
