import { ScrollView, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { colors } from "../../theme";

export default function ComponentTest({ children }) {
	return (
		<View
			style={{
				flex: 1,
				backgroundColor: colors.background,
			}}
		>
			<ScrollView
				contentContainerStyle={{
					flexGrow: 1,
					alignItems: "center",
					justifyContent: "center",
					padding: 24,
					gap: 16,
				}}
			>
				{children}
			</ScrollView>
			<StatusBar style="light" />
		</View>
	);
}
