import { Pressable, Text, View } from "react-native";
import { colors, fontSize, fontWeight, radius } from "../../theme";
import { SEARCH_TABS_LIST, SEARCH_TABS } from "./constants";

export default function SearchTabs({ active = SEARCH_TABS.SONGS, onChange }) {
	return (
		<View
			style={{ flexDirection: "row", gap: 8, marginTop: 16, marginBottom: 16 }}
		>
			{SEARCH_TABS_LIST.map((tab) => {
				const isActive = tab.key === active;
				return (
					<Pressable
						key={tab.key}
						onPress={() => onChange?.(tab.key)}
						style={{
							paddingHorizontal: 16,
							paddingVertical: 6,
							borderRadius: radius.full,
							backgroundColor: isActive ? colors.primary : colors.surfaceLight,
						}}
					>
						<Text
							style={{
								color: colors.textPrimary,
								fontSize: fontSize.sm,
								fontWeight: fontWeight.regular,
								opacity: isActive ? 1 : 0.7,
							}}
						>
							{tab.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}
