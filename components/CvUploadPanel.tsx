import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useResume } from '@/hooks/useResume';
import { useCvAnalysis, usePremium } from '@/hooks/useSubscription';
import { CvAnalysis } from '@/services/CvAnalysis';
import {
  MAX_RESUME_BYTES,
  RESUME_MIME_TYPES,
  ResumeStore,
  StoredResume,
} from '@/services/ResumeStore';
import { formatSize, timeAgo } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface CvUploadPanelProps {
  onChange?: (resume: StoredResume | null) => void;
}

export const CvUploadPanel = ({ onChange }: CvUploadPanelProps) => {
  const queryClient = useQueryClient();
  const { data: resume } = useResume();
  const { data: isPremium } = usePremium();
  const { data: analysis } = useCvAnalysis();
  const [isSaving, setIsSaving] = useState(false);

  const setResume = (value: StoredResume | null) => {
    queryClient.setQueryData(['resume'], value);
    onChange?.(value);
  };

  const pick = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    const result = await DocumentPicker.getDocumentAsync({
      type: RESUME_MIME_TYPES,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (asset.size && asset.size > MAX_RESUME_BYTES) {
      Alert.alert('File too large', 'Your CV needs to be under 24 MB.');
      return;
    }
    if (/\.doc$/i.test(asset.name)) {
      Alert.alert('Old Word format', 'Please re-save your CV as .docx or PDF and try again.');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await ResumeStore.save(asset);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResume(saved);
    } catch (e) {
      console.error('Failed to save CV', e);
      Alert.alert('Upload failed', 'We could not read that file. Please try another one.');
    } finally {
      setIsSaving(false);
    }
  };

  const remove = () => {
    Alert.alert('Remove CV?', 'You will need to upload it again before tailoring.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await ResumeStore.remove();
          await CvAnalysis.clear();
          queryClient.setQueryData(['cvAnalysis'], null);
          setResume(null);
        },
      },
    ]);
  };

  if (isSaving) {
    return (
      <View style={[styles.dropzone, styles.center]}>
        <ActivityIndicator color={Colors.primary} />
        <Text style={[Typography.medium16, { color: Colors.primary }]}>Saving your CV…</Text>
      </View>
    );
  }

  if (!resume) {
    return (
      <Animated.View entering={FadeIn} exiting={FadeOut}>
        <Pressable
          onPress={pick}
          style={({ pressed }) => [styles.dropzone, pressed && { backgroundColor: Colors.secondaryPressed }]}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="cloud-upload-outline" size={32} color={Colors.white} />
          </View>
          <Text style={[Typography.bold20, styles.dropTitle]}>Tap to upload your CV</Text>
          <Text style={[Typography.regular14, styles.dropHint]}>PDF or DOCX, up to 24 MB</Text>
        </Pressable>
      </Animated.View>
    );
  }

  const isPdf = resume.mimeType === 'application/pdf';
  const isAnalysed = analysis?.resumeAddedAt === resume.addedAt;
  const analysisLabel = isAnalysed
    ? '✅ Analysed by AI'
    : isPremium
      ? '⏳ AI analysis in progress'
      : '🔒 AI analysis comes with Pro';

  return (
    <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut} style={styles.fileCard}>
      <View style={styles.fileRow}>
        <View style={[styles.fileIcon, { backgroundColor: isPdf ? '#FDECEC' : Colors.secondary }]}>
          <Ionicons name="document-text" size={26} color={isPdf ? '#D93025' : Colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[Typography.bold16, { color: Colors.black }]} numberOfLines={1}>
            {resume.name}
          </Text>
          <Text style={[Typography.regular12, { color: Colors.gray }]}>
            {isPdf ? 'PDF' : 'DOCX'} · {formatSize(resume.size)} · added {timeAgo(resume.addedAt).toLowerCase()}
          </Text>
        </View>
        <View style={styles.readyBadge}>
          <Ionicons name="checkmark" size={14} color={Colors.white} />
        </View>
      </View>
      <Text style={[Typography.regular12, styles.analysis]}>{analysisLabel}</Text>
      <View style={styles.separator} />
      <View style={styles.actions}>
        <Pressable onPress={pick} style={[styles.action, { backgroundColor: Colors.secondary }]}>
          <Ionicons name="swap-horizontal" size={16} color={Colors.primary} />
          <Text style={[Typography.medium16, { color: Colors.primary }]}>Replace</Text>
        </Pressable>
        <Pressable onPress={remove} style={[styles.action, { backgroundColor: '#FFF0EF' }]}>
          <Ionicons name="trash-outline" size={16} color={Colors.red} />
          <Text style={[Typography.medium16, { color: Colors.red }]}>Remove</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  analysis: {
    color: Colors.gray,
    marginTop: 12,
  },
  dropzone: {
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    backgroundColor: Colors.secondary,
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  center: {
    justifyContent: 'center',
    minHeight: 200,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dropTitle: {
    color: Colors.black,
    textAlign: 'center',
  },
  dropHint: {
    color: Colors.gray,
    textAlign: 'center',
  },
  fileCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.secondary,
    backgroundColor: Colors.white,
    padding: 12,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.secondary,
    marginVertical: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  action: {
    flex: 1,
    height: 40,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
