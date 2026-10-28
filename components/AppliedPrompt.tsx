import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { JobBrief } from '@/types/api';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompanyLogo } from './CompanyLogo';

interface AppliedPromptProps {
  job: JobBrief;
  visible: boolean;
  onAnswer: (applied: boolean) => void;
}

/** "Did you apply?" — an in-screen bottom sheet over a blurred backdrop. */
export const AppliedPrompt = ({ job, visible, onAnswer }: AppliedPromptProps) => {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  const reply = (applied: boolean) => {
    Haptics.impactAsync(applied ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    onAnswer(applied);
  };

  return (
    <>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={StyleSheet.absoluteFill}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View
        entering={SlideInDown.duration(300).easing(Easing.out(Easing.cubic))}
        exiting={SlideOutDown.duration(220)}
        style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}
      >
        <View style={styles.grabber} />
        <Text style={[Typography.bold20, styles.company]} numberOfLines={1}>
          {job.company_name}
        </Text>
        <View style={styles.logoRing}>
          <CompanyLogo name={job.company_name} url={job.url} size={64} />
        </View>
        <Text style={[Typography.bold20, styles.question]}>Did you apply for this job?</Text>
        <Text style={[Typography.regular14, styles.hint]} numberOfLines={2}>
          {job.title}
        </Text>
        <Pressable
          style={({ pressed }) => [styles.button, styles.yes, pressed && { backgroundColor: Colors.primaryPressed }]}
          onPress={() => reply(true)}
        >
          <Text style={[Typography.medium16, { color: Colors.white }]}>Yes, I applied</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.button, styles.no, pressed && { backgroundColor: Colors.secondaryPressed }]}
          onPress={() => reply(false)}
        >
          <Text style={[Typography.medium16, { color: Colors.black }]}>Not yet</Text>
        </Pressable>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: Colors.white,
    borderRadius: 36,
    paddingHorizontal: 16,
    paddingTop: 8,
    alignItems: 'center',
    shadowColor: Colors.primaryDeep,
    shadowOpacity: 0.2,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.grayLight,
    marginBottom: 16,
  },
  company: {
    color: Colors.black,
    textAlign: 'center',
  },
  logoRing: {
    marginTop: 20,
    padding: 6,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
  question: {
    color: Colors.primary,
    marginTop: 16,
    textAlign: 'center',
  },
  hint: {
    color: Colors.gray,
    marginTop: 4,
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  button: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  yes: {
    backgroundColor: Colors.primary,
  },
  no: {
    backgroundColor: Colors.secondary,
  },
});
