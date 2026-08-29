import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Arrival, Prediction } from "../types";
import { describe, formatEta } from "../lib/format";
import { colors, etaColor, radius, routeColor, spacing } from "../theme";

function Slot({ prediction, primary }: { prediction: Prediction | null; primary?: boolean }) {
  const eta = prediction?.etaSeconds ?? null;
  const unavailable = prediction?.message && eta == null ? prediction.message : null;

  return (
    <View style={styles.slot}>
      <Text
        style={[
          primary ? styles.etaPrimary : styles.etaSecondary,
          { color: unavailable ? colors.textFaint : etaColor(eta) },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {unavailable ?? formatEta(eta)}
      </Text>
      {prediction && !unavailable ? (
        <Text style={styles.slotMeta} numberOfLines={1}>
          {describe(prediction)}
        </Text>
      ) : null}
    </View>
  );
}

export function ArrivalCard({ arrival }: { arrival: Arrival }) {
  const tint = routeColor(arrival.routeType);

  return (
    <View style={styles.card}>
      <View style={[styles.stripe, { backgroundColor: tint }]} />
      <View style={styles.body}>
        <View style={styles.headRow}>
          <View style={[styles.badge, { backgroundColor: tint }]}>
            <Text style={styles.badgeText}>{arrival.routeName}</Text>
          </View>
          <View style={styles.headText}>
            <Text style={styles.routeType}>{arrival.routeType || "버스"}</Text>
            {arrival.direction ? (
              <Text style={styles.direction} numberOfLines={1}>
                {arrival.direction} 방면
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.slots}>
          <Slot prediction={arrival.first} primary />
          <View style={styles.slotDivider} />
          <Slot prediction={arrival.second} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  stripe: { width: 4 },
  body: { flex: 1, padding: spacing.lg, gap: spacing.md },
  headRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.sm,
    minWidth: 62,
    alignItems: "center",
  },
  badgeText: { color: "#fff", fontSize: 19, fontWeight: "800", letterSpacing: -0.3 },
  headText: { flex: 1 },
  routeType: { color: colors.textDim, fontSize: 12, fontWeight: "600" },
  direction: { color: colors.textFaint, fontSize: 12, marginTop: 1 },
  slots: { flexDirection: "row", alignItems: "stretch" },
  slotDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
  slot: { flex: 1, gap: 2 },
  etaPrimary: { fontSize: 28, fontWeight: "800", letterSpacing: -0.8 },
  etaSecondary: { fontSize: 18, fontWeight: "700", letterSpacing: -0.4 },
  slotMeta: { color: colors.textFaint, fontSize: 11 },
});
