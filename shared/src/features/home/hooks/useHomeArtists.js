import { useEffect, useState } from "react";
import { getNewArtists } from "../../../services/artistsService.js";
import { mapApiError } from "../../../utils/mapError.js";

const NEW_ARTISTS_COUNT = 12;

export default function useNewArtists() {
	const [artists, setArtists] = useState([]);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const controller = new AbortController();
		let active = true;

		getNewArtists(NEW_ARTISTS_COUNT, { signal: controller.signal })
			.then((list) => {
				if (!active) return;
				setArtists(list);
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

	return { artists, error, loading };
}
