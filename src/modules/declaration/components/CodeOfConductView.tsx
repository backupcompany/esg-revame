import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../core/context/AuthContext';
import { codeOfConductService, CoCVersion } from '../services/codeOfConductService';
import { CodeOfConductDeclaration } from '../types';
import { useLanguage } from '../../../core/context/LanguageContext';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

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
    if (!vendor?.id && !dbUser?.vendorId) {
      setErrorMsg(isId ? 'Akun ini belum terhubung ke perusahaan, jadi belum bisa tanda tangan.' : 'This account is not linked to a company yet, so it cannot sign.');
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

  const statusLabel = latestDecl?.status === 'active'
    ? (isId ? 'Sudah ditandatangani' : 'Signed')
    : latestDecl?.status === 'pending_renewal'
      ? (isId ? 'Perlu diperbarui' : 'Needs renewal')
      : latestDecl
        ? (isId ? 'Kedaluwarsa' : 'Expired')
        : (isId ? 'Belum ditandatangani' : 'Not signed');

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-left">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            {isId ? 'Kode etik pemasok' : 'Supplier code of conduct'}
          </h1>
          <p className="mt-2 text-sm text-slate-900 dark:text-white">
            {statusLabel}
            {coc?.version ? ` · ${coc.version}` : ''}
            {' · '}
            {latestDecl
              ? new Date(latestDecl.declaredDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
              : (isId ? 'Berlaku 1 tahun setelah tanda tangan' : 'Valid for 1 year after signing')}
          </p>
        </div>
        <button type="button" onClick={handlePrint} className="shrink-0 text-sm font-medium text-slate-800 dark:text-white cursor-pointer">
          {isId ? 'Cetak' : 'Print'}
        </button>
      </header>

      {errorMsg && <p className="text-sm text-rose-600">{errorMsg}</p>}

      {latestDecl?.status === 'active' ? (
        <div className="space-y-1 border-t border-slate-300 pt-6 dark:border-slate-800">
          <p className="text-sm text-emerald-500">{isId ? 'Aktif' : 'Active'}</p>
          <p className="text-2xl font-semibold">{latestDecl.signerName}</p>
          <p className="text-lg italic text-slate-600 dark:text-slate-300">{latestDecl.signerTitle}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">{latestDecl.signerAddress}</p>
          <p className="pt-2 text-sm">
            {isId ? 'Berlaku sampai' : 'Valid until'}{' '}
            <span className="font-semibold text-emerald-500">
              {new Date(latestDecl.validUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </p>
        </div>
      ) : (
      <form onSubmit={handleSubmitDeclaration} className="space-y-4">
        <label className="block text-sm">
          <span className="text-slate-900 dark:text-white">{isId ? 'Nama penandatangan' : 'Signer name'}</span>
          <input value={signerName} onChange={e => setSignerName(e.target.value)} className="mt-1 w-full border-b border-slate-400 dark:border-slate-300 bg-transparent py-2 text-base text-slate-900 dark:text-white outline-none" />
        </label>
        <label className="block text-sm">
          <span className="text-slate-900 dark:text-white">{isId ? 'Jabatan' : 'Title'}</span>
          <input value={signerTitle} onChange={e => setSignerTitle(e.target.value)} className="mt-1 w-full border-b border-slate-400 dark:border-slate-300 bg-transparent py-2 text-base text-slate-900 dark:text-white outline-none" />
        </label>
        <label className="block text-sm">
          <span className="text-slate-900 dark:text-white">{isId ? 'Alamat perusahaan' : 'Company address'}</span>
          <input value={signerAddress} onChange={e => setSignerAddress(e.target.value)} className="mt-1 w-full border-b border-slate-400 dark:border-slate-300 bg-transparent py-2 text-base text-slate-900 dark:text-white outline-none" />
        </label>

        <button type="button" onClick={() => setRulesOpen(o => !o)} className="text-sm font-medium text-emerald-700 dark:text-emerald-300 cursor-pointer underline">
          {rulesOpen ? (isId ? 'Tutup aturan' : 'Hide the rules') : (isId ? 'Baca aturan dulu' : 'Read the rules first')}
        </button>
        {rulesOpen && (
          <div className="space-y-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <p className="text-slate-500">
              PT Siloam International Hospitals Tbk dan anak perusahaannya. Pemasok adalah pihak yang identitasnya diisi di atas.
            </p>
            {(coc?.clauses || []).map(clause => (
              <div key={clause.id}>
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">{clause.id}. {isId ? clause.titleId : clause.titleEn}</h2>
                <p className="mt-1 whitespace-pre-line">{isId ? clause.bodyId : clause.bodyEn}</p>
              </div>
            ))}
          </div>
        )}

        <label className="flex items-start gap-3 text-sm text-slate-900 dark:text-white cursor-pointer">
          <input type="checkbox" checked={signatureConfirmed} onChange={e => setSignatureConfirmed(e.target.checked)} className="mt-1" />
          <span>{isId ? 'Saya berwenang mewakili pemasok dan menyetujui aturan ini tanpa paksaan.' : 'I am authorized to sign for the supplier and I agree to these rules.'}</span>
        </label>
        <button type="submit" disabled={isSubmitting} className="cursor-pointer rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {isSubmitting ? (isId ? 'Menyimpan…' : 'Saving…') : (isId ? 'Tandatangani' : 'Sign')}
        </button>
        <p className="text-sm text-slate-900 dark:text-white">{isId ? 'Berlaku satu tahun ke depan.' : 'Valid for the next year.'}</p>
      </form>
      )}

      {declarations.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold">{isId ? 'Riwayat' : 'History'}</h2>
          <ul className="mt-2 divide-y divide-slate-200 dark:divide-slate-800 text-sm">
            {declarations.map(dec => (
              <li key={dec.id} className="py-3">
                {dec.signerName} · {dec.version} · {dec.status === 'active' ? (isId ? 'Aktif' : 'Active') : dec.status === 'pending_renewal' ? (isId ? 'Perlu diperbarui' : 'Renew') : (isId ? 'Kedaluwarsa' : 'Expired')}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );

};
