import { ResumeStore } from '@/services/ResumeStore';
import { TailoredStore } from '@/services/TailoredStore';
import { useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

export const useResume = () => {
  return useQuery({
    queryKey: ['resume'],
    queryFn: () => ResumeStore.get(),
    staleTime: Infinity,
  });
};

export const useTailoredJobs = () => {
  const query = useQuery({
    queryKey: ['tailored'],
    queryFn: () => TailoredStore.all(),
    staleTime: Infinity,
  });
  const { refetch } = query;

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  return query;
};

/** The job's tailoring record, if a CV was ever tailored for it. */
export const useTailoredRecord = (id: string | undefined) => {
  const { data } = useTailoredJobs();
  return data?.find((t) => t.job._id === id) ?? null;
};
