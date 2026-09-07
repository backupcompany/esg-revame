import * as XLSX from 'xlsx';
import { ESGAction } from '../../../core/types';
import { apiPostForm } from '../../../core/services/api';
import { PLACEHOLDER_IMAGE } from '../../../core/ui/assets';

export function downloadActionCatalogTemplate() {
  const sampleData = [
    {
      'ID Aksi (Opsional)': 'act_sample_01',
      'Pilar (E/S/G)*': 'E',
      'Judul Aksi (Bahasa Indonesia)*': 'Instalasi Sensor Gerak Lampu Otomatis',
      'Judul Aksi (English)': 'Motion Sensor Automated Lighting',
      'Kategori*': 'Efisiensi Energi',
      'Kategori (English)': 'Energy Efficiency',
      'Deskripsi (Bahasa Indonesia)*': 'Pemasangan sensor gerak PIR di ruang penyimpanan dan toilet staf untuk penghematan listrik.',
      'Deskripsi (English)': 'Installation of PIR motion sensors in storage rooms and staff restrooms for energy conservation.',
      'Tingkat Kesulitan (Starter/Moderate/Advanced)*': 'Starter',
      'Estimasi Hari Pengerjaan': 5,
      'Satuan Metrik Dampak*': 'kWh Energi Terhemat / thn',
      'Label Metrik Dampak': 'Energi Terhemat',
      'Nilai Pengali Dampak (Multiplier)': 300,
      'Poin Penghargaan (PTS)*': 90,
      'Tipe Bukti Audit (photo/document/both)*': 'photo',
      'URL Gambar (Opsional)': PLACEHOLDER_IMAGE,
      'Tips Praktis (Pisahkan dengan tanda titik-koma ;)': 'Pilih sensor bergaransi;Uji coba deteksi sudut 180 derajat;Ambil foto instalasi'
    },
    {
      'ID Aksi (Opsional)': 'act_sample_02',
      'Pilar (E/S/G)*': 'S',
      'Judul Aksi (Bahasa Indonesia)*': 'Pemeriksaan Kesehatan Berkala Staf Gudang',
      'Judul Aksi (English)': 'Periodic Health Screening for Warehouse Staff',
      'Kategori*': 'Kesehatan & Keselamatan (K3)',
      'Kategori (English)': 'Health & Safety',
      'Deskripsi (Bahasa Indonesia)*': 'Program medical check-up tahunan bagi staf operasional dan pengemudi logistik.',
      'Deskripsi (English)': 'Annual medical check-up program for warehouse operational staff and logistics drivers.',
      'Tingkat Kesulitan (Starter/Moderate/Advanced)*': 'Starter',
      'Estimasi Hari Pengerjaan': 2,
      'Satuan Metrik Dampak*': 'Karyawan Terperiksa',
      'Label Metrik Dampak': 'Karyawan Terperiksa',
      'Nilai Pengali Dampak (Multiplier)': 25,
      'Poin Penghargaan (PTS)*': 100,
      'Tipe Bukti Audit (photo/document/both)*': 'document',
      'URL Gambar (Opsional)': PLACEHOLDER_IMAGE,
      'Tips Praktis (Pisahkan dengan tanda titik-koma ;)': 'Jadwalkan bergilir agar tidak mengganggu operasional;Simpan rekapitulasi surat keterangan sehat'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 18 }, // ID
    { wch: 12 }, // Pilar
    { wch: 35 }, // Judul ID
    { wch: 35 }, // Judul EN
    { wch: 25 }, // Kategori
    { wch: 25 }, // Kategori EN
    { wch: 45 }, // Deskripsi ID
    { wch: 45 }, // Deskripsi EN
    { wch: 18 }, // Kesulitan
    { wch: 15 }, // Hari
    { wch: 25 }, // Satuan
    { wch: 20 }, // Label
    { wch: 15 }, // Multiplier
    { wch: 12 }, // Poin
    { wch: 18 }, // Tipe Bukti
    { wch: 35 }, // Image URL
    { wch: 45 }  // Tips
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Katalog ESG');

  XLSX.writeFile(workbook, 'Template_Import_Katalog_Aksi_ESG.xlsx');
}

export function exportActionsToExcel(actions: ESGAction[]) {
  const data = actions.map(act => ({
    'ID Aksi (Opsional)': act.id,
    'Pilar (E/S/G)*': act.pillar,
    'Judul Aksi (Bahasa Indonesia)*': act.titleId || act.title,
    'Judul Aksi (English)': act.title,
    'Kategori*': act.categoryId || act.category,
    'Kategori (English)': act.category,
    'Deskripsi (Bahasa Indonesia)*': act.descriptionId || act.description,
    'Deskripsi (English)': act.description,
    'Tingkat Kesulitan (Starter/Moderate/Advanced)*': act.difficulty,
    'Estimasi Hari Pengerjaan': act.estimatedDays,
    'Satuan Metrik Dampak*': act.impactMetricUnitId || act.impactMetricUnit,
    'Label Metrik Dampak': act.impactMetricLabelId || act.impactMetricLabel,
    'Nilai Pengali Dampak (Multiplier)': act.impactMultiplier,
    'Poin Penghargaan (PTS)*': act.points,
    'Tipe Bukti Audit (photo/document/both)*': act.requiredEvidenceType,
    'URL Gambar (Opsional)': act.imageUrl || '',
    'Tips Praktis (Pisahkan dengan tanda titik-koma ;)': (act.practicalTipsId || act.practicalTips || []).join('; ')
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 18 },
    { wch: 8 },
    { wch: 35 },
    { wch: 35 },
    { wch: 25 },
    { wch: 25 },
    { wch: 45 },
    { wch: 45 },
    { wch: 15 },
    { wch: 12 },
    { wch: 25 },
    { wch: 20 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 35 },
    { wch: 50 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Katalog Aksi ESG');

  const filename = `Siloam_ESG_Action_Catalog_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

export async function parseExcelFile(file: File): Promise<Partial<ESGAction>[]> {
  const form = new FormData();
  form.append('file', file);
  const data = await apiPostForm<{ actions: Partial<ESGAction>[] }>('/api/admin/catalog/actions/parse', form);
  if (!data?.actions) throw new Error('Format file tidak valid');
  return data.actions;
}
