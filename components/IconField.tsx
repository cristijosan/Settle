import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { ComponentProps } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export type TileTone = "primary" | "accent" | "light";

const TONES: Record<TileTone, readonly [string, string]> = {
  primary: [Colors.primary, Colors.primaryDeep],
  accent: ["#FF9A6E", Colors.accent],
  light: ["rgba(255,255,255,0.28)", "rgba(255,255,255,0.08)"],
};

interface IconTileProps {
  icon: IoniconName;
  size: number;
  tone?: TileTone;
  rotate?: number;
  style?: StyleProp<ViewStyle>;
}

/** A rounded, tilted gradient tile with a glyph — the app's illustration unit. */
export const IconTile = ({ icon, size, tone = "primary", rotate = 0, style }: IconTileProps) => (
  <View
    style={[
      tone !== "light" && styles.shadow,
      { transform: [{ rotate: `${rotate}deg` }] },
      style,
    ]}
  >
    <LinearGradient
      colors={TONES[tone]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: size * 0.3 },
        tone === "light" && styles.lightBorder,
      ]}
    >
      <Ionicons
        name={icon}
        size={size * 0.48}
        color={tone === "light" ? "rgba(255,255,255,0.85)" : Colors.white}
      />
    </LinearGradient>
  </View>
);

export interface FieldTile {
  icon: IoniconName;
  /** Position as a percentage of the container. */
  x: number;
  y: number;
  size: number;
  rotate: number;
  tone: TileTone;
}

/** Scattered tiles filling their parent; purely decorative. */
export const IconField = ({ tiles, style }: { tiles: FieldTile[]; style?: StyleProp<ViewStyle> }) => (
  <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
    {tiles.map((t, i) => (
      <IconTile
        key={i}
        icon={t.icon}
        size={t.size}
        tone={t.tone}
        rotate={t.rotate}
        style={{ position: "absolute", left: `${t.x}%`, top: `${t.y}%` }}
      />
    ))}
  </View>
);

/** Full-screen scatter behind onboarding and the paywall. */
export const SCATTER_TILES: FieldTile[] = [
  { icon: "document-text", x: 8, y: 6, size: 92, rotate: -14, tone: "primary" },
  { icon: "sparkles", x: 64, y: 4, size: 70, rotate: 12, tone: "accent" },
  { icon: "briefcase", x: 72, y: 30, size: 84, rotate: -8, tone: "primary" },
  { icon: "checkmark", x: 2, y: 40, size: 64, rotate: 16, tone: "accent" },
  { icon: "paper-plane", x: 40, y: 34, size: 76, rotate: 6, tone: "primary" },
  { icon: "star", x: 16, y: 70, size: 72, rotate: -10, tone: "primary" },
  { icon: "ribbon", x: 66, y: 68, size: 88, rotate: 14, tone: "accent" },
  { icon: "search", x: 44, y: 82, size: 58, rotate: -18, tone: "primary" },
];

/** Light tiles for use on a primary-coloured card. */
export const CARD_TILES: FieldTile[] = [
  { icon: "document-text", x: 6, y: 10, size: 54, rotate: -12, tone: "light" },
  { icon: "briefcase", x: 34, y: -8, size: 46, rotate: 10, tone: "light" },
  { icon: "sparkles", x: 56, y: 22, size: 40, rotate: -6, tone: "light" },
  { icon: "checkmark", x: 80, y: 46, size: 50, rotate: 14, tone: "light" },
];

const styles = StyleSheet.create({
  tile: {
    alignItems: "center",
    justifyContent: "center",
  },
  lightBorder: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  shadow: {
    shadowColor: Colors.primaryDeep,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
});
