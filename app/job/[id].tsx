import { AppliedPrompt } from "@/components/AppliedPrompt";
import { CompanyLogo } from "@/components/CompanyLogo";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Colors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { useJob } from "@/hooks/useJobs";
import { useApplyFlow } from "@/hooks/useApplyFlow";
import { useRequirePremium } from "@/hooks/useSubscription";
import { useResume, useTailoredRecord } from "@/hooks/useResume";
import { prettySkill, seniorityLabel, timeAgo } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const DESCRIPTION_PREVIEW = 700;

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: job, error, refetch } = useJob(id);
  const { data: resume } = useResume();
  const record = useTailoredRecord(id);
  const requirePremium = useRequirePremium();
  const { openPosting, asking, answer } = useApplyFlow(job);
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  if (!job) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Details" leftElement="back" />
        <View style={styles.loading}>
          {error ? (
            <>
              <Text style={[Typography.regular14, { color: Colors.gray, textAlign: "center" }]}>
                {error.message}
              </Text>
              <Pressable style={styles.retryButton} onPress={() => refetch()}>
                <Text style={[Typography.medium16, { color: Colors.white }]}>Try again</Text>
              </Pressable>
            </>
          ) : (
            <ActivityIndicator color={Colors.primary} />
          )}
        </View>
      </View>
    );
  }

  const isTailored = !!record;

  const shareCv = async () => {
    if (!record?.cvUri) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    await Sharing.shareAsync(record.cvUri, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
      dialogTitle: record.cvName ?? "CV",
    });
  };

  // Tailoring is a Pro feature: free users see the paywall first.
  const handleTailor = () => requirePremium(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!resume) {
      Alert.alert(
        "Upload your CV first",
        "We need your current CV to tailor it for this job.",
        [
          { text: "Not now", style: "cancel" },
          { text: "Upload CV", onPress: () => router.push("/resume") },
        ]
      );
      return;
    }
    router.push({ pathname: "/tailor", params: { id: job._id } });
  });

  const requirements = [
    seniorityLabel(job.seniority),
    job.years_min ? `${job.years_min}+ years of experience` : null,
    job.employment_type,
    job.remote ? "Remote friendly" : null,
  ].filter((r): r is string => !!r);

  const description = job.description_text ?? job.summary ?? "";
  const isLong = description.length > DESCRIPTION_PREVIEW;

  const RequirementsElement = (text: string, index: number) => (
    <View style={styles.requirementsText} key={index}>
      <View style={styles.requiredIcon}>
        <Ionicons name="checkmark" size={14} color={Colors.white} />
      </View>
      <Text style={[{ color: Colors.black, flex: 1 }, Typography.regular14]}>
        {text}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Details" leftElement="back" />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[Typography.medium24, { color: Colors.primary, lineHeight: 30 }]}>
          {job.title}
        </Text>
        <View style={styles.infoCard}>
          <View style={styles.infoCompany}>
            <CompanyLogo name={job.company_name} url={job.url} size={64} />
            <View
              style={[
                styles.badge,
                { backgroundColor: isTailored ? Colors.successSoft : job.remote ? Colors.accentSoft : Colors.secondary },
              ]}
            >
              <Text
                style={[
                  { color: isTailored ? Colors.success : job.remote ? Colors.accentText : Colors.primary },
                  Typography.regular14,
                ]}
              >
                {record?.applied ? "Applied" : isTailored ? "CV ready" : job.remote ? "remote" : "on-site"}
              </Text>
            </View>
          </View>
          <Text style={[{ color: Colors.black }, Typography.bold20]}>
            {job.company_name}
          </Text>
          <View style={styles.separator} />
          <View style={{ gap: 4 }}>
            <Text style={[{ color: Colors.gray }, Typography.regular12]}>Salary:</Text>
            <Text style={[{ color: Colors.black }, Typography.bold20]}>
              {job.salary_raw || "Not listed"}
            </Text>
          </View>
          <View style={styles.separator} />
          <View style={{ gap: 4 }}>
            <Text style={[{ color: Colors.gray }, Typography.regular12]}>Location:</Text>
            <Text style={[{ color: Colors.black, lineHeight: 26 }, Typography.bold20]}>
              {job.location || (job.remote ? "Remote" : "United States")}
            </Text>
          </View>
          <View style={styles.separator} />
          <View style={{ gap: 4 }}>
            <Text style={[{ color: Colors.gray }, Typography.regular12]}>Posted:</Text>
            <Text style={[{ color: Colors.black }, Typography.bold20]}>
              {timeAgo(job.posted_at)}
            </Text>
          </View>
        </View>

        {job.skills.length > 0 && (
          <View style={styles.requirements}>
            <Text style={[{ color: Colors.primary }, Typography.bold16]}>Skills</Text>
            <View style={styles.skills}>
              {job.skills.map((skill) => (
                <View key={skill} style={styles.skillChip}>
                  <Text style={[Typography.regular14, { color: Colors.primary }]}>
                    {prettySkill(skill)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {requirements.length > 0 && (
          <View style={styles.requirements}>
            <Text style={[{ color: Colors.primary }, Typography.bold16]}>Requirements</Text>
            {requirements.map(RequirementsElement)}
          </View>
        )}

        {description.length > 0 && (
          <View style={styles.description}>
            <Text style={[{ color: Colors.black }, Typography.bold16]}>Description</Text>
            <View style={styles.descriptionText}>
              <Ionicons name="reader-outline" size={20} color={Colors.black} />
              <Text style={[{ color: Colors.black, flex: 1, lineHeight: 20 }, Typography.regular14]}>
                {isLong && !expanded
                  ? `${description.slice(0, DESCRIPTION_PREVIEW).trimEnd()}…`
                  : description}
              </Text>
            </View>
            {isLong && (
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setExpanded(!expanded);
                }}
                style={styles.showMore}
              >
                <Text style={[Typography.regular12, { color: Colors.primary }]}>
                  {expanded ? "Show less" : "Show more"}
                </Text>
                <Ionicons
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={12}
                  color={Colors.primary}
                />
              </Pressable>
            )}
          </View>
        )}

        {!!job.department && (
          <View style={styles.description}>
            <Text style={[{ color: Colors.black }, Typography.bold16]}>Team</Text>
            <View style={styles.descriptionText}>
              <Ionicons name="people-outline" size={20} color={Colors.black} />
              <Text style={[{ color: Colors.black, flex: 1 }, Typography.regular14]}>
                {job.department}
              </Text>
            </View>
          </View>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>
      <View style={styles.footerContainer}>
        <LinearGradient
          colors={[
            "rgba(255, 255, 255, 0)",
            "rgba(255, 255, 255, 0.75)",
            "rgba(255, 255, 255, 0.90)",
          ]}
          style={styles.gradient}
          pointerEvents="none"
        />

        <View style={styles.buttonWrapper}>
          {isTailored ? (
            // One tailored CV per job: from here on the job is for applying.
            <View style={styles.buttonRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  styles.flexButton,
                  pressed && { backgroundColor: Colors.primaryPressed },
                ]}
                onPress={openPosting}
              >
                <Ionicons name="open-outline" size={18} color={Colors.white} />
                <Text style={[Typography.medium16, { color: Colors.white, textAlign: "center" }]}>
                  Open job posting
                </Text>
              </Pressable>
              {!!record?.cvUri && (
                <Pressable
                  style={({ pressed }) => [
                    styles.iconButton,
                    pressed && { backgroundColor: Colors.secondaryPressed },
                  ]}
                  onPress={shareCv}
                  accessibilityLabel="Save or share CV"
                >
                  <Ionicons name="download-outline" size={22} color={Colors.primary} />
                </Pressable>
              )}
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && { backgroundColor: Colors.primaryPressed },
              ]}
              onPress={handleTailor}
            >
              <Ionicons name="sparkles" size={18} color={Colors.white} />
              <Text style={[Typography.medium16, { color: Colors.white, textAlign: "center" }]}>
                Tailor my resume
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <AppliedPrompt job={job} visible={asking} onAnswer={answer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: 20 },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 30,
    paddingBottom: 100,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
  },
  infoCard: {
    marginTop: 25,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 5,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  infoCompany: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  separator: {
    marginVertical: 9,
    height: 1,
    backgroundColor: Colors.secondary,
  },
  badge: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 24,
  },
  requirements: {
    marginTop: 20,
    paddingHorizontal: 14,
    gap: 16,
  },
  skills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  skillChip: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 24,
  },
  requiredIcon: {
    width: 20,
    height: 20,
    backgroundColor: Colors.primary,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  requirementsText: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 20,
  },
  description: {
    marginTop: 30,
    paddingHorizontal: 14,
    gap: 16,
  },
  descriptionText: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 20,
  },
  showMore: {
    alignSelf: "flex-start",
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 28,
  },
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "flex-end",
  },
  gradient: {
    height: 200,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  buttonWrapper: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    paddingTop: 10,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 24,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  flexButton: {
    flex: 1,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
});
