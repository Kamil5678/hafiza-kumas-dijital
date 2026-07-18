import { TOPICS, type Category, type Topic } from "../data/topics";

export type PackageSize = 10 | 25 | 50 | 100;

export const PACKAGE_SIZES: PackageSize[] = [10, 25, 50, 100];

export interface GenerateResult {
  ok: boolean;
  topics: Topic[];
  message?: string;
}

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateTopics(
  size: PackageSize,
  category: Category | "All"
): GenerateResult {
  if (!PACKAGE_SIZES.includes(size)) {
    return { ok: false, topics: [], message: "Invalid package size selected." };
  }

  const pool =
    category === "All" ? TOPICS : TOPICS.filter((t) => t.category === category);

  if (pool.length === 0) {
    return {
      ok: false,
      topics: [],
      message: `No topics found for category "${category}".`,
    };
  }

  if (pool.length < size) {
    return {
      ok: false,
      topics: [],
      message: `The "${category}" dataset has only ${pool.length} topics, but you requested ${size}. Try a smaller package or choose "All categories".`,
    };
  }

  const selected = shuffle(pool).slice(0, size);
  return { ok: true, topics: selected };
}
