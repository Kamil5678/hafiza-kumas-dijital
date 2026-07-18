import { useEffect, useState, useCallback } from "react";
import { generateLesson, fetchCachedLesson, fetchNotes, saveNote, deleteNote, type LessonResult, type LessonNote } from "../lib/lesson";
import type { ContentNode, Difficulty } from "../lib/supabase";

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "beginner", label: "Başlangıç" }, { value: "intermediate", label: "Orta" }, { value: "advanced", label: "İleri" },
];

function str(v: unknown): string { return typeof v === "string" ? v : ""; }
function arr<T = unknown>(v: unknown): T[] { return Array.isArray(v) ? (v as T[]) : []; }
function obj(v: unknown): Record<string, unknown> { return (v && typeof v === "object" && !Array.isArray(v)) ? (v as Record<string, unknown>) : {}; }

type TabId = "content" | "visuals" | "quiz" | "flashcards" | "notes" | "related";
const TABS: { id: TabId; label: string }[] = [
  { id: "content", label: "Konu Anlatımı" }, { id: "visuals", label: "Görseller" },
  { id: "quiz", label: "Quiz" }, { id: "flashcards", label: "Flash Kart" },
  { id: "notes", label: "Notlar" }, { id: "related", label: "İlgili Konular" },
];

export interface LessonNav { prev: ContentNode | null; next: ContentNode | null; parent: ContentNode | null; root: ContentNode | null; }

export function LessonView({ node, nav, onNavigate, onBackToModule, onBackToDashboard }: {
  node: ContentNode; nav: LessonNav; onNavigate: (slug: string) => void; onBackToModule: () => void; onBackToDashboard: () => void;
}) {
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [result, setResult] = useState<LessonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("content");

  const load = useCallback(async (force: boolean) => {
    setLoading(true); setError(null);
    try {
      const cached = await fetchCachedLesson(node.slug, difficulty);
      if (cached && !force) setResult(cached);
      else { const r = await generateLesson({ slug: node.slug, difficulty, force }); setResult(r); }
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); setResult(null); }
    finally { setLoading(false); }
  }, [node.slug, difficulty]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true); setError(null);
      try { const cached = await fetchCachedLesson(node.slug, difficulty); if (active) { if (cached) setResult(cached); else await load(false); } }
      catch (e) { if (active) setError(e instanceof Error ? e.message : String(e)); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [node.slug, difficulty, load]);

  const c = result?.content ?? {};

  return (
    <section className="lesson-view">
      <div className="lesson-header">
        <div className="lesson-header-main">
          <div className="lesson-eyebrow">{arr<string>(c.module_path).map((p, i) => <span key={i}>{p}{i < arr(c.module_path).length - 1 ? " › " : ""}</span>)}</div>
          <h1 className="lesson-title">{str(c.title) || node.title}</h1>
          {str(c.definition) && <p className="lesson-definition">{str(c.definition)}</p>}
        </div>
        <div className="lesson-header-side">
          <div className="lesson-meta-row">
            {str(c.difficulty_label) && <span className="meta-pill">{str(c.difficulty_label)}</span>}
            {typeof c.estimated_minutes === "number" && <span className="meta-pill">~{c.estimated_minutes} dk</span>}
            {result?.cached && <span className="meta-pill muted">Kayıtlı</span>}
          </div>
          <div className="lesson-controls">
            <label className="control"><span>Seviye</span>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
                {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </label>
            <button className="btn-ghost" disabled={loading} onClick={() => load(true)}>↻ Yeniden Üret</button>
          </div>
        </div>
      </div>

      {error && !loading && (
        <div className="lesson-error">
          <div className="lesson-error-icon">⚠</div>
          <div className="lesson-error-text"><strong>İçerik yüklenemedi.</strong><p>{error}</p></div>
          <button className="btn-primary" onClick={() => load(false)}>Tekrar Dene</button>
        </div>
      )}

      {loading && <div className="lesson-loading"><div className="loading-spinner" /><p>İçerik hazırlanıyor…</p></div>}

      {result && !loading && !error && (
        <>
          {arr<string>(c.tags).length > 0 && <div className="tag-row">{arr<string>(c.tags).map((t, i) => <span key={i} className="tag">{t}</span>)}</div>}
          <nav className="lesson-tabs">
            {TABS.map((t) => <button key={t.id} className={`tab ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>)}
          </nav>
          <div className="lesson-content">
            {activeTab === "content" && <ContentTab c={c} />}
            {activeTab === "visuals" && <VisualsTab c={c} />}
            {activeTab === "quiz" && <QuizTab c={c} />}
            {activeTab === "flashcards" && <FlashcardsTab c={c} />}
            {activeTab === "notes" && <NotesTab node={node} />}
            {activeTab === "related" && <RelatedTab c={c} onNavigate={onNavigate} />}
          </div>

          <nav className="lesson-nav">
            <button className="nav-btn" disabled={!nav.prev} onClick={() => nav.prev && onNavigate(nav.prev.slug)}>
              ← Önceki Ders{nav.prev && <span className="nav-btn-title">{nav.prev.title}</span>}
            </button>
            <div className="nav-center">
              <button className="nav-link" onClick={onBackToModule}>↑ Modüle Dön</button>
              <button className="nav-link" onClick={onBackToDashboard}>⊞ Panele Dön</button>
            </div>
            <button className="nav-btn right" disabled={!nav.next} onClick={() => nav.next && onNavigate(nav.next.slug)}>
              Sonraki Ders →{nav.next && <span className="nav-btn-title">{nav.next.title}</span>}
            </button>
          </nav>
        </>
      )}
    </section>
  );
}

function Card({ title, children, icon }: { title: string; children: React.ReactNode; icon?: string }) {
  return (<div className="content-card"><div className="card-head">{icon && <span className="card-icon">{icon}</span>}<h3 className="card-title">{title}</h3></div><div className="card-body">{children}</div></div>);
}
function Paragraphs({ items }: { items: unknown }) { const ps = arr<string>(items); return ps.length ? <>{ps.map((p, i) => <p key={i} className="lesson-p">{p}</p>)}</> : null; }
function DataTable({ data }: { data: Record<string, unknown> }) {
  const headers = arr<string>(data.headers); const rows = arr<unknown[]>(data.rows);
  if (!headers.length || !rows.length) return null;
  return (<table className="data-table"><thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{arr<string>(r).map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table>);
}

function ContentTab({ c }: { c: Record<string, unknown> }) {
  const detailed = obj(c.detailed_explanation); const scientific = obj(c.scientific_info);
  const tables = obj(c.comparison_tables); const summary = obj(c.summary);
  return (
    <div className="tab-grid">
      {arr<string>(c.introduction).length > 0 && <Card title="Giriş" icon="▸"><Paragraphs items={c.introduction} /></Card>}
      {arr<string>(c.learning_objectives).length > 0 && <Card title="Öğrenme Hedefleri" icon="◎"><ol className="objective-list">{arr<string>(c.learning_objectives).map((o, i) => <li key={i}>{o}</li>)}</ol></Card>}
      {arr<Record<string, unknown>>(detailed.sections).length > 0 && <Card title="Detaylı Anlatım" icon="❡">{arr<Record<string, unknown>>(detailed.sections).map((s, i) => <div key={i} className="sub-section"><h4 className="sub-heading">{str(s.heading)}</h4><Paragraphs items={s.paragraphs} />{arr<string>(s.items).length > 0 && <ul className="item-list">{arr<string>(s.items).map((it, j) => <li key={j}>{it}</li>)}</ul>}</div>)}</Card>}
      {arr<string>(scientific.paragraphs).length > 0 && <Card title="Bilimsel ve Teknik Bilgiler" icon="Σ"><Paragraphs items={scientific.paragraphs} />{arr<Record<string, unknown>>(scientific.formulas).length > 0 && <div className="formula-list">{arr<Record<string, unknown>>(scientific.formulas).map((f, i) => <div key={i} className="formula-row"><code className="formula">{str(f.formula)}</code><span className="formula-desc">{str(f.description)}</span></div>)}</div>}</Card>}
      {arr<Record<string, unknown>>(c.production_process).length > 0 && <Card title="Üretim Süreci" icon="⚙"><div className="process-steps">{arr<Record<string, unknown>>(c.production_process).map((s, i) => <div key={i} className="process-step"><div className="step-marker">{Number(s.step) || i + 1}</div><div className="step-content"><h4 className="step-title">{str(s.title)}</h4><p className="step-desc">{str(s.description)}</p></div></div>)}</div></Card>}
      {arr<Record<string, unknown>>(c.properties).length > 0 && <Card title="Fiziksel ve Kimyasal Özellikler" icon="♭"><table className="data-table"><thead><tr><th>Özellik</th><th>Değer</th><th>Birim</th><th>Not</th></tr></thead><tbody>{arr<Record<string, unknown>>(c.properties).map((p, i) => <tr key={i}><td>{str(p.property)}</td><td>{str(p.value)}</td><td>{str(p.unit)}</td><td>{str(p.note)}</td></tr>)}</tbody></table></Card>}
      {arr<string>(c.advantages).length > 0 && <Card title="Avantajlar" icon="+"><ul className="pro-list">{arr<string>(c.advantages).map((a, i) => <li key={i}>{a}</li>)}</ul></Card>}
      {arr<string>(c.disadvantages).length > 0 && <Card title="Dezavantajlar" icon="−"><ul className="con-list">{arr<string>(c.disadvantages).map((d, i) => <li key={i}>{d}</li>)}</ul></Card>}
      {arr<Record<string, unknown>>(c.applications).length > 0 && <Card title="Uygulama Alanları" icon="◎"><ul className="app-list">{arr<Record<string, unknown>>(c.applications).map((a, i) => <li key={i}><strong>{str(a.sector)}</strong> — {str(a.use)}</li>)}</ul></Card>}
      {arr<Record<string, unknown>>(c.industry_examples).length > 0 && <Card title="Endüstri Örnekleri" icon="⌘"><div className="example-grid">{arr<Record<string, unknown>>(c.industry_examples).map((e, i) => <div key={i} className="example-card"><h4 className="example-company">{str(e.company)}</h4><p className="example-scenario">{str(e.scenario)}</p><div className="example-result">{str(e.result)}</div></div>)}</div></Card>}
      {arr<Record<string, unknown>>(c.case_studies).length > 0 && <Card title="Vaka Çalışmaları" icon="◇"><div className="case-grid">{arr<Record<string, unknown>>(c.case_studies).map((cs, i) => <div key={i} className="case-card"><h4 className="case-title">{str(cs.title)}</h4><div className="case-row"><span className="case-label">Sorun:</span> {str(cs.problem)}</div><div className="case-row"><span className="case-label">Çözüm:</span> {str(cs.solution)}</div><div className="case-row"><span className="case-label">Sonuç:</span> {str(cs.result)}</div></div>)}</div></Card>}
      {arr<string>(obj(tables.types).headers).length > 0 && <Card title="Karşılaştırma Tabloları" icon="⊞">{["types", "pros_cons"].map((k) => { const t = obj(tables[k]); if (!str(t.title) || !arr<string>(t.headers).length) return null; return <div key={k} className="table-block"><h4 className="table-caption">{str(t.title)}</h4><DataTable data={t} /></div>; })}</Card>}
      {arr<string>(c.important_notes).length > 0 && <Card title="Önemli Notlar" icon="!"><ul className="notes-list">{arr<string>(c.important_notes).map((n, i) => <li key={i}>{n}</li>)}</ul></Card>}
      {arr<Record<string, unknown>>(c.common_mistakes).length > 0 && <Card title="Yaygın Hatalar" icon="✗"><div className="mistake-list">{arr<Record<string, unknown>>(c.common_mistakes).map((m, i) => <div key={i} className="mistake-row"><div className="mistake-wrong">✗ {str(m.mistake)}</div><div className="mistake-right">✓ {str(m.correction)}</div></div>)}</div></Card>}
      {arr<string>(c.best_practices).length > 0 && <Card title="En İyi Uygulamalar" icon="✓"><ul className="best-list">{arr<string>(c.best_practices).map((b, i) => <li key={i}>{b}</li>)}</ul></Card>}
      {arr<Record<string, unknown>>(c.faqs).length > 0 && <Card title="Sıkça Sorulan Sorular" icon="?"><div className="faq-list">{arr<Record<string, unknown>>(c.faqs).map((f, i) => <div key={i} className="faq-item"><div className="faq-q">{str(f.q)}</div><div className="faq-a">{str(f.a)}</div></div>)}</div></Card>}
      {arr<Record<string, unknown>>(c.key_terms).length > 0 && <Card title="Anahtar Terimler" icon="§"><dl className="glossary">{arr<Record<string, unknown>>(c.key_terms).map((t, i) => <div key={i} className="glossary-row"><dt>{str(t.term)}</dt><dd>{str(t.definition)}</dd></div>)}</dl></Card>}
      {arr<string>(summary.paragraphs).length > 0 && <Card title="Özet" icon="≡"><Paragraphs items={summary.paragraphs} />{arr<string>(summary.takeaways).length > 0 && <ul className="takeaway-list">{arr<string>(summary.takeaways).map((t, i) => <li key={i}>{t}</li>)}</ul>}</Card>}
      {arr<Record<string, unknown>>(c.references).length > 0 && <Card title="Kaynaklar" icon="¶"><ol className="ref-list">{arr<Record<string, unknown>>(c.references).map((r, i) => <li key={i}>{str(r.title)} — {str(r.author)} ({str(r.year)})</li>)}</ol></Card>}
    </div>
  );
}

function VisualsTab({ c }: { c: Record<string, unknown> }) {
  const visuals = arr<Record<string, unknown>>(c.visuals);
  if (!visuals.length) return <div className="tab-empty">Görsel önerisi yok.</div>;
  return (<div className="tab-grid"><Card title="Görsel ve Diyagram Önerileri" icon="▦"><div className="visual-grid">{visuals.map((v, i) => <div key={i} className="visual-card"><div className="visual-placeholder"><span className="visual-icon">{str(v.layout) === "vertical-flow" ? "↓" : str(v.layout) === "cross-section" ? "▦" : str(v.layout) === "line-chart" ? "📈" : str(v.layout) === "comparison-table" ? "⊞" : str(v.layout) === "machine-diagram" ? "⚙" : "📊"}</span><span className="visual-type-tag">{str(v.type)}</span></div><h4 className="visual-title">{str(v.title)}</h4><p className="visual-desc">{str(v.description)}</p>{str(v.prompt) && <div className="visual-prompt"><span className="prompt-label">Görsel İstem:</span><code>{str(v.prompt)}</code></div>}</div>)}</div></Card></div>);
}

function QuizTab({ c }: { c: Record<string, unknown> }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const quiz = arr<Record<string, unknown>>(c.quiz);
  if (!quiz.length) return <div className="tab-empty">Quiz bulunmuyor.</div>;
  const score = Object.entries(answers).filter(([idx, ans]) => ans === Number(quiz[Number(idx)].correct_index)).length;

  return (
    <div className="tab-grid">
      <Card title={`Mini Quiz (${quiz.length} soru)`} icon="✓">
        {showResults && <div className="quiz-result"><span className="quiz-score">{score} / {quiz.length}</span><span className="quiz-feedback">{score === quiz.length ? "Mükemmel!" : score >= quiz.length * 0.7 ? "İyi!" : "Tekrar önerilir."}</span></div>}
        <ol className="quiz-list">
          {quiz.map((q, i) => (
            <li key={i} className="quiz-q">
              <div className="quiz-question-row">
                <span className="quiz-type-badge">{str(q.type_label)}</span>
                <div className="quiz-question">{str(q.question)}</div>
              </div>
              <ul className="quiz-opts">
                {arr<string>(q.options).map((opt, j) => {
                  const selected = answers[i] === j; const correct = Number(q.correct_index) === j;
                  let cls = "";
                  if (showResults) { if (correct) cls = "correct"; else if (selected) cls = "wrong"; } else if (selected) cls = "selected";
                  return (<li key={j} className={cls} onClick={() => !showResults && setAnswers({ ...answers, [i]: j })}><span className="opt-letter">{String.fromCharCode(65 + j)}</span><span className="opt-text">{opt}</span>{showResults && correct && <span className="opt-mark">✓</span>}{showResults && selected && !correct && <span className="opt-mark">✗</span>}</li>);
                })}
              </ul>
              {showResults && str(q.explanation) && <div className="quiz-expl"><strong>Açıklama:</strong> {str(q.explanation)}</div>}
              {showResults && arr<string>(q.explanations).length > 0 && (
                <div className="quiz-expl-detail">
                  {arr<string>(q.explanations).map((e, j) => <div key={j} className="expl-line">{e}</div>)}
                </div>
              )}
            </li>
          ))}
        </ol>
        <div className="quiz-actions">
          <button className="btn-primary" onClick={() => setShowResults(!showResults)}>{showResults ? "Cevapları Gizle" : "Cevapları Kontrol Et"}</button>
          {showResults && <button className="btn-ghost" onClick={() => { setAnswers({}); setShowResults(false); }}>↻ Tekrar Dene</button>}
        </div>
      </Card>
    </div>
  );
}

function FlashcardsTab({ c }: { c: Record<string, unknown> }) {
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const cards = arr<Record<string, unknown>>(c.flashcards);
  if (!cards.length) return <div className="tab-empty">Flash kart yok.</div>;
  return (<div className="tab-grid"><Card title={`Flash Kartlar (${cards.length} kart)`} icon="♣"><div className="flashcards-grid">{cards.map((card, i) => <div key={i} className={`flashcard ${flipped[i] ? "flipped" : ""}`} onClick={() => setFlipped({ ...flipped, [i]: !flipped[i] })}><div className="flashcard-inner"><div className="flashcard-front"><span className="flashcard-label">Soru</span><div className="flashcard-text">{str(card.front)}</div><span className="flashcard-hint">Cevap için tıkla</span></div><div className="flashcard-back"><span className="flashcard-label">Cevap</span><div className="flashcard-text">{str(card.back)}</div><span className="flashcard-hint">Geri için tıkla</span></div></div></div>)}</div></Card></div>);
}

function NotesTab({ node }: { node: ContentNode }) {
  const [notes, setNotes] = useState<LessonNote[]>([]); const [newNote, setNewNote] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { setLoading(true); setError(null); try { setNotes(await fetchNotes(node.slug)); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setLoading(false); } }, [node.slug]);
  useEffect(() => { load(); }, [load]);
  const handleSave = async () => { if (!newNote.trim()) return; try { setNotes([await saveNote(node.slug, newNote.trim()), ...notes]); setNewNote(""); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } };
  const handleDelete = async (id: string) => { try { await deleteNote(id); setNotes(notes.filter((n) => n.id !== id)); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } };
  return (<div className="tab-grid"><Card title="Ders Notların" icon="✎"><div className="note-input"><textarea className="note-textarea" placeholder="Notunu buraya yaz…" value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={4} /><button className="btn-primary" disabled={!newNote.trim()} onClick={handleSave}>Notu Kaydet</button></div>{error && <div className="lesson-error-inline">{error}</div>}{loading ? <div className="tab-empty">Notlar yükleniyor…</div> : notes.length === 0 ? <div className="tab-empty">Henüz not yok.</div> : <div className="notes-list">{notes.map((n) => <div key={n.id} className="note-card"><div className="note-text">{n.note}</div><div className="note-meta"><span>{new Date(n.updated_at).toLocaleString("tr-TR")}</span><button className="note-delete" onClick={() => handleDelete(n.id)}>Sil</button></div></div>)}</div>}</Card></div>);
}

function RelatedTab({ c, onNavigate }: { c: Record<string, unknown>; onNavigate: (slug: string) => void }) {
  const related = arr<Record<string, unknown>>(c.related_lessons); const keyTerms = arr<Record<string, unknown>>(c.key_terms);
  return (<div className="tab-grid">{related.length > 0 && <Card title="İlgili Dersler" icon="🔗"><div className="related-grid">{related.map((r, i) => <button key={i} className="related-card" onClick={() => onNavigate(str(r.slug))}><div className="related-title">{str(r.title)}</div><div className="related-relation">{str(r.relation)}</div></button>)}</div></Card>}{keyTerms.length > 0 && <Card title="Anahtar Terimler" icon="§"><dl className="glossary">{keyTerms.map((t, i) => <div key={i} className="glossary-row"><dt>{str(t.term)}</dt><dd>{str(t.definition)}</dd></div>)}</dl></Card>}</div>);
}
