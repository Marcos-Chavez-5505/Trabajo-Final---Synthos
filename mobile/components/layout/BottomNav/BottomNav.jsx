import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, Pressable, Text, View } from "react-native";
import { NavigationBar } from "expo-navigation-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { navigationBarStyle, sizes } from "../../../theme";
import { BOTTOM_NAV_STYLES as styles, NAV_COLORS } from "./Bottomnav.styles";

const ENTER_SPRING = { friction: 5, tension: 120 };
const EXIT_MS = 150;

function NavItem({ item, selected, onPress }) {
	const progress = useRef(new Animated.Value(selected ? 1 : 0)).current;

	useEffect(() => {
		const animation = selected
			? Animated.spring(progress, { toValue: 1, ...ENTER_SPRING, useNativeDriver: true })
			: Animated.timing(progress, {
					toValue: 0,
					duration: EXIT_MS,
					easing: Easing.out(Easing.quad),
					useNativeDriver: true,
				});
		animation.start();
		return () => animation.stop();
	}, [selected, progress]);

	const indicatorOpacity = progress.interpolate({
		inputRange: [0, 1],
		outputRange: [0, 1],
		extrapolate: "clamp",
	});
	const indicatorScale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });
	const iconScale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });

	const Icon = item.Icon;

	return (
		<Pressable
			style={styles.item}
			onPress={onPress}
			accessibilityRole="tab"
			accessibilityLabel={item.label}
			accessibilityState={{ selected }}
		>
			<View style={styles.indicatorSlot}>
				<Animated.View
					style={[
						styles.indicator,
						{ opacity: indicatorOpacity, transform: [{ scale: indicatorScale }] },
					]}
				/>
				<Animated.View style={{ transform: [{ scale: iconScale }] }}>
					<Icon
						size={sizes.navIcon}
						color={selected ? NAV_COLORS.iconSelected : NAV_COLORS.iconDefault}
					/>
					{item.badge ? (
						<View style={styles.badge}>
							<Text style={styles.badgeText}>{item.badge}</Text>
						</View>
					) : null}
				</Animated.View>
			</View>
			<Text style={[styles.label, selected && styles.labelSelected]}>{item.label}</Text>
		</Pressable>
	);
}

export default function BottomNav({ items, selectedKey, onSelect }) {
	const insets = useSafeAreaInsets();

	useEffect(() => {
		if (Platform.OS !== "android") return;
		NavigationBar.setStyle(navigationBarStyle);
	}, []);

	return (
		<View
			style={[styles.bar, { paddingBottom: insets.bottom }]}
			accessibilityRole="tablist"
		>
			{items.map((item) => (
				<NavItem
					key={item.key}
					item={item}
					selected={item.key === selectedKey}
					onPress={() => onSelect(item.key)}
				/>
			))}
		</View>
	);
}