import { JobCard } from "@/components/JobCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Colors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { useTopMatches } from "@/hooks/useJobs";
import { useTailoredJobs } from "@/hooks/useResume";
import { useMemo } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";

export default function MatchesScreen() {
  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTopMatches();
  const { data: tailored } = useTailoredJobs();

  const jobs = useMemo(() => {
    const seen = new Set<string>();
    return (data?.pages ?? [])
      .flatMap((p) => p.items)
      .filter((job) => !seen.has(job._id) && !!seen.add(job._id));
  }, [data]);

  const tailoredById = useMemo(
    () => new Map((tailored ?? []).map((t) => [t.job._id, t])),
    [tailored]
  );

  const total = data?.pages[0]?.total;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Top Matches" leftElement="back" />
      <FlatList
        data={jobs}
        keyExtractor={(item) => item._id}
        onRefresh={refetch}
        refreshing={isRefetching && !isFetchingNextPage}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.6}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={11}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View style={styles.countBadge}>
            <View style={styles.liveDot} />
            <Text style={Typography.regular12}>
              {total !== undefined
                ? `${total.toLocaleString("en-US")} live jobs`
                : "Loading jobs…"}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <JobCard
            job={item}
            isTailored={tailoredById.has(item._id)}
            badge={tailoredById.get(item._id)?.applied ? "Applied" : "CV ready"}
          />
        )}
        ListFooterComponent={
          isFetchingNextPage || isLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
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
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  countBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 24,
    marginTop: 20,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
});
