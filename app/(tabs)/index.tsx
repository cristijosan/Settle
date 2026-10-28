import { JobCard } from "@/components/JobCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Colors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { useJobs, useTopMatches } from "@/hooks/useJobs";
import { useTailoredJobs } from "@/hooks/useResume";
import { Job, JobFilters } from "@/types/api";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";

type CategoryType = "All" | "Remote" | "Entry level" | "Senior";

const CATEGORY_FILTERS: Record<CategoryType, JobFilters> = {
  All: {},
  Remote: { remote: true },
  "Entry level": { seniority: "junior" },
  Senior: { seniority: "senior" },
};

const categories = Object.keys(CATEGORY_FILTERS) as CategoryType[];

const FILTERS_ROW = "filters";
type Row = Job | typeof FILTERS_ROW;

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<CategoryType>("All");
  const {
    data,
    isLoading,
    isRefetching,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useJobs(CATEGORY_FILTERS[activeCategory]);
  const { data: tailored } = useTailoredJobs();
  const { data: topMatches } = useTopMatches();
  const topMatch = topMatches?.pages[0]?.items[0];
  const router = useRouter();

  const jobs = useMemo(() => {
    const seen = new Set<string>(topMatch ? [topMatch._id] : []);
    return (data?.pages ?? [])
      .flatMap((p) => p.items)
      .filter((job) => !seen.has(job._id) && !!seen.add(job._id));
  }, [data, topMatch]);

  const tailoredById = useMemo(
    () => new Map((tailored ?? []).map((t) => [t.job._id, t])),
    [tailored]
  );


  // The filter chips travel inside the list as its first row so they can pin
  // under the header, while "Your Top Matches" above them scrolls away.
  const rows: Row[] = useMemo(() => [FILTERS_ROW, ...jobs], [jobs]);

  const topMatchesSection = (
    <View>
      <Text style={[styles.sectionTitle, Typography.medium24]}>
        Your Top Matches
      </Text>
      <TouchableOpacity
        style={styles.showAllButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
          router.push("/matches");
        }}
      >
        <Text style={Typography.regular12}>Show all</Text>
        <Ionicons name="arrow-forward" size={14} color={Colors.black} style={styles.showAllArrow} />
      </TouchableOpacity>
      <View style={styles.topMatch}>
        {topMatch ? (
          <JobCard
            job={topMatch}
            featured
            isTailored={tailoredById.has(topMatch._id)}
            badge={tailoredById.get(topMatch._id)?.applied ? "Applied" : "CV ready"}
          />
        ) : (
          <View style={styles.topMatchPlaceholder}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        )}
      </View>
    </View>
  );

  const filtersRow = (
    <View style={styles.filtersWrapper}>
      <View style={styles.filtersContainer}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
              setActiveCategory(cat);
            }}
            style={[
              styles.filterChip,
              activeCategory === cat && styles.activeChip,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                activeCategory === cat && styles.activeChipText,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <LinearGradient
        colors={["#FFFFFF", "rgba(255, 255, 255, 0)"]}
        style={styles.gradientPadding}
        pointerEvents="none"
      />
    </View>
  );

  const emptyState = error ? (
    <View style={styles.empty}>
      <Ionicons name="cloud-offline-outline" size={48} color={Colors.primary} />
      <Text style={[Typography.regular14, styles.emptyText]}>
        {error.message}
      </Text>
      <Pressable style={styles.retryButton} onPress={() => refetch()}>
        <Text style={[Typography.medium16, { color: Colors.white }]}>
          Try again
        </Text>
      </Pressable>
    </View>
  ) : (
    <Text style={[Typography.semibold24, styles.emptyTitle]}>
      No jobs found for this category.
    </Text>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Jobs" leftElement="help" rightElement="search" />
      <Animated.FlatList
        style={styles.list}
        onRefresh={refetch}
        data={rows}
        refreshing={isRefetching && !isFetchingNextPage}
        keyExtractor={(item) => (item === FILTERS_ROW ? FILTERS_ROW : item._id)}
        stickyHeaderIndices={[1]}
        ListHeaderComponent={topMatchesSection}
        itemLayoutAnimation={LinearTransition.duration(220)}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={11}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.6}
        renderItem={({ item, index }) =>
          item === FILTERS_ROW ? (
            filtersRow
          ) : (
            <Animated.View
              // Only the first screenful animates in; later pages just appear.
              entering={index <= 10 ? FadeIn.duration(200).delay((index - 1) * 25) : undefined}
              exiting={FadeOut.duration(150)}
            >
              <JobCard
                job={item}
                isTailored={tailoredById.has(item._id)}
                badge={tailoredById.get(item._id)?.applied ? "Applied" : "CV ready"}
              />
            </Animated.View>
          )
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListFooterComponent={
          isFetchingNextPage || isLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
          ) : jobs.length === 0 ? (
            emptyState
          ) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  list: {
    flex: 1,
  },
  sectionTitle: {
    marginTop: 20,
  },
  showAllButton: {
    alignSelf: "flex-start",
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 24,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  showAllArrow: {
    transform: [{ rotate: "-45deg" }],
  },
  topMatch: {
    marginTop: 10,
    marginBottom: 10,
  },
  topMatchPlaceholder: {
    height: 84,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: 12,
  },
  filtersWrapper: {
    zIndex: 10,
    backgroundColor: Colors.white,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  filtersContainer: {
    flexDirection: "row",
    paddingTop: 14,
    gap: 4,
    paddingBottom: 10,
  },
  gradientPadding: {
    position: "absolute",
    left: 0,
    right: 0,
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
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  emptyTitle: {
    textAlign: "center",
    marginTop: 40,
  },
  empty: {
    alignItems: "center",
    gap: 16,
    paddingTop: 40,
    paddingHorizontal: 30,
  },
  emptyText: {
    color: Colors.gray,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
  },
});
