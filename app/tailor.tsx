import { AppliedPrompt } from "@/components/AppliedPrompt";
import { CompanyLogo } from "@/components/CompanyLogo";
import { IconTile } from "@/components/IconField";
import { Colors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { useApplyFlow } from "@/hooks/useApplyFlow";
import { useJob } from "@/hooks/useJobs";
import { useResume } from "@/hooks/useResume";
import { SavedCv, TailoredStore } from "@/services/TailoredStore";
import { formatSize } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

// Tailoring is simulated for now: no request is sent and the saved CV is a
// blank PDF. When the backend is wired in, replace the timer with
// CvService.tailor / CvService.adapt and the blank file with CvService.pdf.
const STEPS = [
  "Reading your CV",
  "Analysing the job requirements",
  "Matching your skills",
  "Rewriting your experience",
  "Polishing the final layout",
];
const SAVE_STEP = "Saving to your device";
const DURATION = 6500;
const SAVE_DURATION = 1900;
const TICK = 100;

type Phase = "tailoring" | "saving" | "ready";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 2);

export default function TailorScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: job } = useJob(id);
  const { data: resume } = useResume();
  const { openPosting, asking, answer } = useApplyFlow(job);

  const [elapsed, setElapsed] = useState(0);
  const [saved, setSaved] = useState(false);
  const saveStarted = useRef(false);
  const [cv, setCv] = useState<SavedCv | null>(null);
  const lastStep = useRef(-1);

  const phase: Phase = elapsed < DURATION ? "tailoring" : saved ? "ready" : "saving";
  const progress = Math.min(easeOut(elapsed / DURATION), 1);
  const percent = Math.round(progress * 100);
  const activeStep =
    phase === "tailoring"
      ? Math.min(Math.floor(progress * STEPS.length), STEPS.length - 1)
      : STEPS.length;

  // The bar runs on the UI thread with the same curve as the percentage.
  const bar = useSharedValue(0);
  const pulse = useSharedValue(1);
  const spin = useSharedValue(0);

  useEffect(() => {
    bar.set(withTiming(1, { duration: DURATION, easing: Easing.out(Easing.quad) }));
    pulse.set(
      withRepeat(
        withSequence(
          withTiming(1.12, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) })
        ),
        -1
      )
    );
    spin.set(withRepeat(withTiming(360, { duration: 2400, easing: Easing.linear }), -1));
  }, [bar, pulse, spin]);

  useEffect(() => {
    if (phase !== "tailoring") return;
    const timer = setInterval(() => {
      setElapsed((e) => Math.min(e + TICK, DURATION));
    }, TICK);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (activeStep !== lastStep.current) {
      lastStep.current = activeStep;
      Haptics.selectionAsync();
    }
  }, [activeStep]);

  // Tailoring done → save the file while the save animation plays.
  useEffect(() => {
    if (phase !== "saving" || !job || saveStarted.current) return;
    saveStarted.current = true;
    const started = Date.now();
    (async () => {
      try {
        const saved = TailoredStore.saveCv(job);
        const updated = await TailoredStore.add(job, saved);
        queryClient.setQueryData(["tailored"], updated);
        setCv(saved);
      } catch (error) {
        console.error("Failed to save the tailored CV", error);
      }
      const remaining = Math.max(SAVE_DURATION - (Date.now() - started), 0);
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSaved(true);
      }, remaining);
    })();
  }, [phase, job, queryClient]);

  const shareCv = async () => {
    if (!cv) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    await Sharing.shareAsync(cv.uri, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
      dialogTitle: cv.name,
    });
  };

  const barStyle = useAnimatedStyle(() => ({ width: `${bar.value * 100}%` }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: (1.12 - pulse.value) * 2.5,
  }));
  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  const isReady = phase === "ready";

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ gestureEnabled: isReady }} />

      {job && (
        <View style={styles.jobRow}>
          <CompanyLogo name={job.company_name} url={job.url} size={36} />
          <View style={{ flex: 1 }}>
            <Text style={[Typography.regular12, { color: Colors.gray }]} numberOfLines={1}>
              {job.company_name}
            </Text>
            <Text style={[Typography.bold16, { color: Colors.black }]} numberOfLines={1}>
              {job.title}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.hero}>
        {phase === "tailoring" && (
          <Animated.View exiting={FadeOut.duration(150)} style={styles.heroGraphic}>
            <Animated.View style={[styles.ring, pulseStyle]} />
            <View style={styles.orb}>
              <Animated.View style={[styles.arc, spinStyle]} />
              <Text style={[Typography.bold20, { color: Colors.white, fontSize: 28, lineHeight: 32 }]}>
                {percent}%
              </Text>
            </View>
          </Animated.View>
        )}
        {phase === "saving" && (
          <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)}>
            <SaveAnimation />
          </Animated.View>
        )}
        {isReady && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.heroGraphic}>
            <View style={[styles.orb, { backgroundColor: Colors.success }]}>
              <Ionicons name="checkmark" size={52} color={Colors.white} />
            </View>
          </Animated.View>
        )}
        <Text style={[Typography.bold20, styles.heroTitle]}>
          {isReady ? "Your CV is ready" : phase === "saving" ? "Saving your CV" : "Tailoring your CV"}
        </Text>
        <Text style={[Typography.regular14, styles.heroSubtitle]} numberOfLines={2}>
          {isReady
            ? "Saved on this device. Open the posting to apply."
            : phase === "saving"
              ? "Keeping a copy on this device"
              : resume
                ? `Working on ${resume.name}`
                : "Working on your CV"}
        </Text>
      </View>

      {!isReady ? (
        <>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, barStyle]} />
          </View>
          <View style={styles.steps}>
            {[...STEPS, SAVE_STEP].map((label, index) => {
              const state = index < activeStep ? "done" : index === activeStep ? "active" : "pending";
              return (
                <Animated.View key={label} entering={FadeInDown.delay(index * 70)} style={styles.step}>
                  <View
                    style={[
                      styles.stepIcon,
                      state === "done" && { backgroundColor: Colors.primary },
                      state === "active" && { borderColor: Colors.primary, borderWidth: 2 },
                    ]}
                  >
                    {state === "done" && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                    {state === "active" && <View style={styles.activeDot} />}
                  </View>
                  <Text
                    style={[
                      Typography.medium16,
                      { color: state === "pending" ? Colors.grayLight : Colors.black },
                    ]}
                  >
                    {label}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
        </>
      ) : (
        cv && (
          <Animated.View entering={FadeInDown.delay(150).duration(300).easing(Easing.out(Easing.cubic))} style={styles.fileCard}>
            <IconTile icon="document-text" size={48} tone="accent" rotate={-6} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[Typography.bold16, { color: Colors.black }]} numberOfLines={1}>
                {cv.name}
              </Text>
              <Text style={[Typography.regular12, { color: Colors.gray }]}>
                PDF · {formatSize(cv.size)} · On this device
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
          </Animated.View>
        )
      )}

      {isReady && (
        <Animated.View entering={FadeInDown.delay(250).duration(300).easing(Easing.out(Easing.cubic))} style={styles.buttonGroup}>
          <Pressable
            style={({ pressed }) => [styles.button, styles.primaryButton, pressed && { backgroundColor: Colors.primaryPressed }]}
            onPress={openPosting}
          >
            <Ionicons name="open-outline" size={18} color={Colors.white} />
            <Text style={[Typography.medium16, { color: Colors.white }]}>Open job posting</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.button, styles.secondaryButton, pressed && { backgroundColor: Colors.secondaryPressed }]}
            onPress={shareCv}
          >
            <Ionicons name="download-outline" size={18} color={Colors.primary} />
            <Text style={[Typography.medium16, { color: Colors.primary }]}>Save or share CV</Text>
          </Pressable>
          <Pressable
            style={styles.textButton}
            hitSlop={8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Text style={[Typography.medium16, { color: Colors.gray }]}>Done</Text>
          </Pressable>
        </Animated.View>
      )}

      {job && <AppliedPrompt job={job} visible={asking} onAnswer={answer} />}
    </View>
  );
}

/** A CV page drops into a folder, the folder bounces, a check pops on. */
function SaveAnimation() {
  const drop = useSharedValue(0);
  const bounce = useSharedValue(1);
  const check = useSharedValue(0);

  useEffect(() => {
    drop.set(withDelay(150, withTiming(1, { duration: 750, easing: Easing.in(Easing.cubic) })));
    bounce.set(
      withDelay(
        880,
        withSequence(
          withTiming(1.04, { duration: 160, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 220, easing: Easing.inOut(Easing.quad) })
        )
      )
    );
    check.set(withDelay(1150, withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) })));
  }, [drop, bounce, check]);

  const docStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.max(drop.value - 0.75, 0) * 4,
    transform: [
      { translateY: drop.value * 58 },
      { scale: 1 - drop.value * 0.45 },
      { rotate: `${-10 + drop.value * 10}deg` },
    ],
  }));
  const folderStyle = useAnimatedStyle(() => ({ transform: [{ scale: bounce.value }] }));
  const checkStyle = useAnimatedStyle(() => ({
    opacity: check.value,
    transform: [{ scale: 0.8 + check.value * 0.2 }],
  }));

  return (
    <View style={styles.saveStage}>
      <Animated.View style={[styles.saveFolder, folderStyle]}>
        <IconTile icon="folder-open" size={84} />
        <Animated.View style={[styles.saveCheck, checkStyle]}>
          <Ionicons name="checkmark" size={16} color={Colors.white} />
        </Animated.View>
      </Animated.View>
      <Animated.View style={[styles.saveDoc, docStyle]}>
        <IconTile icon="document-text" size={56} tone="accent" />
      </Animated.View>
    </View>
  );
}

const ORB = 112;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 24,
  },
  jobRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.secondary,
    borderRadius: 24,
    padding: 8,
    paddingRight: 16,
    marginTop: 8,
  },
  hero: {
    alignItems: "center",
    marginTop: 28,
  },
  heroGraphic: {
    width: ORB,
    height: ORB,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: ORB,
    height: ORB,
    borderRadius: ORB / 2,
    backgroundColor: Colors.primary,
    opacity: 0.2,
  },
  orb: {
    width: ORB,
    height: ORB,
    borderRadius: ORB / 2,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  arc: {
    position: "absolute",
    width: ORB - 12,
    height: ORB - 12,
    borderRadius: (ORB - 12) / 2,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.15)",
    borderTopColor: Colors.white,
  },
  saveStage: {
    width: ORB,
    height: ORB,
    alignItems: "center",
  },
  saveFolder: {
    position: "absolute",
    bottom: 0,
  },
  saveCheck: {
    position: "absolute",
    right: -6,
    top: -6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  saveDoc: {
    position: "absolute",
    top: -22,
  },
  heroTitle: {
    color: Colors.black,
    marginTop: 20,
    fontSize: 24,
    lineHeight: 28,
  },
  heroSubtitle: {
    color: Colors.gray,
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.secondary,
    borderRadius: 3,
    marginTop: 24,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  steps: {
    marginTop: 24,
    gap: 14,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 28,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  buttonGroup: {
    marginTop: "auto",
    gap: 10,
    paddingBottom: 12,
  },
  button: {
    width: "100%",
    height: 50,
    borderRadius: 25,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.secondary,
  },
  textButton: {
    alignSelf: "center",
    paddingVertical: 10,
  },
});
