import { useEffect, useState, useCallback } from "react";
import {
  generateLesson,
  fetchCachedLesson,
  fetchNotes,
  saveNote,
  deleteNote,
  type LessonResult,
  type LessonNote,
} from "../lib/lesson";
import type { ContentNode, Difficulty } from "../lib/supabase";

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "beginner", label: "Başlangıç" },
  { value: "intermediate", label: "Orta" },
  { value: "advanced", label: "İleri" },
];

// Type helpers
function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function arr<T = unknown>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}
function obj(v: unknown): Record<string, unknown> {
  return (v && typeof v === "object" && !Array.isArray(v)) ? (v as Record<string, unknown>) : {};
}

type TabId = "content" | "visuals" | "quiz" | "flashcards" | "notes" | "related" | "ask";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "content", label: "Konu Anlatımı", icon: "📖" },
  { id: "visuals", label: "Görseller ve Diyagramlar", icon: "📊" },
  { id: "quiz", label: "Quiz", icon: "✅" },
  { id: "flashcards", label: "Flash Kart", icon: "🃏" },
  { id: "notes", label: "Notlar", icon: "📝" },
  { id: "related", label: "İlgili Konular", icon: "🔗" },
  { id: "ask", label: "AI'ya Soru Sor", icon: "🤖" },
];

export function LessonView({
  node,
  onNavigate,
}: {
  node: ContentNode;
  onNavigate: (slug: string) => void;
}) {
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [result, setResult] = useState<LessonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("content");

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const cached = await fetchCachedLesson(node.slug, difficulty);
      if (cached && !force) {
        setResult(cached);
      } else {
        const r = await generateLesson({ slug: node.slug, difficulty, force });
        setResult(r);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [node.slug, difficulty]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const cached = await fetchCachedLesson(node.slug, difficulty);
        if (active) setResult(cached);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [node.slug, difficulty]);

  const c = result?.content ?? {};

  return (
    <section className="lesson-view">
      <div className="lesson-head">
        <div className="lesson-head-info">
          <div className="lesson-head-title">{str(c.title) || node.title}</div>
          {arr<string>(c.module_path).length > 0 && (
            <div className="content-path">
              {arr<string>(c.module_path).map((p, i) => (
                <span key={i}>{p}{i < arr(c.module_path).length - 1 ? " › " : ""}</span>
              ))}
            </div>
          )}
        </div>
        <div className="lesson-controls">
          <label className="control">
            <span>Seviye</span>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
              {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </label>
          <button className="btn-engine ghost" disabled={loading} onClick={() => load(true)} title="Yeniden üret">
            ↻ Yeniden Üret
          </button>
        </div>
      </div>

      {error && <div className="engine-error">Hata: {error}</div>}

      {loading && !result && <div className="engine-loading">Ders içeriği hazırlanıyor…</div>}

      {result && !loading && (
        <div className="lesson-body">
          <div className="content-meta">
            <span className={`badge ${result.cached ? "cached" : "fresh"}`}>
              {result.cached ? "Kayıtlı" : "Yeni üretildi"}
            </span>
            {result.generated_by && (
              <span className="badge source">{result.generated_by === "ai" ? "AI" : "Sistem"}</span>
            )}
            <span className="meta-date">{new Date(result.generated_at).toLocaleString("tr-TR")}</span>
            {typeof c.estimated_minutes === "number" && (
              <span className="meta-date">~{c.estimated_minutes} dk</span>
            )}
            {str(c.difficulty_label) && (
              <span className="badge diff">{str(c.difficulty_label)}</span>
            )}
          </div>

          {arr<string>(c.tags).length > 0 && (
            <div className="tag-row">
              {arr<string>(c.tags).map((t, i) => <span key={i} className="tag">{t}</span>)}
            </div>
          )}

          <nav className="lesson-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`tab ${activeTab === t.id ? "active" : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                <span className="tab-icon">{t.icon}</span>
                <span className="tab-label">{t.label}</span>
              </button>
            ))}
          </nav>

          <div className="lesson-content">
            {activeTab === "content" && <ContentTab c={c} />}
            {activeTab === "visuals" && <VisualsTab c={c} />}
            {activeTab === "quiz" && <QuizTab c={c} />}
            {activeTab === "flashcards" && <FlashcardsTab c={c} />}
            {activeTab === "notes" && <NotesTab node={node} />}
            {activeTab === "related" && <RelatedTab c={c} onNavigate={onNavigate} />}
            {activeTab === "ask" && <AskTab node={node} />}
          </div>
        </div>
      )}
    </section>
  );
}

// ---- Section helpers ----
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="section">
      <h3 className="section-title">{title}</h3>
      <div className="section-body">{children}</div>
    </div>
  );
}

function Paragraphs({ items }: { items: unknown }) {
  const ps = arr<string>(items);
  if (ps.length === 0) return null;
  return <>{ps.map((p, i) => <p key={i} className="lesson-p">{p}</p>)}</>;
}

function DataTable({ data }: { data: Record<string, unknown> }) {
  const headers = arr<string>(data.headers);
  const rows = arr<unknown[]>(data.rows);
  if (headers.length === 0 || rows.length === 0) return null;
  return (
    <table className="data-table">
      <thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>{arr<string>(row).map((cell, j) => <td key={j}>{cell}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

// ---- Tab: Konu Anlatımı ----
function ContentTab({ c }: { c: Record<string, unknown> }) {
  const summary = obj(c.summary);
  const detailed = obj(c.detailed_explanation);
  const scientific = obj(c.scientific_explanation);
  const tables = obj(c.tables);
  const lessonSummary = obj(c.lesson_summary);

  return (
    <div className="tab-content">
      {/* Ders Özeti */}
      <Section title="Dersin Özeti">
        {str(summary.description) && <p className="lesson-p">{str(summary.description)}</p>}
        {str(summary.one_liner) && <p className="lesson-lead">{str(summary.one_liner)}</p>}
        {arr<string>(summary.key_points).length > 0 && (
          <ul className="key-points">
            {arr<string>(summary.key_points).map((k, i) => <li key={i}>{k}</li>)}
          </ul>
        )}
      </Section>

      {/* Öğrenme Hedefleri */}
      <Section title="Öğrenme Hedefleri">
        <ol className="objectives">
          {arr<string>(c.learning_objectives).map((o, i) => <li key={i}>{o}</li>)}
        </ol>
      </Section>

      {/* Detaylı Anlatım */}
      {arr<string>(detailed).length > 0 || obj(detailed.introduction).heading ? (
        <Section title="Detaylı Anlatım">
          {["introduction", "definition", "classification", "importance"].map((key) => {
            const part = obj(detailed[key]);
            if (!str(part.heading)) return null;
            return (
              <div key={key} className="sub-section">
                <h4 className="sub-title">{str(part.heading)}</h4>
                <Paragraphs items={part.paragraphs} />
                {arr<string>(part.items).length > 0 && (
                  <ul className="item-list">
                    {arr<string>(part.items).map((it, i) => <li key={i}>{it}</li>)}
                  </ul>
                )}
              </div>
            );
          })}
        </Section>
      ) : null}

      {/* Bilimsel Açıklamalar */}
      {str(scientific.heading) && (
        <Section title="Bilimsel Açıklamalar">
          <Paragraphs items={scientific.paragraphs} />
          {arr<Record<string, unknown>>(scientific.formulas).length > 0 && (
            <div className="formula-list">
              {arr<Record<string, unknown>>(scientific.formulas).map((f, i) => (
                <div key={i} className="formula-row">
                  <code className="formula">{str(f.formula)}</code>
                  <span className="formula-desc">{str(f.description)}</span>
                </div>
              ))}
            </div>
          )}
          {arr<Record<string, unknown>>(scientific.parameters).length > 0 && (
            <table className="data-table">
              <thead><tr><th>Parametre</th><th>Birim</th><th>Tipik Değer</th></tr></thead>
              <tbody>
                {arr<Record<string, unknown>>(scientific.parameters).map((p, i) => (
                  <tr key={i}>
                    <td>{str(p.name)}</td>
                    <td>{str(p.unit)}</td>
                    <td>{str(p.typical)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      )}

      {/* Örnekler */}
      {arr<Record<string, unknown>>(c.examples).length > 0 && (
        <Section title="Örnekler">
          <div className="example-grid">
            {arr<Record<string, unknown>>(c.examples).map((e, i) => (
              <div key={i} className="example-card">
                <h4 className="example-title">{str(e.title)}</h4>
                <div className="example-row"><span className="example-label">Senaryo:</span> {str(e.scenario)}</div>
                <div className="example-row"><span className="example-label">Detay:</span> {str(e.details)}</div>
                <div className="example-row"><span className="example-label">Sonuç:</span> {str(e.outcome)}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Tablolar */}
      {arr<string>(obj(tables.properties).headers).length > 0 && (
        <Section title="Tablolar">
          {["properties", "comparison", "pros_cons"].map((key) => {
            const t = obj(tables[key]);
            if (!str(t.title) || arr<string>(t.headers).length === 0) return null;
            return (
              <div key={key} className="table-block">
                <h4 className="table-caption">{str(t.title)}</h4>
                <DataTable data={t} />
              </div>
            );
          })}
        </Section>
      )}

      {/* İlgili Makineler */}
      {arr<Record<string, unknown>>(c.related_machines).length > 0 && (
        <Section title="İlgili Makineler">
          <div className="machine-grid">
            {arr<Record<string, unknown>>(c.related_machines).map((m, i) => (
              <div key={i} className="machine-card">
                <h4>{str(m.name)}</h4>
                <p className="machine-func">{str(m.function)}</p>
                {arr<string>(m.specs).length > 0 && (
                  <ul className="spec-list">
                    {arr<string>(m.specs).map((s, j) => <li key={j}>{s}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* İlgili Malzemeler */}
      {arr<Record<string, unknown>>(c.related_materials).length > 0 && (
        <Section title="İlgili Malzemeler">
          <div className="material-list">
            {arr<Record<string, unknown>>(c.related_materials).map((m, i) => (
              <div key={i} className="material-item">
                <div className="material-name">{str(m.name)}</div>
                <div className="material-type">{str(m.type)}</div>
                <div className="material-desc">{str(m.description)}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Özet */}
      {arr<string>(lessonSummary.paragraphs).length > 0 && (
        <Section title="Özet">
          <Paragraphs items={lessonSummary.paragraphs} />
          {arr<string>(lessonSummary.takeaways).length > 0 && (
            <ul className="takeaways">
              {arr<string>(lessonSummary.takeaways).map((t, i) => <li key={i} className="takeaway">{t}</li>)}
            </ul>
          )}
        </Section>
      )}

      {/* Terimler Sözlüğü */}
      {arr<Record<string, unknown>>(c.terminology).length > 0 && (
        <Section title="Terimler Sözlüğü">
          <dl className="glossary">
            {arr<Record<string, unknown>>(c.terminology).map((t, i) => (
              <div key={i} className="glossary-row">
                <dt>{str(t.term)}</dt>
                <dd>{str(t.definition)}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}
    </div>
  );
}

// ---- Tab: Görseller ve Diyagramlar ----
function VisualsTab({ c }: { c: Record<string, unknown> }) {
  const visuals = arr<Record<string, unknown>>(c.visual_diagrams);
  if (visuals.length === 0) return <div className="tab-empty">Bu ders için görsel önerisi bulunmuyor.</div>;
  return (
    <div className="tab-content">
      <Section title="Görsel ve Diyagram Önerileri">
        <p className="lesson-p">Aşağıdaki görseller ve diyagramlar bu dersin konusunu desteklemek için önerilmiştir. Her diyagram, konunun daha iyi anlaşılması için tasarlanmıştır.</p>
        <div className="visual-grid">
          {visuals.map((v, i) => (
            <div key={i} className="visual-card">
              <div className="visual-placeholder">
                <span className="visual-icon">
                  {str(v.layout) === "vertical-flow" ? "↓" :
                   str(v.layout) === "cross-section" ? "⬛" :
                   str(v.layout) === "line-chart" ? "📈" :
                   str(v.layout) === "comparison-table" ? "⊞" : "📊"}
                </span>
                <span className="visual-type-tag">{str(v.type)}</span>
              </div>
              <h4 className="visual-title">{str(v.title)}</h4>
              <p className="visual-desc">{str(v.description)}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ---- Tab: Quiz ----
function QuizTab({ c }: { c: Record<string, unknown> }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const quiz = arr<Record<string, unknown>>(c.mini_quiz);

  if (quiz.length === 0) return <div className="tab-empty">Bu ders için quiz bulunmuyor.</div>;

  const score = Object.entries(answers).filter(
    ([idx, ans]) => ans === Number(quiz[Number(idx)].correct_index),
  ).length;

  return (
    <div className="tab-content">
      <Section title="Mini Quiz">
        {showResults && (
          <div className="quiz-result">
            Sonucun: <strong>{score}</strong> / {quiz.length}
            {score === quiz.length ? " — Mükemmel!" : score >= quiz.length * 0.7 ? " — İyi!" : " — Tekrar etmen önerilir."}
          </div>
        )}
        <ol className="quiz-list">
          {quiz.map((q, i) => (
            <li key={i} className="quiz-q">
              <div className="quiz-question">{str(q.question)}</div>
              <ul className="quiz-opts">
                {arr<string>(q.options).map((opt, j) => {
                  const selected = answers[i] === j;
                  const correct = Number(q.correct_index) === j;
                  let cls = "";
                  if (showResults) {
                    if (correct) cls = "correct";
                    else if (selected) cls = "wrong";
                  } else if (selected) cls = "selected";
                  return (
                    <li
                      key={j}
                      className={cls}
                      onClick={() => !showResults && setAnswers({ ...answers, [i]: j })}
                    >
                      <span className="opt-letter">{String.fromCharCode(65 + j)}</span>
                      <span className="opt-text">{opt}</span>
                      {showResults && correct && <span className="opt-mark">✓</span>}
                      {showResults && selected && !correct && <span className="opt-mark">✗</span>}
                    </li>
                  );
                })}
              </ul>
              {showResults && str(q.explanation) && (
                <div className="quiz-expl"><strong>Açıklama:</strong> {str(q.explanation)}</div>
              )}
            </li>
          ))}
        </ol>
        <div className="quiz-actions">
          <button className="btn-engine" onClick={() => setShowResults(!showResults)}>
            {showResults ? "Cevapları Gizle" : "Cevapları Kontrol Et"}
          </button>
          {showResults && (
            <button className="btn-engine ghost" onClick={() => { setAnswers({}); setShowResults(false); }}>
              ↻ Tekrar Dene
            </button>
          )}
        </div>
      </Section>
    </div>
  );
}

// ---- Tab: Flash Kartlar ----
function FlashcardsTab({ c }: { c: Record<string, unknown> }) {
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const cards = arr<Record<string, unknown>>(c.flashcards);

  if (cards.length === 0) return <div className="tab-empty">Bu ders için flash kart bulunmuyor.</div>;

  return (
    <div className="tab-content">
      <Section title="Flash Kartlar">
        <p className="lesson-p">Kartlara tıklayarak cevapları görebilirsin. Hızlı tekrar için idealdir.</p>
        <div className="flashcards-grid">
          {cards.map((card, i) => (
            <div
              key={i}
              className={`flashcard ${flipped[i] ? "flipped" : ""}`}
              onClick={() => setFlipped({ ...flipped, [i]: !flipped[i] })}
            >
              <div className="flashcard-inner">
                <div className="flashcard-front">
                  <span className="flashcard-label">Soru</span>
                  <div className="flashcard-text">{str(card.front)}</div>
                  <span className="flashcard-hint">Cevap için tıkla</span>
                </div>
                <div className="flashcard-back">
                  <span className="flashcard-label">Cevap</span>
                  <div className="flashcard-text">{str(card.back)}</div>
                  <span className="flashcard-hint">Geri çevirmek için tıkla</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ---- Tab: Notlar ----
function NotesTab({ node }: { node: ContentNode }) {
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotes(node.slug);
      setNotes(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [node.slug]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!newNote.trim()) return;
    try {
      const saved = await saveNote(node.slug, newNote.trim());
      setNotes([saved, ...notes]);
      setNewNote("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNote(id);
      setNotes(notes.filter((n) => n.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="tab-content">
      <Section title="Ders Notların">
        <p className="lesson-p">Bu derse kişisel notlarını ekle. Notların kaydedilir ve sonradan görüntüleyebilirsin.</p>
        <div className="note-input">
          <textarea
            className="note-textarea"
            placeholder="Notunu buraya yaz…"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={4}
          />
          <button className="btn-engine" disabled={!newNote.trim()} onClick={handleSave}>Notu Kaydet</button>
        </div>
        {error && <div className="engine-error">{error}</div>}
        {loading ? (
          <div className="engine-loading">Notlar yükleniyor…</div>
        ) : notes.length === 0 ? (
          <div className="tab-empty">Henüz not eklenmedi. İlk notunu ekle!</div>
        ) : (
          <div className="notes-list">
            {notes.map((n) => (
              <div key={n.id} className="note-card">
                <div className="note-text">{n.note}</div>
                <div className="note-meta">
                  <span>{new Date(n.updated_at).toLocaleString("tr-TR")}</span>
                  <button className="note-delete" onClick={() => handleDelete(n.id)}>Sil</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

// ---- Tab: İlgili Konular ----
function RelatedTab({ c, onNavigate }: { c: Record<string, unknown>; onNavigate: (slug: string) => void }) {
  const related = arr<Record<string, unknown>>(c.related_topics);
  const terminology = arr<Record<string, unknown>>(c.terminology);

  if (related.length === 0 && terminology.length === 0) {
    return <div className="tab-empty">Bu ders için ilgili konu bulunmuyor.</div>;
  }

  return (
    <div className="tab-content">
      {related.length > 0 && (
        <Section title="İlgili Konular">
          <div className="related-grid">
            {related.map((r, i) => (
              <button
                key={i}
                className="related-card"
                onClick={() => onNavigate(str(r.slug))}
              >
                <div className="related-title">{str(r.title)}</div>
                <div className="related-desc">{str(r.description)}</div>
                <div className="related-relation">{str(r.relation)}</div>
              </button>
            ))}
          </div>
        </Section>
      )}
      {terminology.length > 0 && (
        <Section title="Terimler Sözlüğü">
          <dl className="glossary">
            {terminology.map((t, i) => (
              <div key={i} className="glossary-row">
                <dt>{str(t.term)}</dt>
                <dd>{str(t.definition)}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}
    </div>
  );
}

// ---- Tab: AI'ya Soru Sor ----
function AskTab({ node }: { node: ContentNode }) {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<{ q: string; a: string; loading?: boolean }[]>([]);
  const ask = async () => {
    if (!question.trim()) return;
    const q = question.trim();
    setHistory([...history, { q, a: "", loading: true }]);
    setQuestion("");

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/full-lesson`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ slug: node.slug, difficulty: "intermediate", force: false }),
      });
      const data = await res.json();
      const content = data?.content ?? {};
      // Build an answer from the lesson content
      const summary = content?.summary ?? {};
      const terminology = content?.terminology ?? [];
      const answer = [
        `Bu ders "${content?.title ?? node.title}" konusunu işliyor.`,
        summary?.description ?? "",
        summary?.one_liner ?? "",
        Array.isArray(terminology) && terminology.length > 0
          ? `İlgili terimler: ${terminology.slice(0, 3).map((t: Record<string, unknown>) => t.term).join(", ")}`
          : "",
      ].filter(Boolean).join("\n\n");

      setHistory((prev) => prev.map((h, i) => i === prev.length - 1 ? { q, a: answer } : h));
    } catch {
      setHistory((prev) => prev.map((h, i) =>
        i === prev.length - 1 ? { q, a: "Şu anda cevap veremiyorum. Lütfen tekrar dene." } : h,
      ));
    }
  };

  const suggestedQuestions = [
    `${node.title} nedir?`,
    `${node.title} neden önemlidir?`,
    `${node.title} hangi alanlarda kullanılır?`,
    `${node.title} avantajları nelerdir?`,
  ];

  return (
    <div className="tab-content">
      <Section title="AI'ya Soru Sor">
        <p className="lesson-p">Bu dersle ilgili soru sor. AI, ders içeriğine dayanarak cevaplar.</p>

        <div className="suggested-questions">
          {suggestedQuestions.map((q, i) => (
            <button key={i} className="suggested-q" onClick={() => setQuestion(q)}>
              {q}
            </button>
          ))}
        </div>

        <div className="ask-input">
          <input
            type="text"
            className="ask-text"
            placeholder="Sorunu buraya yaz…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
          />
          <button className="btn-engine" disabled={!question.trim()} onClick={ask}>Sor</button>
        </div>

        <div className="ask-history">
          {history.map((h, i) => (
            <div key={i} className="ask-item">
              <div className="ask-q"><strong>Sen:</strong> {h.q}</div>
              <div className="ask-a"><strong>AI:</strong> {h.loading ? "Düşünüyor…" : h.a}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
