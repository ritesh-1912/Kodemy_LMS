/**
 * Cover images aligned with course material (Unsplash, stable photo IDs).
 * Used when `thumbnail` is missing in the API — keyed by slug keywords.
 */
export const MATERIAL_THUMBNAILS = {
  /** Web UI / component-style frontend (HTML & layout on screen) */
  react:
    "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=1200&q=85&auto=format&fit=crop",
  /** Terminal / backend / server-side development */
  node:
    "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&q=85&auto=format&fit=crop",
  /** Python: data & analytics workflow (notebooks, pandas-style work) */
  python:
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=85&auto=format&fit=crop",
  /** Any other dev course */
  default:
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=85&auto=format&fit=crop",
} as const;

/** Pick a material-appropriate image from slug + title when API has no thumbnail */
export function resolveMaterialThumbnail(slug: string, title: string): string {
  const hay = `${slug} ${title}`.toLowerCase();

  if (
    hay.includes("react") ||
    hay.includes("vue") ||
    hay.includes("angular") ||
    hay.includes("svelte") ||
    hay.includes("frontend") ||
    hay.includes("next.js") ||
    hay.includes("nextjs")
  ) {
    return MATERIAL_THUMBNAILS.react;
  }

  if (
    hay.includes("node") ||
    hay.includes("express") ||
    hay.includes("nestjs") ||
    hay.includes("backend") ||
    hay.includes("api ") ||
    hay.includes("server")
  ) {
    return MATERIAL_THUMBNAILS.node;
  }

  if (hay.includes("python") || hay.includes("django") || hay.includes("fastapi")) {
    return MATERIAL_THUMBNAILS.python;
  }

  if (
    hay.includes("javascript") ||
    hay.includes("typescript") ||
    hay.includes("web dev")
  ) {
    return MATERIAL_THUMBNAILS.react;
  }

  return MATERIAL_THUMBNAILS.default;
}
