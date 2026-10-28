import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { JobBrief } from '@/types/api';
import { timeAgo } from '@/utils/format';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { CompanyLogo } from './CompanyLogo';

interface JobCardProps {
  job: JobBrief;
  isTailored?: boolean;
  subtitle?: string;
  /** Bordered standalone card, as used for the top match. */
  featured?: boolean;
  /** Replaces the default "open the job" behaviour. */
  onPress?: () => void;
  onPressIn?: () => void;
  badge?: string;
}

export const JobCard = ({ job, isTailored = false, subtitle, featured = false, onPress, onPressIn, badge = 'CV ready' }: JobCardProps) => {
  const isPressed = useSharedValue(0);
  const router = useRouter();

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(isPressed.value, [0, 1], [Colors.white, Colors.secondary]),
  }));

  return (
    <>
      <Pressable
        onPress={() => {
          if (onPress) return onPress();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
          router.push(`/job/${job._id}`);
        }}
        onPressIn={() => {
          isPressed.set(withTiming(1, { duration: 90 }));
          onPressIn?.();
        }}
        onPressOut={() => isPressed.set(withTiming(0, { duration: 220 }))}
      >
        <Animated.View style={[styles.card, featured && styles.featuredCard, animatedStyle]}>
          <CompanyLogo name={job.company_name} url={job.url} />
          <View style={styles.info}>
            <View style={styles.infoText}>
              <Text style={[Typography.regular12, styles.company]} numberOfLines={1}>
                {job.company_name}
              </Text>
              <Text style={[Typography.bold16, styles.title]} numberOfLines={2}>
                {job.title}
              </Text>
            </View>
            <Text style={[styles.meta, Typography.regular12]} numberOfLines={1}>
              {subtitle ?? [job.location, timeAgo(job.posted_at)].filter(Boolean).join(' · ')}
            </Text>
          </View>

          <View style={styles.rightAction}>
            {!isTailored && (
              <View style={styles.tailorButton}>
                <Text style={[styles.tailorText, Typography.medium16]}>Tailor</Text>
              </View>
            )}
            {isTailored ? (
              <View style={[styles.badge, styles.badgeLarge, { backgroundColor: Colors.successSoft }]}>
                <Text style={[{ color: Colors.success }, Typography.medium10]}>{badge}</Text>
              </View>
            ) : (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: job.remote ? Colors.accentSoft : Colors.secondary },
                ]}
              >
                <Text style={[{ color: job.remote ? Colors.accentText : Colors.primary }, Typography.medium10]}>
                  {job.remote ? 'remote' : 'on-site'}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </Pressable>
      {!featured && <View style={styles.separator} />}
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    backgroundColor: Colors.white,
  },
  featuredCard: {
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: 12,
  },
  info: {
    marginLeft: 8,
    marginRight: 8,
    flex: 1,
    gap: 8,
  },
  infoText: {
    gap: 4,
  },
  company: {
    color: Colors.black,
  },
  title: {
    color: Colors.black,
  },
  meta: {
    color: Colors.gray,
  },
  rightAction: {
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
  },
  tailorButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 24,
  },
  tailorText: {
    color: Colors.white,
  },
  badge: {
    borderRadius: 24,
    paddingVertical: 2,
    paddingHorizontal: 10,
  },
  badgeLarge: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.secondary,
  },
});
