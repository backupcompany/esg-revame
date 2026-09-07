import { PLACEHOLDER_IMAGE } from '../../../core/ui/assets';

export interface CuratedImagePreset {
  id: string;
  title: string;
  category: string;
  url: string;
  description: string;
}

export const CURATED_IMAGE_LIBRARY: CuratedImagePreset[] = [
  {
    id: 'img_green_hospital_facade',
    title: 'Gedung Rumah Sakit Hijau Modern',
    category: 'Rumah Sakit & Fasilitas',
    url: PLACEHOLDER_IMAGE,
    description: 'Arsitektur fasilitas medis modern berorientasi hemat energi dan pencahayaan alami.'
  },
  {
    id: 'img_hospital_solar_rooftop',
    title: 'Panel Surya Rooftop Fasilitas Medis',
    category: 'Energi Bersih',
    url: PLACEHOLDER_IMAGE,
    description: 'Instalasi solar photovoltaic di atap fasilitas untuk suplai energi bersih mandiri.'
  },
  {
    id: 'img_medical_green_logistics',
    title: 'Gudang Logistik Medis Ramah Lingkungan',
    category: 'Logistik & Cold Chain',
    url: PLACEHOLDER_IMAGE,
    description: 'Distribusi obat dan alkes dengan optimalisasi rute dan kemasan sirkular bebas plastik.'
  },
  {
    id: 'img_healthcare_professionals_team',
    title: 'Tenaga Medis & Standar K3 Kolaboratif',
    category: 'Sosial & K3',
    url: PLACEHOLDER_IMAGE,
    description: 'Pelatihan keselamatan kerja (K3) dan jaminan lingkungan kerja adil bagi seluruh staf ekosistem.'
  },
  {
    id: 'img_clean_laboratory_innovation',
    title: 'Inovasi Farmasi & Kemasan Biodegradable',
    category: 'Sirkularitas & Farmasi',
    url: PLACEHOLDER_IMAGE,
    description: 'Penyimpanan obat dan bahan farmasi dengan pendingin berefisiensi tinggi ramah ozon.'
  },
  {
    id: 'img_healing_garden_nature',
    title: 'Taman Penyembuhan (Healing Sanctuary)',
    category: 'Konservasi & Alam',
    url: PLACEHOLDER_IMAGE,
    description: 'Ruang terbuka hijau di lingkungan rumah sakit untuk terapi pemulihan pasien dan biodiversitas.'
  },
  {
    id: 'img_clean_water_filtration',
    title: 'Sistem Daur Ulang & Penghematan Air Bersih',
    category: 'Konservasi & Alam',
    url: PLACEHOLDER_IMAGE,
    description: 'Instalasi pengolahan air limbah domestik (STP) menjadi air guna ulang non-medis.'
  },
  {
    id: 'img_digital_smart_dashboard',
    title: 'Dashboard Digital Pemantauan Emisi Karbon',
    category: 'Tata Kelola & Data',
    url: PLACEHOLDER_IMAGE,
    description: 'Transformasi paperless invoicing dan audit keterlacakan data rantai pasok secara real-time.'
  }
];
