import React, { useEffect, useRef, useState } from 'react';
import { SustainabilityGalleryItem } from '../types';
import { TracingBeam } from '../../../components/ui/tracing-beam';

export const SustainabilityGallery: React.FC<{ items: SustainabilityGalleryItem[] }> = ({ items }) => {
  const [index, setIndex] = useState<number | null>(null);
  const scroll = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (index === null) return;
    const el = document.getElementById(`gal-${index}`);
    if (el && scroll.current) scroll.current.scrollTo({ top: Math.max(0, el.offsetTop - 56) });
  }, [index]);

  return (
    <section id="galeri" className="space-y-2 text-left">
      <h2 className="text-3xl font-semibold tracking-tight">Galeri</h2>
      <p className="text-sm italic text-[var(--ep-sub)]">Fasilitas dan perubahan yang sudah jalan.</p>
      <div>
        {items.slice(0, 2).map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setIndex(items.indexOf(item))}
            className="block w-full cursor-pointer border-b border-white/10 py-5 text-left"
          >
            <p className="text-sm text-[var(--ep-primary)]">{item.category} · {item.year}</p>
            <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
            <p className="mt-1 text-sm italic text-[var(--ep-sub)]">{item.hospitalUnit}</p>
          </button>
        ))}
      </div>
      {items.length > 2 && (
        <button type="button" onClick={() => setIndex(2)} className="cursor-pointer text-sm font-semibold text-[var(--ep-primary)]">
          {`Lainnya · ${items.length - 2}`}
        </button>
      )}

      {index !== null && (
        <div ref={scroll} className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 text-slate-100">
          <div className="sticky top-0 z-10 flex items-center justify-end gap-4 bg-slate-950/90 px-6 py-4">
            {index < items.length - 1 && (
              <button
                type="button"
                onClick={() => {
                  const next = index + 1;
                  setIndex(next);
                  const el = document.getElementById(`gal-${next}`);
                  if (el && scroll.current) scroll.current.scrollTo({ top: el.offsetTop - 56, behavior: 'smooth' });
                }}
                className="cursor-pointer text-sm font-semibold text-emerald-400"
              >
                Berikutnya
              </button>
            )}
            <button type="button" onClick={() => setIndex(null)} className="cursor-pointer text-sm font-semibold">Tutup</button>
          </div>
          <div className="px-10 pb-24 pt-6 md:px-16">
            <TracingBeam container={scroll}>
              {items.map((item, i) => (
                <section id={`gal-${i}`} key={item.id} className="mb-28 scroll-mt-16">
                  <p className="text-sm text-emerald-400">{item.category} · {item.year}</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight">{item.title}</h2>
                  {item.imageUrl && <img src={item.imageUrl} alt="" className="mt-6 max-h-96 w-full rounded-lg object-cover" />}
                  <p className="mt-4 text-lg italic text-slate-300">{item.hospitalUnit}</p>
                  {item.metricTag && <p className="mt-4 text-2xl font-semibold text-emerald-400">{item.metricTag}</p>}
                  <p className="mt-6 text-base leading-relaxed text-slate-200">{item.caption}</p>
                </section>
              ))}
            </TracingBeam>
          </div>
        </div>
      )}
    </section>
  );
};
