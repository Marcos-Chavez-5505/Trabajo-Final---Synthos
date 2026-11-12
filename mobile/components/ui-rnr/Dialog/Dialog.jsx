import { Fragment, useCallback, useEffect, useRef } from "react";
import { Platform, Text, View } from "react-native";
import { FadeIn, FadeOut, ReduceMotion } from "react-native-reanimated";
import { FullWindowOverlay as RNFullWindowOverlay } from "react-native-screens";
import * as DialogPrimitive from "@rn-primitives/dialog";
import { colors, spacing } from "../../../theme";
import { CloseIcon } from "../../icons";
import { useReducedMotionPreference } from "../../ui/Toast/useReducedMotionPreference";
import { NativeOnlyAnimatedView } from "../NativeOnlyAnimatedView";
import { DIALOG_MOTION, DIALOG_STYLES as styles } from "./Dialog.styles";

const FullWindowOverlay =
	Platform.OS === "ios" ? RNFullWindowOverlay : Fragment;

function useStableCallback(callback) {
	const ref = useRef(callback);
	useEffect(() => {
		ref.current = callback;
	}, [callback]);

	return useCallback((...args) => ref.current?.(...args), []);
}

function Dialog({ onOpenChange, children, ...props }) {
	const handleOpenChange = useStableCallback(onOpenChange);

	return (
		<DialogPrimitive.Root onOpenChange={handleOpenChange} {...props}>
			{children}
		</DialogPrimitive.Root>
	);
}

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

function DialogOverlay({
	children,
	closeOnPress = true,
	onPress,
	style,
	...props
}) {
	const { onOpenChange } = DialogPrimitive.useRootContext();
	const reducedMotion = useReducedMotionPreference();

	function handleWebPress(event) {
		onPress?.(event);
		if (!closeOnPress) return;
		if (event.target === event.currentTarget && !event.isDefaultPrevented?.()) {
			onOpenChange(false);
		}
	}

	return (
		<FullWindowOverlay>
			<DialogPrimitive.Overlay
				style={[styles.overlay, style]}
				{...props}
				{...(Platform.OS !== "web" ? { closeOnPress } : {})}
				onPress={Platform.select({ web: handleWebPress, native: onPress })}
				asChild={Platform.OS !== "web"}
			>
				<NativeOnlyAnimatedView
					as="Pressable"
					entering={
						reducedMotion
							? undefined
							: FadeIn.duration(DIALOG_MOTION.enter).reduceMotion(
									ReduceMotion.System,
								)
					}
					exiting={
						reducedMotion
							? undefined
							: FadeOut.duration(DIALOG_MOTION.exit).reduceMotion(
									ReduceMotion.System,
								)
					}
				>
					<View style={styles.scrim} pointerEvents="none" />
					<NativeOnlyAnimatedView
						entering={
							reducedMotion
								? undefined
								: FadeIn.delay(DIALOG_MOTION.delay).reduceMotion(
										ReduceMotion.System,
									)
						}
						exiting={
							reducedMotion
								? undefined
								: FadeOut.duration(DIALOG_MOTION.exit).reduceMotion(
										ReduceMotion.System,
									)
						}
						style={styles.cardSlot}
					>
						{children}
					</NativeOnlyAnimatedView>
				</NativeOnlyAnimatedView>
			</DialogPrimitive.Overlay>
		</FullWindowOverlay>
	);
}

function DialogCloseButton() {
	return (
		<DialogPrimitive.Close
			hitSlop={spacing.md}
			accessibilityLabel="Cerrar"
			style={({ pressed }) => [
				styles.closeButton,
				pressed && styles.closeButtonPressed,
			]}
		>
			<CloseIcon size={spacing.lg} color={colors.textPrimary} />
		</DialogPrimitive.Close>
	);
}

function DialogContent({
	showCloseButton = true,
	closeOnPress = true,
	style,
	children,
	portalHost,
	...props
}) {
	return (
		<DialogPortal hostName={portalHost}>
			<DialogOverlay closeOnPress={closeOnPress}>
				<DialogPrimitive.Content style={[styles.content, style]} {...props}>
					{children}
					{showCloseButton ? <DialogCloseButton /> : null}
				</DialogPrimitive.Content>
			</DialogOverlay>
		</DialogPortal>
	);
}

function DialogHeader({ style, ...props }) {
	return <View style={[styles.header, style]} {...props} />;
}

function DialogFooter({ showCloseButton = false, style, children, ...props }) {
	return (
		<View style={[styles.footer, style]} {...props}>
			{children}
			{showCloseButton ? (
				<DialogPrimitive.Close style={styles.footerClose}>
					<Text style={styles.footerCloseText}>Cerrar</Text>
				</DialogPrimitive.Close>
			) : null}
		</View>
	);
}

function DialogTitle({ style, ...props }) {
	return <DialogPrimitive.Title style={[styles.title, style]} {...props} />;
}

function DialogDescription({ style, ...props }) {
	return (
		<DialogPrimitive.Description
			style={[styles.description, style]}
			{...props}
		/>
	);
}

export {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
};