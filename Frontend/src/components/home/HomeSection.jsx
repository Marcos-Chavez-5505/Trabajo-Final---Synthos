export default function HomeSection({
	title,
	loading = false,
	error,
	items = [],
	skeletonCount = 12,
	skeleton,
	renderItem,
}) {
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
		<section className="mt-10">
			<h2 className="Header4 mb-4">{title}</h2>

			<ul className="flex gap-4 overflow-x-auto pb-1 scrollbar-thin">
				{loading
					? Array.from({ length: skeletonCount }).map((_, i) => (
							<li key={i}>{skeleton}</li>
						))
					: items.map((item, index) => (
							<li key={item.id}>{renderItem(item, index)}</li>
						))}
			</ul>
		</section>
	);
}
