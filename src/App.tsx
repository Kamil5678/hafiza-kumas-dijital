import { useEffect, useState, useCallback } from "react";
import {
  fetchRoots,
  fetchChildren,
  fetchPath,
  countDescendants,
  type ContentNode,
  type NodeType,
} from "./lib/supabase";
import { LessonView } from "./components/LessonView";

const TYPE_LABEL: Record<NodeType, string> = {
  module: "Modül",
  submodule: "Alt Modül",
  lesson: "Ders",
  topic: "Konu",
  subtopic: "Alt Konu",
};

const TYPE_ORDER: NodeType[] = ["module", "submodule", "lesson", "topic", "subtopic"];

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
  slug: string;
}

export default function App() {
  const [, setRoots] = useState<ContentNode[]>([]);
  const [current, setCurrent] = useState<ContentNode | null>(null);
  const [children, setChildren] = useState<ContentNode[]>([]);
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const [allNodes, setAllNodes] = useState<ContentNode[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRoots();
      setRoots(data);
      setAllNodes((prev) => [...prev, ...data]);
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
      setCrumbs(path.map((p: ContentNode) => ({ id: p.id, title: p.title, slug: p.slug })));
      setAllNodes((prev) => {
        const merged = [...prev];
        for (const k of kids) if (!merged.find((m) => m.id === k.id)) merged.push(k);
        return merged;
      });
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

  const navigateBySlug = useCallback((slug: string) => {
    const node = allNodes.find((n) => n.slug === slug);
    if (node) openNode(node);
    else loadRoots();
  }, [allNodes, openNode, loadRoots]);

  const goHome = useCallback(() => { loadRoots(); }, [loadRoots]);

  useEffect(() => { loadRoots(); }, [loadRoots]);

  const grouped: Record<string, ContentNode[]> = {};
  for (const t of TYPE_ORDER) grouped[t] = [];
  for (const c of children) grouped[c.type]?.push(c);

  const showLesson = current && (current.type === "lesson" || current.type === "topic" || current.type === "subtopic");

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
              <button className="crumb" onClick={() => navigateBySlug(c.slug)}>{c.title}</button>
            </span>
          ))}
        </nav>

        <section className="header">
          <div>
            <div className="eyebrow">{current ? TYPE_LABEL[current.type] : "Bilgi Bankası"}</div>
            <h1 className="title">{current ? current.title : "Üniversite Seviyesinde Bilgi Ağacı"}</h1>
            {typeof current?.description === "string" && <p className="desc">{current.description}</p>}
            {!current && (
              <p className="desc">
                Tekstil, Moda, İç Giyim, Sürdürülebilirlik, Strateji, İstatistik, Elisé Studio
                ve Bilgi Bankası modüllerini kapsayan kapsamlı içerik hiyerarşisi.
              </p>
            )}
          </div>
          {current && <button className="btn-back" onClick={goHome}>← Tüm Modüller</button>}
        </section>

        {error && <div className="error">Hata: {error}</div>}

        {showLesson && <LessonView node={current!} onNavigate={navigateBySlug} />}

        {loading ? (
          <div className="loading">Yükleniyor…</div>
        ) : children.length === 0 ? (
          !showLesson && (
            <div className="empty">
              <div className="empty-icon">○</div>
              <p>Bu dalın altında içerik kaydı yok.</p>
            </div>
          )
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
                    return (
                      <button
                        key={node.id}
                        className="card"
                        onClick={() => openNode(node)}
                      >
                        <span className="card-icon"><Icon type={node.type} /></span>
                        <span className="card-body">
                          <span className="card-title">{node.title}</span>
                          {node.description && <span className="card-desc">{node.description}</span>}
                          <span className="card-meta">
                            {childCount > 0 ? `${childCount} alt başlık` : "ders içeriği"}
                          </span>
                        </span>
                        <span className="card-arrow">→</span>
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
