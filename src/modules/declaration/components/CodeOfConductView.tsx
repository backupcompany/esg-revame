import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../core/context/AuthContext';
import { BaseCard } from '../../../core/ui/Cards';
import { Button } from '../../../core/ui/Button';
import { ShieldCheck, FileText, CheckCircle2, AlertTriangle, Calendar, Printer, UserCheck } from 'lucide-react';
import { codeOfConductService, CoCVersion } from '../services/codeOfConductService';
import { CodeOfConductDeclaration } from '../types';
import { useLanguage } from '../../../core/context/LanguageContext';
import { BRAND_LOGO } from '../../../core/ui/assets';

export const CodeOfConductView: React.FC = () => {
  const { dbUser, vendor } = useAuth();
  const { isId } = useLanguage();
  const [declarations, setDeclarations] = useState<CodeOfConductDeclaration[]>([]);
  const [latestDecl, setLatestDecl] = useState<CodeOfConductDeclaration | null>(null);
  const [coc, setCoc] = useState<CoCVersion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [signerName, setSignerName] = useState(dbUser?.name || '');
  const [signerTitle, setSignerTitle] = useState('');
  const [signerAddress, setSignerAddress] = useState(vendor?.address || '');
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    if (vendor?.address) setSignerAddress(vendor.address);
    if (dbUser?.name && !signerName) setSignerName(dbUser.name);
  }, [vendor, dbUser]);

  const loadData = async () => {
    setIsLoading(true);
    const [list, latest, version] = await Promise.all([
      codeOfConductService.getDeclarations(),
      codeOfConductService.getLatestDeclarationForVendor(),
      codeOfConductService.getCurrentVersion()
    ]);
    setDeclarations(list);
    setLatestDecl(latest);
    setCoc(version);
    if (latest) {
      setSignerName(latest.signerName);
      setSignerTitle(latest.signerTitle);
      setSignerAddress(latest.signerAddress);
      setSignatureConfirmed(false);
    }
    setIsLoading(false);
  };

  const handleSubmitDeclaration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!vendor?.id) {
      setErrorMsg('Akun belum terhubung ke vendor. Hubungi admin Siloam.');
      return;
    }
    if (!signatureConfirmed) {
      alert('Mohon centang persetujuan Surat Pernyataan Kode Etik Pemasok Siloam.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newDecl = await codeOfConductService.saveDeclaration({
        signerName,
        signerTitle,
        signerAddress,
        signatureConfirmed: true
      });
      setLatestDecl(newDecl);
      setDeclarations(await codeOfConductService.getDeclarations());
      setSuccessMsg('Surat Pernyataan Kode Etik Pemasok berhasil ditandatangani dan diregistrasi secara resmi!');
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menandatangani Kode Etik.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-left">
      {/* Header Banner */}
      <BaseCard padding="lg" className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white border-none shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3 mb-2">
              <img
                src={BRAND_LOGO}
                alt="Siloam Hospitals"
                className="h-8 w-auto bg-white/90 p-1 rounded-lg"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
              <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-md text-xs font-bold uppercase tracking-wider text-emerald-100">
                Siloam Governance & Compliance
              </span>
            </div>
            <h1 className="text-2xl font-black">
              {isId ? (coc?.titleId || 'Surat Pernyataan Kode Etik Pemasok') : (coc?.titleEn || 'Supplier Code of Conduct Declaration')}
            </h1>
            <p className="text-xs text-emerald-100 max-w-xl">
              {isId
                ? 'Kepatuhan berkala terhadap Kebijakan Pengadaan Berkelanjutan, Anti-Korupsi, Konflik Kepentingan, dan Prinsip-Prinsip ESG Siloam Hospitals Group.'
                : 'Periodic compliance with Siloam Hospitals Group Sustainable Procurement, anti-corruption, conflict of interest, and ESG principles.'}
              {coc?.version ? ` · ${coc.version}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handlePrint}
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Cetak / PDF
            </Button>
          </div>
        </div>
      </BaseCard>

      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Status Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Status Kepatuhan</span>
            <span className={`text-sm font-extrabold ${
              latestDecl?.status === 'active'
                ? 'text-emerald-600 dark:text-emerald-400'
                : latestDecl?.status === 'pending_renewal'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-700 dark:text-slate-200'
            }`}>
              {latestDecl?.status === 'active'
                ? (isId ? 'Aktif & Terverifikasi (Valid)' : 'Active & Verified')
                : latestDecl?.status === 'pending_renewal'
                  ? (isId ? 'Perlu Pembaruan Versi' : 'Renewal required')
                  : latestDecl
                    ? (isId ? 'Kedaluwarsa' : 'Expired')
                    : (isId ? 'Belum Ditandatangani' : 'Not signed')}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-teal-50 dark:bg-teal-950 text-teal-600 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tanggal Pembaruan Terakhir</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
              {latestDecl ? new Date(latestDecl.declaredDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Masa Berlaku Berkala</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
              {latestDecl ? new Date(latestDecl.validUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '1 Tahun (Wajib Berkala)'}
            </span>
          </div>
        </div>
      </div>

      {/* Official Legal Document Content */}
      <BaseCard padding="lg" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-6 space-y-2">
          <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-100">
            {isId ? (coc?.titleId || 'SURAT PERNYATAAN KODE ETIK PEMASOK') : (coc?.titleEn || 'SUPPLIER CODE OF CONDUCT')}
          </h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            PT Siloam International Hospitals Tbk dan/atau Anak Perusahaannya ("Siloam Hospitals Group")
          </p>
        </div>

        {/* Preamble / Signer details input */}
        <div className="space-y-4 bg-slate-50 dark:bg-slate-800/60 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
          <h3 className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            Identitas Penandatangan / Pemasok
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nama Lengkap Wakil Pemasok</label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Masukkan nama lengkap..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Jabatan</label>
              <input
                type="text"
                value={signerTitle}
                onChange={(e) => setSignerTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="cth: Direktur Utama"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Alamat Perusahaan / Pemasok</label>
              <input
                type="text"
                value={signerAddress}
                onChange={(e) => setSignerAddress(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Masukkan alamat lengkap..."
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 italic mt-2">
            Selanjutnya disebut sebagai <span className="font-bold text-slate-700 dark:text-slate-300">("Pemasok")</span>, sehubungan dengan kerjasama antara Pemasok dengan PT Siloam International Hospitals Tbk dan/atau anak perusahaannya ("Siloam Hospitals Group").
          </p>
        </div>

        {/* Clauses from current CoC version */}
        <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
          {(coc?.clauses || []).map(clause => (
            <div key={clause.id} className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs">
                  {clause.id}
                </span>
                {isId ? clause.titleId : clause.titleEn}
              </h4>
              <p className="pl-8 text-slate-600 dark:text-slate-400 whitespace-pre-line">
                {isId ? clause.bodyId : clause.bodyEn}
              </p>
            </div>
          ))}
        </div>

        {/* Signature Box & Submission */}
        <form onSubmit={handleSubmitDeclaration} className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6">
          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-start space-x-3">
            <input
              type="checkbox"
              id="agreeCheck"
              checked={signatureConfirmed}
              onChange={(e) => setSignatureConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
            />
            <label htmlFor="agreeCheck" className="text-xs text-slate-800 dark:text-slate-200 font-semibold cursor-pointer select-none">
              Saya menyatakan bahwa saya memiliki kewenangan penuh untuk mewakili Pemasok di atas, dan dengan ini menyetujui seluruh ketentuan dalam Surat Pernyataan Kode Etik Pemasok Siloam Hospitals Group secara sadar dan tanpa paksaan.
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              * Penandatanganan berkala ini berlaku untuk periode 1 (satu) tahun ke depan.
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !signatureConfirmed || !vendor?.id}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>{isSubmitting ? 'Menyimpan & Mendaftarkan...' : 'Tandatangani & Daftarkan Deklarasi'}</span>
            </Button>
          </div>
        </form>

        {/* QR Code Approval Proof Section */}
        {latestDecl && (
          <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl">
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-md">
                  Bukti Approval Resmi (Verified CoC)
                </span>
                <span className="text-xs text-slate-500">ID: {latestDecl.id}</span>
              </div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                Ditandatangani Secara Elektronik oleh {latestDecl.signerName} ({latestDecl.signerTitle})
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md">
                ID bukti di samping merujuk ke deklarasi Kode Etik yang tersimpan di server Siloam. Auditor mencocokkan ID ini pada cetakan atau grid admin.
              </p>
              <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                Masa Berlaku s.d. {new Date(latestDecl.validUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col items-center justify-center shrink-0 min-w-[9rem]">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">ID bukti</span>
              <span className="text-sm font-mono font-bold text-slate-800 mt-1 text-center break-all">{latestDecl.id}</span>
              <span className="text-[10px] text-slate-500 mt-2 tracking-tight">Cetak halaman ini untuk auditor</span>
            </div>
          </div>
        )}
      </BaseCard>

      {/* History / Previous Declarations List */}
      {declarations.length > 0 && (
        <BaseCard padding="lg" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" /> Riwayat Deklarasi Kode Etik Pemasok
          </h3>
          <div className="space-y-3">
            {declarations.map(dec => (
              <div key={dec.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{dec.vendorName}</span>
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded">
                      Versi {dec.version}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Ditandatangani oleh: <strong className="text-slate-700 dark:text-slate-300">{dec.signerName}</strong> ({dec.signerTitle})
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Tanggal: {new Date(dec.declaredDate).toLocaleString()} | Berlaku s.d. {new Date(dec.validUntil).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-1 font-bold text-xs rounded-lg ${
                    dec.status === 'active'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : dec.status === 'pending_renewal'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {dec.status === 'active' ? 'Aktif' : dec.status === 'pending_renewal' ? 'Perlu Pembaruan' : 'Kedaluwarsa'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </BaseCard>
      )}
    </div>
  );
};
