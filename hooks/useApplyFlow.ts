import { Colors } from '@/constants/Colors';
import { TailoredStore } from '@/services/TailoredStore';
import { JobBrief } from '@/types/api';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';
import { AppState, Platform } from 'react-native';

/**
 * iOS resolves openBrowserAsync when the sheet is dismissed; Android resolves
 * as soon as the Custom Tab opens, so there we wait for the app to come back.
 */
const openAndWaitForClose = async (url: string) => {
  const result = await WebBrowser.openBrowserAsync(url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    toolbarColor: Colors.white,
    controlsColor: Colors.primary,
  });
  if (Platform.OS !== 'android' || result.type !== 'opened') return;
  await new Promise<void>((resolve) => {
    let left = false;
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') left = true;
      else if (left) {
        sub.remove();
        resolve();
      }
    });
  });
};

/**
 * Opens a job's posting and, once the browser closes, asks whether the user
 * applied — but only while the job is tailored and not yet marked applied.
 */
export const useApplyFlow = (job: JobBrief | undefined) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [asking, setAsking] = useState(false);

  const openPosting = useCallback(async () => {
    if (!job) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    try {
      await openAndWaitForClose(job.url);
    } catch (error) {
      console.error('Failed to open job posting', error);
      return;
    }
    const record = await TailoredStore.find(job._id);
    if (record && !record.applied) setAsking(true);
  }, [job]);

  const answer = useCallback(
    async (applied: boolean) => {
      setAsking(false);
      if (!applied || !job) return;
      const updated = await TailoredStore.markApplied(job._id);
      queryClient.setQueryData(['tailored'], updated);
      // Let the sheet slide away before the success screen takes over.
      setTimeout(() => router.push({ pathname: '/applied', params: { id: job._id } }), 250);
    },
    [job, queryClient, router]
  );

  return { openPosting, asking, answer };
};
