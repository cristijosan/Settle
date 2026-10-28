import { JobCard } from "@/components/JobCard";
import { Typography } from "@/constants/Typography";
import {
  useCachedJobs,
  useJobs,
  usePromptSearch,
} from "@/hooks/useJobs";
import { usePremium, useRequirePremium } from "@/hooks/useSubscription";
import { JobFilters, Seniority } from "@/types/api";
import { matchesFilters, seniorityLabel } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../constants/Colors";

type Mode = "keywords" | "describe";

// The catalogue tags no listing "mid", so that chip would always be empty.
const SENIORITIES: Seniority[] = ["intern", "junior", "senior", "lead"];

const EXPERIENCE: { label: string; years: number }[] = [
  { label: "≤ 2 yrs exp", years: 2 },
  { label: "≤ 5 yrs exp", years: 5 },
];

const PROMPT_EXAMPLES = [
  "Remote React developer, mid level",
  "Junior data analyst in New York",
  "Registered nurse with night shifts in Texas",
  "Senior backend engineer working with Go and Kubernetes",
];

const useDebounced = (value: string, delay = 350) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("keywords");

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            tap();
            router.back();
          }}
          style={styles.iconButton}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.black} />
        </Pressable>
        <View style={styles.segmented}>
          {(
            [
              { key: "keywords", label: "Keywords", icon: "options-outline" },
              { key: "describe", label: "Describe", icon: "sparkles-outline" },
            ] as const
          ).map(({ key, label, icon }) => {
            const active = mode === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.segment, active && styles.segmentActive]}
                onPress={() => {
                  tap();
                  setMode(key);
                }}
              >
                <Ionicons
                  name={icon}
                  size={14}
                  color={active ? Colors.white : Colors.black}
                />
                <Text
                  style={[
                    Typography.regular14,
                    { color: active ? Colors.white : Colors.black },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {mode === "keywords" ? <KeywordSearch /> : <DescribeSearch />}
    </View>
  );
}

/** Exact search: a keyword plus GET /jobs filters. Free, live as you type. */
function KeywordSearch() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<JobFilters>({});
  const keyword = useDebounced(query).trim().toLowerCase();

  const hasFilters = Object.keys(filters).length > 0;
  const hasKeyword = keyword.length > 1;

  // Skills are stored lower-case, so the keyword is matched as a skill
  // on the backend; titles and companies are matched in what is loaded.
  const serverFilters = hasKeyword ? { ...filters, skills: [keyword] } : filters;
  const {
    data,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useJobs(serverFilters, { enabled: hasKeyword || hasFilters });
  const cachedJobs = useCachedJobs();

  const results = useMemo(() => {
    if (!hasKeyword && !hasFilters) return [];
    const local = hasKeyword
      ? cachedJobs.filter(
          (job) =>
            (job.title.toLowerCase().includes(keyword) ||
              job.company_name.toLowerCase().includes(keyword)) &&
            matchesFilters(job, filters)
        )
      : [];
    const remote = (data?.pages ?? []).flatMap((p) => p.items);
    const seen = new Set<string>();
    return [...local, ...remote].filter(
      (job) => !seen.has(job._id) && !!seen.add(job._id)
    );
  }, [keyword, hasKeyword, hasFilters, filters, cachedJobs, data]);

  const total = data?.pages[0]?.total;
  const countLabel = hasKeyword
    ? `${results.length}${hasNextPage ? "+" : ""} jobs found`
    : total !== undefined
      ? `${total.toLocaleString("en-US")} jobs found`
      : "Searching…";

  const toggle = (patch: JobFilters) => {
    tap();
    setFilters((current) => {
      const next = { ...current };
      for (const [key, value] of Object.entries(patch) as [keyof JobFilters, any][]) {
        if (next[key] === value) delete next[key];
        else (next as any)[key] = value;
      }
      return next;
    });
  };

  const chip = (label: string, active: boolean, onPress: () => void) => (
    <TouchableOpacity
      key={label}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[Typography.regular14, active ? styles.chipTextActive : styles.chipText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.flex}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={Colors.black} />
        <TextInput
          autoFocus
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          style={[styles.input, Typography.regular14]}
          placeholder="Job title, company or skill…"
          value={query}
          onChangeText={setQuery}
          placeholderTextColor={Colors.gray}
        />
        {isFetching && !isFetchingNextPage ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : query.length > 0 ? (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={Colors.grayLight} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.chipsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.chipsRow}
        >
          {hasFilters &&
            chip("Clear", false, () => {
              tap();
              setFilters({});
            })}
          {chip("Remote", filters.remote === true, () => toggle({ remote: true }))}
          <View style={styles.chipDivider} />
          {SENIORITIES.map((s) =>
            chip(seniorityLabel(s)!, filters.seniority === s, () => toggle({ seniority: s }))
          )}
          <View style={styles.chipDivider} />
          {EXPERIENCE.map(({ label, years }) =>
            chip(label, filters.max_years === years, () => toggle({ max_years: years }))
          )}
        </ScrollView>
        <LinearGradient
          colors={["#FFFFFF", "rgba(255, 255, 255, 0)"]}
          style={styles.gradientPadding}
          pointerEvents="none"
        />
      </View>

      {hasKeyword || hasFilters ? (
        <Animated.FlatList
          itemLayoutAnimation={LinearTransition.duration(220)}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={11}
          data={results}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContainer}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.6}
          ListHeaderComponent={
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={[{ color: Colors.primary }, Typography.regular12]}>
                  {countLabel}
                </Text>
              </View>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={index < 10 ? FadeIn.duration(200).delay(index * 25) : undefined}
              exiting={FadeOut.duration(150)}
            >
              <JobCard job={item} />
            </Animated.View>
          )}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
            ) : undefined
          }
          ListEmptyComponent={
            !isFetching ? (
              <EmptyState
                icon={<Ionicons name="search" size={56} color={Colors.primary} />}
                title={hasKeyword ? `No results for “${query.trim()}”` : "No jobs match these filters"}
                hint="Try fewer filters, or describe the job in your own words."
              />
            ) : undefined
          }
        />
      ) : (
        <EmptyState
          icon={<Ionicons name="search" size={56} color={Colors.primary} />}
          title="Search by keyword or filter"
          hint="Try a skill like “python” or “figma”, a job title or a company"
        />
      )}
    </View>
  );
}

/**
 * Semantic search: a sentence in any language, matched by meaning. A Pro
 * feature — free users can write a prompt, and sending it opens the paywall.
 */
function DescribeSearch() {
  const [draft, setDraft] = useState("");
  const [prompt, setPrompt] = useState("");
  const { data: isPremium } = usePremium();
  const requirePremium = useRequirePremium();
  const { data, isFetching, error, refetch } = usePromptSearch(isPremium ? prompt : "");

  const submit = (text = draft) => {
    const value = text.trim();
    if (!value) return;
    Keyboard.dismiss();
    setDraft(value);
    requirePremium(() => {
      tap();
      setPrompt(value);
    });
  };

  return (
    <View style={styles.flex}>
      <View style={styles.promptBox}>
        <TextInput
          autoFocus
          multiline
          style={[styles.promptInput, Typography.regular14]}
          placeholder="Describe the job you want, in any language…"
          placeholderTextColor={Colors.gray}
          value={draft}
          onChangeText={setDraft}
          submitBehavior="blurAndSubmit"
          returnKeyType="search"
          onSubmitEditing={() => submit()}
        />
        {!isPremium && (
          <View style={styles.proPill}>
            <Text style={[Typography.medium10, { color: Colors.white }]}>PRO</Text>
          </View>
        )}
        <Pressable
          onPress={() => submit()}
          disabled={!draft.trim() || isFetching}
          style={[styles.sendButton, (!draft.trim() || isFetching) && styles.sendButtonDisabled]}
        >
          {isFetching ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Ionicons name="arrow-up" size={18} color={Colors.white} />
          )}
        </Pressable>
      </View>

      {!prompt ? (
        <Animated.View entering={FadeIn} style={styles.examples}>
          <Text style={[Typography.regular12, { color: Colors.gray }]}>
            Try one of these
          </Text>
          {PROMPT_EXAMPLES.map((example) => (
            <TouchableOpacity
              key={example}
              style={styles.example}
              onPress={() => submit(example)}
            >
              <Ionicons name="sparkles-outline" size={14} color={Colors.primary} />
              <Text style={[Typography.regular14, styles.exampleText]}>{example}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      ) : isFetching && !data ? (
        <EmptyState
          icon={<ActivityIndicator color={Colors.primary} />}
          title="Finding the closest jobs…"
          hint="Matching your description against every listing."
        />
      ) : error ? (
        <EmptyState
          icon={<Ionicons name="cloud-offline-outline" size={48} color={Colors.primary} />}
          title={error.message}
          action={{ label: "Try again", onPress: () => refetch() }}
        />
      ) : (
        <Animated.FlatList
          data={data?.results ?? []}
          keyExtractor={(item) => item.job._id}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={[{ color: Colors.primary }, Typography.regular12]}>
                  Best {data?.results.length ?? 0} matches, closest first
                </Text>
              </View>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={index < 10 ? FadeIn.duration(200).delay(index * 25) : undefined}>
              <JobCard
                job={item.job}
                subtitle={[`${Math.round(item.similarity * 100)}% match`, item.job.location]
                  .filter(Boolean)
                  .join(" · ")}
              />
            </Animated.View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<Ionicons name="search" size={56} color={Colors.primary} />}
              title="No close matches"
              hint="Try describing the role differently, or with fewer details."
            />
          }
        />
      )}
    </View>
  );
}

function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.emptyContainer}>
      {icon}
      <View style={styles.emptyText}>
        <Text style={[{ color: Colors.gray, textAlign: "center" }, Typography.regular14]}>
          {title}
        </Text>
        {hint && (
          <Text style={[{ color: Colors.grayLight, textAlign: "center" }, Typography.regular12]}>
            {hint}
          </Text>
        )}
      </View>
      {action && (
        <Pressable style={styles.retryButton} onPress={action.onPress}>
          <Text style={[Typography.medium16, { color: Colors.white }]}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  flex: {
    flex: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  segmented: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: Colors.secondary,
    borderRadius: 24,
    padding: 3,
    height: 40,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 21,
  },
  segmentActive: {
    backgroundColor: Colors.black,
  },
  searchBar: {
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.secondary,
    borderRadius: 50,
    paddingHorizontal: 12,
    height: 40,
    marginTop: 16,
  },
  input: {
    flex: 1,
    color: Colors.black,
  },
  chipsWrapper: {
    zIndex: 10,
    backgroundColor: Colors.white,
    marginHorizontal: -20,
  },
  chipsRow: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 4,
    alignItems: "center",
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.secondary,
  },
  chipActive: {
    backgroundColor: Colors.black,
  },
  chipText: {
    color: Colors.black,
  },
  chipTextActive: {
    color: Colors.white,
  },
  chipDivider: {
    width: 1,
    height: 20,
    marginHorizontal: 4,
    backgroundColor: Colors.grayLight,
  },
  gradientPadding: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -30,
    height: 30,
  },
  listContainer: {
    paddingBottom: 60,
  },
  badgeRow: {
    alignItems: "center",
  },
  badge: {
    backgroundColor: Colors.secondary,
    marginVertical: 14,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 16,
  },
  promptBox: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 16,
    padding: 12,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
  },
  promptInput: {
    flex: 1,
    minHeight: 64,
    maxHeight: 120,
    color: Colors.black,
    textAlignVertical: "top",
    paddingTop: 0,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  proPill: {
    position: "absolute",
    top: 10,
    right: 12,
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.grayLight,
  },
  examples: {
    marginTop: 24,
    gap: 8,
  },
  example: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  exampleText: {
    flex: 1,
    color: Colors.black,
  },
  emptyContainer: {
    alignItems: "center",
    gap: 16,
    paddingTop: 80,
    paddingHorizontal: 30,
  },
  emptyText: {
    alignItems: "center",
    gap: 4,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
  },
});
