import { CvUploadPanel } from "@/components/CvUploadPanel";
import {
  CARD_TILES,
  IconField,
  IconTile,
  SCATTER_TILES,
} from "@/components/IconField";
import { Colors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { useResume } from "@/hooks/useResume";
import { Entypo, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaskedViewBase from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ComponentProps, ComponentType, ReactElement, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewProps,
} from "react-native";
import Animated, {
  Easing,
  FadeInRight,
  FadeOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const MaskedView = MaskedViewBase as unknown as ComponentType<
  ViewProps & { maskElement: ReactElement }
>;

const { width } = Dimensions.get("window");

const GradientText = ({
  children,
  style,
}: {
  children: string;
  style?: any;
}) => (
  <MaskedView
    maskElement={
      <Text style={[style, { backgroundColor: "transparent" }]}>
        {children}
      </Text>
    }
  >
    <LinearGradient
      colors={[Colors.white, Colors.primary, Colors.white]}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <Text style={[style, { opacity: 0 }]}>{children}</Text>
    </LinearGradient>
  </MaskedView>
);

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const totalSteps = 4;

  const progressWidth = useSharedValue(1 / totalSteps);

  const nextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    if (step < totalSteps - 1) {
      const next = step + 1;
      setStep(next);
      progressWidth.value = withTiming((next + 1) / totalSteps, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
    }
  };

  const prevStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    if (step > 0) {
      const next = step - 1;
      setStep(next);
      progressWidth.value = withTiming((next + 1) / totalSteps, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
    }
  };

  const finishStep = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    try {
      await AsyncStorage.setItem("hasSeenOnboarding", "true");
      router.replace("/paywall");
    } catch (e) {
      console.log("Error saving onboarding status", e);
    }
  };

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const FirstStep = () => (
    <View style={styles.firstContent}>
      <Animated.View entering={FadeInRight.delay(100)} exiting={FadeOutLeft}>
        <Text style={[Typography.medium24, { fontSize: 32, lineHeight: 40 }]}>
          Welcome to
        </Text>
        <Text
          style={[
            Typography.bold20,
            { fontSize: 32, lineHeight: 40, color: Colors.primary },
          ]}
        >
          CV Sender
        </Text>
      </Animated.View>
      <Animated.View
        entering={FadeInRight.delay(200)}
        exiting={FadeOutLeft}
        style={styles.firstBlock}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.payoutContainer}
        >
          <IconField tiles={CARD_TILES} />
          <Text style={[Typography.medium24, { color: Colors.white }]}>
            We tailor your CV
          </Text>
        </LinearGradient>
        <IconTile
          icon="rocket"
          size={104}
          tone="accent"
          rotate={12}
          style={styles.firstIcon}
        />
        <Text
          style={[
            Typography.medium24,
            {
              fontSize: 26,
              color: Colors.black,
              lineHeight: 36,
              paddingTop: 10,
              paddingHorizontal: 8,
            },
          ]}
        >
          Get a CV that fits every job you apply for
        </Text>
      </Animated.View>
      <View style={styles.buttonWrapper}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            { opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={nextStep}
        >
          <Text
            style={[
              Typography.bold20,
              { color: Colors.white, textAlign: "center" },
            ]}
          >
            Continue
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const SecondStep = () => (
    <View style={styles.firstContent}>
      <Animated.View
        entering={FadeInRight.delay(100)}
        exiting={FadeOutLeft}
        style={styles.illustration}
      >
        <IconField tiles={SCATTER_TILES} />
      </Animated.View>
      <Animated.View
        entering={FadeInRight.delay(200)}
        exiting={FadeOutLeft}
        style={{ alignItems: "center" }}
      >
        <GradientText
          style={[Typography.bold20, { fontSize: 120, lineHeight: 120 }]}
        >
          200K+
        </GradientText>
        <Text
          style={[
            Typography.semibold24,
            { fontSize: 32, lineHeight: 32, color: Colors.primary, marginTop: 10 },
          ]}
        >
          Live Jobs
        </Text>
      </Animated.View>
      {!isLiquidGlassAvailable() ? (
        <Animated.View
          entering={FadeInRight.delay(300)}
          exiting={FadeOutLeft}
          style={styles.glassWrapper}
        >
          <BlurView
            intensity={Platform.OS === "ios" ? 30 : 90}
            tint="extraLight"
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.4)", "rgba(255,255,255,0.1)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.blurBorder}
            >
              <Text style={[Typography.bold20, { textAlign: "center" }]}>
                Did you know?
              </Text>
              <Text
                style={[
                  Typography.medium16,
                  { textAlign: "center", marginTop: 16 },
                ]}
              >
                “Recruiters spend about{" "}
                <Text style={{ color: Colors.primary }}>7 seconds</Text> on a first
                look. A tailored CV makes every second count”
              </Text>
            </LinearGradient>
          </BlurView>
        </Animated.View>
      ) : (
        <Animated.View
          entering={FadeInRight.delay(300)}
          exiting={FadeOutLeft}
          style={styles.blurContainerAnimated}
        >
          <GlassView style={styles.blurContainer} isInteractive>
            <Text style={[Typography.bold20, { textAlign: "center" }]}>
              Did you know?
            </Text>
            <Text
              style={[
                Typography.medium16,
                { textAlign: "center", marginTop: 16 },
              ]}
            >
              “Recruiters spend about{" "}
              <Text style={{ color: Colors.primary }}>7 seconds</Text> on a first
              look. A tailored CV makes every second count”
            </Text>
          </GlassView>
        </Animated.View>
      )}
      <View style={styles.buttonWrapper}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            { opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={nextStep}
        >
          <Text
            style={[
              Typography.bold20,
              { color: Colors.white, textAlign: "center" },
            ]}
          >
            Continue
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const ThirdStepBlock = (
    step: number,
    text: string,
    icon: ComponentProps<typeof Ionicons>["name"]
  ) => (
    <Animated.View
      entering={FadeInRight.delay(200 * step)}
      exiting={FadeOutLeft}
    >
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.payoutBox}
      >
        <IconTile icon={icon} size={64} tone="light" rotate={-12} style={styles.boxTile} />
        <Entypo name="chevron-right" size={24} color={Colors.white} />
        <Text style={[Typography.medium24, { color: Colors.white }]}>
          {text}
        </Text>
        {!isLiquidGlassAvailable() ? (
          <View style={styles.glassBoxWrapper}>
            <BlurView intensity={Platform.OS === "ios" ? 40 : 90}>
              <LinearGradient
                colors={["rgba(255,255,255,0.4)", "rgba(255,255,255,0.1)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.blurBoxBorder}
              >
                <Text
                  style={[
                    Typography.bold20,
                    {
                      fontSize: 24,
                      color: "rgba(255, 255, 255, 0.5)",
                      lineHeight: 38,
                    },
                  ]}
                >
                  step
                </Text>
                <Text
                  style={[
                    Typography.bold20,
                    { fontSize: 48, color: Colors.white, lineHeight: 48 },
                  ]}
                >
                  {step}
                </Text>
              </LinearGradient>
            </BlurView>
          </View>
        ) : (
          <GlassView
            style={styles.blurContainerBox}
            tintColor="rgba(0, 0, 0, 0.1)"
            glassEffectStyle="clear"
            isInteractive
          >
            <Text
              style={[
                Typography.bold20,
                {
                  fontSize: 24,
                  color: "rgba(255, 255, 255, 0.5)",
                  lineHeight: 38,
                },
              ]}
            >
              step
            </Text>
            <Text
              style={[
                Typography.bold20,
                { fontSize: 48, color: Colors.white, lineHeight: 48 },
              ]}
            >
              {step}
            </Text>
          </GlassView>
        )}
      </LinearGradient>
    </Animated.View>
  );

  const ThirdStep = () => (
    <View style={styles.firstContent}>
      <Animated.View entering={FadeInRight.delay(100)} exiting={FadeOutLeft}>
        <Text style={[Typography.medium24, { fontSize: 32, lineHeight: 40 }]}>
          Apply
        </Text>
        <Text
          style={[
            Typography.bold20,
            { fontSize: 32, lineHeight: 40, color: Colors.primary },
          ]}
        >
          Smarter
        </Text>
      </Animated.View>
      <View style={{ flexDirection: "column", gap: 56 }}>
        {ThirdStepBlock(
          1,
          "Pick a Job",
          "briefcase"
        )}
        {ThirdStepBlock(
          2,
          "Tailor with AI",
          "sparkles"
        )}
        {ThirdStepBlock(
          3,
          "Apply in One Tap",
          "paper-plane"
        )}
      </View>
      <View style={styles.buttonWrapper}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            { opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={nextStep}
        >
          <Text
            style={[
              Typography.bold20,
              { color: Colors.white, textAlign: "center" },
            ]}
          >
            Continue
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return FirstStep();
      case 1:
        return SecondStep();
      case 2:
        return ThirdStep();
      case 3:
        return <UploadStep onFinish={finishStep} />;
      default:
        return FirstStep();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressHeader}>
        <View style={styles.headerLeft}>
          {step > 0 && (
            <Pressable onPress={prevStep} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="black" />
            </Pressable>
          )}
        </View>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, animatedProgressStyle]} />
        </View>
        <View style={{ width: 44 }} />
      </View>
      <View style={{ flex: 1 }}>
        <View key={`step-${step}`} style={{ flex: 1 }}>
          {renderStep()}
        </View>
      </View>
    </SafeAreaView>
  );
}

// Lives outside Onboarding so that picking a file does not remount the step.
const UploadStep = ({ onFinish }: { onFinish: () => void }) => {
  const { data: resume } = useResume();

  return (
    <View style={styles.firstContent}>
      <Animated.View entering={FadeInRight.delay(100)} exiting={FadeOutLeft}>
        <Text style={[Typography.medium24, { fontSize: 32, lineHeight: 40 }]}>
          Upload
        </Text>
        <Text
          style={[
            Typography.bold20,
            { fontSize: 32, lineHeight: 40, color: Colors.primary },
          ]}
        >
          Your CV
        </Text>
        <Text style={[Typography.bold16, { marginTop: 10 }]}>
          We rewrite it for every job you pick. Your employers, titles and
          dates are never changed.
        </Text>
      </Animated.View>
      <Animated.View entering={FadeInRight.delay(200)} exiting={FadeOutLeft}>
        <CvUploadPanel />
      </Animated.View>
      <View style={styles.buttonWrapper}>
        <Pressable
          disabled={!resume}
          style={({ pressed }) => [
            styles.primaryButton,
            { opacity: !resume ? 0.4 : pressed ? 0.9 : 1 },
          ]}
          onPress={onFinish}
        >
          <Text
            style={[
              Typography.bold20,
              { color: Colors.white, textAlign: "center" },
            ]}
          >
            Continue
          </Text>
        </Pressable>
        <Pressable onPress={onFinish} style={styles.skipButton}>
          <Text style={[Typography.regular14, { color: Colors.gray }]}>
            {resume ? " " : "Skip for now"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  firstContent: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  payoutContainer: {
    overflow: "hidden",
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 20,
    borderRadius: 24,
    height: 196,
    justifyContent: "flex-end",
  },
  firstIcon: {
    position: "absolute",
    right: 36,
    top: -44,
  },
  firstBlock: {
    paddingHorizontal: 20,
  },
  buttonWrapper: {
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    paddingTop: 10,
  },
  skipButton: {
    alignItems: "center",
    paddingTop: 14,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  illustration: {
    position: "absolute",
    width: width + 20,
    height: width + 20,
    top: "50%",
    left: "50%",
    marginLeft: -(width + 20) / 2,
    marginTop: -(width + 20) / 2,
    zIndex: -1,
  },
  glassWrapper: {
    borderRadius: 34,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 10, height: 20 },
        shadowOpacity: 0.4,
        shadowRadius: 50,
      },
      android: { elevation: 20 },
    }),
    marginTop: "auto",
    marginBottom: 50,
    borderColor: "rgba(255, 255, 255, 0.8)",
    borderWidth: 1,
  },
  glassBoxWrapper: {
    borderRadius: 24,
    overflow: "hidden",
    position: "absolute",
    left: 25,
    top: -25,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 10, height: 20 },
        shadowOpacity: 0.4,
        shadowRadius: 50,
      },
      android: { elevation: 20 },
    }),
    borderColor: "rgba(255, 255, 255, 0.8)",
    borderWidth: 1,
  },
  blurBorder: {
    borderRadius: 34,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  blurBoxBorder: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  blurContainerAnimated: {
    marginTop: "auto",
    marginBottom: 50,
  },
  blurContainer: {
    borderRadius: 34,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  blurContainerBox: {
    position: "absolute",
    left: 25,
    top: -25,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 5,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  payoutBox: {
    overflow: "hidden",
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 16,
    height: 96,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 9,
  },
  boxTile: {
    position: "absolute",
    right: 120,
    top: -14,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 60,
  },
  headerLeft: { width: 44, alignItems: "flex-start" },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: Colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.secondary,
    borderRadius: 3,
    marginHorizontal: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
});
