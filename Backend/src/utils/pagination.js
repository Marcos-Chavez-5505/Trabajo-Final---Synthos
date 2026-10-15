const prisma = require("../prisma/prismaClient");

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

function parsePagination({ page, pageSize }) {
	const parsedPage = Number.parseInt(page, 10);
	const parsedPageSize = Number.parseInt(pageSize, 10);

	return {
		page:
			Number.isInteger(parsedPage) && parsedPage >= 1
				? parsedPage
				: DEFAULT_PAGE,
		pageSize:
			Number.isInteger(parsedPageSize) && parsedPageSize >= 1
				? Math.min(parsedPageSize, MAX_PAGE_SIZE)
				: DEFAULT_PAGE_SIZE,
	};
}

async function paginatedSearch({
	delegate,
	where,
	include,
	orderBy = { id: "asc" },
	pagination = {},
}) {
	const { page: requestedPage, pageSize } = parsePagination(pagination);

	const [total, items] = await prisma.$transaction([
		delegate.count({ where }),
		delegate.findMany({
			where,
			skip: (requestedPage - 1) * pageSize,
			take: pageSize,
			include,
			orderBy,
		}),
	]);

	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const page = Math.min(requestedPage, totalPages);

	const finalItems =
		page === requestedPage
			? items
			: await delegate.findMany({
					where,
					skip: (page - 1) * pageSize,
					take: pageSize,
					include,
					orderBy,
				});

	return { items: finalItems, total, page, pageSize, totalPages };
}

module.exports = { parsePagination, paginatedSearch };
