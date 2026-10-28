import { CvResult } from '@/types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from './AuthService';
import { CvService } from './CvService';
import { ResumeStore } from './ResumeStore';

const KEY = 'cv_analysis';

export interface CvAnalysisResult {
  /** Which upload this analysis belongs to; a new upload invalidates it. */
  resumeAddedAt: string;
  analysedAt: string;
  result: CvResult;
}

let running: Promise<CvAnalysisResult | null> | null = null;

/**
 * The AI read of the uploaded CV (/cv/parse, 1 credit). It runs only for
 * subscribers, once per upload, so no credits are spent on free users or on a
 * CV that was already analysed.
 */
export const CvAnalysis = {
  async get(): Promise<CvAnalysisResult | null> {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  },

  /** The analysis for the current upload, running it first if needed. */
  run(): Promise<CvAnalysisResult | null> {
    running ??= (async () => {
      const resume = await ResumeStore.get();
      if (!resume) return null;
      const existing = await this.get();
      if (existing?.resumeAddedAt === resume.addedAt) return existing;

      const result = await AuthService.withSession(() => CvService.parse(resume));
      const analysis: CvAnalysisResult = {
        resumeAddedAt: resume.addedAt,
        analysedAt: new Date().toISOString(),
        result,
      };
      await AsyncStorage.setItem(KEY, JSON.stringify(analysis));
      return analysis;
    })().finally(() => {
      running = null;
    });
    return running;
  },

  async clear() {
    await AsyncStorage.removeItem(KEY);
  },
};
