import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Fila horizontal con snap por tarjetas, barra oculta y botones de página.
 * Si más adelante se necesita en otras pantallas, extraer a
 * features/home/hooks/useSnapRow.js.
 */
function useSnapRow(itemsCount, loading) {
	const ref = useRef(null);
	const [canPrev, setCanPrev] = useState(false);
	const [canNext, setCanNext] = useState(false);

	const update = useCallback(() => {
		const el = ref.current;
		if (!el) return;
		const max = el.scrollWidth - el.clientWidth;
		setCanPrev(el.scrollLeft > 1);
		setCanNext(el.scrollLeft < max - 1);
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
		const reduceMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		el.scrollBy({
			left: direction * el.clientWidth * 0.9,
			behavior: reduceMotion ? "auto" : "smooth",
		});
	}, []);

	return { ref, canPrev, canNext, scrollPage };
}

function Chevron({ direction }) {
	return (
		<svg
			viewBox="0 0 24 24"
			width="20"
			height="20"
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

function NavButton({ direction, disabled, onClick, label }) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			aria-label={label}
			className="grid size-9 place-items-center rounded-full bg-muted text-foreground transition-opacity hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-default disabled:opacity-30"
		>
			<Chevron direction={direction} />
		</button>
	);
}

export default function HomeSection({
	title,
	loading = false,
	error,
	items = [],
	skeletonCount = 12,
	skeleton,
	renderItem,
}) {
	const { ref, canPrev, canNext, scrollPage } = useSnapRow(
		items.length,
		loading,
	);

	if (error) {
		return (
			<section className="mt-10">
				<h2 className="Header4 mb-4">{title}</h2>
				<p className="text-muted-foreground TextRegular">
					No pudimos cargar {title.toLowerCase()}.
				</p>
			</section>
		);
	}

	if (!loading && items.length === 0) return null;

	return (
		<section className="mt-10" aria-label={title}>
			<div className="mb-4 flex items-center justify-between gap-4">
				<h2 className="Header4">{title}</h2>

				{/* Solo con puntero preciso (mouse); en táctil se desliza con el dedo */}
				<div className="hidden gap-2 [@media(pointer:fine)]:flex">
					<NavButton
						direction="left"
						label={`Anterior en ${title}`}
						disabled={!canPrev}
						onClick={() => scrollPage(-1)}
					/>
					<NavButton
						direction="right"
						label={`Siguiente en ${title}`}
						disabled={!canNext}
						onClick={() => scrollPage(1)}
					/>
				</div>
			</div>

			<ul
				ref={ref}
				className="flex gap-4 overflow-x-auto overscroll-x-contain pb-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
		</section>
	);
}