export type ImageWidth = 320 | 640 | 1280;

// Only the application's UUID upload routes support thumbnail variants.
export function imageVariant(src: string, width: ImageWidth): string {
  if (!src || src.startsWith("data:")) return src;
  const origin = (import.meta.env?.VITE_API_URL || window.location.origin).replace(/\/$/, "");
  try {
    const url = new URL(src, origin);
    if (url.origin !== new URL(origin).origin || !/^\/media\/(events|houses)\/[a-f0-9]{32}\.(jpg|png)$/.test(url.pathname)) return src;
    url.searchParams.set("width", String(width));
    return src.startsWith("/") ? `${url.pathname}${url.search}` : url.href;
  } catch { return src; }
}

export function imageSrcSet(src: string): string | undefined {
  if (imageVariant(src, 640) === src) return undefined;
  return ([320, 640, 1280] as const).map(width => `${imageVariant(src, width)} ${width}w`).join(", ");
}
