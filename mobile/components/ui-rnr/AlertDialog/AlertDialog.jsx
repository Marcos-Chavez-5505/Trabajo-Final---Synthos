import {
	Fragment,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
} from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { FadeIn, FadeOut, ReduceMotion } from "react-native-reanimated";
import { FullWindowOverlay as RNFullWindowOverlay } from "react-native-screens";
import * as AlertDialogPrimitive from "@rn-primitives/alert-dialog";
import { colors, spacing } from "../../../theme";
import { CloseIcon } from "../../icons";
import { useReducedMotionPreference } from "../../ui/Toast/useReducedMotionPreference";
import { NativeOnlyAnimatedView } from "../NativeOnlyAnimatedView";
import {
	ALERT_DIALOG_MOTION,
	ALERT_DIALOG_STYLES as styles,
} from "./AlertDialog.styles";

const FullWindowOverlay =	Platform.OS === "ios" ? RNFullWindowOverlay : Fragment;

const AlertDialogContext = createContext(true);

function useStableCallback(callback) {
	const ref = useRef(callback);
	useEffect(() => {
		ref.current = callback;
	}, [callback]);

	return useCallback((...args) => ref.current?.(...args), []);
}

function claimResponder() {
	return true;
}

function renderLabel(children, textStyle) {
	if (typeof children === "string") {
		return <Text style={textStyle}>{children}</Text>;
	}
	return children;
}

function AlertDialog({
	closeOnOutsideClick = true,
	onOpenChange,
	children,
	...props
}) {
	const handleOpenChange = useStableCallback(onOpenChange);

	return (
		<AlertDialogContext.Provider value={closeOnOutsideClick}>
			<AlertDialogPrimitive.Root onOpenChange={handleOpenChange} {...props}>
				{children}
			</AlertDialogPrimitive.Root>
		</AlertDialogContext.Provider>
	);
}

const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

const AlertDialogPortal = AlertDialogPrimitive.Portal;

function AlertDialogOverlay({
	children,
	closeOnOutsideClick,
	onPress,
	style,
	...props
}) {
	const rootCloseOnOutsideClick = useContext(AlertDialogContext);
	const closeOnOutside =
		closeOnOutsideClick === undefined
			? rootCloseOnOutsideClick
			: closeOnOutsideClick;
	const { onOpenChange } = AlertDialogPrimitive.useRootContext();
	const reducedMotion = useReducedMotionPreference();

	function handlePress(event) {
		onPress?.(event);
		if (!closeOnOutside) return;
		if (event.target === event.currentTarget && !event.isDefaultPrevented?.()) {
			onOpenChange(false);
		}
	}

	const overlayStyle = [styles.overlay, style];

	return (
		<FullWindowOverlay>
			<AlertDialogPrimitive.Overlay {...props} asChild>
				{Platform.OS === "web" ? (
					<Pressable style={overlayStyle} onPress={handlePress}>
						<View style={styles.scrim} pointerEvents="none" />
						{children}
					</Pressable>
				) : (
					<NativeOnlyAnimatedView
						as="Pressable"
						onPress={handlePress}
						style={overlayStyle}
						entering={
							reducedMotion
								? undefined
								: FadeIn.duration(ALERT_DIALOG_MOTION.enter)
										.delay(ALERT_DIALOG_MOTION.delay)
										.reduceMotion(ReduceMotion.System)
						}
						exiting={
							reducedMotion
								? undefined
								: FadeOut.duration(ALERT_DIALOG_MOTION.exit).reduceMotion(
										ReduceMotion.System,
									)
						}
					>
						<View style={styles.scrim} pointerEvents="none" />
						{children}
					</NativeOnlyAnimatedView>
				)}
			</AlertDialogPrimitive.Overlay>
		</FullWindowOverlay>
	);
}

function AlertDialogCloseButton() {
	return (
		<AlertDialogPrimitive.Cancel
			hitSlop={spacing.md}
			accessibilityLabel="Cerrar"
			style={({ pressed }) => [
				styles.closeButton,
				pressed && styles.closeButtonPressed,
			]}
		>
			<CloseIcon size={spacing.lg} color={colors.textPrimary} />
		</AlertDialogPrimitive.Cancel>
	);
}

function AlertDialogContent({
	size = "default",
	showCloseButton = true,
	closeOnOutsideClick,
	style,
	children,
	portalHost,
	...props
}) {
	return (
		<AlertDialogPortal hostName={portalHost}>
			<AlertDialogOverlay closeOnOutsideClick={closeOnOutsideClick}>
				<AlertDialogPrimitive.Content
					onStartShouldSetResponder={claimResponder}
					style={[
						styles.content,
						size === "sm" && styles.contentSmall,
						style,
					]}
					{...props}
				>
					{children}
					{showCloseButton ? <AlertDialogCloseButton /> : null}
				</AlertDialogPrimitive.Content>
			</AlertDialogOverlay>
		</AlertDialogPortal>
	);
}

function AlertDialogHeader({ style, ...props }) {
	return <View style={[styles.header, style]} {...props} />;
}

function AlertDialogFooter({ style, ...props }) {
	return <View style={[styles.footer, style]} {...props} />;
}

function AlertDialogMedia({ style, ...props }) {
	return <View style={[styles.media, style]} {...props} />;
}

function AlertDialogTitle({ style, ...props }) {
	return (
		<AlertDialogPrimitive.Title style={[styles.title, style]} {...props} />
	);
}

function AlertDialogDescription({ style, ...props }) {
	return (
		<AlertDialogPrimitive.Description
			style={[styles.description, style]}
			{...props}
		/>
	);
}

function AlertDialogAction({ style, children, ...props }) {
	return (
		<AlertDialogPrimitive.Action
			style={(state) => [
				styles.action,
				state.pressed && styles.actionPressed,
				typeof style === "function" ? style(state) : style,
			]}
			{...props}
		>
			{renderLabel(children, styles.actionText)}
		</AlertDialogPrimitive.Action>
	);
}

function AlertDialogCancel({ style, children, ...props }) {
	return (
		<AlertDialogPrimitive.Cancel
			style={(state) => [
				styles.cancel,
				state.pressed && styles.cancelPressed,
				typeof style === "function" ? style(state) : style,
			]}
			{...props}
		>
			{renderLabel(children, styles.cancelText)}
		</AlertDialogPrimitive.Cancel>
	);
}

export {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogOverlay,
	AlertDialogPortal,
	AlertDialogTitle,
	AlertDialogTrigger,
};