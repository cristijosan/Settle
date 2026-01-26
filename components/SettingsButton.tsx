import { Colors } from '@/constants/Colors';
import { IconName, Icons } from '@/constants/Icons';
import { Typography } from '@/constants/Typography';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface SettingsButtonProps {
  label: string;
  iconName: IconName;
  isPrimary?: boolean;
  onPress?: () => void;
}

export const SettingsButton = ({ label, iconName, isPrimary = false, onPress }: SettingsButtonProps) => {
  const pressed = useSharedValue(0);
  const SvgIcon = Icons[iconName];

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      pressed.value,
      [0, 1],
      isPrimary ? [Colors.blue, '#1A36B0'] : [Colors.secondary, '#ced7f2']
    );

    return {
      backgroundColor,
    };
  });

  const textStyle = {
    color: isPrimary ? Colors.white : Colors.black
  };

  return (
    <Pressable
      onPressIn={() => (pressed.value = withTiming(1, { duration: 120 }))}
      onPressOut={() => (pressed.value = withTiming(0, { duration: 120 }))}
      onPress={onPress}
    >
      <Animated.View style={[styles.button, animatedStyle]}>
        <View style={styles.leftContent}>
          <SvgIcon 
            width={16} 
            height={16}
            color={isPrimary ? Colors.white : Colors.blue}
          />
          <Text style={[textStyle, Typography.medium16]}>{label}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});