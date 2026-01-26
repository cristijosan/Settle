import { CompanyCard } from '@/components/CompanyCard';
import { Typography } from '@/constants/Typography';
import { useLawsuits } from '@/hooks/useLawsuits';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { CurvedTransition, FadeInRight, Layout, SlideOutLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SearchIcon from '../assets/icons/search.svg';
import { Colors } from '../constants/Colors';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState('');

  const { data: lawsuits } = useLawsuits('All');

  const filteredData = useMemo(() => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    return (lawsuits || []).filter((item) => {
      return (
        item.name.toLowerCase().includes(lowerQuery) || 
        item.representing_lawfirm_details?.toLowerCase().includes(lowerQuery)
      );
    });
  }, [query, lawsuits]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <View>
            <Ionicons name="chevron-back" size={20} color={Colors.black} />
          </View>
        </Pressable>
        <View style={styles.searchBar}>
          <SearchIcon width={16} height={16} color={Colors.black} />
          <TextInput
            autoFocus
            style={[styles.input, Typography.regular14]}
            placeholder="Search..."
            value={query}
            onChangeText={setQuery}
            placeholderTextColor={Colors.gray}
          />
        </View>
      </View>
      
      {query.length > 0 ? (
        <View style={styles.resultsWrapper}>
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, { backgroundColor: Colors.secondary }]}>
              <Text style={[ {color: Colors.blue}, Typography.regular12]}>
                {filteredData.length} Settlements found
              </Text>
              <SearchIcon width={12} height={12} color={Colors.blue} />
            </View>
            <LinearGradient
              colors={['#FFFFFF', 'rgba(255, 255, 255, 0)']}
              style={styles.gradientPadding}
            />
          </View>
          <Animated.FlatList
            itemLayoutAnimation={CurvedTransition}
            data={filteredData}
            keyExtractor={(item) => item.unique_hash}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item, index }) => (
              <Animated.View 
                entering={FadeInRight.delay(index * 50)}
                exiting={SlideOutLeft.duration(300)}
                layout={Layout.springify()}
              >
                <CompanyCard items={item} />
              </Animated.View>
            )}
            ListEmptyComponent={() => (
              <View style={styles.errorContainer}>
                <View style={styles.error}>
                  <SearchIcon width={64} height={64} color={Colors.blue} />
                  <View style={styles.errorText}>
                    <Text style={[ {color: Colors.gray, textAlign: 'center'}, Typography.regular14]}>
                      No results for "{query}"
                    </Text>
                  </View>
                </View>
              </View>
            )}
          />
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <View style={styles.error}>
            <SearchIcon width={64} height={64} color={Colors.blue} />
            <View style={styles.errorText}>
              <Text style={[ {color: Colors.gray, textAlign: 'center'}, Typography.regular14]}>
                Start typing to find settlements
              </Text>
              <Text style={[ {color: Colors.grayLight, textAlign: 'center'}, Typography.regular12]}>
                Search for settlements by company name or settlement title
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    
    // marginTop: 70,
    // paddingBottom: 20
  },
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: 50,
    paddingHorizontal: 12,
    height: 40,
  },
  input: {
    flex: 1,
    color: Colors.black,
  },
  badgeContainer: {
    zIndex: 10,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginVertical: 20,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 16,
  },
  errorContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 50
  },
  error: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    paddingHorizontal: 50,
    alignItems: 'center',
    gap: 4,
  },
  resultsWrapper: {
    flex: 1,
  },
  gradientPadding: {
    position: 'absolute',
    left: -20,
    right: -20,
    bottom: -30,
    height: 30,
  },
});