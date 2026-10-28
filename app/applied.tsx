import { CompanyLogo } from "@/components/CompanyLogo";
import { IconTile } from "@/components/IconField";
import { Colors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { useTailoredRecord } from "@/hooks/useResume";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { ComponentProps, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const DAY = 86_400_000;

const shortDate = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

// Typical hiring timings — shown as estimates, not promises.
const nextSteps = (appliedAt: Date): { label: string; icon: IoniconName; date: string }[] => [
  { label: "Applied", icon: "paper-plane-outline", date: shortDate(appliedAt) },
  { label: "Review", icon: "eye-outline", date: `~ ${shortDate(new Date(appliedAt.getTime() + 10 * DAY))}` },
  { label: "Interview", icon: "people-outline", date: `~ ${shortDate(new Date(appliedAt.getTime() + 24 * DAY))}` },
];

const RAYS = [-60, -30, 0, 30, 60];

export default function AppliedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const record = useTailoredRecord(id);
  const [openedAt] = useState(Date.now);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const done = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    router.dismissTo({ pathname: "/job/[id]", params: { id } });
  };

  const appliedAt = new Date(record?.appliedAt ?? openedAt);
  const steps = nextSteps(appliedAt);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.hero}>
        {RAYS.map((angle, i) => (
          <Animated.View
            key={angle}
            entering={FadeIn.delay(350 + i * 60)}
            style={[styles.ray, { transform: [{ rotate: `${angle}deg` }, { translateY: -78 }] }]}
          />
        ))}
        <Animated.View entering={FadeIn.duration(300)}>
          <IconTile icon="paper-plane" size={112} tone="accent" rotate={-8} />
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(150).duration(300).easing(Easing.out(Easing.cubic))}>
        <Text style={[Typography.medium24, styles.titleTop]}>Application</Text>
        <Text style={[Typography.bold20, styles.titleBottom]}>SENT SUCCESSFULLY!</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(250).duration(300).easing(Easing.out(Easing.cubic))}>
        <Text style={[Typography.bold16, styles.sectionTitle]}>What happens next?</Text>
        <View style={styles.timeline}>
          {steps.map((step, i) => {
            const current = i === 0;
            return (
              <View key={step.label} style={[styles.stepCard, current && styles.stepCardCurrent]}>
                <View style={styles.stepHeader}>
                  <Ionicons name={step.icon} size={16} color={current ? Colors.primary : Colors.grayLight} />
                  <Text style={[Typography.medium16, { color: current ? Colors.primary : Colors.grayLight }]}>
                    {step.label}
                  </Text>
                </View>
                <Text
                  style={[Typography.regular12, { color: current ? Colors.black : Colors.grayLight }]}
                  numberOfLines={1}
                >
                  {step.date}
                </Text>
              </View>
            );
          })}
        </View>
      </Animated.View>

      {record && (
        <Animated.View entering={FadeInDown.delay(350).duration(300).easing(Easing.out(Easing.cubic))} style={styles.jobCard}>
          <View style={styles.jobCardTop}>
            <CompanyLogo name={record.job.company_name} url={record.job.url} size={52} />
            <View style={styles.appliedBadge}>
              <Ionicons name="checkmark" size={14} color={Colors.success} />
              <Text style={[Typography.regular14, { color: Colors.success }]}>Applied</Text>
            </View>
          </View>
          <Text style={[Typography.bold20, styles.jobTitle]} numberOfLines={2}>
            {record.job.title}
          </Text>
          <Text style={[Typography.regular14, { color: Colors.gray }]} numberOfLines={1}>
            {record.job.company_name}
          </Text>
          <View style={styles.separator} />
          <Text style={[Typography.regular12, { color: Colors.gray }]}>Sent with</Text>
          <View style={styles.cvRow}>
            <Ionicons name="document-text-outline" size={18} color={Colors.black} />
            <Text style={[Typography.bold16, { color: Colors.black, flex: 1 }]} numberOfLines={1}>
              {record.cvName ?? "Your tailored CV"}
            </Text>
          </View>
        </Animated.View>
      )}

      <Animated.View entering={FadeIn.delay(500)} style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.doneButton, pressed && { backgroundColor: Colors.primaryPressed }]}
          onPress={done}
        >
          <Text style={[Typography.medium16, { color: Colors.white }]}>Done</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
  },
  hero: {
    height: 170,
    alignItems: "center",
    justifyContent: "center",
  },
  ray: {
    position: "absolute",
    width: 6,
    height: 18,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  titleTop: {
    color: Colors.primary,
    fontSize: 34,
    lineHeight: 40,
    marginTop: 12,
  },
  titleBottom: {
    color: Colors.primary,
    fontSize: 32,
    lineHeight: 38,
  },
  sectionTitle: {
    color: Colors.black,
    marginTop: 18,
  },
  timeline: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  stepCard: {
    flex: 1,
    gap: 6,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  stepCardCurrent: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
    shadowColor: Colors.primaryDeep,
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  jobCard: {
    marginTop: 20,
    padding: 14,
    gap: 4,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  jobCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  appliedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.successSoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
  },
  jobTitle: {
    color: Colors.black,
    lineHeight: 26,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.secondary,
    marginVertical: 10,
  },
  cvRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  footer: {
    marginTop: "auto",
  },
  doneButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
