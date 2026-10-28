import { AI_TIMEOUT, api } from '@/api/NetworkManager';
import { CvFile, CvProfile, CvResult, CvTemplateData, PastedJob } from '@/types/api';
import { File, Paths } from 'expo-file-system';

type JobTarget = { job_id: string } | { job: PastedJob };

const appendFile = (form: FormData, file: CvFile) => {
  // React Native's FormData takes a { uri, name, type } descriptor for files.
  form.append('file', { uri: file.uri, name: file.name, type: file.mimeType } as any);
};

export const CvService = {
  /** 1 credit. Reads an uploaded PDF/DOCX into an editable profile. */
  parse(file: CvFile, language = 'en'): Promise<CvResult> {
    const form = new FormData();
    appendFile(form, file);
    form.append('language', language);
    return api.postForm<CvResult>('/cv/parse', form, { timeout: AI_TIMEOUT });
  },

  /** 1 credit. Aims a parsed profile at one advert; `changes` may honestly be empty. */
  tailor(profile: CvProfile, target: JobTarget, language = 'en'): Promise<CvResult> {
    return api.post<CvResult>('/cv/tailor', { profile, language, ...target }, { timeout: AI_TIMEOUT });
  },

  /** 2 credits. parse + tailor in a single request. */
  adapt(file: CvFile, target: JobTarget, language = 'en'): Promise<CvResult> {
    const form = new FormData();
    appendFile(form, file);
    form.append('language', language);
    if ('job_id' in target) {
      form.append('job_id', target.job_id);
    } else {
      form.append('job_title', target.job.title);
      form.append('job_description', target.job.description);
      if (target.job.company) form.append('job_company', target.job.company);
    }
    return api.postForm<CvResult>('/cv/adapt', form, { timeout: AI_TIMEOUT });
  },

  /** Free, ~2ms. Returns HTML — useful as a live preview in a WebView. */
  render(data: CvTemplateData | { profile: CvProfile }): Promise<string> {
    return api.post<string>('/cv/render', data, { responseType: 'text' });
  },

  /** Free, ~450ms. Writes the PDF to the cache directory and returns its uri. */
  async pdf(data: CvTemplateData | { profile: CvProfile }): Promise<string> {
    const { bytes, filename } = await api.download('/cv/pdf', data);
    const file = new File(Paths.cache, filename ?? 'CV.pdf');
    if (file.exists) file.delete();
    file.create();
    file.write(new Uint8Array(bytes));
    return file.uri;
  },
};
