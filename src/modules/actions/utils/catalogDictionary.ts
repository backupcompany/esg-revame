import { ESGPillar } from '../../../core/types';
import { apiGet } from '../../../core/services/api';

export interface CategoryMasterDefinition {
  id: string;
  nameId: string;
  nameEn: string;
  pillar: ESGPillar;
  defaultMetricUnitId: string;
  defaultMetricUnitEn: string;
  defaultMetricLabelId: string;
  defaultMetricLabelEn: string;
  iconName: string;
  sdgs: number[];
  griStandards: string[];
  pojkCategory: string;
  isoReference?: string;
  defaultTipsId: string[];
  defaultTipsEn: string[];
}

export let MASTER_CATEGORIES: CategoryMasterDefinition[] = [];

let loadOnce: Promise<CategoryMasterDefinition[]> | null = null;

export async function loadMasterCategories(): Promise<CategoryMasterDefinition[]> {
  if (MASTER_CATEGORIES.length) return MASTER_CATEGORIES;
  if (!loadOnce) {
    loadOnce = apiGet<{ categories: CategoryMasterDefinition[] }>('/api/catalog/categories').then(data => {
      MASTER_CATEGORIES = data?.categories ?? [];
      if (!MASTER_CATEGORIES.length) loadOnce = null;
      return MASTER_CATEGORIES;
    });
  }
  return loadOnce;
}

export const MASTER_DIFFICULTIES = [
  { value: 'Starter', labelId: 'Starter (Dasar - Cepat Diterapkan)', labelEn: 'Starter (Low Barrier / Fast Win)' },
  { value: 'Moderate', labelId: 'Moderate (Menengah - Butuh Prosedur)', labelEn: 'Moderate (Standard SOP Required)' },
  { value: 'Advanced', labelId: 'Advanced (Lanjutan - Butuh Investasi/Audit)', labelEn: 'Advanced (Capital / Audit Required)' }
];

export const MASTER_EVIDENCE_TYPES = [
  { value: 'photo', labelId: 'Foto Dokumentasi Lapangan', labelEn: 'On-Site Photo Evidence' },
  { value: 'document', labelId: 'Dokumen / Laporan / Sertifikat', labelEn: 'Report / Certificate Document' },
  { value: 'both', labelId: 'Keduanya (Foto Lapangan + Dokumen Laporan)', labelEn: 'Both (Photo + Official Document)' }
];

export const SILOAM_PTS_METRIC_INFO = {
  acronym: 'SG-PTS',
  fullNameId: 'Siloam Green Supply Points',
  fullNameEn: 'Siloam Green Supply Points',
  taglineId: 'Indeks Penilaian & Insentif Rantai Pasok Berkelanjutan Siloam Hospitals',
  taglineEn: 'Siloam Hospitals Sustainable Supply Chain Incentive & Benchmark Index',
  disclaimerId:
    'Siloam Green Supply Points (SG-PTS) adalah skor internal program ESG Siloam, diselaraskan dengan GRI dan POJK 51/2017. Dipakai untuk mengukur engagement keberlanjutan dan klasifikasi level kemitraan (Starter, Bronze, Silver, Gold, Champion). Bukan sertifikasi karbon atau akreditasi pihak ketiga. Klaim prioritas tender bersifat aspirasional sampai ada kontrak data dengan procurement.',
  disclaimerEn:
    'Siloam Green Supply Points (SG-PTS) is an internal Siloam ESG program score, referenced against GRI and POJK 51/2017. It measures vendor sustainability engagement and partnership level (Starter, Bronze, Silver, Gold, Champion). Siloam is not a third-party carbon accreditor. Tender-preference claims are aspirational until procurement signs a data contract.',
  frameworkReferences: [
    {
      name: 'UN SDGs (Sustainable Development Goals)',
      scope: 'Agenda 2030 PBB untuk pembangunan berkelanjutan global.',
      code: 'SDG 3, 7, 8, 12, 13, 16',
      badge: 'UN Global Compact'
    },
    {
      name: 'GRI Standards (Global Reporting Initiative)',
      scope: 'Standar keterbukaan pelaporan keberlanjutan internasional terlengkap di dunia.',
      code: 'GRI 205, 302, 303, 305, 306, 403, 405',
      badge: 'GRI Aligned'
    },
    {
      name: 'POJK No. 51 / POJK.03 / 2017 (OJK Indonesia)',
      scope: 'Regulasi resmi OJK RI tentang Penerapan Keuangan Berkelanjutan & Tanggung Jawab Sosial Lingkungan bagi Emiten & Rantai Pasok.',
      code: 'POJK 51/2017 Lampiran II',
      badge: 'Regulasi OJK RI'
    },
    {
      name: 'GHG Protocol Scope 3 Guidance',
      scope: 'Standar akuntansi emisi gas rumah kaca untuk rantai pasok dan logistik pihak ketiga.',
      code: 'GHG Protocol Cat. 1, 4, 5',
      badge: 'Scope 3 Supply Chain'
    }
  ]
};

export function findMasterCategory(categoryNameOrId: string): CategoryMasterDefinition | undefined {
  if (!categoryNameOrId) return undefined;
  const lower = categoryNameOrId.toLowerCase().trim();
  return MASTER_CATEGORIES.find(
    c =>
      c.id.toLowerCase() === lower ||
      c.nameId.toLowerCase() === lower ||
      c.nameEn.toLowerCase() === lower ||
      c.nameId.toLowerCase().includes(lower) ||
      c.nameEn.toLowerCase().includes(lower)
  );
}

export function resolveCategoryBilingual(idOrName: string) {
  const match = findMasterCategory(idOrName);
  if (match) {
    return {
      categoryId: match.nameId,
      category: match.nameEn,
      pillar: match.pillar,
      metricUnitId: match.defaultMetricUnitId,
      metricUnitEn: match.defaultMetricUnitEn,
      metricLabelId: match.defaultMetricLabelId,
      metricLabelEn: match.defaultMetricLabelEn,
      iconName: match.iconName,
      sdgs: match.sdgs,
      griStandards: match.griStandards,
      pojkCategory: match.pojkCategory,
      defaultTipsId: match.defaultTipsId,
      defaultTipsEn: match.defaultTipsEn
    };
  }
  return null;
}
