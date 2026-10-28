import { FieldTile, IconField } from "@/components/IconField";
import { JobCard } from "@/components/JobCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Colors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { useTailoredJobs } from "@/hooks/useResume";
import { TailoredJob, TailoredStore } from "@/services/TailoredStore";
import { timeAgo } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ReanimatedSwipeable, {
  SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  FadeIn,
  FadeOut,
  interpolate,
  LinearTransition,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

// Kept to the left half: the card's figures are right-aligned.
const STAT_TILES: FieldTile[] = [
  { icon: "document-text", x: 4, y: 12, size: 58, rotate: -12, tone: "light" },
  { icon: "sparkles", x: 28, y: 4, size: 40, rotate: 10, tone: "light" },
  { icon: "checkmark", x: 14, y: 56, size: 46, rotate: 14, tone: "light" },
];

const ACTION_WIDTH = 76;

export default function Tailored() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data = [] } = useTailoredJobs();

  // Only jobs the user confirmed applying for; a CV tailored without applying
  // still blocks re-tailoring but does not appear here.
  const applied = useMemo(
    () =>
      data
        .filter((t) => t.applied)
        .sort((a, b) => (b.appliedAt ?? b.tailoredAt).localeCompare(a.appliedAt ?? a.tailoredAt)),
    [data]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      const updated = await TailoredStore.remove(id);
      queryClient.setQueryData(["tailored"], updated);
    },
    [queryClient]
  );

  const [now] = useState(Date.now);
  const thisWeek = applied.filter(
    (t) => now - new Date(t.appliedAt ?? t.tailoredAt).getTime() < 7 * 86_400_000
  ).length;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <ScreenHeader title="Tailored" />
        <Animated.FlatList
          data={applied}
          keyExtractor={(item) => item.job._id}
          itemLayoutAnimation={LinearTransition.duration(220)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statsCard}
            >
              <IconField tiles={STAT_TILES} />
              <Text style={[{ color: Colors.secondary, textAlign: "right" }, Typography.medium16]}>
                Applications
              </Text>
              <Text style={[{ color: Colors.white, textAlign: "right" }, Typography.semibold24]}>
                {applied.length}
              </Text>
              <View style={styles.separator} />
              <Text style={[{ color: Colors.secondary, marginBottom: 4 }, Typography.regular12]}>
                This week
              </Text>
              <Text style={[{ color: Colors.secondary }, Typography.bold20]}>{thisWeek}</Text>
            </LinearGradient>
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={index < 10 ? FadeIn.duration(200).delay(index * 25) : undefined}
              exiting={FadeOut.duration(150)}
            >
              <SwipeRow item={item} onDelete={handleDelete} />
            </Animated.View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="sparkles-outline" size={48} color={Colors.primary} />
              <Text style={[Typography.regular14, styles.emptyText]}>
                Jobs you apply to with a tailored CV will show up here.
              </Text>
              <Pressable
                style={styles.browseButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
                  router.navigate("/");
                }}
              >
                <Text style={[Typography.medium16, { color: Colors.white }]}>Browse jobs</Text>
              </Pressable>
            </View>
          }
        />
      </View>
    </GestureHandlerRootView>
  );
}

/**
 * Swipe left to reveal Delete. A drag must never count as a tap: the press is
 * ignored for any touch that moved the row, and a tap on an open row closes it.
 */
function SwipeRow({ item, onDelete }: { item: TailoredJob; onDelete: (id: string) => void }) {
  const router = useRouter();
  const swipeable = useRef<SwipeableMethods>(null);
  const isDragging = useRef(false);
  const isOpen = useRef(false);

  const startDrag = () => {
    isDragging.current = true;
  };
  const settle = (open: boolean) => {
    isOpen.current = open;
  };

  return (
    <ReanimatedSwipeable
      ref={swipeable}
      friction={1.6}
      rightThreshold={ACTION_WIDTH / 2}
      overshootRight={false}
      dragOffsetFromRight={12}
      onSwipeableOpenStartDrag={startDrag}
      onSwipeableCloseStartDrag={startDrag}
      onSwipeableWillOpen={() => Haptics.selectionAsync()}
      onSwipeableOpen={() => settle(true)}
      onSwipeableClose={() => settle(false)}
      renderRightActions={(progress) => (
        <DeleteAction progress={progress} onPress={() => onDelete(item.job._id)} />
      )}
    >
      <JobCard
        job={item.job}
        isTailored
        badge="Applied"
        subtitle={`Applied ${timeAgo(item.appliedAt ?? item.tailoredAt).toLowerCase()}`}
        // Every touch starts as a tap; it becomes a drag only if the row moves.
        onPressIn={() => {
          isDragging.current = false;
        }}
        onPress={() => {
          if (isDragging.current) return;
          if (isOpen.current) {
            swipeable.current?.close();
            return;
          }
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
          router.push(`/job/${item.job._id}`);
        }}
      />
    </ReanimatedSwipeable>
  );
}

function DeleteAction({ progress, onPress }: { progress: SharedValue<number>; onPress: () => void }) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.6, 1], [0, 0.6, 1]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.6, 1], "clamp") }],
  }));

  return (
    <View style={styles.actionSlot}>
      <Animated.View style={style}>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.deleteAction, pressed && { opacity: 0.85 }]}
          accessibilityLabel="Delete"
        >
          <Ionicons name="trash-outline" size={20} color={Colors.white} />
          <Text style={[Typography.medium10, { color: Colors.white }]}>Delete</Text>
        </Pressable>
      </Animated.View>
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
    paddingTop: 10,
    paddingBottom: 120,
  },
  statsCard: {
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 20,
    borderRadius: 24,
    marginBottom: 14,
  },
  separator: {
    marginVertical: 9,
    height: 1,
    backgroundColor: Colors.secondary,
    opacity: 0.2,
  },
  actionSlot: {
    width: ACTION_WIDTH,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  deleteAction: {
    backgroundColor: Colors.red,
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
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
  browseButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
  },
});
