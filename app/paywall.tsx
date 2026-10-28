import { IconField, IconTile, SCATTER_TILES } from "@/components/IconField";
import { Colors } from "@/constants/Colors";
import { Links } from "@/constants/Links";
import { Typography } from "@/constants/Typography";
import { periodUnit, SubscriptionService } from "@/services/SubscriptionService";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { ReactNode, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// Plain emoji on purpose: the paywall should read light, not like the app's icon set.
const FEATURES: { emoji: string; text: ReactNode }[] = [
  { emoji: "✨", text: <>TAILOR <B>MORE CVs</B> WITH AI</> },
  { emoji: "🎯", text: <>SEE YOUR <B>TOP MATCHES</B></> },
  { emoji: "💬", text: <>SEARCH <B>WITH PROMPTS</B></> },
  { emoji: "🧠", text: <><B>AI ANALYSIS</B> OF YOUR CV</> },
];

function B({ children }: { children: ReactNode }) {
  return <Text style={styles.featureBold}>{children}</Text>;
}

type Plan = "year" | "month";

export default function PaywallScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Plan>("year");
  const [busy, setBusy] = useState<"buy" | "restore" | null>(null);

  const { data: products, isLoading, error, refetch } = useQuery({
    queryKey: ["paywallProducts"],
    queryFn: () => SubscriptionService.getProducts(),
    staleTime: 1000 * 60 * 10,
  });

  const yearly = products?.find((p) => periodUnit(p) === "year");
  const monthly = products?.find((p) => periodUnit(p) === "month");
  const product = selected === "year" ? (yearly ?? monthly) : (monthly ?? yearly);

  const close = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  const unlocked = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Flipping this starts the one-time AI analysis of the uploaded CV.
    queryClient.setQueryData(["premium"], true);
    close();
  };

  const handleContinue = async () => {
    if (!product || busy) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    setBusy("buy");
    try {
      if (await SubscriptionService.purchase(product)) unlocked();
    } catch (e) {
      Alert.alert("Purchase failed", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const handleRestore = async () => {
    if (busy) return;
    setBusy("restore");
    try {
      if (await SubscriptionService.restore()) unlocked();
      else Alert.alert("Nothing to restore", "No active subscription was found for this Apple ID.");
    } catch (e) {
      Alert.alert("Restore failed", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const features = FEATURES.map((f) => (
    <View key={f.emoji} style={styles.featureRow}>
      <Text style={styles.featureEmoji}>{f.emoji}</Text>
      <Text style={styles.featureText}>{f.text}</Text>
    </View>
  ));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.illustration} pointerEvents="none">
        <IconField tiles={SCATTER_TILES} />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Animated.View entering={FadeIn.duration(300)}>
            <Text style={[Typography.medium24, styles.titleTop]}>Land Your</Text>
            <Text style={[Typography.bold20, styles.titleBottom]}>Dream Job</Text>
          </Animated.View>
          <Pressable onPress={close} style={styles.closeButton} hitSlop={10} accessibilityLabel="Close">
            <Ionicons name="close" size={20} color={Colors.gray} />
          </Pressable>
        </View>

        <Animated.View entering={FadeInDown.duration(300).delay(80)} style={styles.cardArea}>
          {isLiquidGlassAvailable() ? (
            <GlassView style={styles.featureCard} isInteractive>
              {features}
            </GlassView>
          ) : (
            <View style={styles.glassWrapper}>
              <BlurView intensity={Platform.OS === "ios" ? 30 : 90} tint="extraLight">
                <LinearGradient
                  colors={["rgba(255,255,255,0.55)", "rgba(255,255,255,0.2)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.featureCard}
                >
                  {features}
                </LinearGradient>
              </BlurView>
            </View>
          )}
          <IconTile icon="sparkles" size={76} tone="accent" rotate={12} style={styles.tileTopRight} />
          <IconTile icon="checkmark" size={60} rotate={-12} style={styles.tileBottomLeft} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(300).delay(160)}>
          <Text style={styles.planTitle}>
            GET <Text style={{ color: Colors.primary }}>PRO</Text> ACCESS
          </Text>

          {isLoading ? (
            <ActivityIndicator color={Colors.primary} style={styles.plansLoading} />
          ) : error || !product ? (
            <Pressable onPress={() => refetch()} style={styles.plansError}>
              <Text style={[Typography.regular14, { color: Colors.gray, textAlign: "center" }]}>
                Couldn’t load the plans. Tap to try again.
              </Text>
            </Pressable>
          ) : (
            <View style={{ gap: 12 }}>
              {yearly && (
                <PlanOption
                  active={selected === "year"}
                  onPress={() => setSelected("year")}
                  badge="BEST OFFER"
                  title="YEARLY ACCESS"
                  price={`just ${yearly.price?.localizedString ?? ""} per year`}
                />
              )}
              {monthly && (
                <PlanOption
                  active={selected === "month"}
                  onPress={() => setSelected("month")}
                  title="1 MONTH"
                  price={monthly.price?.localizedString ?? ""}
                  inline
                />
              )}
            </View>
          )}

          <Pressable
            onPress={handleContinue}
            disabled={!product || !!busy}
            style={({ pressed }) => [
              styles.continueButton,
              pressed && { backgroundColor: Colors.primaryPressed },
              !product && { opacity: 0.5 },
            ]}
          >
            {busy === "buy" ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={[Typography.bold20, { color: Colors.white }]}>Continue</Text>
            )}
          </Pressable>

          <Text style={styles.footerNote}>🛡️ Auto Renewals / Cancel Anytime</Text>

          <View style={styles.footerLinks}>
            <Text style={styles.footerLink} onPress={() => WebBrowser.openBrowserAsync(Links.terms)}>
              Terms of Use
            </Text>
            <Text style={styles.footerLink} onPress={handleRestore}>
              {busy === "restore" ? "Restoring…" : "Restore"}
            </Text>
            <Text style={styles.footerLink} onPress={() => WebBrowser.openBrowserAsync(Links.privacy)}>
              Privacy Policy
            </Text>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

function PlanOption({
  active,
  onPress,
  title,
  price,
  badge,
  inline = false,
}: {
  active: boolean;
  onPress: () => void;
  title: string;
  price: string;
  badge?: string;
  inline?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={[styles.planCard, active && styles.planCardActive]}
    >
      <View style={inline ? styles.planInline : undefined}>
        <Text style={[styles.planName, { color: active ? Colors.black : Colors.gray }]}>{title}</Text>
        <Text style={styles.planPrice}>{price}</Text>
      </View>
      {active ? (
        <Ionicons name="checkmark-circle" size={26} color={Colors.primary} />
      ) : (
        <View style={styles.radio} />
      )}
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  illustration: {
    position: "absolute",
    width: width + 20,
    height: width + 20,
    top: "22%",
    left: -10,
    opacity: 0.25,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 10,
  },
  titleTop: { fontSize: 32, lineHeight: 40, color: Colors.black },
  titleBottom: { fontSize: 32, lineHeight: 40, color: Colors.primary },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  cardArea: {
    marginHorizontal: 12,
  },
  glassWrapper: {
    borderRadius: 30,
    overflow: "hidden",
    borderColor: "rgba(255, 255, 255, 0.8)",
    borderWidth: 1,
  },
  featureCard: {
    borderRadius: 30,
    paddingVertical: 22,
    paddingHorizontal: 18,
    gap: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureEmoji: {
    fontSize: 24,
    lineHeight: 30,
  },
  featureText: {
    ...Typography.regular14,
    color: Colors.black,
    flex: 1,
  },
  featureBold: {
    fontFamily: "Archivo-Bold",
  },
  tileTopRight: {
    position: "absolute",
    right: -22,
    top: -40,
  },
  tileBottomLeft: {
    position: "absolute",
    left: -18,
    bottom: -32,
  },
  planTitle: {
    ...Typography.bold20,
    fontSize: 30,
    lineHeight: 36,
    color: Colors.black,
    textAlign: "center",
    marginBottom: 18,
  },
  plansLoading: {
    height: 136,
  },
  plansError: {
    height: 136,
    justifyContent: "center",
  },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    minHeight: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: Colors.secondary,
    backgroundColor: Colors.white,
  },
  planCardActive: { borderColor: Colors.primary },
  planInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  planName: {
    ...Typography.medium16,
    fontSize: 14,
  },
  planPrice: {
    ...Typography.bold16,
    fontSize: 14,
    color: Colors.primary,
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.secondary,
  },
  badge: {
    position: "absolute",
    top: -11,
    right: 54,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    ...Typography.bold16,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.5,
    color: Colors.white,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  footerNote: {
    ...Typography.regular12,
    textAlign: "center",
    marginTop: 12,
    color: Colors.gray,
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingHorizontal: 10,
  },
  footerLink: {
    ...Typography.regular12,
    color: Colors.gray,
    textDecorationLine: "underline",
  },
});
