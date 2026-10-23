"use client";

import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  CheckCircle,
  XCircle,
  Edit3,
  RotateCw,
  Sparkles,
  BookOpen,
  Filter,
  CheckCheck,
} from "lucide-react";
import { PortalHeader } from "../../../components/PortalHeader";
import { api } from "../../../lib/api";
import { useTranslation } from "../../../lib/i18n";

export default function QuestionReviewPage() {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("draft");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editExplanation, setEditExplanation] = useState("");
  const [editOptions, setEditOptions] = useState<string[]>([]);
  const [editCorrectIdx, setEditCorrectIdx] = useState<number>(0);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    loadQuestions(statusFilter);
  }, [statusFilter]);

  const loadQuestions = async (status: string) => {
    try {
      setLoading(true);
      const data = await api.getDraftQuestions(status);
      setQuestions(data);
    } catch {
      // Fallback demo mock if backend database has no unapproved drafts
      setQuestions([
        {
          id: "q-mock-1",
          question_text: "Which of the following numbers comes immediately after 15?",
          options: ["14", "16", "17", "20"],
          correct_index: 1,
          correct_answer_index: 1,
          difficulty: 1,
          language: "en",
          skill_name: "Counting 1-20",
          explanation: "Counting sequentially, 16 comes directly after 15.",
          source_snippet: "Chapter 1, p.4 'Counting sequentially from 1 to 20...'",
          status: "draft",
        },
        {
          id: "q-mock-2",
          question_text: "5 + 3 = ?",
          options: ["7", "8", "9", "6"],
          correct_index: 1,
          correct_answer_index: 1,
          difficulty: 1,
          language: "en",
          skill_name: "Single-Digit Addition",
          explanation: "Adding 3 to 5 gives 8 (5 + 3 = 8).",
          source_snippet: "Chapter 2, p.12 'Addition combinations up to 10...'",
          status: "draft",
        },
        {
          id: "q-mock-3",
          question_text: "కింది వాటిలో ఏది సంఖ్య '7' యొక్క సరైన అక్షర రూపం?",
          options: ["ఐదు", "ఆరు", "ఏడు", "ఎనిమిది"],
          correct_index: 2,
          correct_answer_index: 2,
          difficulty: 1,
          language: "te",
          skill_name: "Number Words",
          explanation: "సంఖ్య 7 ని తెలుగులో 'ఏడు' అని పిలుస్తారు.",
          source_snippet: "గణితం భాగం 1, పేజీ 8 'తెలుగు సంఖ్యా పదాలు...'",
          status: "draft",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (q: any) => {
    setEditingId(q.id);
    setEditText(q.question_text || q.text || "");
    setEditExplanation(q.explanation || "");
    setEditOptions(q.options && q.options.length ? [...q.options] : ["", "", "", ""]);
    setEditCorrectIdx(q.correct_index ?? q.correct_answer_index ?? 0);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      setSavingEdit(true);
      await api.reviewQuestion(id, "edit", {
        text: editText,
        explanation: editExplanation,
        options: editOptions,
        correct_index: editCorrectIdx,
      });
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === id
            ? {
                ...q,
                text: editText,
                question_text: editText,
                explanation: editExplanation,
                options: editOptions,
                correct_index: editCorrectIdx,
                correct_answer_index: editCorrectIdx,
              }
            : q
        )
      );
      setEditingId(null);
      setActionMessage("Question and explanation updated successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to save question edits");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.reviewQuestion(id, "approve");
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      setActionMessage("Question approved! It is now live in student practice.");
    } catch (err: any) {
      alert(err.message || "Approval failed");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.reviewQuestion(id, "reject");
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      setActionMessage("Question rejected.");
    } catch (err: any) {
      alert(err.message || "Rejection failed");
    }
  };

  const handleBulkApprove = async () => {
    const ids = questions.map((q) => q.id);
    try {
      await api.bulkApproveDrafts(ids);
      setQuestions([]);
      setActionMessage(`All ${ids.length} draft questions approved!`);
    } catch (err: any) {
      alert(err.message || "Bulk approval failed");
    }
  };

  const renderDifficultyDots = (diff: number = 1) => {
    return (
      <span className="text-amber-500 font-mono tracking-widest text-sm">
        {diff === 3 ? "●●●" : diff === 2 ? "●●○" : "●○○"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" suppressHydrationWarning>
      <PortalHeader role="teacher" />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t("teacher.reviewQuestions", "Question Review & Approvals")}
            </h1>
            <p className="text-sm text-slate-500">
              Verify accuracy and curriculum alignment before questions enter student practice pools
            </p>
          </div>

          {questions.length > 0 && statusFilter === "draft" && (
            <button
              onClick={handleBulkApprove}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all whitespace-nowrap"
            >
              <CheckCheck className="w-4 h-4" />
              <span>{t("teacher.bulkApprove", "Bulk Approve All")} ({questions.length})</span>
            </button>
          )}
        </div>

        {actionMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{actionMessage}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="text-xs text-emerald-700 underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          {["draft", "approved", "rejected"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {st} {st === "draft" ? `(${questions.length})` : ""}
            </button>
          ))}
        </div>

        {/* Review Cards List */}
        <div className="space-y-4">
          {questions.map((q) => (
            <div
              key={q.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 hover:border-blue-300 transition-all"
            >
              {/* Card Meta Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    Skill: {q.skill_name || "Foundational"}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    Lang: <span className="uppercase">{q.language || "en"}</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                    Diff: {renderDifficultyDots(q.difficulty)}
                  </span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full uppercase text-[10px] font-black ${
                    q.status === "approved"
                      ? "bg-emerald-100 text-emerald-800"
                      : q.status === "rejected"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {q.status || "draft"}
                </span>
              </div>

              {/* Question Text & Interactive Editor */}
              {editingId === q.id ? (
                <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-blue-300">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Question Text:
                    </label>
                    <textarea
                      rows={2}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full p-3 rounded-xl border border-blue-500 font-bold text-slate-900 text-base outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                      Answer Options (Select the correct option):
                    </label>
                    <div className="space-y-2">
                      {editOptions.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-opt-${q.id}`}
                            checked={editCorrectIdx === optIdx}
                            onChange={() => setEditCorrectIdx(optIdx)}
                            className="w-4 h-4 text-blue-600 cursor-pointer"
                          />
                          <span className="w-6 text-xs font-bold text-slate-500">
                            {String.fromCharCode(65 + optIdx)}:
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const updated = [...editOptions];
                              updated[optIdx] = e.target.value;
                              setEditOptions(updated);
                            }}
                            className={`flex-1 px-3 py-2 rounded-lg border text-sm font-semibold outline-none ${
                              editCorrectIdx === optIdx
                                ? "border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold"
                                : "border-slate-300 bg-white text-slate-800"
                            }`}
                          />
                          {editCorrectIdx === optIdx && (
                            <span className="text-xs text-emerald-700 font-bold whitespace-nowrap">
                              ✓ Correct
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-blue-900 mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      Pedagogical Explanation & Rationale (Why this is correct):
                    </label>
                    <textarea
                      rows={3}
                      value={editExplanation}
                      onChange={(e) => setEditExplanation(e.target.value)}
                      placeholder="Explain why this answer is correct and what the concept means..."
                      className="w-full p-3 rounded-xl border border-blue-400 font-medium text-slate-900 text-sm outline-none bg-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={() => setEditingId(null)}
                      disabled={savingEdit}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(q.id)}
                      disabled={savingEdit}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                    >
                      {savingEdit ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-black text-slate-900 leading-snug">
                    {q.question_text || q.text}
                  </h3>

                  {/* Options & Correct Answer */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {(q.options || []).map((opt: string, idx: number) => {
                      const isCorrect = idx === (q.correct_index ?? q.correct_answer_index);
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border text-sm font-semibold flex items-center justify-between ${
                            isCorrect
                              ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-bold"
                              : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                              isCorrect ? "bg-emerald-600 text-white" : "border border-slate-300 text-slate-500"
                            }`}>
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span>{opt}</span>
                          </span>
                          {isCorrect && (
                            <span className="text-xs text-emerald-700 font-bold">Correct Answer ✓</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Pedagogical Explanation Box */}
                  <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wide">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span>Explanation & Why this answer is correct:</span>
                    </div>
                    <p className="text-sm font-semibold leading-relaxed text-blue-900">
                      {q.explanation || "No explanation provided yet. Click 'Edit' below to add one."}
                    </p>
                  </div>
                </>
              )}

              {/* Curriculum Source Snippet */}
              {q.source_snippet && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-800">Source Textbook:</strong> {q.source_snippet}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => startEditing(q)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{t("teacher.edit", "Edit")}</span>
                </button>

                {q.status !== "rejected" && (
                  <button
                    onClick={() => handleReject(q.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{t("teacher.reject", "Reject")}</span>
                  </button>
                )}

                {q.status !== "approved" && (
                  <button
                    onClick={() => handleApprove(q.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{t("teacher.approve", "Approve")}</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {questions.length === 0 && !loading && (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900">No {statusFilter} questions</h3>
              <p className="text-sm text-slate-500 mt-1">
                Upload a textbook PDF or switch filters to inspect questions.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
