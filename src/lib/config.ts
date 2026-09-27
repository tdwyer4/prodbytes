// Base URL where processed images are served from R2.
// Swap this once if you ever change domains/buckets — nothing else
// in the codebase should hardcode this.
export const CDN_BASE_URL = "https://cdn.prodbytes.com";

// Homepage hero image — a manually-managed file, not tied to any
// specific graphic in the manifest. Upload a hero.webp to this exact
// path in your PUBLIC R2 bucket whenever you want to swap it.
export const HERO_IMAGE_URL = `${CDN_BASE_URL}/hero/hero.jpg`;
