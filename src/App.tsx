import { useEffect, useState, useCallback } from "react";
import {
  fetchRoots,
  fetchChildren,
  fetchPath,
  countDescendants,
  type ContentNode,
  type NodeType,
} from "./lib/supabase";
import {
  generateContent,
  fetchCachedContent,
  type ContentType,
  type Difficulty,
  type EngineResult,
} from "./lib/engine";

const TYPE_LABEL: Record<NodeType, string> = {
  module: "Modül",
  submodule: "Alt Modül",
  lesson: "Ders",
  topic: "Konu",
  subtopic: "Alt Konu",
};

const TYPE_ORDER: NodeType[] = ["module", "submodule", "lesson", "topic", "subtopic"];

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "lesson", label: "Ders" },
  { value: "summary", label: "Özet" },
  { value: "glossary", label: "Sözlük" },
  { value: "flashcards", label: "Flash Kartlar" },
  { value: "quiz", label: "Quiz" },
];

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "beginner", label: "Başlangıç" },
  { value: "intermediate", label: "Orta" },
  { value: "advanced", label: "İleri" },
];

function Icon({ type }: { type: NodeType }) {
  const c = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (type) {
    case "module":
      return (<svg {...c}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>);
    case "submodule":
      return (<svg {...c}><path d="M3 7h18M3 12h18M3 17h18" /></svg>);
    case "lesson":
      return (<svg {...c}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>);
    case "topic":
      return (<svg {...c}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>);
    case "subtopic":
      return (<svg {...c}><path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01" /></svg>);
  }
}

interface Crumb {
  id: string;
  title: string;
}

export default function App() {
  const [roots, setRoots] = useState<ContentNode[]>([]);
  const [current, setCurrent] = useState<ContentNode | null>(null);
  const [children, setChildren] = useState<ContentNode[]>([]);
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRoots();
      setRoots(data);
      setCurrent(null);
      setChildren(data);
      setCrumbs([]);
      const c: Record<string, number> = {};
      for (const n of data) c[n.id] = await countDescendants(n.id);
      setCounts(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const openNode = useCallback(async (node: ContentNode) => {
    setLoading(true);
    setError(null);
    try {
      const [kids, path] = await Promise.all([fetchChildren(node.id), fetchPath(node.id)]);
      setCurrent(node);
      setChildren(kids);
      setCrumbs(path.map((p: ContentNode) => ({ id: p.id, title: p.title })));
      const c: Record<string, number> = {};
      for (const n of kids) c[n.id] = await countDescendants(n.id);
      setCounts(c);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const goHome = useCallback(() => { loadRoots(); }, [loadRoots]);

  useEffect(() => { loadRoots(); }, [loadRoots]);

  const grouped: Record<string, ContentNode[]> = {};
  for (const t of TYPE_ORDER) grouped[t] = [];
  for (const c of children) grouped[c.type]?.push(c);

  return (
    <div className="layout">
      <header className="navbar">
        <div className="navbar-inner">
          <button className="brand" onClick={goHome}>
            <span className="brand-mark">T</span>
            <span className="brand-text">
              <span className="brand-name">Tekstil Hafızam</span>
              <span className="brand-sub">bilgi motoru</span>
            </span>
          </button>
        </div>
      </header>

      <main className="main">
        <nav className="crumbs">
          <button className="crumb" onClick={goHome}>Tüm Modüller</button>
          {crumbs.map((c) => (
            <span key={c.id} className="crumb-wrap">
              <span className="crumb-sep">/</span>
              <button className="crumb" onClick={() => {
                if (c.id === current?.id) return;
                const node = [...roots, ...children].find((n) => n.id === c.id);
                if (node) openNode(node);
                else goHome();
              }}>{c.title}</button>
            </span>
          ))}
        </nav>

        <section className="header">
          <div>
            <div className="eyebrow">
              {current ? TYPE_LABEL[current.type] : "Bilgi Bankası"}
            </div>
            <h1 className="title">
              {current ? current.title : "Üniversite Seviyesinde Bilgi Ağacı"}
            </h1>
            {current?.description && <p className="desc">{current.description}</p>}
            {!current && (
              <p className="desc">
                Tekstil, Moda, İç Giyim, Sürdürülebilirlik, Strateji, İstatistik, Elisé Studio
                ve Bilgi Bankası modüllerini kapsayan kapsamlı içerik hiyerarşisi.
              </p>
            )}
          </div>
          {current && (
            <button className="btn-back" onClick={goHome}>← Tüm Modüller</button>
          )}
        </section>

        {error && <div className="error">Hata: {error}</div>}

        {current && <EnginePanel node={current} />}

        {loading ? (
          <div className="loading">Yükleniyor…</div>
        ) : children.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">○</div>
            <p>Bu dalın altında içerik kaydı yok.</p>
          </div>
        ) : (
          <div className="groups">
            {TYPE_ORDER.filter((t) => (grouped[t]?.length ?? 0) > 0).map((t) => (
              <section key={t} className="group">
                <h2 className="group-title">
                  {TYPE_LABEL[t]}
                  <span className="group-count">{grouped[t].length}</span>
                </h2>
                <div className={`grid grid-${t}`}>
                  {grouped[t].map((node) => {
                    const childCount = counts[node.id] ?? 0;
                    const isLeaf = node.type === "subtopic" || childCount === 0;
                    return (
                      <button
                        key={node.id}
                        className="card"
                        onClick={() => !isLeaf && openNode(node)}
                        disabled={isLeaf}
                      >
                        <span className="card-icon"><Icon type={node.type} /></span>
                        <span className="card-body">
                          <span className="card-title">{node.title}</span>
                          {node.description && <span className="card-desc">{node.description}</span>}
                          <span className="card-meta">
                            {isLeaf ? "içerik yaprağı" : `${childCount} alt başlık`}
                          </span>
                        </span>
                        {!isLeaf && <span className="card-arrow">→</span>}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EnginePanel({ node }: { node: ContentNode }) {
  const [contentType, setContentType] = useState<ContentType>("lesson");
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [result, setResult] = useState<EngineResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const cached = await fetchCachedContent(node.slug, contentType, difficulty);
      if (cached && !force) {
        setResult(cached);
      } else {
        const r = await generateContent({ slug: node.slug, content_type: contentType, difficulty, force });
        setResult(r);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [node.slug, contentType, difficulty]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const cached = await fetchCachedContent(node.slug, contentType, difficulty);
        if (active) setResult(cached);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [node.slug, contentType, difficulty]);

  return (
    <section className="engine">
      <div className="engine-head">
        <div className="engine-title">AI Bilgi Motoru</div>
        <div className="engine-controls">
          <label className="control">
            <span>Tür</span>
            <select value={contentType} onChange={(e) => setContentType(e.target.value as ContentType)}>
              {CONTENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <label className="control">
            <span>Seviye</span>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
              {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </label>
          <button className="btn-engine" disabled={loading} onClick={() => run(false)}>
            {loading ? "Üretiliyor…" : "İçeriği Göster"}
          </button>
          <button className="btn-engine ghost" disabled={loading} onClick={() => run(true)} title="Önbelleği atlayarak yeniden üret">
            Yeniden Üret
          </button>
        </div>
      </div>

      {error && <div className="engine-error">Motor hatası: {error}</div>}

      {loading && !result && <div className="engine-loading">İçerik hazırlanıyor…</div>}

      {result && !loading && (
        <ContentRenderer result={result} />
      )}
    </section>
  );
}

function ContentRenderer({ result }: { result: EngineResult }) {
  const c = result.content as Record<string, unknown>;
  return (
    <div className="content-render">
      <div className="content-meta">
        <span className={`badge ${result.cached ? "cached" : "fresh"}`}>
          {result.cached ? "Önbellekten" : "Yeni üretildi"}
        </span>
        <span className="meta-date">{new Date(result.generated_at).toLocaleString("tr-TR")}</span>
      </div>
      <h3 className="content-title">{String(c.title ?? "")}</h3>
      {typeof c.description === "string" && <p className="content-desc">{c.description}</p>}
      {Array.isArray(c.module_path) && (
        <div className="content-path">
          {(c.module_path as string[]).map((p: string, i: number) => (
            <span key={i}>{p}{i < (c.module_path as string[]).length - 1 ? " › " : ""}</span>
          ))}
        </div>
      )}
      <StructuredBody content={c} />
    </div>
  );
}

function StructuredBody({ content }: { content: Record<string, unknown> }) {
  const obj = content as Record<string, unknown>;
  return (
    <div className="structured">
      {Array.isArray(obj.learning_objectives) && obj.learning_objectives.length > 0 && (
        <Block title="Öğrenme Hedefleri">
          <ul>{(obj.learning_objectives as string[]).map((o, i) => <li key={i}>{o}</li>)}</ul>
        </Block>
      )}
      {Array.isArray(obj.sections) && obj.sections.length > 0 && (
        <Block title="Ders İçeriği">
          {(obj.sections as Array<Record<string, string>>).map((s, i) => (
            <div key={i} className="section-block">
              <h4>{s.heading}</h4>
              <p>{s.body}</p>
            </div>
          ))}
        </Block>
      )}
      {Array.isArray(obj.examples) && obj.examples.length > 0 && (
        <Block title="Örnekler">
          <ul>{(obj.examples as Array<Record<string, unknown>>).map((e, i) => (
            <li key={i}><strong>{e.title as string}</strong> — {e.description as string}</li>
          ))}</ul>
        </Block>
      )}
      {Array.isArray(obj.key_points) && obj.key_points.length > 0 && (
        <Block title="Anahtar Noktalar">
          <ul>{(obj.key_points as string[]).map((k, i) => <li key={i}>{k}</li>)}</ul>
        </Block>
      )}
      {typeof obj.one_liner === "string" && (
        <Block title="Tek Cümleyle"><p className="one-liner">{obj.one_liner}</p></Block>
      )}
      {Array.isArray(obj.terms) && obj.terms.length > 0 && (
        <Block title="Sözlük">
          <dl>{(obj.terms as Array<Record<string, string>>).map((t, i) => (
            <div key={i} className="term-row"><dt>{t.term}</dt><dd>{t.definition}</dd></div>
          ))}</dl>
        </Block>
      )}
      {Array.isArray(obj.cards) && obj.cards.length > 0 && (
        <Block title="Flash Kartlar">
          <div className="cards-grid">
            {(obj.cards as Array<Record<string, string>>).map((card, i) => (
              <div key={i} className="flashcard">
                <div className="flash-front">{card.front}</div>
                <div className="flash-back">{card.back}</div>
              </div>
            ))}
          </div>
        </Block>
      )}
      {Array.isArray(obj.questions) && obj.questions.length > 0 && (
        <Block title="Quiz">
          <ol className="quiz-list">
            {(obj.questions as Array<Record<string, unknown>>).map((q, i) => (
              <li key={i} className="quiz-q">
                <div className="quiz-question">{q.question as string}</div>
                <ul className="quiz-opts">
                  {(q.options as string[]).map((opt, j) => (
                    <li key={j} className={j === (q.correct_index as number) ? "correct" : ""}>
                      {String.fromCharCode(65 + j)}. {opt}
                    </li>
                  ))}
                </ul>
                <div className="quiz-expl"><em>Açıklama:</em> {q.explanation as string}</div>
              </li>
            ))}
          </ol>
        </Block>
      )}
      {typeof obj.summary === "string" && (
        <Block title="Özet"><p>{obj.summary}</p></Block>
      )}
      {typeof obj.estimated_minutes === "number" && (
        <div className="meta-line">Tahmini süre: ~{obj.estimated_minutes} dk</div>
      )}
      {typeof obj.passing_score === "number" && (
        <div className="meta-line">Geçme barajı: {obj.passing_score} / {(obj.questions as unknown[]).length}</div>
      )}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <h4 className="block-title">{title}</h4>
      <div className="block-body">{children}</div>
    </div>
  );
}
