import { useState } from "react";

export default function HouseLogo({ src, name, color }: { src: string; name: string; color: string }) {
  const [failed, setFailed] = useState("");
  return <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white/5 p-1" style={{ borderColor: color }}>
    {src && src !== failed ? <img src={src} alt={`${name} logo`} className="h-full w-full object-contain" loading="lazy" onError={() => setFailed(src)} /> : <span aria-label={`${name} logo unavailable`} className="text-sm font-bold text-neutral-200">{name.slice(0, 2).toUpperCase()}</span>}
  </span>;
}
