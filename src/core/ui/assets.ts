/** Brand + placeholders. Set VITE_BRAND_LOGO in .env for the Siloam CDN logo. */
export const PLACEHOLDER_IMAGE = "/placeholder.svg";
export const BRAND_LOGO = import.meta.env.VITE_BRAND_LOGO || '/siloam.png';

/** Unsplash CDN resize. DB stores the URL (~100 bytes), not the file. */
export function catalogImage(url: string | undefined, width = 800): string {
  const src = url || PLACEHOLDER_IMAGE;
  return src.includes("images.unsplash.com") ? src.replace(/([?&])w=\d+/, `$1w=${width}`) : src;
}
