/**
 * Rotate which offering (and its practices) is shown per post.
 * Uses offerings_referenced from recent posts to avoid repetition.
 */

export function getOfferingCatalog(
  practicesByOffering?: Record<string, string[]>,
  productsServices?: string[]
): string[] {
  const fromPractices = Object.keys(practicesByOffering || {}).filter(Boolean);
  if (fromPractices.length > 0) {
    return [...fromPractices].sort((a, b) => a.localeCompare(b));
  }
  if (productsServices?.length) {
    return [...productsServices].sort((a, b) => a.localeCompare(b));
  }
  return [];
}

/**
 * Pick the next offering in catalog order after the most recently referenced one.
 * Skips offerings in `recentOfferings` when possible; resets when all were used recently.
 */
export function selectNextOffering(
  catalog: string[],
  recentOfferings: string[] = []
): string {
  if (catalog.length === 0) return "";
  if (catalog.length === 1) return catalog[0];

  const notRecent = catalog.filter(
    (name) =>
      !recentOfferings.some((r) => r.toLowerCase() === name.toLowerCase())
  );
  const pool = notRecent.length > 0 ? notRecent : catalog;

  const lastUsed = recentOfferings[0];
  if (lastUsed) {
    const idx = catalog.findIndex(
      (name) => name.toLowerCase() === lastUsed.toLowerCase()
    );
    if (idx >= 0) {
      for (let step = 1; step <= catalog.length; step++) {
        const candidate = catalog[(idx + step) % catalog.length];
        if (pool.some((p) => p.toLowerCase() === candidate.toLowerCase())) {
          return candidate;
        }
      }
    }
  }

  return pool[0];
}

/** Single offering + bullet practices for mode templates */
export function formatOfferingWithPractices(
  offering: string,
  practicesByOffering?: Record<string, string[]>
): string {
  if (!offering) return "";

  const practices = practicesByOffering?.[offering];
  if (!practices?.length) return offering;

  const list = practices.map((p) => `  - ${p}`).join("\n");
  return `${offering}:\n${list}`;
}
