import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing } from "../theme";

export function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        variant === "primary" && styles.buttonPrimary,
        variant === "ghost" && styles.buttonGhost,
        variant === "danger" && styles.buttonDanger,
        pressed && !isDisabled && styles.buttonPressed,
        isDisabled && styles.buttonDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : colors.textDim} size="small" />
      ) : (
        <Text
          style={[
            styles.buttonLabel,
            variant === "ghost" && { color: colors.textDim },
            variant === "danger" && { color: colors.danger },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  tint,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tint?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.chip,
        selected && { backgroundColor: tint ?? colors.accent, borderColor: tint ?? colors.accent },
      ]}
    >
      <Text style={[styles.chipLabel, selected && { color: "#fff", fontWeight: "700" }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  value,
  onChangeText,
  placeholder,
  ...rest
}: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textFaint}
      style={styles.input}
      autoCapitalize="none"
      autoCorrect={false}
      {...rest}
    />
  );
}

export function Stepper({
  label,
  value,
  onDecrease,
  onIncrease,
}: {
  label: string;
  value: string;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable onPress={onDecrease} style={styles.stepperButton} accessibilityLabel={`${label} 줄이기`}>
          <Text style={styles.stepperSign}>−</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{value}</Text>
        <Pressable onPress={onIncrease} style={styles.stepperButton} accessibilityLabel={`${label} 늘리기`}>
          <Text style={styles.stepperSign}>＋</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "ok"; children: React.ReactNode }) {
  const tint = tone === "error" ? colors.danger : tone === "ok" ? colors.ok : colors.textDim;
  return (
    <View style={[styles.notice, { borderColor: tint + "55" }]}>
      <Text style={[styles.noticeText, { color: tint }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: spacing.xs,
    marginHorizontal: spacing.xs,
  },
  sectionHint: {
    color: colors.textFaint,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  button: {
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  buttonPrimary: { backgroundColor: colors.accent },
  buttonGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.border },
  buttonDanger: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.danger + "66" },
  buttonPressed: { opacity: 0.7 },
  buttonDisabled: { opacity: 0.4 },
  buttonLabel: { color: "#fff", fontSize: 15, fontWeight: "600" },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  chipLabel: { color: colors.textDim, fontSize: 14, fontWeight: "600" },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
  },
  stepperRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stepperLabel: { color: colors.textDim, fontSize: 14, flexShrink: 1 },
  stepperControls: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperSign: { color: colors.text, fontSize: 18, lineHeight: 20 },
  stepperValue: { color: colors.text, fontSize: 15, fontWeight: "700", minWidth: 64, textAlign: "center" },
  divider: { height: 1, backgroundColor: colors.border },
  notice: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  noticeText: { fontSize: 13, lineHeight: 18 },
});
