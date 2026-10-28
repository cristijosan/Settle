import { AuthService } from '@/services/AuthService';
import { JobService } from '@/services/JobService';
import { Job, JobFilters, JobsPage } from '@/types/api';
import { InfiniteData, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';

export const useJobs = (filters: JobFilters = {}, { enabled = true } = {}) => {
  return useInfiniteQuery({
    queryKey: ['jobs', filters],
    enabled,
    queryFn: ({ pageParam }) => JobService.getJobs(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.page_size < last.total ? last.page + 1 : undefined,
    staleTime: 1000 * 60 * 5,
  });
};

/** Every listing already loaded by any list query, so detail screens open instantly. */
export const useCachedJobs = (): Job[] => {
  const queryClient = useQueryClient();
  const cached = queryClient.getQueriesData<InfiniteData<JobsPage> | JobsPage>({ queryKey: ['jobs'] });
  return cached.flatMap(([, data]) => {
    if (!data) return [];
    if ('pages' in data) return data.pages.flatMap((p) => p.items);
    return data.items;
  });
};

export const useJob = (id: string) => {
  const cachedJobs = useCachedJobs();
  return useQuery({
    queryKey: ['job', id],
    queryFn: () => JobService.getJob(id),
    placeholderData: () => cachedJobs.find((j) => j._id === id),
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Listings shown under "Your Top Matches". There is no parsed CV or sign-in yet,
 * so this is the newest listings; once there is, swap the source for
 * JobService.matchAll(profile), which ranks the whole catalogue against the CV for free.
 */
export const useTopMatches = () => useJobs();

/**
 * Free-text search: the prompt is embedded and compared against every listing.
 * Free without `explain`; the endpoint wants a token, which the device session provides.
 * Kept outside the ['jobs'] key because its response is not a JobsPage.
 */
export const usePromptSearch = (prompt: string) => {
  return useQuery({
    queryKey: ['search', prompt],
    queryFn: () => AuthService.withSession(() => JobService.search(prompt, { page_size: 30 })),
    enabled: prompt.length > 0,
    staleTime: 1000 * 60 * 5,
  });
};
