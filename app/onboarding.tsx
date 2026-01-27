import { Colors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { Entypo, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  ImageBackground,
  ImageSourcePropType,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import Animated, { FadeInRight, FadeOutLeft, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const totalSteps = 4;

  const progressWidth = useSharedValue(1 / totalSteps);

  const nextStep = () => {
    if (step < totalSteps - 1) {
      const next = step + 1;
      setStep(next);
      progressWidth.value = withSpring((next + 1) / totalSteps);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      const next = step - 1;
      setStep(next);
      progressWidth.value = withSpring((next + 1) / totalSteps);
    }
  };

  const finishStep = async () => {
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

  const GradientText = ({ children, style }: { children: string, style?: any }) => (
    <MaskedView maskElement={<Text style={[style, { backgroundColor: 'transparent' }]}>{children}</Text>}>
      <LinearGradient
        colors={[Colors.white, Colors.blue, Colors.white]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );

  const FirstStep = () => (
    <View style={styles.firstContent}>
      <Animated.View entering={FadeInRight.delay(100)} exiting={FadeOutLeft}>
        <Text style={[Typography.medium24, { fontSize: 32, lineHeight: 40 }]}>
          Welcome to
        </Text>
        <Text
          style={[
            Typography.bold20,
            { fontSize: 32, lineHeight: 40, color: Colors.blue },
          ]}
        >
          Pay Me
        </Text>
      </Animated.View>
      <Animated.View entering={FadeInRight.delay(200)} exiting={FadeOutLeft} style={styles.firstBlock}>
        <ImageBackground
          source={require("@/assets/images/rain-coins.png")}
          style={styles.payoutContainer}
          imageStyle={styles.payoutImage}
        >
          <View style={styles.blueOverlay} />
          <Text style={[Typography.medium24, { color: Colors.white }]}>
            We will help you
          </Text>
        </ImageBackground>
        <Text style={styles.firstIcon}>💸</Text>
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
          Get Money you Deserve from Settlements
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
    </View >
  );

  const SecondStep = () => (
    <View style={styles.firstContent}>
      <Animated.Image
        entering={FadeInRight.delay(100)} exiting={FadeOutLeft}
        source={require('@/assets/images/onboarding/onboaring_coins_2.png')} 
        style={styles.illustration}
        resizeMode="contain"
      />
      <Animated.View entering={FadeInRight.delay(200)} exiting={FadeOutLeft} style={{ alignItems: 'center' }}>
        <GradientText style={[Typography.bold20, {fontSize: 120, lineHeight: 120,}]}>
          $42
        </GradientText>
        <Text style={[Typography.semibold24, {fontSize: 32, lineHeight: 32, color: Colors.blue, marginTop: 10,}]}>Billion</Text>
      </Animated.View>
      {!isLiquidGlassAvailable() ? (
        <Animated.View entering={FadeInRight.delay(300)} exiting={FadeOutLeft} style={styles.glassWrapper}>
          <BlurView 
            intensity={Platform.OS === 'ios' ? 30 : 90} 
            tint='extraLight'
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.blurBorder}
            >
              <Text style={[Typography.bold20, {textAlign: 'center'}]}>
                Did you know?
              </Text>
              <Text style={[Typography.medium16, {textAlign: 'center', marginTop: 16}]}>
                “In 2024 over <Text style={{color: Colors.blue}}>$42 Billion was paid</Text> out in class-action settlements”
              </Text>
            </LinearGradient>
          </BlurView>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInRight.delay(300)} exiting={FadeOutLeft} style={styles.blurContainerAnimated}>
          <GlassView style={styles.blurContainer} isInteractive>
            <Text style={[Typography.bold20, {textAlign: 'center'}]}>
              Did you know?
            </Text>
            <Text style={[Typography.medium16, {textAlign: 'center', marginTop: 16}]}>
              “In 2024 over <Text style={{color: Colors.blue}}>$42 Billion was paid</Text> out in class-action settlements”
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

  const ThirdStepBlock = (step: number, text: string, source: ImageSourcePropType) => (
    <Animated.View entering={FadeInRight.delay(200 * step)} exiting={FadeOutLeft}>
      <ImageBackground
        source={source}
        style={styles.payoutBox}
        imageStyle={styles.payoutBoxImage}
      >
        <Entypo name="chevron-right" size={24} color={Colors.white} />
        <Text style={[Typography.medium24, {color: Colors.white}]}>
          {text}
        </Text>
        {!isLiquidGlassAvailable() ? (
          <View style={styles.glassBoxWrapper}>
            <BlurView 
              intensity={Platform.OS === 'ios' ? 40 : 90} 
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.blurBoxBorder}
              >
                <Text style={[Typography.bold20, {fontSize: 24, color: 'rgba(255, 255, 255, 0.5)', lineHeight: 38}]}>
                  step
                </Text>
                <Text style={[Typography.bold20, {fontSize: 48, color: Colors.white, lineHeight: 48}]}>
                  {step}
                </Text>
              </LinearGradient>
            </BlurView>
          </View>
        ) : (
          <GlassView style={styles.blurContainerBox} tintColor="rgba(0, 0, 0, 0.1)" glassEffectStyle="clear" isInteractive>
            <Text style={[Typography.bold20, {fontSize: 24, color: 'rgba(255, 255, 255, 0.5)', lineHeight: 38}]}>
              step
            </Text>
            <Text style={[Typography.bold20, {fontSize: 48, color: Colors.white, lineHeight: 48}]}>
              {step}
            </Text>
          </GlassView>
        )}
      </ImageBackground>
    </Animated.View>
  )

  const ThirdStep = () => (
    <View style={styles.firstContent}>
      <Animated.View entering={FadeInRight.delay(100)} exiting={FadeOutLeft}>
        <Text style={[Typography.medium24, { fontSize: 32, lineHeight: 40 }]}>
          Claim
        </Text>
        <Text
          style={[
            Typography.bold20,
            { fontSize: 32, lineHeight: 40, color: Colors.blue },
          ]}
        >
          Your Share
        </Text>
      </Animated.View>
      <View style={{flexDirection: "column", gap: 56,}}>
        {ThirdStepBlock(1, 'See open Settlements', require("@/assets/images/onboarding/onboaring_box_1.png"))}
        {ThirdStepBlock(2, 'Tap to', require("@/assets/images/onboarding/onboaring_box_2.png"))}
        {ThirdStepBlock(3, 'Get your Money', require("@/assets/images/onboarding/onboaring_box_3.png"))}
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

  const FiveStep = () => (
    <View style={styles.firstContent}>
      <View style={styles.absoluteContainer} pointerEvents="none">
        <MaskedView
          style={StyleSheet.absoluteFill}
          maskElement={
            <LinearGradient
              colors={['rgba(0,0,0,1)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.1)']}
              locations={[0, 0.8, 1]}
              start={{ x: 1, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          }
        >
          <BlurView 
            intensity={Platform.OS === 'ios' ? 50 : 80} 
            tint="light" 
            style={StyleSheet.absoluteFill}
          />
        </MaskedView>
      </View>      
      <Animated.Image 
        entering={FadeInRight.delay(200)} exiting={FadeOutLeft}
        source={require('@/assets/images/onboarding/onboaring_coins_2.png')} 
        style={styles.illustrationFive}
        resizeMode="contain"
      />
      <Animated.View entering={FadeInRight.delay(100)} exiting={FadeOutLeft}>
        <Text style={[Typography.medium24, { fontSize: 32, lineHeight: 40 }]}>
          Don’t loose
        </Text>
        <Text
          style={[
            Typography.bold20,
            { fontSize: 32, lineHeight: 40, color: Colors.blue },
          ]}
        >
          Your Share
        </Text>
        <Text style={[Typography.bold16, { marginTop: 10 }]}>
          Based on average payouts from class action settlements
        </Text>
      </Animated.View>
      <Animated.View entering={FadeInRight.delay(300)} exiting={FadeOutLeft} style={{alignItems: 'center'}}>
        <GradientText style={[Typography.bold20, {fontSize: 120, lineHeight: 120,}]}>
          $150
        </GradientText>
        <Text style={[Typography.semibold24, {fontSize: 32, lineHeight: 32, color: Colors.blue, marginTop: 10, textAlign: 'center'}]}>Don’t let your money expire!</Text>
      </Animated.View>
      <View style={styles.buttonWrapper}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            { opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={finishStep}
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
  )

  const StepContent = () => {
    switch (step) {
      case 0: return <FirstStep />;
      case 1: return <SecondStep />;
      case 2: return <ThirdStep />;
      case 3: return <FiveStep />;
      default: return <FirstStep />;
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
        <StepContent key={`step-${step}`} />
      </View>
    </SafeAreaView>
  );
}

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
    backgroundColor: Colors.blue,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 20,
    borderRadius: 24,
    height: 196,
    justifyContent: "flex-end",
  },
  payoutImage: {
    resizeMode: "cover",
    opacity: 0.5,
  },
  blueOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.blue,
    opacity: 0.6,
  },
  firstIcon: {
    fontSize: 120,
    lineHeight: 130,
    position: "absolute",
    right: 30,
    top: -50,
  },
  firstBlock: {
    paddingHorizontal: 20,
  },
  buttonWrapper: {
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    paddingTop: 10,
  },
  primaryButton: {
    backgroundColor: Colors.blue,
    height: 56,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  illustration: {
    resizeMode: "cover",
    position: 'absolute',
    width: width + 20,
    height: width + 20,
    top: '50%',
    left: '50%',
    marginLeft: -(width + 20) / 2,
    marginTop: -(width + 20) / 2,
    zIndex: -1
  },
  illustrationFive: {
    position: 'absolute',
    verticalAlign: 'middle',
    resizeMode: "cover",
    width: width + 40,
    height: width + 20,
    left: '50%',
    bottom: '-20%',
    marginLeft: -(width) / 2
  },
  glassWrapper: {
    borderRadius: 34,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 10, height: 20 },
        shadowOpacity: 0.4,
        shadowRadius: 50,
      },
      android: { elevation: 20 },
    }),
    marginTop: "auto",
    marginBottom: 50,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1
  },
  glassBoxWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    position: 'absolute',
    left: 25,
    top: -25,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 10, height: 20 },
        shadowOpacity: 0.4,
        shadowRadius: 50,
      },
      android: { elevation: 20 },
    }),
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1
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
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  blurContainerAnimated: {
    marginTop: "auto",
    marginBottom: 50
  },
  blurContainer: {
    borderRadius: 34,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  blurContainerBox: {
    position: 'absolute',
    left: 25,
    top: -25,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  payoutBox: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 16,
    height: 96,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 9,
  },
  payoutBoxImage: {
    borderRadius: 24,
    resizeMode: "cover",
    position: 'absolute',
    top: 0,
    left: 0,
  },
  absoluteContainer: {
    position: 'absolute',
    bottom: "-20%",
    left: 0,
    right: 0,
    height: height * 0.6, 
    zIndex: 5,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 60,
  },
  headerLeft: { width: 44, alignItems: 'flex-start' },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.secondary,
    borderRadius: 3,
    marginHorizontal: 10,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.blue,
    borderRadius: 3,
  },
});
