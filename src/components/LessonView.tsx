import { useEffect, useState, useCallback } from "react";
import {
  generateFullLesson,
  fetchCachedFullLesson,
  type FullLessonResult,
} from "../lib/fullLesson";
import type { ContentNode, Difficulty } from "../lib/supabase";

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "beginner", label: "Başlangıç" },
  { value: "intermediate", label: "Orta" },
  { value: "advanced", label: "İleri" },
];

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function arr<T = unknown>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}
function obj(v: unknown): Record<string, unknown> {
  return (v && typeof v === "object" && !Array.isArray(v)) ? (v as Record<string, unknown>) : {};
}

export function LessonView({ node }: { node: ContentNode }) {
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [result, setResult] = useState<FullLessonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const cached = await fetchCachedFullLesson(node.slug, difficulty);
      if (cached && !force) {
        setResult(cached);
      } else {
        const r = await generateFullLesson({ slug: node.slug, difficulty, force });
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
        const cached = await fetchCachedFullLesson(node.slug, difficulty);
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

  const tabs = [
    { id: "overview", label: "Genel Bakış" },
    { id: "content", label: "Ders İçeriği" },
    { id: "process", label: "Süreç & Özellikler" },
    { id: "examples", label: "Örnekler & Vakalar" },
    { id: "practice", label: "Pratik & Quiz" },
    { id: "reference", label: "Terimler & Kaynak" },
  ];

  return (
    <section className="lesson-view">
      <div className="lesson-head">
        <div className="lesson-head-title">Ders İçeriği Motoru</div>
        <div className="lesson-controls">
          <label className="control">
            <span>Seviye</span>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
              {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </label>
          <button className="btn-engine" disabled={loading} onClick={() => load(false)}>
            {loading ? "Yükleniyor…" : "Dersi Aç"}
          </button>
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
              {result.cached ? "Önbellekten" : "Yeni üretildi"}
            </span>
            {result.generated_by && (
              <span className="badge source">{result.generated_by === "ai" ? "AI" : "Determination"}</span>
            )}
            <span className="meta-date">{new Date(result.generated_at).toLocaleString("tr-TR")}</span>
            {typeof c.estimated_minutes === "number" && (
              <span className="meta-date">~{c.estimated_minutes} dk</span>
            )}
          </div>

          <h2 className="lesson-title">{str(c.title) || node.title}</h2>

          {arr(c.module_path).length > 0 && (
            <div className="content-path">
              {arr<string>(c.module_path).map((p, i) => (
                <span key={i}>{p}{i < arr(c.module_path).length - 1 ? " › " : ""}</span>
              ))}
            </div>
          )}

          {arr(c.tags).length > 0 && (
            <div className="tag-row">
              {arr<string>(c.tags).map((t, i) => <span key={i} className="tag">{t}</span>)}
            </div>
          )}

          <nav className="lesson-tabs">
            {tabs.map((t) => (
              <button
                key={t.id}
                className={`tab ${activeTab === t.id ? "active" : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className="lesson-content">
            {activeTab === "overview" && <OverviewTab c={c} />}
            {activeTab === "content" && <ContentTab c={c} />}
            {activeTab === "process" && <ProcessTab c={c} />}
            {activeTab === "examples" && <ExamplesTab c={c} />}
            {activeTab === "practice" && <PracticeTab c={c} />}
            {activeTab === "reference" && <ReferenceTab c={c} />}
          </div>
        </div>
      )}
    </section>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <h3 className="block-title">{title}</h3>
      <div className="block-body">{children}</div>
    </div>
  );
}

function OverviewTab({ c }: { c: Record<string, unknown> }) {
  return (
    <>
      {str(c.introduction) && <Block title="Giriş"><p>{str(c.introduction)}</p></Block>}
      {arr(c.learning_objectives).length > 0 && (
        <Block title="Öğrenme Hedefleri">
          <ul>{arr<string>(c.learning_objectives).map((o, i) => <li key={i}>{o}</li>)}</ul>
        </Block>
      )}
      {str(c.why_it_matters) && <Block title="Bu Konu Neden Önemli?"><p>{str(c.why_it_matters)}</p></Block>}
      {str(c.summary) && <Block title="Özet"><p>{str(c.summary)}</p></Block>}
      {arr(c.key_takeaways).length > 0 && (
        <Block title="Anahtar Noktalar">
          <ul>{arr<string>(c.key_takeaways).map((k, i) => <li key={i}>{k}</li>)}</ul>
        </Block>
      )}
    </>
  );
}

function ContentTab({ c }: { c: Record<string, unknown> }) {
  const comparison = obj(c.comparison_table);
  return (
    <>
      {str(c.full_explanation) && <Block title="Tam Ders Açıklaması"><p className="long-text">{str(c.full_explanation)}</p></Block>}
      {str(c.historical_background) && <Block title="Tarihsel Arka Plan"><p className="long-text">{str(c.historical_background)}</p></Block>}
      {str(c.technical_explanation) && <Block title="Teknik ve Bilimsel Açıklama"><p className="long-text">{str(c.technical_explanation)}</p></Block>}
      {arr(comparison.headers).length > 0 && (
        <Block title="Karşılaştırma Tablosu">
          <table className="data-table">
            <thead>
              <tr>{arr<string>(comparison.headers).map((h, i) => <th key={i}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {arr<unknown[]>(comparison.rows).map((row, i) => (
                <tr key={i}>{arr<string>(row).map((cell, j) => <td key={j}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </Block>
      )}
    </>
  );
}

function ProcessTab({ c }: { c: Record<string, unknown> }) {
  const process = arr<Record<string, unknown>>(c.production_process);
  const properties = arr<Record<string, unknown>>(c.properties);
  return (
    <>
      {process.length > 0 && (
        <Block title="Üretim / Üygulama Süreci">
          <ol className="process-list">
            {process.map((s, i) => (
              <li key={i}>
                <div className="process-step">
                  <span className="step-num">{Number(s.step) || i + 1}</span>
                  <div>
                    <div className="step-title">{str(s.title)}</div>
                    <div className="step-desc">{str(s.description)}</div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Block>
      )}
      {properties.length > 0 && (
        <Block title="Özellikler">
          <table className="data-table">
            <thead><tr><th>Özellik</th><th>Değer</th><th>Not</th></tr></thead>
            <tbody>
              {properties.map((p, i) => (
                <tr key={i}>
                  <td>{str(p.property)}</td>
                  <td>{str(p.value)}</td>
                  <td>{str(p.note)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Block>
      )}
      <div className="two-col">
        {arr<string>(c.advantages).length > 0 && (
          <Block title="Avantajlar">
            <ul>{arr<string>(c.advantages).map((a, i) => <li key={i} className="pro">{a}</li>)}</ul>
          </Block>
        )}
        {arr<string>(c.disadvantages).length > 0 && (
          <Block title="Dezavantajlar">
            <ul>{arr<string>(c.disadvantages).map((d, i) => <li key={i} className="con">{d}</li>)}</ul>
          </Block>
        )}
      </div>
      {arr<Record<string, unknown>>(c.applications).length > 0 && (
        <Block title="Uygulama Alanları">
          <ul>{arr<Record<string, unknown>>(c.applications).map((a, i) => (
            <li key={i}><strong>{str(a.sector)}</strong> — {str(a.use)}</li>
          ))}</ul>
        </Block>
      )}
    </>
  );
}

function ExamplesTab({ c }: { c: Record<string, unknown> }) {
  return (
    <>
      {arr<Record<string, unknown>>(c.real_world_examples).length > 0 && (
        <Block title="Gerçek Dünya Örnekleri">
          <ul>{arr<Record<string, unknown>>(c.real_world_examples).map((e, i) => (
            <li key={i}><strong>{str(e.title)}</strong> — {str(e.description)}</li>
          ))}</ul>
        </Block>
      )}
      {arr<Record<string, unknown>>(c.case_studies).length > 0 && (
        <Block title="Vaka Çalışmaları">
          <div className="case-grid">
            {arr<Record<string, unknown>>(c.case_studies).map((cs, i) => (
              <div key={i} className="case-card">
                <h4>{str(cs.title)}</h4>
                <div className="case-row"><span className="case-label">Sorun:</span> {str(cs.problem)}</div>
                <div className="case-row"><span className="case-label">Çözüm:</span> {str(cs.solution)}</div>
                <div className="case-row"><span className="case-label">Sonuç:</span> {str(cs.result)}</div>
              </div>
            ))}
          </div>
        </Block>
      )}
      {arr<Record<string, unknown>>(c.visual_suggestions).length > 0 && (
        <Block title="Görsel Önerileri">
          <div className="visual-grid">
            {arr<Record<string, unknown>>(c.visual_suggestions).map((v, i) => (
              <div key={i} className="visual-card">
                <span className="visual-type">{str(v.type)}</span>
                <div className="visual-title">{str(v.title)}</div>
                <div className="visual-desc">{str(v.description)}</div>
              </div>
            ))}
          </div>
        </Block>
      )}
      {arr<Record<string, unknown>>(c.templates).length > 0 && (
        <Block title="Şablonlar ve Çek Listeleri">
          <div className="template-list">
            {arr<Record<string, unknown>>(c.templates).map((t, i) => (
              <div key={i} className="template-card">
                <span className="template-type">{str(t.type)}</span>
                <div className="template-title">{str(t.title)}</div>
                {arr<string>(t.items).length > 0 && (
                  <ul>{arr<string>(t.items).map((it, j) => <li key={j}>{it}</li>)}</ul>
                )}
                {arr<string>(t.steps).length > 0 && (
                  <ol>{arr<string>(t.steps).map((s, j) => <li key={j}>{s}</li>)}</ol>
                )}
                {arr<string>(t.fields).length > 0 && (
                  <div className="field-row">{arr<string>(t.fields).map((f, j) => <span key={j} className="field-chip">{f}</span>)}</div>
                )}
              </div>
            ))}
          </div>
        </Block>
      )}
    </>
  );
}

function PracticeTab({ c }: { c: Record<string, unknown> }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const quiz = arr<Record<string, unknown>>(c.mini_quiz);

  return (
    <>
      {arr<string>(c.practice_questions).length > 0 && (
        <Block title="Pratik Sorular">
          <ol>{arr<string>(c.practice_questions).map((q, i) => <li key={i}>{q}</li>)}</ol>
        </Block>
      )}
      {quiz.length > 0 && (
        <Block title="Mini Quiz">
          {showResults && (
            <div className="quiz-score">
              Sonuç: {Object.entries(answers).filter(([idx, ans]) => ans === quiz[Number(idx)].correct_index).length} / {quiz.length}
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
                      <li key={j} className={cls} onClick={() => !showResults && setAnswers({ ...answers, [i]: j })}>
                        {String.fromCharCode(65 + j)}. {opt}
                      </li>
                    );
                  })}
                </ul>
                {showResults && str(q.explanation) && (
                  <div className="quiz-expl"><em>Açıklama:</em> {str(q.explanation)}</div>
                )}
              </li>
            ))}
          </ol>
          <button className="btn-engine" onClick={() => setShowResults(!showResults)}>
            {showResults ? "Cevapları Gizle" : "Cevapları Göster"}
          </button>
        </Block>
      )}
      {arr<Record<string, unknown>>(c.flashcards).length > 0 && (
        <Block title="Flash Kartlar">
          <div className="cards-grid">
            {arr<Record<string, unknown>>(c.flashcards).map((card, i) => (
              <div key={i} className="flashcard">
                <div className="flash-front">{str(card.front)}</div>
                <div className="flash-back">{str(card.back)}</div>
              </div>
            ))}
          </div>
        </Block>
      )}
    </>
  );
}

function ReferenceTab({ c }: { c: Record<string, unknown> }) {
  return (
    <>
      {arr<Record<string, unknown>>(c.terminology).length > 0 && (
        <Block title="Terimler ve Tanımlar">
          <dl>{arr<Record<string, unknown>>(c.terminology).map((t, i) => (
            <div key={i} className="term-row"><dt>{str(t.term)}</dt><dd>{str(t.definition)}</dd></div>
          ))}</dl>
        </Block>
      )}
      {arr<Record<string, unknown>>(c.common_mistakes).length > 0 && (
        <Block title="Yaygın Hatalar">
          <ul>{arr<Record<string, unknown>>(c.common_mistakes).map((m, i) => (
            <li key={i}><strong>✗ {str(m.mistake)}</strong><br /><span className="correction">✓ {str(m.correction)}</span></li>
          ))}</ul>
        </Block>
      )}
      {arr<string>(c.best_practices).length > 0 && (
        <Block title="En İyi Uygulamalar">
          <ul>{arr<string>(c.best_practices).map((b, i) => <li key={i} className="pro">{b}</li>)}</ul>
        </Block>
      )}
      {arr<Record<string, unknown>>(c.faqs).length > 0 && (
        <Block title="Sıkça Sorulan Sorular">
          <div className="faq-list">
            {arr<Record<string, unknown>>(c.faqs).map((f, i) => (
              <div key={i} className="faq-item">
                <div className="faq-q">Q: {str(f.q)}</div>
                <div className="faq-a">A: {str(f.a)}</div>
              </div>
            ))}
          </div>
        </Block>
      )}
      {arr<Record<string, unknown>>(c.related_materials).length > 0 && (
        <Block title="İlgili Malzemeler">
          <ul>{arr<Record<string, unknown>>(c.related_materials).map((m, i) => (
            <li key={i}><strong>{str(m.title)}</strong> — {str(m.relation)}</li>
          ))}</ul>
        </Block>
      )}
      {arr<Record<string, unknown>>(c.related_machines).length > 0 && (
        <Block title="İlgili Makineler">
          <ul>{arr<Record<string, unknown>>(c.related_machines).map((m, i) => (
            <li key={i}><strong>{str(m.name)}</strong> — {str(m.function)}</li>
          ))}</ul>
        </Block>
      )}
      {arr<Record<string, unknown>>(c.related_standards).length > 0 && (
        <Block title="İlgili Standartlar">
          <ul>{arr<Record<string, unknown>>(c.related_standards).map((s, i) => (
            <li key={i}><strong>{str(s.code)}</strong> — {str(s.title)}</li>
          ))}</ul>
        </Block>
      )}
      {arr<Record<string, unknown>>(c.references).length > 0 && (
        <Block title="Kaynaklar ve Daha Fazla Okuma">
          <ul>{arr<Record<string, unknown>>(c.references).map((r, i) => (
            <li key={i}>{str(r.title)} — {str(r.author)} ({str(r.year)})</li>
          ))}</ul>
        </Block>
      )}
      {arr<Record<string, unknown>>(c.related_lessons).length > 0 && (
        <Block title="İlgili Dersler">
          <ul>{arr<Record<string, unknown>>(c.related_lessons).map((l, i) => (
            <li key={i}><strong>{str(l.title)}</strong> — {str(l.relation)}</li>
          ))}</ul>
        </Block>
      )}
    </>
  );
}
