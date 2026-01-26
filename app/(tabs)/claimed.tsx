import DeleteIcon from '@/assets/icons/delete.svg';
import { CompanyCard } from '@/components/CompanyCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { CompanyDTO } from '@/types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ImageBackground, Pressable, Animated as RNAnimated, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import Animated, { CurvedTransition, FadeInRight, Layout, SlideOutLeft } from 'react-native-reanimated';

export default function Claimed() {
  const router = useRouter();
  const [data, setData] = useState<CompanyDTO[]>([]);

  useFocusEffect(
    useCallback(() => {
      const loadClaims = async () => {
        try {
          const savedClaims = await AsyncStorage.getItem('user_claims');
          if (savedClaims) {
            setData(JSON.parse(savedClaims));
          }
        } catch (e) {
          console.error("Failed to load claims", e);
        }
      };
      loadClaims();
    }, [])
  );

  const handleDelete = useCallback(async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updatedData = data.filter(item => item.id !== id);
    setData(updatedData);
    await AsyncStorage.setItem('user_claims', JSON.stringify(updatedData));
  }, [data]);

  const totalPayout = data.reduce((sum, item) => sum + item.amounts.max.amount, 0);

  const renderRightActions = (
  id: string, 
  progress: RNAnimated.AnimatedInterpolation<number>, 
  dragX: RNAnimated.AnimatedInterpolation<number>
) => {
  const scale = dragX.interpolate({
    inputRange: [-80, 0],
    outputRange: [1, 0.5],
    extrapolate: 'clamp',
  });

  return (
    <Pressable 
      onPress={() => handleDelete(id)}
      style={styles.deleteAction}
    >
      <RNAnimated.View style={{ transform: [{ scale }] }}>
        <DeleteIcon width={18} height={18} color={Colors.white} />
      </RNAnimated.View>
    </Pressable>
  );
};

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <ScreenHeader title="Claimed" />
        <View style={styles.content}>
          <View>
            <ImageBackground source={require('@/assets/images/rain-coins.png')} style={styles.payoutContainer} imageStyle={styles.payoutImage}>
              <View style={styles.blueOverlay} />
              <Text style={[{color: Colors.secondary, textAlign: 'right'}, Typography.medium16]}>Estimated Payout</Text>
              <Text style={[{color: Colors.white, textAlign: 'right'}, Typography.semibold24]}>${totalPayout}</Text>
              <View style={styles.separator} />
              <Text style={[{color: Colors.grayLight, marginBottom: 4}, Typography.regular12]}>Claimed</Text>
              <Text style={[{color: Colors.grayLight}, Typography.bold20]}>{data.length}</Text>
            </ImageBackground>
          </View>
          <View style={styles.filtersWrapper}>
            <View style={styles.filtersContainer}>
              <Text style={[styles.filterChip, Typography.regular14]}>
                Recents
              </Text>
            </View>
            <LinearGradient
              colors={['#FFFFFF', 'rgba(255, 255, 255, 0)']}
              style={styles.gradientPadding}
            />
          </View>
          <Animated.FlatList
            data={data}
            keyExtractor={(item) => item.id}
            itemLayoutAnimation={CurvedTransition}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item, index }) => (
              <Animated.View 
                entering={FadeInRight.delay(index * 50)}
                exiting={SlideOutLeft.duration(300)}
                layout={Layout.springify()}
              >
                <Swipeable
                  renderRightActions={(progress, dragX) => renderRightActions(item.id, progress, dragX)}
                  friction={2}
                  rightThreshold={40}
                  onSwipeableWillOpen={() => Haptics.selectionAsync()}
                >
                  <CompanyCard isClaimed={true} items={item} />
                </Swipeable>
              </Animated.View>
            )}
          />
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  sectionTitle: {
    marginTop: 20,
  },
  showAllBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 24,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filtersWrapper: {
    zIndex: 10,
    backgroundColor: Colors.white,
  },
  filtersContainer: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 4,
    paddingBottom: 10,
  },
  gradientPadding: {
    position: 'absolute',
    left: -20,
    right: -20,
    bottom: -30,
    height: 30,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.green,
    color: Colors.white
  },
  listContainer: {
    paddingBottom: 500
  },
  separator: {
    marginVertical: 9,
    height: 1,
    backgroundColor: Colors.secondary,
    opacity: 0.1
  },
  payoutImage: {
    resizeMode: 'contain',
    left: -60,
    opacity: 0.5
  },
  blueOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.blue,
    opacity: 0.6
  },
  payoutContainer: {
    overflow: 'hidden',
    backgroundColor: Colors.blue,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 20,
    borderRadius: 24,
  },
  deleteAction: {
    backgroundColor: '#FF453A',
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40, 
    borderRadius: 24,
    marginLeft: 10,
    alignSelf: 'center'
  },
});