import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenHeaderProps {
  title: string;
  leftElement?: 'back' | 'help' | null;
  rightElement?: 'search' | null;
}

export const ScreenHeader = ({
  title, 
  leftElement, 
  rightElement
}: ScreenHeaderProps) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.content}>
        <View style={styles.buttonSlot}>
          {leftElement === 'back' && (
            <TouchableOpacity style={styles.iconButton} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
              router.back()
            }}>
              <Ionicons name="chevron-back" size={20} color={Colors.black} />
            </TouchableOpacity>
          )}
          {leftElement === 'help' && (
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="help-circle-outline" size={20} color={Colors.black} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[Typography.semibold24, styles.title]}>{title}</Text>
        <View style={styles.buttonSlot}>
          {rightElement === 'search' ? (
            <TouchableOpacity style={styles.iconButton} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
              router.push('/search')
            }}>
              <Ionicons name="search" size={20} color={Colors.black} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  buttonSlot: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Colors.black,
    textAlign: 'center',
    flex: 1,
  },
});