import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { CompanyDTO } from '@/types/api';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

interface CompanyProps {
  items: CompanyDTO
  isClaimed?: boolean;
}

export const CompanyCard = ({ items, isClaimed = false }: CompanyProps) => {
  const isPressed = useSharedValue(0);
  const router = useRouter();

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: isPressed.value ? "#00000006" : Colors.white,
  }));

  return (
    <>
      <Pressable
        onPress={() => {
          if (!isClaimed) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
            router.push(`/company/${items.id}`)
          }
        }}
        onPressIn={() => (isPressed.value = 1)}
        onPressOut={() => (isPressed.value = 0)}
      >
        <Animated.View style={[styles.card, animatedStyle]}>
          <Image 
            source={items.company_logo_url ? {uri: items.company_logo_url} : require('@/assets/images/company.png')} 
            style={styles.logo} 
          />
          <View style={styles.info}>
            <View style={styles.infoText}>
              <Text style={Typography.regular12}>{items.company_name ?? items.name}</Text>
              <Text style={[styles.amountLabel, Typography.bold20]}>up to <Text style={[styles.amountValue, Typography.bold20]}>{items.amounts.max.symbol}{items.amounts.max.amount}</Text></Text>
            </View>
            <Text style={[styles.date, Typography.regular12]}>Due date: {items.deadline ? new Date(items.deadline * 1000).toLocaleDateString('en-US', {month: 'long', day: '2-digit', year: 'numeric'}) : 'TDB'}</Text>
          </View>

          <View style={[styles.rightAction, {}]}>
            {!isClaimed && (
              <View style={styles.claimButton}>
                <Text style={[styles.claimText, Typography.medium16]}>Claim</Text>
              </View>
            )}
            <View style={[styles.badge, { backgroundColor: items.is_proof_required ? Colors.secondary : Colors.greenSecondary, paddingVertical: !isClaimed ? 2 : 10, paddingHorizontal: !isClaimed ? 10 : 16 }]}>
              <Text style={[{ color: items.is_proof_required ? Colors.blue : Colors.green }, Typography.medium10]}>
                {items.is_proof_required ? 'with proof' : 'no proof'}
              </Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
      <View style={styles.separator} />
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
  logo: {
    width: 42,
    height: 42,
    borderRadius: 24,
    resizeMode: 'contain',
    verticalAlign:'top'
  },
  info: {
    marginLeft: 8,
    flex: 1,
    gap: 8,
  },
  infoText: {
    gap: 4,
  },
  amountLabel: {
    color: Colors.grayLight,
  },
  amountValue: {
    color: Colors.black
  },
  date: {
    color: Colors.gray,
  },
  rightAction: {
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center'
  },
  claimButton: {
    backgroundColor: Colors.blue,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 24,
  },
  claimText: {
    color: Colors.white,
  },
  badge: {
    borderRadius: 24,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.secondary,
  },
});