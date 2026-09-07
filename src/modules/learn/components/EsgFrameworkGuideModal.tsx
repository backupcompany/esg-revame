import React, { useState } from 'react';
import { Modal } from '../../../core/ui/FeedbackStates';
import { Button } from '../../../core/ui/Button';
import {
  Compass,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Search,
  Sparkles,
  Award,
  ChevronRight,
  Building2,
  FileCheck
} from 'lucide-react';

interface EsgFrameworkGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExploreActions?: () => void;
}

export const EsgFrameworkGuideModal: React.FC<EsgFrameworkGuideModalProps> = ({
  isOpen,
  onClose,
  onExploreActions
}) => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      stepNumber: '1',
      code: 'P',
      title: 'Pioneer Basics (Pahami ESG Praktis)',
      subtitle: 'Memahami ESG dari Sudut Pandang Efisiensi & Kepatuhan Bisnis',
      icon: <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      color: 'from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-800',
      summary: 'Bagi mitra vendor, ESG bukan tentang membuat laporan tebal ratusan halaman, melainkan tentang menjalankan bisnis yang hemat biaya, aman bagi pekerja, dan bebas korupsi.',
      keyTakeaways: [
        'E (Environmental): Kurangi pemborosan listrik, BBM kendaraan, dan limbah plastik.',
        'S (Social): Lindungi keselamatan kerja staf (K3), pastikan upah layak & BPJS aktif.',
        'G (Governance): Patuhi etika bebas suap/gratifikasi dan amankan kerahasiaan data.'
      ],
      practicalExample: 'Contoh: Mematikan komputer dan AC saat ruangan kosong langsung memangkas 15% tagihan listrik kantor Anda.'
    },
    {
      stepNumber: '2',
      code: 'L',
      title: 'Locate Impact (Petakan Titik Pemborosan)',
      subtitle: 'Identifikasi Titik Biaya & Risiko Operasional Terbesar di Perusahaan Anda',
      icon: <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      color: 'from-blue-500/10 to-indigo-500/10 border-blue-200 dark:border-blue-800',
      summary: 'Setiap sektor usaha memiliki titik hotspot berbeda. Temukan 1-2 area yang paling mudah diperbaiki dalam 30 hari pertama tanpa modal besar (Quick-Wins).',
      keyTakeaways: [
        'Vendor Logistik: Periksa tekanan ban, kebiasaan idle sopir, dan efisiensi rute.',
        'Vendor Katering/F&B: Pisahkan sisa makanan dan ganti wadah plastik ke paper kraft.',
        'Vendor Jasa/Kebersihan: Pastikan APD lengkap dan lembar MSDS kimia terpasang.',
        'Vendor IT/Konsultan: Hentikan cetak kertas kwitansi dan gunakan e-invoicing.'
      ],
      practicalExample: 'Contoh: Lakukan audit tagihan listrik dan BBM 3 bulan terakhir sebagai dasar baseline penghematan.'
    },
    {
      stepNumber: '3',
      code: 'A',
      title: 'Action Commitment (Pilih Inisiatif di Katalog)',
      subtitle: 'Ambil Komitmen Nyata di Katalog Aksi ESG Siloam Hospitals',
      icon: <Compass className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      color: 'from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-800',
      summary: 'Gunakan Katalog Aksi ESG Siloam untuk memilih inisiatif yang sesuai dengan kapabilitas tim. Mulai dari level "Starter" yang bisa diselesaikan dalam hitungan hari.',
      keyTakeaways: [
        'Pilih inisiatif berlabel "Starter" untuk kemenangan cepat (quick-win).',
        'Pelajari langkah panduan praktis (Practical Tips) yang disediakan di kartu aksi.',
        'Tentukan target kuantitas yang ingin dilaporkan (misal: 100% lampu LED atau 30 staf terlatih).'
      ],
      practicalExample: 'Contoh: Ambil aksi "Transisi E-Invoicing & Penagihan Digital" untuk menghilangkan biaya cetak kertas dan kurir penagihan.'
    },
    {
      stepNumber: '4',
      code: 'N',
      title: 'Navigate Evidence (Dokumentasikan Bukti Audit)',
      subtitle: 'Kumpulkan Bukti Foto atau Dokumen Sah untuk Verifikasi',
      icon: <FileCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      color: 'from-purple-500/10 to-fuchsia-500/10 border-purple-200 dark:border-purple-800',
      summary: 'Auditor ESG Siloam memverifikasi setiap klaim aksi berdasarkan bukti otentik. Pastikan dokumentasi dibuat sebelum dan sesudah implementasi.',
      keyTakeaways: [
        'Bukti Foto: Foto sebelum dan sesudah pemasangan (misal: bohlam lama vs lampu LED terpasang).',
        'Bukti Dokumen: Invoice pembelian, sertifikat pelatihan K3, atau SOP bertandatangan direksi.',
        'Upload langsung melalui portal untuk evaluasi AI otomatis & verifikasi tim audit.'
      ],
      practicalExample: 'Contoh: Ambil foto absensi briefing keselamatan kerja K3 dan upload langsung lewat menu Komitmen Saya.'
    },
    {
      stepNumber: '5',
      code: 'S',
      title: 'Scale (Raih Lencana & Naikkan Peringkat)',
      subtitle: 'Kumpulkan SG-PTS, naikkan kematangan, dan tampilkan dampak terverifikasi',
      icon: <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      color: 'from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-800',
      summary: 'Setiap aksi yang terverifikasi menambah skor ESG dan peringkat kematangan (Bronze, Silver, Gold, Champion). Klaim prioritas tender bersifat aspirasional sampai ada kontrak data dengan procurement.',
      keyTakeaways: [
        'Dapatkan Micro-Credential dari Siloam ESG Academy setelah modul selesai.',
        'SG-PTS adalah skor internal program — bukan sertifikasi GRI/CSRD.',
        'Kisah sukses mitra berpeluang diliput di Buletin ESG Horizon.'
      ],
      practicalExample: 'Contoh: Selesaikan aksi, unggah bukti, lalu pantau level kematangan di profil vendor.'
    }
  ];

  const current = steps[activeStep];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="3xl"
      title="Panduan Praktis: Bagaimana Menerapkan ESG di Perusahaan Saya"
    >
      <div className="space-y-6 text-left">
        {/* Intro Tagline */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Building2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-xs text-slate-600 dark:text-slate-300">
            <strong>Framework P-L-A-N-S Siloam</strong> dirancang khusus agar mudah dipahami dan langsung dapat diterapkan oleh seluruh sektor usaha mitra (logistik, katering, kebersihan, IT, hingga jasa medis).
          </p>
        </div>

        {/* 5-Step Horizontal Tab Navigator */}
        <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
          {steps.map((s, idx) => {
            const isActive = activeStep === idx;
            return (
              <button
                key={s.code}
                onClick={() => setActiveStep(idx)}
                className={`py-2 px-1 rounded-lg text-xs font-bold transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-emerald-500/20'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span className="text-[10px] uppercase tracking-wider opacity-70">Langkah {s.stepNumber}</span>
                <span className="font-extrabold text-sm">{s.code}</span>
              </button>
            );
          })}
        </div>

        {/* Active Step Content Card */}
        <div className={`p-5 rounded-2xl border bg-gradient-to-br ${current.color} space-y-4 transition-all duration-300`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-xs flex items-center justify-center border border-slate-200 dark:border-slate-800 shrink-0">
                {current.icon}
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Langkah {current.stepNumber} dari 5
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {current.title}
                </h3>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
            {current.summary}
          </p>

          {/* Key Actionable Checkpoints */}
          <div className="space-y-2 bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider block">
              Poin Penting Pelaksanaan:
            </span>
            <ul className="space-y-1.5">
              {current.keyTakeaways.map((item, i) => (
                <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Practical Real-World Example */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <span className="font-bold shrink-0">💡 Contoh Lapangan:</span>
            <span>{current.practicalExample}</span>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {activeStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
              >
                Kembali
              </Button>
            )}
            {activeStep < steps.length - 1 ? (
              <Button
                variant="primary"
                size="sm"
                icon={<ArrowRight className="w-4 h-4" />}
                onClick={() => setActiveStep(prev => Math.min(steps.length - 1, prev + 1))}
              >
                Lanjut Langkah {activeStep + 2}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={onClose}
              >
                Saya Paham, Mulai Belajar!
              </Button>
            )}
          </div>

          {onExploreActions && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Compass className="w-4 h-4 text-emerald-600" />}
              onClick={() => {
                onClose();
                onExploreActions();
              }}
            >
              Lihat Katalog Aksi Terkait
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
