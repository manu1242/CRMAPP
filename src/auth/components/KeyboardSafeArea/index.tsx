import React from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface KeyboardSafeAreaProps {
    children: React.ReactNode;
    /** Style applied to the outer SafeAreaView */
    style?: ViewStyle;
    /** Style applied to the ScrollView's contentContainer */
    contentContainerStyle?: ViewStyle;
    /** Background color applied to both SafeAreaView and ScrollView */
    backgroundColor?: string;
}

/**
 * KeyboardSafeArea — Production-ready keyboard avoidance wrapper.
 *
 * Combines:
 * - SafeAreaView (handles notch, Dynamic Island, home indicator)
 * - KeyboardAvoidingView with platform-correct behavior:
 *     iOS     → 'padding'  (pushes content up above keyboard)
 *     Android → 'height'   (shrinks the view to fit above keyboard)
 * - ScrollView with keyboardShouldPersistTaps="handled" so tapping
 *   outside an input dismisses the keyboard, and buttons remain
 *   tappable while the keyboard is still open.
 */
export default function KeyboardSafeArea({
    children,
    style,
    contentContainerStyle,
    backgroundColor,
}: KeyboardSafeAreaProps) {
    return (
        <SafeAreaView
            style={[
                styles.safeArea,
                backgroundColor ? { backgroundColor } : undefined,
                style,
            ]}
            edges={['top', 'bottom', 'left', 'right']}
        >
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={[
                        styles.defaultContent,
                        contentContainerStyle,
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    {children}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
    defaultContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
});
