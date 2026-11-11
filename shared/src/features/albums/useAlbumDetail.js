import { useCallback, useEffect, useState } from "react";
import { getAlbumById } from "../../services/albumsService.js";
import { mapApiError } from "../../utils/mapError.js";

export function useAlbumDetail(albumId) {
	const [state, setState] = useState({
		album: null,
		songs: [],
		error: null,
		loading: true,
	});
	const [version, setVersion] = useState(0);

	useEffect(() => {
		if (!albumId) {
			setState({ album: null, songs: [], error: null, loading: false });
			return undefined;
		}

		let active = true;
		setState({ album: null, songs: [], error: null, loading: true });

		getAlbumById(albumId)
			.then((album) => {
				if (!active) return;
				setState({
					album,
					songs: album?.songs ?? [],
					error: null,
					loading: false,
				});
			})
			.catch((cause) => {
				if (!active) return;
				setState({
					album: null,
					songs: [],
					error: mapApiError(cause),
					loading: false,
				});
			});

		return () => {
			active = false;
		};
	}, [albumId, version]);

	const retry = useCallback(() => setVersion((v) => v + 1), []);

	return { ...state, resolving: false, retry };
}

export default useAlbumDetail;
