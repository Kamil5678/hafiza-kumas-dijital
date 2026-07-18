import { useState, useEffect, useRef } from "react";
import {
  fetchRoots,
  fetchChildren,
  fetchNode,
  fetchPath,
  fetchAllLessons,
  fetchCachedSlugs,
  type ContentNode,
} from "./lib/supabase";
import { generateLesson } from "./lib/lesson";
import LessonView from "./components/LessonView";

type View =
  | { name: "dashboard" }
  | { name: "module"; slug: string }
  | { name: "lesson"; slug: string };

interface GenStatus {
  total: number;
  cached: number;
  remaining: number;
  generating: boolean;
  currentTitle: string | null;
  progress: number;
  errors: string[];
}

export default function App() {
  const [view, setView] = useState<View>({ name: "dashboard" });
  const [roots, setRoots] = useState<ContentNode[]>([]);
  const [moduleChildren, setModuleChildren] = useState<ContentNode[]>([]);
  const [lessonNode, setLessonNode] = useState<ContentNode | null>(null);
  const [path, setPath] = useState<ContentNode[]>([]);
  const [genStatus, setGenStatus] = useState<GenStatus>({
    total: 0,
    cached: 0,
    remaining: 0,
    generating: false,
    currentTitle: null,
    progress: 0,
    errors: [],
  });
  const [allLessons, setAllLessons] = useState<ContentNode[]>([]);
  const [genExpanded, setGenExpanded] = useState(false);
  const genAbortRef = useRef(false);

  useEffect(() => {
    (async () => {
      const r = await fetchRoots();
      setRoots(r);
      await refreshGenStatus();
    })();
  }, []);

  const refreshGenStatus = async () => {
    const [lessons, cachedSlugs] = await Promise.all([
      fetchAllLessons(),
      fetchCachedSlugs(),
    ]);
    setAllLessons(lessons);
    const cachedCount = lessons.filter((l) => cachedSlugs.has(l.slug)).length;
    setGenStatus((prev) => ({
      ...prev,
      total: lessons.length,
      cached: cachedCount,
      remaining: lessons.length - cachedCount,
      progress:
        lessons.length > 0
          ? Math.round((cachedCount / lessons.length) * 100)
          : 0,
    }));
  };

  const handleGenerateAll = async () => {
    if (genStatus.generating) return;
    genAbortRef.current = false;
    setGenStatus((prev) => ({ ...prev, generating: true, errors: [] }));

    const cachedSlugs = await fetchCachedSlugs();
    const toGenerate = allLessons.filter((l) => !cachedSlugs.has(l.slug));
    let completed = genStatus.cached;
    const errors: string[] = [];

    for (const lesson of toGenerate) {
      if (genAbortRef.current) break;
      setGenStatus((prev) => ({ ...prev, currentTitle: lesson.title }));
      try {
        await generateLesson(lesson.slug, "intermediate", false);
        completed++;
      } catch (e: any) {
        errors.push(`${lesson.title}: ${e.message}`);
      }
      setGenStatus((prev) => ({
        ...prev,
        cached: completed,
        remaining: prev.total - completed,
        progress: Math.round((completed / prev.total) * 100),
        errors,
      }));
    }

    setGenStatus((prev) => ({ ...prev, generating: false, currentTitle: null }));
    await refreshGenStatus();
  };

  const handleStopGeneration = () => { genAbortRef.current = true; };
  const handleRegenerate = async (slug: string) => { await generateLesson(slug, "intermediate", true); };

  const openModule = async (slug: string) => {
    const node = await fetchNode(slug);
    if (!node) return;
    const children = await fetchChildren(node.id);
    setModuleChildren(children);
    const p = await fetchPath(slug);
    setPath(p);
    setView({ name: "module", slug });
  };

  const openLesson = async (slug: string) => {
    const node = await fetchNode(slug);
    if (!node) return;
    setLessonNode(node);
    const p = await fetchPath(slug);
    setPath(p);
    setView({ name: "lesson", slug });
  };

  const backToModule = () => {
    if (path.length >= 2) openModule(path[0].slug);
    else setView({ name: "dashboard" });
  };

  const backToDashboard = () => setView({ name: "dashboard" });

  const allGenerated = genStatus.remaining === 0 && genStatus.total > 0;

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <button className="brand" onClick={backToDashboard}>
            <span className="brand-mark">🍒</span>
            <span className="brand-text">Vişne Fashion OS</span>
          </button>
          {view.name !== "dashboard" && path.length > 0 && (
            <nav className="crumbs">
              {path.map((n, i) => (
                <span key={n.id} className="crumb">
                  {i > 0 && <span className="crumb-sep">·</span>}
                  <button
                    className="crumb-link"
                    onClick={() => {
                      if (i === 0) openModule(n.slug);
                      else if (n.type === "lesson") openLesson(n.slug);
                      else openModule(path[0].slug);
                    }}
                  >
                    {n.title}
                  </button>
                </span>
              ))}
            </nav>
          )}
        </div>
      </header>

      <main className="content">
        {view.name === "dashboard" && (
          <div className="dashboard">
            <div className="hero">
              <h1 className="hero-title">Fashion Operating System</h1>
              <p className="hero-sub">
                Tekstil ve moda sektörü için merkezi içerik platformu
              </p>
            </div>
            <section className="modules">
              <h2 className="modules-label">Modüller</h2>
              <div className="module-list">
                {roots.map((m) => (
                  <button key={m.id} className="module-item" onClick={() => openModule(m.slug)}>
                    <span className="module-num">{moduleIcon(m.slug)}</span>
                    <div className="module-meta">
                      <span className="module-name">{m.title}</span>
                      {m.description && <span className="module-desc">{m.description}</span>}
                    </div>
                    <span className="module-arrow">→</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {view.name === "module" && (
          <div className="module-page">
            <div className="page-head">
              <h1 className="page-title">{path[0]?.title}</h1>
              {path[0]?.description && <p className="page-desc">{path[0].description}</p>}
            </div>
            <NodeTree nodes={moduleChildren} level={0} onOpenLesson={openLesson} />
          </div>
        )}

        {view.name === "lesson" && lessonNode && (
          <LessonView
            node={lessonNode}
            onNavigate={openLesson}
            onBackToModule={backToModule}
            onBackToDashboard={backToDashboard}
            onRegenerate={handleRegenerate}
          />
        )}
      </main>

      <div className={`gen-bar ${genExpanded ? "expanded" : ""} ${genStatus.generating ? "active" : ""} ${allGenerated ? "done" : ""}`}>
        <button className="gen-bar-toggle" onClick={() => setGenExpanded(!genExpanded)}>
          <div className="gen-bar-info">
            {genStatus.generating ? (
              <>
                <span className="gen-dot pulse" />
                <span className="gen-bar-text">Üretiliyor: <strong>{genStatus.currentTitle}</strong></span>
                <span className="gen-bar-count">{genStatus.remaining} kaldı</span>
              </>
            ) : allGenerated ? (
              <>
                <span className="gen-dot done" />
                <span className="gen-bar-text">Tüm içerik hazır</span>
              </>
            ) : (
              <>
                <span className="gen-dot" />
                <span className="gen-bar-text">{genStatus.cached} / {genStatus.total} ders hazır</span>
              </>
            )}
          </div>
          <span className="gen-bar-pct">{genStatus.progress}%</span>
        </button>
        <div className="gen-bar-track">
          <div className="gen-bar-fill" style={{ width: `${genStatus.progress}%` }} />
        </div>
        {genExpanded && (
          <div className="gen-bar-detail">
            {genStatus.errors.length > 0 && (
              <div className="gen-bar-errors">
                <span className="gen-bar-errors-label">Hatalar ({genStatus.errors.length}):</span>
                <ul>{genStatus.errors.slice(-3).map((e, i) => <li key={i}>{e}</li>)}</ul>
              </div>
            )}
            <div className="gen-bar-actions">
              {!genStatus.generating && genStatus.remaining > 0 && (
                <button className="gen-btn primary" onClick={handleGenerateAll}>
                  {genStatus.cached > 0 ? `Üretmeye Devam Et (${genStatus.remaining})` : `Tüm İçeriği Üret (${genStatus.total})`}
                </button>
              )}
              {genStatus.generating && (
                <button className="gen-btn stop" onClick={handleStopGeneration}>Durdur</button>
              )}
              {allGenerated && !genStatus.generating && (
                <span className="gen-bar-done-msg">Dersler açıldığında anında yüklenecektir.</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NodeTree({ nodes, level, onOpenLesson }: { nodes: ContentNode[]; level: number; onOpenLesson: (slug: string) => void; }) {
  return (
    <div className={`tree level-${level}`}>
      {nodes.map((node) => (
        <NodeTreeItem key={node.id} node={node} level={level} onOpenLesson={onOpenLesson} />
      ))}
    </div>
  );
}

function NodeTreeItem({ node, level, onOpenLesson }: { node: ContentNode; level: number; onOpenLesson: (slug: string) => void; }) {
  const [children, setChildren] = useState<ContentNode[]>([]);
  const [expanded, setExpanded] = useState(false);

  const toggle = async () => {
    if (!expanded && children.length === 0 && node.type !== "lesson") {
      const c = await fetchChildren(node.id);
      setChildren(c);
    }
    setExpanded(!expanded);
  };

  if (node.type === "lesson") {
    return (
      <button className="tree-item lesson" onClick={() => onOpenLesson(node.slug)}>
        <span className="tree-leaf" />
        <span className="tree-text">{node.title}</span>
      </button>
    );
  }

  return (
    <div className="tree-branch">
      <button className="tree-item branch" onClick={toggle}>
        <span className="tree-toggle">{expanded ? "−" : "+"}</span>
        <span className="tree-tag">{node.type}</span>
        <span className="tree-text">{node.title}</span>
      </button>
      {expanded && children.length > 0 && (
        <NodeTree nodes={children} level={level + 1} onOpenLesson={onOpenLesson} />
      )}
    </div>
  );
}

function moduleIcon(slug: string): string {
  const icons: Record<string, string> = {
    "tekstil-bilgileri": "01",
    "moda-bilgileri": "02",
    "ic-giyim": "03",
    surdurulebilirlik: "04",
    strateji: "05",
    istatistik: "06",
    "elise-studio": "07",
    "bilgi-bankasi": "08",
  };
  return icons[slug] || "·";
}
