import { JobBrief } from '@/types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';

const KEY = 'tailored_jobs';

/**
 * One record per job, created the moment a CV is tailored for it — whether or
 * not the user then applies. Its existence is what stops a job being tailored
 * twice; `applied` is what puts it on the Tailored tab.
 */
export interface TailoredJob {
  job: JobBrief;
  tailoredAt: string;
  cvUri: string | null;
  cvName: string | null;
  applied: boolean;
  appliedAt: string | null;
}

export interface SavedCv {
  uri: string;
  name: string;
  size: number;
}

const cvDir = () => new Directory(Paths.document, 'tailored');

const safeName = (s: string) =>
  s.normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_').slice(0, 40) || 'CV';

/**
 * A valid, empty one-page A4 PDF. Stands in for the tailored CV until the
 * app calls /cv/tailor and /cv/pdf for real.
 */
const blankPdf = () => {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((body, i) => {
    const offset = pdf.length;
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
    return offset;
  });
  const xref = pdf.length;
  pdf +=
    `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` +
    offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('') +
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return pdf;
};

const toBrief = (job: JobBrief): JobBrief => ({
  _id: job._id,
  source: job.source,
  external_id: job.external_id,
  url: job.url,
  title: job.title,
  company_name: job.company_name,
  summary: job.summary,
  skills: job.skills,
  seniority: job.seniority,
  years_min: job.years_min,
  salary_raw: job.salary_raw,
  location: job.location,
  remote: job.remote,
  posted_at: job.posted_at,
});

export const TailoredStore = {
  async all(): Promise<TailoredJob[]> {
    const raw = await AsyncStorage.getItem(KEY);
    const items: Partial<TailoredJob>[] = raw ? JSON.parse(raw) : [];
    // Records written before the apply step existed were all shown on the tab.
    return items.map((t) => ({
      cvUri: null,
      cvName: null,
      appliedAt: null,
      ...t,
      applied: t.applied ?? true,
    })) as TailoredJob[];
  },

  async find(id: string): Promise<TailoredJob | null> {
    return (await this.all()).find((t) => t.job._id === id) ?? null;
  },

  async write(items: TailoredJob[]) {
    await AsyncStorage.setItem(KEY, JSON.stringify(items));
    return items;
  },

  /** Writes the tailored CV into the app's documents folder. */
  saveCv(job: JobBrief): SavedCv {
    const dir = new Directory(cvDir(), job._id);
    if (dir.exists) dir.delete();
    dir.create({ intermediates: true });
    const name = `CV_${safeName(job.company_name)}.pdf`;
    const file = new File(dir, name);
    file.create();
    file.write(blankPdf());
    return { uri: file.uri, name, size: file.size ?? 0 };
  },

  async add(job: JobBrief, cv: SavedCv) {
    const items = (await this.all()).filter((t) => t.job._id !== job._id);
    const record: TailoredJob = {
      job: toBrief(job),
      tailoredAt: new Date().toISOString(),
      cvUri: cv.uri,
      cvName: cv.name,
      applied: false,
      appliedAt: null,
    };
    return this.write([record, ...items]);
  },

  async markApplied(id: string) {
    const items = (await this.all()).map((t) =>
      t.job._id === id ? { ...t, applied: true, appliedAt: new Date().toISOString() } : t
    );
    return this.write(items);
  },

  /** Forgets the job entirely, including its saved CV, so it can be tailored again. */
  async remove(id: string) {
    const dir = new Directory(cvDir(), id);
    if (dir.exists) dir.delete();
    return this.write((await this.all()).filter((t) => t.job._id !== id));
  },
};
