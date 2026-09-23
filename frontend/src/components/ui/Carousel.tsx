import { Children, useId, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Carousel({ children, label, single = false }: { children: ReactNode; label: string; single?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const [position, setPosition] = useState(0);
  const items = Children.toArray(children);
  const move = (step: number) => {
    const rail = ref.current;
    if (!rail) return;
    const child = rail.children[Math.max(0, Math.min(items.length - 1, position + step))] as HTMLElement;
    rail.scrollTo({ left: child.offsetLeft - (rail.children[0] as HTMLElement).offsetLeft, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  return <div role="region" aria-roledescription="carousel" aria-label={label} className="min-w-0">
    <div className="mb-4 flex items-center justify-between gap-3">
      <p aria-live="polite" className="text-xs text-neutral-400">{items.length > 1 ? `Swipe to browse · ${position + 1} of ${items.length}` : "1 of 1"}</p>
      <div className="flex gap-2">{[-1, 1].map(step => <button key={step} type="button" aria-controls={id} aria-label={`${step < 0 ? 'Previous' : 'Next'} ${label}`} disabled={step < 0 ? position === 0 : position >= items.length - 1} onClick={() => move(step)} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-amber-200 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-300 disabled:opacity-30">{step < 0 ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}</button>)}</div>
    </div>
    <div id={id} ref={ref} tabIndex={0} onKeyDown={e => { if (e.target === e.currentTarget && ['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); move(e.key === 'ArrowLeft' ? -1 : 1); } }} onScroll={() => {
      const rail = ref.current;
      if (!rail) return;
      const first = (rail.children[0] as HTMLElement)?.offsetLeft || 0;
      let nearest = 0;
      Array.from(rail.children).slice(0, items.length).forEach((child, index) => { if (Math.abs((child as HTMLElement).offsetLeft - first - rail.scrollLeft) < Math.abs((rail.children[nearest] as HTMLElement).offsetLeft - first - rail.scrollLeft)) nearest = index; });
      setPosition(nearest);
    }} className="relative flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain pb-4 focus-visible:outline-2 focus-visible:outline-amber-300 [scrollbar-width:thin]">
      {items.map((item, index) => <div key={index} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${items.length}`} className={`min-w-0 shrink-0 snap-start ${single ? 'w-full' : 'w-[88%] sm:w-[calc((100%-20px)/2)] lg:w-[calc((100%-40px)/3)]'} [&>article]:h-full`}>{item}</div>)}
      {!single && <div aria-hidden="true" className="w-[12%] shrink-0 sm:w-[calc((100%-20px)/2+20px)] lg:w-[calc((100%-40px)/3*2+40px)]" />}
    </div>
  </div>;
}
