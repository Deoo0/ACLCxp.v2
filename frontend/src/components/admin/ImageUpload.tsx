import { useEffect, useRef, useState } from "react";

const control = "rounded-lg border border-white/20 px-3 py-2 text-xs hover:bg-white/10 disabled:opacity-40";

export default function ImageUpload({ label, value, onChange, aspectRatio = 16 / 9, id }: {
  label: string; value: string; aspectRatio?: number; id?: string; onChange: (value: string) => void;
}) {
  const ratioLabel = aspectRatio === 1 ? "1:1 square" : "16:9";
  const [source, setSource] = useState("");
  const [cropping, setCropping] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!source || !cropping) return;
    let active = true;
    const image = new Image();
    image.onload = () => {
      if (!active || !canvas.current) return;
      const context = canvas.current.getContext("2d");
      if (!context) return;
      const width = Math.min(image.width, image.height * aspectRatio) / zoom;
      const height = width / aspectRatio;
      canvas.current.width = Math.round(Math.min(1600, width));
      canvas.current.height = Math.round(canvas.current.width / aspectRatio);
      context.clearRect(0, 0, canvas.current.width, canvas.current.height);
      context.drawImage(image, (image.width - width) * x / 100, (image.height - height) * y / 100,
        width, height, 0, 0, canvas.current.width, canvas.current.height);
      setReady(true);
    };
    image.onerror = () => { if (active) setError("This image could not be opened. Choose another JPG or PNG."); };
    image.src = source;
    return () => { active = false; };
  }, [source, cropping, zoom, x, y, aspectRatio]);

  return <div className="space-y-3 rounded-xl border border-white/10 p-3">
    <input id={id} type="file" aria-label={label} accept="image/jpeg,image/png,.jpg,.jpeg,.png" className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-amber-300 file:px-3 file:py-2 file:text-black" onChange={async event => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      setError("");
      if (!["image/jpeg", "image/png"].includes(file.type)) { setError("Choose a JPG or PNG image."); return; }
      if (file.size > 5 * 1024 * 1024) { setError("Choose an image under 5 MB."); return; }
      const reader = new FileReader();
      reader.onerror = () => setError("Could not read this file. Please try again.");
      reader.onload = () => {
        const data = String(reader.result);
        const image = new Image();
        image.onload = () => { setSource(data); onChange(data); setCropping(false); setZoom(1); setX(50); setY(50); };
        image.onerror = () => setError("This image could not be opened. Choose another JPG or PNG.");
        image.src = data;
      };
      reader.readAsDataURL(file);
    }} />
    <p className="text-xs text-neutral-400">JPG or PNG, up to 5 MB. Keep the original or optionally crop to {ratioLabel}.</p>
    {value && !cropping && <img src={value} alt={`${label} preview`} className="max-h-56 w-full rounded-lg bg-black object-contain" />}
    {cropping && <div className="space-y-3">
      <canvas ref={canvas} aria-label={`${ratioLabel} crop preview`} style={{ aspectRatio }} className="max-h-80 w-full rounded-lg bg-black object-contain" />
      {([{ label: 'Zoom', value: zoom, min: 1, max: 3, step: 0.01, change: setZoom }, { label: 'Horizontal position', value: x, min: 0, max: 100, step: 1, change: setX }, { label: 'Vertical position', value: y, min: 0, max: 100, step: 1, change: setY }]).map(slider => <div key={slider.label} className="flex items-center gap-3 text-xs"><span className="w-32">{slider.label}</span><input type="range" aria-label={`${label}: ${slider.label}`} className="min-w-0 flex-1 accent-amber-300" min={slider.min} max={slider.max} step={slider.step} value={slider.value} onChange={e => { setReady(false); slider.change(Number(e.target.value)); }} /></div>)}
      <p className="text-xs text-neutral-400">Apply the crop before saving, or keep the original photo.</p>
    </div>}
    <div className="flex flex-wrap gap-2">
      {source && !cropping && <button type="button" className={control} onClick={() => { setReady(false); setCropping(true); }}>Crop to {ratioLabel}</button>}
      {cropping && <button type="button" disabled={!ready} className={control} onClick={() => {
        if (!canvas.current) return;
        const data = canvas.current.toDataURL(source.startsWith('data:image/png') ? 'image/png' : 'image/jpeg', 0.9);
        if (data.length > 7_000_000) { setError('The cropped image is too large. Choose a smaller image.'); return; }
        onChange(data); setCropping(false);
      }}>Apply crop</button>}
      {source && <button type="button" className={control} onClick={() => { onChange(source); setCropping(false); }}>Use original</button>}
      {value && <button type="button" className={control} onClick={() => { onChange(""); setSource(""); setCropping(false); }}>Remove photo</button>}
    </div>
    {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}
  </div>;
}
