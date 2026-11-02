import { StyleSheet } from "react-native";
import { colors, opacity, radius, spacing, text } from "../../../theme";

export const UP_NEXT_STYLES = StyleSheet.create({
	section: {
		width: "100%",
		paddingHorizontal: 18,
		paddingBottom: 40,
	},
	header: {
		flexDirection: "row",
		alignItems: "baseline",
		justifyContent: "space-between",
		gap: spacing.md,
	},
	heading: {
		...text.header4,
		color: colors.lighter,
	},
	count: {
		...text.tiny,
		color: colors.lighter,
		opacity: 0.6,
		textTransform: "uppercase",
	},
	list: {
		marginTop: spacing.md,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.sm,
		borderRadius: radius.sm,
	},
	rowPressed: {
		backgroundColor: "rgba(255, 255, 255, 0.05)", // web: hover:bg-white/5
	},
	cover: {
		width: 40,
		height: 40,
		borderRadius: radius.sm,
		backgroundColor: colors.light,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
	},
	coverImage: {
		width: "100%",
		height: "100%",
	},
	coverPlaceholder: {
		opacity: 0.6,
	},
	titles: {
		flex: 1,
		minWidth: 0,
	},
	title: {
		...text.regular,
		color: colors.lighter,
	},
	artist: {
		...text.medium,
		color: colors.lighter,
		opacity: opacity.muted,
	},
	queuedPill: {
		backgroundColor: colors.fucsia,
		borderRadius: radius.full,
		paddingHorizontal: spacing.sm,
		paddingVertical: 2,
	},
	queuedText: {
		...text.tiny,
		color: colors.lighter,
		textTransform: "uppercase",
	},
});
