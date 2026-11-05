import { useEffect, useState } from "react";
import { mapApiError } from "../../utils/mapError.js";
import { getLatestAlbums } from "../../services/albumsService.js";

const LATEST_ALBUMS_COUNT = 6;

export default function useLatestAlbums() {
	const [albums, setAlbums] = useState([]);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const controller = new AbortController();
		let active = true;

		getLatestAlbums(LATEST_ALBUMS_COUNT, { signal: controller.signal })
			.then((list) => {
				if (!active) return;
				setAlbums(list);
				setLoading(false);
			})
			.catch((cause) => {
				if (!active) return;
				setError(mapApiError(cause));
				setLoading(false);
			});

		return () => {
			active = false;
			controller.abort();
		};
	}, []);

	return { albums, error, loading };
}
