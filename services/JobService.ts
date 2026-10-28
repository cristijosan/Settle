import { AI_TIMEOUT, api } from '@/api/NetworkManager';
import {
  CvProfile,
  IndexStatus,
  Job,
  JobFilters,
  JobsPage,
  MatchAllResponse,
  SearchResponse,
} from '@/types/api';

export const PAGE_SIZE = 20;

export const JobService = {
  getJobs(filters: JobFilters = {}, page = 1, pageSize = PAGE_SIZE): Promise<JobsPage> {
    return api.get<JobsPage>('/jobs', { ...filters, page, page_size: pageSize });
  },

  getJob(id: string): Promise<Job> {
    return api.get<Job>(`/jobs/${id}`);
  },

  getIndex(): Promise<IndexStatus> {
    return api.get<IndexStatus>('/jobs/index');
  },

  /** Free unless `explain` is set, which asks the model to rank (2 credits). */
  search(prompt: string, options: JobFilters & { page_size?: number; explain?: boolean } = {}) {
    return api.post<SearchResponse>(
      '/jobs/search',
      { prompt, ...options },
      { timeout: options.explain ? AI_TIMEOUT : undefined },
    );
  },

  /** `explain` defaults to true on the backend — pass false for the free path. */
  match(profile: CvProfile, options: JobFilters & { page_size?: number; explain?: boolean } = {}) {
    const explain = options.explain ?? true;
    return api.post<SearchResponse>(
      '/jobs/match',
      { profile, ...options, explain },
      { timeout: explain ? AI_TIMEOUT : undefined },
    );
  },

  /** Free; cached server-side until the next crawl (see `data_version`). */
  matchAll(profile: CvProfile, options: JobFilters & { limit?: number; min_similarity?: number } = {}) {
    return api.post<MatchAllResponse>('/jobs/match/all', { profile, ...options });
  },
};
