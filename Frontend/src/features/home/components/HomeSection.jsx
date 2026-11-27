import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Los botones laterales ocupan el margen de página que rodea a la sección
 * (HomeDesktop usa `p-6 md:p-10`): la fila "sangra" hasta el borde con márgenes
 * negativos y recupera la alineación con el título mediante padding. Si el
 * padding de la página cambia, estas tres constantes se cambian juntas.
 */
const BLEED = "-mx-6 md:-mx-10";
const ROW_PADDING = "px-6 md:px-10 scroll-px-6 md:scroll-px-10";
const EDGE_WIDTH = "w-6 md:w-10";

/**
 * Fila horizontal con snap por tarjetas y barra oculta.
 *
 * Expone `canPrev` / `canNext` para mostrar cada botón solo cuando hay hacia
 * dónde desplazarse. No hace loop: en un extremo el botón correspondiente
 * desaparece y solo se vuelve con el botón contrario.
 */
function useSnapRow(itemsCount, loading) {
	const ref = useRef(null);
	const prevRef = useRef(null);
	const nextRef = useRef(null);
	const [canPrev, setCanPrev] = useState(false);
	const [canNext, setCanNext] = useState(false);

	const update = useCallback(() => {
		const el = ref.current;
		if (!el) return;

		const max = el.scrollWidth - el.clientWidth;
		const prev = el.scrollLeft > 1;
		const next = el.scrollLeft < max - 1;

		// Un botón que se desmonta con el foco encima lo manda a <body> y quien
		// navega con teclado pierde su lugar. Antes de ocultarlo, el foco pasa al
		// botón contrario (o a la propia fila si no queda ninguno).
		const active = document.activeElement;
		if (!next && active === nextRef.current) {
			(prev ? prevRef.current : null)?.focus();
			if (document.activeElement === active) el.focus({ preventScroll: true });
		} else if (!prev && active === prevRef.current) {
			(next ? nextRef.current : null)?.focus();
			if (document.activeElement === active) el.focus({ preventScroll: true });
		}

		setCanPrev(prev);
		setCanNext(next);
	}, []);

	// Se vuelve a ejecutar cuando cambian items/loading porque el <ul>
	// puede montarse o cambiar de ancho después de la carga.
	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		let raf = 0;
		const onScroll = () => {
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(update);
		};

		el.addEventListener("scroll", onScroll, { passive: true });
		const ro = new ResizeObserver(update);
		ro.observe(el);
		update();

		return () => {
			cancelAnimationFrame(raf);
			el.removeEventListener("scroll", onScroll);
			ro.disconnect();
		};
	}, [update, itemsCount, loading]);

	const scrollPage = useCallback((direction) => {
		const el = ref.current;
		if (!el) return;

		el.scrollBy({
			left: direction * el.clientWidth * 0.9,
			behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
				? "auto"
				: "smooth",
		});
	}, []);

	return { ref, prevRef, nextRef, canPrev, canNext, scrollPage };
}

function Chevron({ direction }) {
	return (
		<svg
			viewBox="0 0 24 24"
			width="24"
			height="24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d={direction === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
		</svg>
	);
}

/**
 * Botón de borde a todo lo alto de la fila. Solo se monta cuando hay hacia
 * dónde desplazarse. Mientras no esté "visible" (sin hover ni foco de teclado)
 * sigue en el orden de tabulación, pero transparente y con `pointer-events-none`
 * para no interceptar clics sobre las tarjetas.
 */
function EdgeButton({ direction, visible, onClick, label, buttonRef }) {
	const isLeft = direction === "left";

	return (
		<button
			ref={buttonRef}
			type="button"
			onClick={onClick}
			aria-label={label}
			className={`absolute inset-y-0 z-10 flex items-center justify-center ${EDGE_WIDTH} ${
				isLeft ? "left-0" : "right-0"
			} bg-background/70 text-foreground transition-opacity duration-200 hover:bg-background/90 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring ${
				visible ? "opacity-100" : "pointer-events-none opacity-0"
			}`}
		>
			<Chevron direction={direction} />
		</button>
	);
}

export default function HomeSection({
	title,
	loading = false,
	items = [],
	skeletonCount = 12,
	skeleton,
	renderItem,
}) {
	const { ref, prevRef, nextRef, canPrev, canNext, scrollPage } = useSnapRow(
		items.length,
		loading,
	);
	const [hovered, setHovered] = useState(false);
	const [keyboardFocus, setKeyboardFocus] = useState(false);

	if (!loading && items.length === 0) return null;

	const visible = hovered || keyboardFocus;

	return (
		<section className="mt-10" aria-label={title}>
			<h2 className="Header4 mb-4">{title}</h2>

			<div
				className={`relative ${BLEED}`}
				// Solo el mouse revela los botones al pasar por encima; en táctil no
				// aparecen (se desliza con el dedo) y no estorban los toques.
				onPointerEnter={(event) => {
					if (event.pointerType === "mouse") setHovered(true);
				}}
				onPointerLeave={() => setHovered(false)}
				// Con teclado se revelan al enfocar cualquier cosa de la fila.
				// `:focus-visible` distingue el foco de teclado de un clic o un toque.
				onFocus={(event) => {
					if (event.target.matches(":focus-visible")) setKeyboardFocus(true);
				}}
				onBlur={(event) => {
					if (!event.currentTarget.contains(event.relatedTarget)) {
						setKeyboardFocus(false);
					}
				}}
			>
				{/* Antes de la lista en el DOM: el orden de tab es anterior, siguiente, tarjetas */}
				{canPrev && (
					<EdgeButton
						buttonRef={prevRef}
						direction="left"
						label={`Anterior en ${title}`}
						visible={visible}
						onClick={() => scrollPage(-1)}
					/>
				)}
				{canNext && (
					<EdgeButton
						buttonRef={nextRef}
						direction="right"
						label={`Siguiente en ${title}`}
						visible={visible}
						onClick={() => scrollPage(1)}
					/>
				)}

				<ul
					ref={ref}
					// tabIndex -1: solo para poder devolver el foco aquí por código.
					tabIndex={-1}
					className={`flex gap-4 overflow-x-auto overscroll-x-contain pb-1 outline-none snap-x snap-mandatory ${ROW_PADDING} [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
				>
					{loading
						? Array.from({ length: skeletonCount }).map((_, i) => (
								<li key={i} className="shrink-0 snap-start">
									{skeleton}
								</li>
							))
						: items.map((item, index) => (
								<li key={item.id} className="shrink-0 snap-start">
									{renderItem(item, index)}
								</li>
							))}
				</ul>
			</div>
		</section>
	);
}