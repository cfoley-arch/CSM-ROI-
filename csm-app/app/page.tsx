"use client";

import { useState, useEffect, useCallback } from "react";
import { AnalysisResult, ChecklistState } from "./types";

const STORAGE_KEY = "csm-workflow-state";

function buildInitialChecklist(result: AnalysisResult): ChecklistState {
  return {
    jiraIssues: result.jiraIssues.map(() => false),
    ahaIdeas: result.ahaIdeas.map(() => false),
    actionItems: {
      day0: result.actionItems.day0.map(() => false),
      day1: result.actionItems.day1.map(() => false),
      day2to3: result.actionItems.day2to3.map(() => false),
      day5to7: result.actionItems.day5to7.map(() => false),
    },
    catalystDone: false,
    emailDone: false,
  };
}

function countChecked(state: ChecklistState): { checked: number; total: number } {
  let checked = 0;
  let total = 0;

  if (state.catalystDone) checked++;
  total++;

  state.jiraIssues.forEach((v) => { if (v) checked++; total++; });
  state.ahaIdeas.forEach((v) => { if (v) checked++; total++; });

  (["day0", "day1", "day2to3", "day5to7"] as const).forEach((key) => {
    state.actionItems[key].forEach((v) => { if (v) checked++; total++; });
  });

  if (state.emailDone) checked++;
  total++;

  return { checked, total };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function HealthBadge({ score }: { score: "Green" | "Amber" | "Red" }) {
  const colors = {
    Green: "bg-green-100 text-green-700 border-green-200",
    Amber: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Red: "bg-red-100 text-red-700 border-red-200",
  };
  const dots = {
    Green: "bg-green-500",
    Amber: "bg-yellow-500",
    Red: "bg-red-500",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors[score]}`}>
      <span className={`w-2 h-2 rounded-full ${dots[score]}`} />
      {score}
    </span>
  );
}

function IssueTypeBadge({ type }: { type: "Bug" | "Story" | "Task" }) {
  const styles = {
    Bug: "bg-red-50 text-red-600 border-red-200",
    Story: "bg-blue-50 text-blue-600 border-blue-200",
    Task: "bg-purple-50 text-purple-600 border-purple-200",
  };
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium border ${styles[type]}`}>
      {type}
    </span>
  );
}

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [checklist, setChecklist] = useState<ChecklistState | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  // Load persisted state
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { result: r, checklist: c } = JSON.parse(stored);
        setResult(r);
        setChecklist(c);
      }
    } catch {
      // ignore
    }
  }, []);

  const persist = useCallback((r: AnalysisResult, c: ChecklistState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ result: r, checklist: c }));
    } catch {
      // ignore
    }
  }, []);

  const handleAnalyze = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Analysis failed");
      }

      const data: AnalysisResult = await res.json();
      const newChecklist = buildInitialChecklist(data);
      setResult(data);
      setChecklist(newChecklist);
      persist(data, newChecklist);
      setSummary(
        `Analysis complete! Found ${data.jiraIssues.length} Jira issue(s), ${data.ahaIdeas.length} Aha! idea(s), and ${
          data.actionItems.day0.length + data.actionItems.day1.length +
          data.actionItems.day2to3.length + data.actionItems.day5to7.length
        } action item(s). Health score: ${data.catalyst.healthScore}.`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const updateChecklist = (updated: ChecklistState) => {
    setChecklist(updated);
    if (result) persist(result, updated);
  };

  const toggleJira = (i: number) => {
    if (!checklist) return;
    const next = { ...checklist, jiraIssues: [...checklist.jiraIssues] };
    next.jiraIssues[i] = !next.jiraIssues[i];
    updateChecklist(next);
  };

  const toggleAha = (i: number) => {
    if (!checklist) return;
    const next = { ...checklist, ahaIdeas: [...checklist.ahaIdeas] };
    next.ahaIdeas[i] = !next.ahaIdeas[i];
    updateChecklist(next);
  };

  const toggleAction = (key: keyof ChecklistState["actionItems"], i: number) => {
    if (!checklist) return;
    const next = {
      ...checklist,
      actionItems: {
        ...checklist.actionItems,
        [key]: [...checklist.actionItems[key]],
      },
    };
    next.actionItems[key][i] = !next.actionItems[key][i];
    updateChecklist(next);
  };

  const { checked, total } = checklist ? countChecked(checklist) : { checked: 0, total: 0 };
  const progress = total > 0 ? Math.round((checked / total) * 100) : 0;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">CSM Post-Call Workflow</h1>
            <p className="text-xs text-gray-500">Analyze calls and manage follow-ups</p>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Checklist */}
        <aside className="w-2/5 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          {!result || !checklist ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">Analyze a call to see your checklist</p>
              <p className="text-gray-400 text-sm mt-1">Paste a Gong transcript on the right to get started</p>
            </div>
          ) : (
            <>
              {/* Progress */}
              <div className="p-4 border-b border-gray-100 flex-shrink-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm text-gray-500">{checked}/{total} items</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{progress}% complete</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* Catalyst Notes */}
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Catalyst Notes</h2>
                    <div className="flex items-center gap-2">
                      <HealthBadge score={result.catalyst.healthScore} />
                      <CopyButton text={result.catalyst.notes} />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={checklist.catalystDone}
                        onChange={() => updateChecklist({ ...checklist, catalystDone: !checklist.catalystDone })}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 cursor-pointer"
                      />
                      <p className={`text-sm text-gray-700 leading-relaxed ${checklist.catalystDone ? "line-through text-gray-400" : ""}`}>
                        {result.catalyst.notes}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Jira Issues */}
                {result.jiraIssues.length > 0 && (
                  <section>
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Jira Issues ({result.jiraIssues.length})
                    </h2>
                    <div className="space-y-2">
                      {result.jiraIssues.map((issue, i) => (
                        <div key={i} className={`bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-start gap-2 ${checklist.jiraIssues[i] ? "opacity-60" : ""}`}>
                          <input
                            type="checkbox"
                            checked={checklist.jiraIssues[i]}
                            onChange={() => toggleJira(i)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <IssueTypeBadge type={issue.type} />
                              <span className={`text-sm font-medium text-gray-800 ${checklist.jiraIssues[i] ? "line-through text-gray-400" : ""}`}>
                                {issue.title}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">{issue.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Aha! Ideas */}
                {result.ahaIdeas.length > 0 && (
                  <section>
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Aha! Ideas ({result.ahaIdeas.length})
                    </h2>
                    <div className="space-y-2">
                      {result.ahaIdeas.map((idea, i) => (
                        <div key={i} className={`bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-start gap-2 ${checklist.ahaIdeas[i] ? "opacity-60" : ""}`}>
                          <input
                            type="checkbox"
                            checked={checklist.ahaIdeas[i]}
                            onChange={() => toggleAha(i)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-block px-1.5 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200">
                                {idea.category}
                              </span>
                              <span className={`text-sm font-medium text-gray-800 ${checklist.ahaIdeas[i] ? "line-through text-gray-400" : ""}`}>
                                {idea.title}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">{idea.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Action Items */}
                <section>
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Action Items</h2>
                  <div className="space-y-3">
                    {(
                      [
                        { key: "day0" as const, label: "Today (Day 0)" },
                        { key: "day1" as const, label: "Tomorrow (Day 1)" },
                        { key: "day2to3" as const, label: "Days 2–3" },
                        { key: "day5to7" as const, label: "Days 5–7" },
                      ] as const
                    ).map(({ key, label }) =>
                      result.actionItems[key].length > 0 ? (
                        <div key={key}>
                          <p className="text-xs font-medium text-gray-600 mb-1.5">{label}</p>
                          <div className="space-y-1">
                            {result.actionItems[key].map((item, i) => (
                              <label key={i} className="flex items-start gap-2 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={checklist.actionItems[key][i]}
                                  onChange={() => toggleAction(key, i)}
                                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 cursor-pointer"
                                />
                                <span className={`text-sm text-gray-700 leading-relaxed ${checklist.actionItems[key][i] ? "line-through text-gray-400" : ""}`}>
                                  {item}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>
                </section>

                {/* Follow-up Email */}
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Follow-up Email</h2>
                    <CopyButton text={`Subject: ${result.followUpEmail.subject}\n\n${result.followUpEmail.body}`} />
                  </div>
                  <div className={`bg-gray-50 rounded-lg p-3 border border-gray-100 ${checklist.emailDone ? "opacity-60" : ""}`}>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklist.emailDone}
                        onChange={() => updateChecklist({ ...checklist, emailDone: !checklist.emailDone })}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium text-gray-800 mb-1 ${checklist.emailDone ? "line-through text-gray-400" : ""}`}>
                          Subject: {result.followUpEmail.subject}
                        </p>
                        <p className={`text-xs text-gray-500 whitespace-pre-wrap leading-relaxed ${checklist.emailDone ? "line-through text-gray-400" : ""}`}>
                          {result.followUpEmail.body}
                        </p>
                      </div>
                    </label>
                  </div>
                </section>
              </div>
            </>
          )}
        </aside>

        {/* Right Panel - Chat Interface */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col p-6">
            {/* Messages area */}
            <div className="flex-1 flex flex-col justify-end space-y-4 mb-4">
              {!summary && !loading && !error && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 border border-gray-100 shadow-sm max-w-lg">
                    <p className="text-sm text-gray-700">
                      Hello! Paste a Gong call transcript or recap below and I&apos;ll extract structured data for your post-call workflow &mdash; including Catalyst notes, Jira issues, Aha! ideas, action items, and a follow-up email draft.
                    </p>
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      Analyzing transcript
                      <span className="inline-flex gap-0.5">
                        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="bg-red-50 rounded-2xl rounded-tl-sm px-4 py-3 border border-red-100 shadow-sm">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {summary && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 border border-gray-100 shadow-sm max-w-lg">
                    <p className="text-sm text-gray-700">{summary}</p>
                    <p className="text-xs text-gray-400 mt-1">Check the sidebar to manage your checklist.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Paste your Gong transcript or call recap here..."
                disabled={loading}
                className="w-full px-4 pt-4 pb-2 text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                rows={8}
              />
              <div className="flex items-center justify-between px-4 pb-3">
                <p className="text-xs text-gray-400">
                  {transcript.length > 0 ? `${transcript.length.toLocaleString()} characters` : ""}
                </p>
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !transcript.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Analyze Call
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
