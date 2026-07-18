import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.110.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ContentNode {
  id: string;
  parent_id: string | null;
  type: string;
  title: string;
  slug: string;
  description: string | null;
  position: number;
}

type ContentType = "lesson" | "quiz" | "flashcards" | "summary" | "glossary";
type Difficulty = "beginner" | "intermediate" | "advanced";

interface EngineParams {
  slug: string;
  content_type: ContentType;
  difficulty?: Difficulty;
  force?: boolean;
}

const VALID_TYPES: ContentType[] = ["lesson", "quiz", "flashcards", "summary", "glossary"];
const VALID_DIFF: Difficulty[] = ["beginner", "intermediate", "advanced"];

const DIFF_LABEL: Record<Difficulty, string> = {
  beginner: "Başlangıç",
  intermediate: "Orta",
  advanced: "İleri",
};

function fail(msg: string, status = 400): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function ok(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function validateParams(body: unknown): EngineParams | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const slug = b.slug;
  const content_type = b.content_type;
  const difficulty = b.difficulty ?? "intermediate";
  const force = b.force === true;
  if (typeof slug !== "string" || !slug.trim()) return null;
  if (typeof content_type !== "string" || !VALID_TYPES.includes(content_type as ContentType)) return null;
  if (typeof difficulty !== "string" || !VALID_DIFF.includes(difficulty as Difficulty)) return null;
  return {
    slug: slug.trim(),
    content_type: content_type as ContentType,
    difficulty: difficulty as Difficulty,
    force,
  };
}

// Deterministic pseudo-random based on seed string — stable output per input
function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffle<T>(rng: () => number, arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---- Content generators ----

function buildLesson(node: ContentNode, path: ContentNode[], children: ContentNode[], diff: Difficulty) {
  const rng = seededRandom(node.slug + ":lesson:" + diff);
  const objectives = [
    `${node.title} kavramını tanımlayabilme`,
    `Temel bileşenleri ve özelliklerini sıralayabilme`,
    `Uygulama alanlarını açıklığa kavuşturabilme`,
    `Sektörel bağlamını değerlendirebilme`,
    `İlgili terimleri doğru kullanabilme`,
  ].slice(0, diff === "beginner" ? 3 : diff === "advanced" ? 5 : 4);

  const sections = [
    {
      heading: "Giriş",
      body: `${node.title}, ${path.length > 1 ? path[path.length - 2].title : "tekstil ve moda"} alanının temel konularından biridir. ${node.description ?? "Bu ders, konunun temel kavramlarını ve uygulama boyutlarını ele alır."}`,
    },
    {
      heading: "Temel Kavramlar",
      body: `Bu bölümde ${node.title.toLowerCase()} ile ilgili anahtar kavramlar, tanımlar ve sınıflandırmalar ele alınır. Öğrenme yol haritası ${children.length > 0 ? `${children.length} alt başlık üzerinden` : "konu başlıkları üzerinden"} ilerler.`,
    },
    {
      heading: "Uygulama ve Örnekler",
      body: `${node.title} konusunun pratik kullanımı, sektördeki yeri ve tipik senaryolar örneklerle açıklanır.`,
    },
    {
      heading: "Özet",
      body: `Bu derste ${node.title} kavramı, bileşenleri ve uygulama alanları kapsamlı biçimde işlendi. İleri düzey için ${diff === "advanced" ? "sektörel vaka çalışmaları" : "ek okumalar"} önerilir.`,
    },
  ];

  const examples = children.slice(0, 4).map((c, i) => ({
    title: c.title,
    description: c.description ?? `${c.title} ile ilgili temel örnek.`,
    index: i + 1,
  }));
  if (examples.length === 0) {
    examples.push({ title: `${node.title} — Temel Örnek`, description: node.description ?? "Kavramın temel bir uygulaması.", index: 1 });
  }

  return {
    title: node.title,
    description: node.description ?? `${node.title} ders içeriği.`,
    difficulty: diff,
    difficulty_label: DIFF_LABEL[diff],
    module_path: path.map((p) => p.title),
    learning_objectives: objectives,
    sections,
    examples,
    summary: `${node.title} dersi ${DIFF_LABEL[diff].toLowerCase()} seviyesinde ${objectives.length} öğrenme hedefi ve ${sections.length} bölüm ile işlendi.`,
    estimated_minutes: diff === "beginner" ? 15 : diff === "advanced" ? 45 : 30,
  };
}

function buildQuiz(node: ContentNode, path: ContentNode[], children: ContentNode[], diff: Difficulty) {
  const rng = seededRandom(node.slug + ":quiz:" + diff);
  const pool = children.length > 0 ? children : [node];
  const questionCount = diff === "beginner" ? 4 : diff === "advanced" ? 8 : 6;
  const distractors = [
    "Yukarıdakilerin hiçbiri",
    "Yukarıdakilerin tümü",
    "Sadece I ve II",
    "Yalnızca III",
    "I, II ve III",
  ];

  const questions = [];
  for (let i = 0; i < questionCount; i++) {
    const src = pool[i % pool.length];
    const correct = src.title;
    const opts = shuffle(rng, [correct, ...distractors.slice(0, 3)]);
    questions.push({
      question: `${node.title} kapsamında "${src.title}" ile ilgili aşağıdakilerden hangisi doğrudur?`,
      options: opts,
      correct_index: opts.indexOf(correct),
      explanation: src.description ?? `${src.title}, ${node.title} konusunun önemli bir bileşenidir.`,
    });
  }

  return {
    title: `${node.title} — Quiz`,
    description: `${DIFF_LABEL[diff]} seviye ${questionCount} soruluk değerlendirme.`,
    difficulty: diff,
    difficulty_label: DIFF_LABEL[diff],
    module_path: path.map((p) => p.title),
    questions,
    passing_score: Math.ceil(questionCount * 0.7),
  };
}

function buildFlashcards(node: ContentNode, path: ContentNode[], children: ContentNode[], diff: Difficulty) {
  const pool = children.length > 0 ? children : [node];
  const count = diff === "beginner" ? 5 : diff === "advanced" ? 12 : 8;
  const cards = [];
  for (let i = 0; i < Math.min(count, pool.length); i++) {
    const src = pool[i];
    cards.push({
      front: src.title,
      back: src.description ?? `${src.title}, ${node.title} konusunun bir parçasıdır.`,
    });
  }
  if (cards.length === 0) {
    cards.push({ front: node.title, back: node.description ?? "Temel kavram." });
  }
  return {
    title: `${node.title} — Flash Kartlar`,
    description: `${cards.length} kart ile hızlı tekrar.`,
    difficulty: diff,
    difficulty_label: DIFF_LABEL[diff],
    module_path: path.map((p) => p.title),
    cards,
  };
}

function buildSummary(node: ContentNode, path: ContentNode[], children: ContentNode[], diff: Difficulty) {
  const bullets = children.slice(0, 6).map((c) => `${c.title}: ${c.description ?? "temel konu"}`);
  if (bullets.length === 0) bullets.push(`${node.title}: ${node.description ?? "temel kavram"}`);
  return {
    title: `${node.title} — Özet`,
    description: "Hızlı gözden geçirme için yapılandırılmış özet.",
    difficulty: diff,
    difficulty_label: DIFF_LABEL[diff],
    module_path: path.map((p) => p.title),
    key_points: bullets,
    one_liner: `${node.title}, ${path.length > 1 ? path[path.length - 2].title : "bu alan"} içinde ${children.length > 0 ? `${children.length} alt başlığı` : "kapsamlı bir konuyu"} kapsar.`,
  };
}

function buildGlossary(node: ContentNode, path: ContentNode[], children: ContentNode[], diff: Difficulty) {
  const pool = children.length > 0 ? children : [node];
  const terms = pool.slice(0, diff === "advanced" ? 12 : 8).map((c) => ({
    term: c.title,
    definition: c.description ?? `${c.title} ile ilgili temel tanım.`,
  }));
  return {
    title: `${node.title} — Sözlük`,
    description: `${terms.length} terim ve tanım.`,
    difficulty: diff,
    difficulty_label: DIFF_LABEL[diff],
    module_path: path.map((p) => p.title),
    terms,
  };
}

function generate(params: EngineParams, node: ContentNode, path: ContentNode[], children: ContentNode[]): unknown {
  switch (params.content_type) {
    case "lesson": return buildLesson(node, path, children, params.difficulty);
    case "quiz": return buildQuiz(node, path, children, params.difficulty);
    case "flashcards": return buildFlashcards(node, path, children, params.difficulty);
    case "summary": return buildSummary(node, path, children, params.difficulty);
    case "glossary": return buildGlossary(node, path, children, params.difficulty);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return fail("Sadece POST desteklenir.", 405);
  }

  try {
    const body = await req.json().catch(() => null);
    const params = validateParams(body);
    if (!params) {
      return fail("Geçersiz parametreler. slug (string), content_type (lesson|quiz|flashcards|summary|glossary), difficulty? (beginner|intermediate|advanced) gerekli.");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 1. Find node by slug
    const { data: node, error: nodeErr } = await supabase
      .from("content_nodes")
      .select("id, parent_id, type, title, slug, description, position")
      .eq("slug", params.slug)
      .maybeSingle();
    if (nodeErr) throw nodeErr;
    if (!node) return fail(`'${params.slug}' slug'ına sahip düğüm bulunamadı.`, 404);

    // 2. Check cache unless force
    if (!params.force) {
      const { data: cached, error: cacheErr } = await supabase
        .from("generated_content")
        .select("payload, updated_at")
        .eq("node_slug", params.slug)
        .eq("content_type", params.content_type)
        .eq("difficulty", params.difficulty)
        .maybeSingle();
      if (cacheErr) throw cacheErr;
      if (cached) {
        return ok({ cached: true, generated_at: cached.updated_at, content: cached.payload });
      }
    }

    // 3. Fetch path and children in parallel
    const [childrenRes] = await Promise.all([
      supabase.from("content_nodes").select("id, parent_id, type, title, slug, description, position").eq("parent_id", node.id).order("position", { ascending: true }),
    ]);
    if (childrenRes.error) throw childrenRes.error;
    const children = (childrenRes.data ?? []) as ContentNode[];

    // Build path by walking up parents
    const path: ContentNode[] = [node];
    let cur: ContentNode | null = node;
    const seen = new Set<string>([node.id]);
    while (cur && cur.parent_id) {
      const { data: parent, error: pErr } = await supabase
        .from("content_nodes")
        .select("id, parent_id, type, title, slug, description, position")
        .eq("id", cur.parent_id)
        .maybeSingle();
      if (pErr) throw pErr;
      if (!parent || seen.has(parent.id)) break;
      seen.add(parent.id);
      path.unshift(parent);
      cur = parent;
    }

    // 4. Generate
    const payload = generate(params, node, path, children);

    // 5. Upsert cache
    const upsert = {
      node_slug: params.slug,
      node_id: node.id,
      content_type: params.content_type,
      difficulty: params.difficulty,
      payload,
      updated_at: new Date().toISOString(),
    };
    const { error: upErr } = await supabase
      .from("generated_content")
      .upsert(upsert, { onConflict: "node_slug,content_type,difficulty" });
    if (upErr) {
      // Non-fatal: still return content
      console.error("Cache upsert failed:", upErr.message);
    }

    return ok({ cached: false, generated_at: upsert.updated_at, content: payload });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Engine error:", msg);
    return fail(`İçerik motoru hatası: ${msg}`, 500);
  }
});
