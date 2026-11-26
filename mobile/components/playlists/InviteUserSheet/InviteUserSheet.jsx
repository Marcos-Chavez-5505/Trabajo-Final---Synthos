import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { mapApiError, searchUsers, useDebounce } from "@synthos/shared";
import {
	BottomSheetInput,
	BottomSheetModal,
	BottomSheetScrollContent,
} from "../../ui/BottomSheet/BottomSheet";
import MemberRow from "../MemberRow/MemberRow";
import InviteRow from "../InviteRow/InviteRow";
import { CloseIcon, GlobeIcon, SearchIcon } from "../../icons";
import { colors } from "../../../theme";
import { showActionError } from "../../../lib/toastMessages";
import { INVITE_USER_SHEET_STYLES as styles } from "./InviteUserSheet.styles";

const DEBOUNCE_MS = 300;
const MIN_QUERY = 2;
const PAGE_SIZE = 10;
const SNAP_POINTS = ["88%"];

/**
 * Sheet "Colaboradores": integrantes de la playlist arriba y buscador para
 * invitar a más personas abajo, con la misma estructura que `UserSearch` web.
 *
 * Lo presenta quien lo usa (botón "Invitar" del detalle de playlist). Mantiene
 * el error inline y no se cierra al invitar, para poder sumar varias personas
 * seguidas. Las invitaciones ya enviadas se marcan sobre el resultado (no se
 * excluyen de la búsqueda), igual que en web.
 */
export default function InviteUserSheet({
	open,
	onClose,
	onInvite,
	userId,
	members = [],
	excludeIds = [],
	invitations = [],
	canManageMembers = true,
	onRemoveMember,
	visibilityLabel = "Public Playlist",
	title = "Colaboradores",
	description,
	inviteTitle = "Invitar colaboradores",
	placeholder = "Buscar personas…",
}) {
	const sheetRef = useRef(null);
	const presentedRef = useRef(false);
	const [query, setQuery] = useState("");
	const [response, setResponse] = useState({ key: null, items: [], error: null });
	const [pendingId, setPendingId] = useState(null);
	const [searchVersion, setSearchVersion] = useState(0);
	const retrySearch = useCallback(() => setSearchVersion((prev) => prev + 1), []);

	const trimmedQuery = query.trim();
	const hasMinChars = trimmedQuery.length >= MIN_QUERY;
	const debouncedQuery = useDebounce(trimmedQuery, DEBOUNCE_MS);
	const canSearch = debouncedQuery.length >= MIN_QUERY;
	const requestKey = canSearch ? debouncedQuery : null;

	// Llamar a dismiss() sobre un modal que nunca se presentó (o que ya se
	// desmontó) lo deja en estado DISMISSING: el portal se monta pero no
	// renderiza y el present() posterior parece no hacer nada. Por eso se cierra
	// solo mientras esté efectivamente presentado.
	useEffect(() => {
		if (open) {
			presentedRef.current = true;
			sheetRef.current?.present();
		} else if (presentedRef.current) {
			sheetRef.current?.dismiss();
		}
	}, [open]);

	useEffect(() => {
		if (!open || !canSearch) return undefined;

		const controller = new AbortController();
		let active = true;

		searchUsers(debouncedQuery, 1, PAGE_SIZE, { signal: controller.signal })
			.then((data) => {
				if (active) setResponse({ key: requestKey, items: data.items, error: null });
			})
			.catch((cause) => {
				if (!active || cause?.name === "AbortError") return;
				setResponse({ key: requestKey, items: [], error: mapApiError(cause) });
			});

		return () => {
			active = false;
			controller.abort();
		};
	}, [open, canSearch, debouncedQuery, requestKey, searchVersion]);

	const isSettled = trimmedQuery === debouncedQuery;
	const isCurrent = response.key === requestKey;
	const isLoading = open && hasMinChars && (!isSettled || (canSearch && !isCurrent));
	const searchError = isSettled && isCurrent ? response.error : null;

	useEffect(() => {
		if (searchError) {
			showActionError(searchError, "search:people", { retry: retrySearch });
		}
	}, [searchError, retrySearch]);

	const invitationStatusById = useMemo(
		() => new Map(invitations.map((invitation) => [invitation.receiver.id, invitation.status])),
		[invitations],
	);
	const excluded = new Set(excludeIds);
	const rows =
		isSettled && isCurrent
			? response.items.filter(
					(person) => person.id !== userId && !excluded.has(person.id),
				)
			: [];

	function handleDismiss() {
		presentedRef.current = false;
		setQuery("");
		setResponse({ key: null, items: [], error: null });
		setPendingId(null);
		onClose?.();
	}

	function clearQuery() {
		setQuery("");
	}

	async function handleSelect(person) {
		if (pendingId || invitationStatusById.has(person.id)) return;

		setPendingId(person.id);

		try {
			await onInvite?.(person);
		} catch (cause) {
			showActionError(cause, "playlist:invite");
		} finally {
			setPendingId(null);
		}
	}

	const emptyMessage = searchError
		? "No hay personas para mostrar por ahora."
		: isLoading
			? "Buscando…"
			: !hasMinChars
				? `Escribí al menos ${MIN_QUERY} letras para buscar personas`
				: `No encontramos personas para “${trimmedQuery}”.`;

	return (
		<BottomSheetModal
			ref={sheetRef}
			snapPoints={SNAP_POINTS}
			enableDynamicSizing={false}
			onDismiss={handleDismiss}
			accessibilityLabel={description ?? title}
		>
			<BottomSheetScrollContent
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.content}
			>
				{/* Cabecera */}
				<View style={styles.header}>
					<View style={styles.visibility}>
						<GlobeIcon size={18} color={colors.textMuted} />
						<Text style={styles.visibilityText}>{visibilityLabel}</Text>
					</View>
					<Text style={styles.title}>{title}</Text>
					<Pressable
						onPress={() => sheetRef.current?.dismiss()}
						style={({ pressed }) => [styles.close, pressed && styles.pressed]}
						accessibilityRole="button"
						accessibilityLabel="Cerrar"
						hitSlop={8}
					>
						<CloseIcon size={22} color={colors.textPrimary} />
					</Pressable>
				</View>

				{/* Integrantes */}
				<View style={styles.section}>
					{members.map((member) => (
						<MemberRow
							key={member.id}
							member={member}
							canRemove={canManageMembers && member.role !== "creator"}
							onRemove={() => onRemoveMember?.(member)}
						/>
					))}
				</View>

				{/* Invitar */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>{inviteTitle}</Text>

					<View style={styles.searchWrapper}>
						<SearchIcon size={18} color={colors.textMuted} />
						<BottomSheetInput
							value={query}
							onChangeText={setQuery}
							placeholder={placeholder}
							autoCapitalize="none"
							autoCorrect={false}
							accessibilityLabel="Buscar personas"
							style={styles.searchInput}
						/>
						{isLoading ? (
							<ActivityIndicator size="small" color={colors.textMuted} />
						) : null}
						{query ? (
							<Pressable
								onPress={clearQuery}
								style={({ pressed }) => [pressed && styles.pressed]}
								accessibilityRole="button"
								accessibilityLabel="Borrar búsqueda"
								hitSlop={8}
							>
								<CloseIcon size={16} color={colors.textMuted} />
							</Pressable>
						) : null}
					</View>

					{rows.length > 0 ? (
						<View style={styles.results}>
							{rows.map((person) => (
								<InviteRow
									key={person.id}
									person={person}
									status={invitationStatusById.get(person.id)}
									pending={pendingId === person.id}
									disabled={pendingId !== null}
									onInvite={() => handleSelect(person)}
								/>
							))}
						</View>
					) : (
						<Text style={styles.message}>{emptyMessage}</Text>
					)}
				</View>
			</BottomSheetScrollContent>
		</BottomSheetModal>
	);
}
