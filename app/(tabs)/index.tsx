import ShowIcon from '@/assets/icons/show.svg';
import { CompanyCard } from '@/components/CompanyCard';
import { ScreenHeader } from "@/components/ScreenHeader";
import { Colors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { useLawsuits } from '@/hooks/useLawsuits';
import { CategoryType } from '@/services/CompanyService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { CurvedTransition, FadeInRight, Layout, SlideOutLeft } from 'react-native-reanimated';

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('All');
  const { data, isLoading, isFetching, error, refetch } = useLawsuits(activeCategory);

  const [claimedIds, setClaimedIds] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      const loadClaimedIds = async () => {
        const savedClaims = await AsyncStorage.getItem('user_claims');
        if (savedClaims) {
          const parsed = JSON.parse(savedClaims);
          setClaimedIds(parsed.map((item: any) => item.id.toString()));
        } else {
          setClaimedIds([]);
        }
      };
      loadClaimedIds();
    }, [])
  );

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(item => !claimedIds.includes(item.id.toString()));
  }, [data, claimedIds]);

  const categories: CategoryType[] = ['All', 'No Proof', 'Due Soon'];

  return (
    <View style={styles.container}>
      <ScreenHeader title="Settlements" leftElement="help" rightElement="search" />
      <View style={styles.content}>
        <Text style={[styles.sectionTitle, Typography.medium24]}>Your Top Matches</Text>
        <TouchableOpacity style={styles.showAllBtn}>
          <Text style={Typography.regular12}>Show all</Text>
          <ShowIcon 
            width={12} 
            height={12}
            color={Colors.black}
          />
        </TouchableOpacity>
        <View style={styles.filtersWrapper}>
          <View style={styles.filtersContainer}>
            {categories.map((cat) => (
              <TouchableOpacity 
                key={cat}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
                  setActiveCategory(cat)
                }}
                style={[
                  styles.filterChip, 
                  activeCategory === cat && styles.activeChip
                ]}
              >
                <Text style={[
                  styles.chipText, 
                  activeCategory === cat && styles.activeChipText
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <LinearGradient
            colors={['#FFFFFF', 'rgba(255, 255, 255, 0)']}
            style={styles.gradientPadding}
          />
        </View>
        <Animated.FlatList
          onRefresh={refetch}
          data={filteredData}
          refreshing={isLoading}
          keyExtractor={(item) => item.unique_hash}
          itemLayoutAnimation={CurvedTransition}
          renderItem={({ item, index }) => (
            <Animated.View 
              entering={FadeInRight.delay(index * 50)}
              exiting={SlideOutLeft.duration(300)}
              layout={Layout.springify()}
            >
              <CompanyCard items={item} />
            </Animated.View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={() => (
            !isLoading && (
              <Text style={[Typography.semibold24, {textAlign: 'center'}]}>No matches found for this category.</Text>
            )
          )}
          />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    paddingHorizontal: 20,
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
    backgroundColor: Colors.secondary,
  },
  activeChip: {
    backgroundColor: Colors.black,
  },
  activeChipText: {
    color: Colors.white,
  },
  chipText: {
    color: Colors.black,
  },
  listContainer: {
    marginTop: 10,
    paddingBottom: 400
  }
});