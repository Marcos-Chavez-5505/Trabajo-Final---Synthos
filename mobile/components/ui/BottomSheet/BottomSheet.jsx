import { useCallback } from "react";
import AnimatedBottomSheet, {
	BottomSheetBackdrop,
	BottomSheetModal as BottomSheetModalPrimitive,
	BottomSheetScrollView,
	BottomSheetTextInput,
	BottomSheetView,
} from "@gorhom/bottom-sheet";
import { ReduceMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "../../../theme";
import { useReducedMotionPreference } from "../Toast/useReducedMotionPreference";
import {
	BOTTOM_SHEET_BACKDROP_OPACITY,
	BOTTOM_SHEET_STYLES as styles,
} from "./BottomSheet.styles";

// Wrapper de @gorhom/bottom-sheet v5.
// La librería trae la mecánica (gestos, snap points, teclado); acá se conectan
// los tokens del proyecto: fondo, borde, radio, sombra, handle, backdrop y
// safe areas.
//
// Variantes:
// - <BottomSheet>: sheet persistente, convive con la pantalla.
// - <BottomSheetModal>: presentación modal (requiere <BottomSheetModalProvider>
//   en la raíz). Se abre con ref.current?.present() y se cierra con dismiss().

// Respeta el "reducir movimiento" del sistema y el hook del proyecto (el mismo
// que usan los toasts).
function useSheetReduceMotion() {
	const reducedMotion = useReducedMotionPreference();
	return reducedMotion ? ReduceMotion.Always : ReduceMotion.System;
}

// Backdrop de la librería con el velo del design system. No se aplica solo:
// hay que pasarlo en backdropComponent (lo hace este wrapper).
function useBackdrop({
	showBackdrop,
	appearsOnIndex,
	disappearsOnIndex,
	pressBehavior,
	backdropStyle,
}) {
	const renderBackdrop = useCallback(
		(props) => (
			<BottomSheetBackdrop
				{...props}
				appearsOnIndex={appearsOnIndex}
				disappearsOnIndex={disappearsOnIndex}
				pressBehavior={pressBehavior}
				opacity={BOTTOM_SHEET_BACKDROP_OPACITY}
				style={[styles.backdrop, backdropStyle]}
			/>
		),
		[
			appearsOnIndex,
			disappearsOnIndex,
			pressBehavior,
			backdropStyle,
		],
	);

	return showBackdrop ? renderBackdrop : undefined;
}

// Con snapPoints explícitos, la librería sumaría un snap point por contenido
// (enableDynamicSizing) y correría los índices. Sólo se activa si no hay
// snapPoints o si el consumidor lo pide.
function resolveDynamicSizing(enableDynamicSizing, snapPoints) {
	if (enableDynamicSizing !== undefined) return enableDynamicSizing;
	return snapPoints === undefined;
}

function BottomSheet({
	ref,
	children,
	snapPoints,
	enableDynamicSizing,
	enablePanDownToClose = false,
	showHandle = true,
	showBackdrop = false,
	backdropAppearsOnIndex = 0,
	backdropDisappearsOnIndex = -1,
	backdropPressBehavior = "close",
	backgroundStyle,
	handleStyle,
	handleIndicatorStyle,
	backdropStyle,
	topInset,
	bottomInset,
	style,
	...props
}) {
	const insets = useSafeAreaInsets();
	const overrideReduceMotion = useSheetReduceMotion();
	const backdropComponent = useBackdrop({
		showBackdrop,
		appearsOnIndex: backdropAppearsOnIndex,
		disappearsOnIndex: backdropDisappearsOnIndex,
		pressBehavior: backdropPressBehavior,
		backdropStyle,
	});

	return (
		<AnimatedBottomSheet
			ref={ref}
			snapPoints={snapPoints}
			enableDynamicSizing={resolveDynamicSizing(
				enableDynamicSizing,
				snapPoints,
			)}
			enablePanDownToClose={enablePanDownToClose}
			topInset={topInset ?? insets.top}
			bottomInset={bottomInset}
			overrideReduceMotion={overrideReduceMotion}
			backgroundStyle={[styles.background, backgroundStyle]}
			handleStyle={[styles.handle, handleStyle]}
			handleIndicatorStyle={[styles.handleIndicator, handleIndicatorStyle]}
			handleComponent={showHandle ? undefined : null}
			backdropComponent={backdropComponent}
			style={style}
			{...props}
		>
			{children}
		</AnimatedBottomSheet>
	);
}

function BottomSheetModal({
	ref,
	children,
	snapPoints,
	enableDynamicSizing,
	enablePanDownToClose = true,
	showHandle = true,
	showBackdrop = true,
	backdropAppearsOnIndex = 0,
	backdropDisappearsOnIndex = -1,
	backdropPressBehavior = "close",
	backgroundStyle,
	handleStyle,
	handleIndicatorStyle,
	backdropStyle,
	style,
	...props
}) {
	const overrideReduceMotion = useSheetReduceMotion();
	const backdropComponent = useBackdrop({
		showBackdrop,
		appearsOnIndex: backdropAppearsOnIndex,
		disappearsOnIndex: backdropDisappearsOnIndex,
		pressBehavior: backdropPressBehavior,
		backdropStyle,
	});

	return (
		<BottomSheetModalPrimitive
			ref={ref}
			snapPoints={snapPoints}
			enableDynamicSizing={resolveDynamicSizing(
				enableDynamicSizing,
				snapPoints,
			)}
			enablePanDownToClose={enablePanDownToClose}
			overrideReduceMotion={overrideReduceMotion}
			backgroundStyle={[styles.background, backgroundStyle]}
			handleStyle={[styles.handle, handleStyle]}
			handleIndicatorStyle={[styles.handleIndicator, handleIndicatorStyle]}
			handleComponent={showHandle ? undefined : null}
			backdropComponent={backdropComponent}
			style={style}
			{...props}
		>
			{children}
		</BottomSheetModalPrimitive>
	);
}

// Contenido vertical con padding y gap del design system. El padding inferior
// suma el safe area para que el último control no quede bajo la barra del
// sistema.
function BottomSheetContent({ style, children, ...props }) {
	const insets = useSafeAreaInsets();

	return (
		<BottomSheetView
			style={[
				styles.content,
				{ paddingBottom: spacing.lg + insets.bottom },
				style,
			]}
			{...props}
		>
			{children}
		</BottomSheetView>
	);
}

// Variante scrolleable: usa el ScrollView de la librería, que coordina el
// scroll con el gesto del sheet. Nunca el ScrollView de react-native.
function BottomSheetScrollContent({
	contentContainerStyle,
	children,
	...props
}) {
	const insets = useSafeAreaInsets();

	return (
		<BottomSheetScrollView
			contentContainerStyle={[
				styles.scrollContent,
				{ paddingBottom: spacing.lg + insets.bottom },
				contentContainerStyle,
			]}
			{...props}
		>
			{children}
		</BottomSheetScrollView>
	);
}

// Input del sheet: usa BottomSheetTextInput para que el teclado mueva el sheet
// en vez de tapar el campo.
function BottomSheetInput({
	style,
	placeholderTextColor = colors.placeholder,
	...props
}) {
	return (
		<BottomSheetTextInput
			placeholderTextColor={placeholderTextColor}
			style={[styles.input, style]}
			{...props}
		/>
	);
}

export {
	BottomSheet,
	BottomSheetModal,
	BottomSheetContent,
	BottomSheetScrollContent,
	BottomSheetInput,
	BottomSheetBackdrop,
	BottomSheetScrollView,
	BottomSheetTextInput,
	BottomSheetView,
};
export {
	BottomSheetModalProvider,
	useBottomSheet,
	useBottomSheetModal,
} from "@gorhom/bottom-sheet";
