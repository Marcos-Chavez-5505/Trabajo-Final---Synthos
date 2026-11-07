import { useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronDownIcon } from "../../icons";
import { colors, withAlpha } from "../../../theme";
import { HORIZONTAL_SCROLL_BAR_STYLES as styles } from "./HorizontalScrollBar.styles";

const TRANSPARENT_SURFACE = withAlpha(colors.surface, 0);

export default function HorizontalScrollBar({
	children,
	contentContainerStyle,
	style,
}) {
	const [showLeft, setShowLeft] = useState(false);
	const [showRight, setShowRight] = useState(false);
	const layoutWidthRef = useRef(0);
	const contentWidthRef = useRef(0);
	const offsetRef = useRef(0);

	const updateEdges = () => {
		const maxScroll = Math.max(
			0,
			contentWidthRef.current - layoutWidthRef.current,
		);
		const hasOverflow = maxScroll > 1;
		const offset = offsetRef.current;

		setShowLeft(hasOverflow && offset > 1);
		setShowRight(hasOverflow && offset < maxScroll - 1);
	};

	const handleLayout = (event) => {
		layoutWidthRef.current = event.nativeEvent.layout.width;
		updateEdges();
	};

	const handleContentSizeChange = (width) => {
		contentWidthRef.current = width;
		updateEdges();
	};

	const handleScroll = (event) => {
		offsetRef.current = event.nativeEvent.contentOffset.x;
		updateEdges();
	};

	return (
		<View style={[styles.container, style]}>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				style={styles.scroll}
				contentContainerStyle={contentContainerStyle}
				onLayout={handleLayout}
				onContentSizeChange={handleContentSizeChange}
				onScroll={handleScroll}
				scrollEventThrottle={16}
			>
				{children}
			</ScrollView>

			{showLeft ? (
				<View pointerEvents="none" style={[styles.edge, styles.edgeLeft]}>
					<LinearGradient
						colors={[colors.surface, colors.surface, TRANSPARENT_SURFACE]}
						locations={[0, 0.5, 1]}
						start={{ x: 0, y: 0.5 }}
						end={{ x: 1, y: 0.5 }}
						style={styles.gradient}
					/>
					<View style={styles.chevronLeft}>
						<ChevronDownIcon size={14} color={colors.textPrimary} />
					</View>
				</View>
			) : null}

			{showRight ? (
				<View pointerEvents="none" style={[styles.edge, styles.edgeRight]}>
					<LinearGradient
						colors={[TRANSPARENT_SURFACE, colors.surface, colors.surface]}
						locations={[0, 0.5, 1]}
						start={{ x: 0, y: 0.5 }}
						end={{ x: 1, y: 0.5 }}
						style={styles.gradient}
					/>
					<View style={styles.chevronRight}>
						<ChevronDownIcon size={14} color={colors.textPrimary} />
					</View>
				</View>
			) : null}
		</View>
	);
}
