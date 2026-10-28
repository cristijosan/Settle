import { CvAnalysis } from '@/services/CvAnalysis';
import { SubscriptionService } from '@/services/SubscriptionService';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

export const usePremium = () =>
  useQuery({
    queryKey: ['premium'],
    queryFn: () => SubscriptionService.isPremium(),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

/** Runs `action` for subscribers; everyone else is shown the paywall. */
export const useRequirePremium = () => {
  const router = useRouter();
  const { data: isPremium } = usePremium();
  return useCallback(
    (action: () => void) => {
      if (isPremium) return action();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push('/paywall');
    },
    [isPremium, router]
  );
};

export const useCvAnalysis = () =>
  useQuery({
    queryKey: ['cvAnalysis'],
    queryFn: () => CvAnalysis.get(),
    staleTime: Infinity,
  });
