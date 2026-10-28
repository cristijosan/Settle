import { JobBrief, JobFilters, Seniority } from '@/types/api';

export const initials = (name: string) =>
  name
    .split(/[\s/&,.-]+/)
    .filter((w) => /^[A-Za-z0-9]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';

export const timeAgo = (iso: string | null) => {
  if (!iso) return 'Recently';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${days < 14 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
};

export const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export const formatCount = (n: number) =>
  n >= 1000 ? `${Math.floor(n / 1000).toLocaleString('en-US')}K` : `${n}`;

const SENIORITY_LABELS: Record<Seniority, string> = {
  intern: 'Internship',
  junior: 'Entry level',
  mid: 'Mid level',
  senior: 'Senior',
  staff: 'Staff',
  principal: 'Principal',
  lead: 'Lead',
};

export const seniorityLabel = (s: Seniority | null) => (s ? SENIORITY_LABELS[s] : null);

const ACRONYMS = new Set([
  'aws', 'gcp', 'sql', 'css', 'html', 'api', 'ui', 'ux', 'php', 'ios', 'qa', 'ci', 'cd',
  'etl', 'ml', 'ai', 'nlp', 'seo', 'crm', 'erp', 'sap', 'hr', 'rest', 'graphql', 'llm',
]);

/** Skills arrive lower-case; show them the way people write them. */
export const prettySkill = (skill: string) =>
  skill
    .split(' ')
    .map((w) => (ACRONYMS.has(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');

/**
 * The API has no logo or company website, and every listing links to a job board,
 * so the company's domain is guessed from the board's company slug
 * (job-boards.greenhouse.io/assemblyai → assemblyai.com). A wrong guess 404s and
 * the logo falls back to initials.
 */
export const companyDomain = (url: string): string | null => {
  try {
    const { hostname, pathname } = new URL(url);
    const host = hostname.toLowerCase();
    const firstSegment = pathname.split('/').filter(Boolean)[0];
    let slug: string | undefined;
    if (/(^|\.)(greenhouse\.io|ashbyhq\.com|lever\.co)$/.test(host)) slug = firstSegment;
    else if (host.endsWith('.breezy.hr')) slug = host.slice(0, -'.breezy.hr'.length);
    if (!slug || !/^[a-z0-9-]+$/i.test(slug)) return null;
    return `${slug.toLowerCase()}.com`;
  } catch {
    return null;
  }
};

export const logoUrl = (url: string) => {
  const domain = companyDomain(url);
  return domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null;
};

/** Client-side mirror of the GET /jobs filters, for listings already in the cache. */
export const matchesFilters = (job: JobBrief, filters: JobFilters) =>
  (filters.remote === undefined || job.remote === filters.remote) &&
  (!filters.seniority || job.seniority === filters.seniority) &&
  (filters.max_years === undefined || job.years_min === null || job.years_min <= filters.max_years);
