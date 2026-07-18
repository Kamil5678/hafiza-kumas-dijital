import { supabase, supabaseConfigured } from "./supabaseClient";
import type { Topic } from "../data/topics";

export interface SaveResult {
  ok: boolean;
  packageId?: string;
  message: string;
}

export interface DistributeResult {
  ok: boolean;
  packageId?: string;
  daysPlanned?: number;
  startDate?: string;
  message: string;
}

function packageName(category: string, size: number): string {
  const stamp = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${category} · ${size} topics · ${stamp}`;
}

export async function savePackage(
  topics: Topic[],
  category: string
): Promise<SaveResult> {
  if (!supabaseConfigured) {
    return {
      ok: false,
      message: "Saving is unavailable because the database is not configured.",
    };
  }
  if (topics.length === 0) {
    return { ok: false, message: "No topics to save." };
  }

  try {
    const { data: pkg, error: pkgErr } = await supabase
      .from("saved_packages")
      .insert({
        name: packageName(category, topics.length),
        size: topics.length,
        category,
      })
      .select("id")
      .single();

    if (pkgErr || !pkg) {
      return { ok: false, message: `Could not save package: ${pkgErr?.message}` };
    }

    const rows = topics.map((t, i) => ({
      package_id: pkg.id,
      topic_id: t.id,
      title: t.title,
      category: t.category,
      tags: t.tags,
      position: i + 1,
    }));

    const { error: topicsErr } = await supabase.from("saved_topics").insert(rows);

    if (topicsErr) {
      return { ok: false, message: `Could not save topics: ${topicsErr.message}` };
    }

    return {
      ok: true,
      packageId: pkg.id,
      message: `Saved ${topics.length} topics as "${packageName(category, topics.length)}".`,
    };
  } catch (e) {
    return {
      ok: false,
      message: `Unexpected error while saving: ${(e as Error).message}`,
    };
  }
}

export async function distributeToDailyPlan(
  topics: Topic[],
  category: string
): Promise<DistributeResult> {
  if (!supabaseConfigured) {
    return {
      ok: false,
      message: "Daily plan is unavailable because the database is not configured.",
    };
  }
  if (topics.length === 0) {
    return { ok: false, message: "No topics to distribute." };
  }

  try {
    const { data: pkg, error: pkgErr } = await supabase
      .from("saved_packages")
      .insert({
        name: packageName(category, topics.length),
        size: topics.length,
        category,
      })
      .select("id")
      .single();

    if (pkgErr || !pkg) {
      return { ok: false, message: `Could not create package: ${pkgErr?.message}` };
    }

    const topicRows = topics.map((t, i) => ({
      package_id: pkg.id,
      topic_id: t.id,
      title: t.title,
      category: t.category,
      tags: t.tags,
      position: i + 1,
    }));

    const { data: insertedTopics, error: topicsErr } = await supabase
      .from("saved_topics")
      .insert(topicRows)
      .select("id");

    if (topicsErr || !insertedTopics) {
      return { ok: false, message: `Could not save topics: ${topicsErr?.message}` };
    }

    const start = new Date();
    const planRows = insertedTopics.map((row, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return {
        package_id: pkg.id,
        saved_topic_id: row.id,
        day_number: i + 1,
        scheduled_date: d.toISOString().slice(0, 10),
        status: "pending",
      };
    });

    const { error: planErr } = await supabase.from("daily_plan").insert(planRows);

    if (planErr) {
      return { ok: false, message: `Could not build daily plan: ${planErr.message}` };
    }

    const startDate = start.toISOString().slice(0, 10);
    return {
      ok: true,
      packageId: pkg.id,
      daysPlanned: planRows.length,
      startDate,
      message: `Distributed ${planRows.length} topics across ${planRows.length} days, starting ${startDate}.`,
    };
  } catch (e) {
    return {
      ok: false,
      message: `Unexpected error while distributing: ${(e as Error).message}`,
    };
  }
}

export interface SavedPackageRow {
  id: string;
  name: string;
  size: number;
  category: string;
  created_at: string;
}

export async function fetchSavedPackages(): Promise<{
  ok: boolean;
  packages: SavedPackageRow[];
  message: string;
}> {
  if (!supabaseConfigured) {
    return { ok: false, packages: [], message: "Database not configured." };
  }
  try {
    const { data, error } = await supabase
      .from("saved_packages")
      .select("id, name, size, category, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return { ok: false, packages: [], message: error.message };
    }
    return { ok: true, packages: data ?? [], message: "" };
  } catch (e) {
    return {
      ok: false,
      packages: [],
      message: (e as Error).message,
    };
  }
}
