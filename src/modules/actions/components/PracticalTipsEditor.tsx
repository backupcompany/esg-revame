import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Lightbulb, Sparkles, Check, Globe } from 'lucide-react';
import { Button } from '../../../core/ui/Button';

export interface PracticalTipItem {
  id: string;
  textId: string;
  textEn: string;
}

interface PracticalTipsEditorProps {
  tipsId: string[];
  tipsEn: string[];
  onChange: (tipsId: string[], tipsEn: string[]) => void;
  onLoadCategoryDefaults?: () => void;
  categoryName?: string;
  lang?: 'ID' | 'EN';
}

export const PracticalTipsEditor: React.FC<PracticalTipsEditorProps> = ({
  tipsId = [],
  tipsEn = [],
  onChange,
  onLoadCategoryDefaults,
  categoryName,
  lang = 'ID',
}) => {
  const isId = lang === 'ID';

  // Normalize paired arrays
  const maxLength = Math.max(tipsId.length, tipsEn.length, 1);
  const items: PracticalTipItem[] = Array.from({ length: maxLength }).map((_, index) => ({
    id: `tip_${index}`,
    textId: tipsId[index] || '',
    textEn: tipsEn[index] || '',
  }));

  const handleUpdateItem = (index: number, field: 'textId' | 'textEn', value: string) => {
    const newTipsId = [...tipsId];
    const newTipsEn = [...tipsEn];

    // Ensure array is long enough
    while (newTipsId.length <= index) newTipsId.push('');
    while (newTipsEn.length <= index) newTipsEn.push('');

    if (field === 'textId') {
      newTipsId[index] = value;
    } else {
      newTipsEn[index] = value;
    }

    onChange(newTipsId, newTipsEn);
  };

  const handleAddItem = () => {
    const newTipsId = [...tipsId, ''];
    const newTipsEn = [...tipsEn, ''];
    onChange(newTipsId, newTipsEn);
  };

  const handleRemoveItem = (index: number) => {
    if (maxLength <= 1) {
      // Don't remove if only 1, just clear it
      onChange([''], ['']);
      return;
    }
    const newTipsId = tipsId.filter((_, i) => i !== index);
    const newTipsEn = tipsEn.filter((_, i) => i !== index);
    onChange(newTipsId, newTipsEn);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newTipsId = [...tipsId];
    const newTipsEn = [...tipsEn];

    // Ensure lengths
    while (newTipsId.length < items.length) newTipsId.push('');
    while (newTipsEn.length < items.length) newTipsEn.push('');

    const tempId = newTipsId[index];
    newTipsId[index] = newTipsId[targetIndex];
    newTipsId[targetIndex] = tempId;

    const tempEn = newTipsEn[index];
    newTipsEn[index] = newTipsEn[targetIndex];
    newTipsEn[targetIndex] = tempEn;

    onChange(newTipsId, newTipsEn);
  };

  return (
    <div className="space-y-3 p-3.5 bg-amber-50/40 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/50 dark:border-amber-900/30 pb-2.5">
        <div>
          <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            {isId ? 'Panduan Langkah Praktis & Tips Implementasi' : 'Practical Steps & Implementation Tips'}
          </h4>
          <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80 mt-0.5">
            {isId
              ? 'Langkah operasional konkret untuk memandu mitra vendor mengeksekusi aksi ini dengan mudah.'
              : 'Actionable steps guiding vendor teams to execute and verify this sustainability action.'}
          </p>
        </div>

        {onLoadCategoryDefaults && (
          <button
            type="button"
            onClick={onLoadCategoryDefaults}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-amber-900 dark:text-amber-200 bg-amber-100 hover:bg-amber-200/80 dark:bg-amber-900/50 dark:hover:bg-amber-900/80 rounded-lg transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            {isId ? 'Muat Template Rekomendasi Kategori' : 'Load Category Default Tips'}
          </button>
        )}
      </div>

      {/* List of Tip Items */}
      <div className="space-y-2.5">
        {items.map((item, index) => (
          <div
            key={index}
            className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 relative"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-bold rounded-md text-[11px]">
                <span>Langkah #{index + 1}</span>
              </span>

              <div className="flex items-center gap-1">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => handleMove(index, 'up')}
                    title="Pindah ke Atas"
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                )}
                {index < items.length - 1 && (
                  <button
                    type="button"
                    onClick={() => handleMove(index, 'down')}
                    title="Pindah ke Bawah"
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  title="Hapus Langkah"
                  className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Bilingual Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span>🇮🇩 Bahasa Indonesia *</span>
                </label>
                <textarea
                  rows={2}
                  required={index === 0}
                  value={item.textId}
                  onChange={e => handleUpdateItem(index, 'textId', e.target.value)}
                  placeholder={`cth: Langkah ${index + 1} - Lakukan pengecekan berkala...`}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span>🇬🇧 English Translation</span>
                </label>
                <textarea
                  rows={2}
                  value={item.textEn}
                  onChange={e => handleUpdateItem(index, 'textEn', e.target.value)}
                  placeholder={`e.g. Step ${index + 1} - Conduct routine checks...`}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleAddItem}
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          {isId ? '+ Tambah Langkah Tips' : '+ Add Another Tip'}
        </Button>
        <span className="text-[11px] text-slate-400">
          {items.length} {isId ? 'langkah panduan terdaftar' : 'step tips defined'}
        </span>
      </div>
    </div>
  );
};
