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
  const stamp = new Date().toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${category} · ${size} konu · ${stamp}`;
}

export async function savePackage(
  topics: Topic[],
  category: string
): Promise<SaveResult> {
  if (!supabaseConfigured) {
    return {
      ok: false,
      message: "Veritabanı yapılandırılmadığından kaydetme kullanılamıyor.",
    };
  }
  if (topics.length === 0) {
    return { ok: false, message: "Kaydedilecek konu yok." };
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
      return { ok: false, message: `Paket kaydedilemedi: ${pkgErr?.message}` };
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
      return { ok: false, message: `Konular kaydedilemedi: ${topicsErr.message}` };
    }

    return {
      ok: true,
      packageId: pkg.id,
      message: `${topics.length} konu "${packageName(category, topics.length)}" olarak kaydedildi.`,
    };
  } catch (e) {
    return {
      ok: false,
      message: `Kaydetme sırasında beklenmeyen hata: ${(e as Error).message}`,
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
      message: "Veritabanı yapılandırılmadığından günlük plan kullanılamıyor.",
    };
  }
  if (topics.length === 0) {
    return { ok: false, message: "Dağıtılacak konu yok." };
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
      return { ok: false, message: `Paket oluşturulamadı: ${pkgErr?.message}` };
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
      return { ok: false, message: `Konular kaydedilemedi: ${topicsErr?.message}` };
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
      return { ok: false, message: `Günlük plan oluşturulamadı: ${planErr.message}` };
    }

    const startDate = start.toISOString().slice(0, 10);
    return {
      ok: true,
      packageId: pkg.id,
      daysPlanned: planRows.length,
      startDate,
      message: `${planRows.length} konu ${planRows.length} güne dağıtıldı, başlangıç ${startDate}.`,
    };
  } catch (e) {
    return {
      ok: false,
      message: `Dağıtım sırasında beklenmeyen hata: ${(e as Error).message}`,
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
    return { ok: false, packages: [], message: "Veritabanı yapılandırılmadı." };
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
