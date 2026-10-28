export type Seniority =
  | 'intern'
  | 'junior'
  | 'mid'
  | 'senior'
  | 'staff'
  | 'principal'
  | 'lead';

export type JobSource =
  | 'greenhouse'
  | 'ashby'
  | 'lever'
  | 'breezy'
  | 'workable'
  | 'remoteok'
  | 'himalayas'
  | 'usajobs';

export interface JobBrief {
  _id: string;
  source: JobSource;
  external_id: string;
  url: string;
  title: string;
  company_name: string;
  summary: string;
  skills: string[];
  seniority: Seniority | null;
  years_min: number | null;
  salary_raw: string | null;
  location: string | null;
  remote: boolean;
  posted_at: string | null;
}

export interface Job extends JobBrief {
  department: string | null;
  employment_type: string | null;
  country: string;
  scraped_at: string;
  description_text: string;
}

export interface JobFilters {
  skills?: string[];
  seniority?: Seniority;
  remote?: boolean;
  max_years?: number;
  source?: JobSource;
}

export interface JobsPage {
  page: number;
  page_size: number;
  total: number;
  items: Job[];
}

export interface IndexStatus {
  vectors: number;
  dimensions: number;
  megabytes: number;
  age_seconds: number;
  model: string;
  jobs: number;
}

export interface SearchResult {
  job: Job;
  similarity: number;
  score: number;
  reason: string;
}

export interface SearchResponse {
  total_candidates: number;
  results: SearchResult[];
  note: string;
  used_model: boolean;
}

export interface MatchAllResponse {
  total_candidates: number;
  matched: number;
  returned: number;
  cached: boolean;
  data_version: string;
  results: { job: JobBrief; similarity: number }[];
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  plan: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  user: User;
}

export interface Usage {
  plan: string;
  description: string;
  credits: number | null;
  used: number;
  remaining: number | null;
  resets: 'day' | 'month' | 'total';
  costs: Record<string, number>;
}

export interface CvLink {
  label: string;
  url: string;
}

export interface CvContact {
  full_name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  links: CvLink[];
}

export interface CvExperience {
  company: string;
  title: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  bullets: string[];
}

export interface CvVolunteering {
  organization: string;
  role: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  bullets: string[];
}

export interface CvEducation {
  institution: string;
  degree: string;
  field_of_study: string;
  location: string;
  start_date: string;
  end_date: string;
  details: string;
}

export interface CvSkillGroup {
  category: string;
  skills: string[];
}

export interface CvProfile {
  contact: CvContact;
  summary: string;
  experience: CvExperience[];
  volunteering: CvVolunteering[];
  education: CvEducation[];
  skill_groups: CvSkillGroup[];
  other_sections: unknown[];
}

export interface CvChange {
  path: string;
  before: string;
  after: string;
}

/** Opaque to the client: posted back to /cv/render or /cv/pdf unchanged. */
export type CvTemplateData = Record<string, unknown>;

export interface CvResult {
  profile: CvProfile;
  template_data: CvTemplateData | null;
  blocked: string | null;
  dropped: { reason: string; [key: string]: unknown }[];
  warnings: string[];
  changes: CvChange[];
  rationale: string;
}

export interface PastedJob {
  title: string;
  company?: string;
  description: string;
}

export interface CvFile {
  uri: string;
  name: string;
  mimeType: string;
}
