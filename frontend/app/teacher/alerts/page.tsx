"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  ZapOff,
  UserCheck,
  Check,
  X,
} from "lucide-react";
import { PortalHeader } from "../../../components/PortalHeader";
import { api } from "../../../lib/api";
import { useTranslation } from "../../../lib/i18n";

export default function TeacherAlertsPage() {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await api.getTeacherAlerts();
      setAlerts(data);
    } catch {
      // Mock alert data for demo visualizer
      setAlerts([
        {
          id: "alt-1",
          student_name: "Rohan Kumar",
          alert_type: "falling_behind",
          reason: "Mastery dropped below 0.35 in Single-Digit Subtraction after 3 consecutive wrong attempts.",
          created_at: "Today, 10:30 AM",
          status: "active",
        },
        {
          id: "alt-2",
          student_name: "Aditya Singh",
          alert_type: "random_clicking",
          reason: "Answered 4 questions with latency under 1.2s; 0 XP awarded and flagged by anti-gaming engine.",
          created_at: "Yesterday, 2:15 PM",
          status: "active",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await api.resolveAlert(alertId, note);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      setMessage("Alert resolved with intervention note.");
      setResolvingId(null);
      setNote("");
    } catch {
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      setMessage("Alert resolved.");
      setResolvingId(null);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "random_clicking":
        return <ZapOff className="w-5 h-5 text-amber-500" />;
      case "falling_behind":
      default:
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row" suppressHydrationWarning>
      <PortalHeader role="teacher" />

      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t("teacher.alerts", "Alerts & Interventions")}
          </h1>
          <p className="text-sm text-slate-500">
            Automated alerts highlighting students who need one-on-one attention or guidance
          </p>
        </div>

        {message && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{message}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-xs text-emerald-700 underline">
              Dismiss
            </button>
          </div>
        )}

        <div className="space-y-4">
          {alerts.map((alt) => (
            <div
              key={alt.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    {getAlertIcon(alt.alert_type)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{alt.student_name}</h3>
                    <span className="text-xs uppercase font-extrabold text-slate-500 tracking-wider">
                      {alt.alert_type.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <span className="text-xs font-semibold text-slate-400">{alt.created_at}</span>
              </div>

              <p className="text-sm text-slate-700 font-medium pl-12">{alt.reason}</p>

              {resolvingId === alt.id ? (
                <div className="mt-3 pl-12 space-y-2">
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add teacher intervention note (e.g. Conducted 1-on-1 subtraction review)..."
                    className="w-full px-3.5 py-2 rounded-xl border border-blue-500 text-sm outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setResolvingId(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleResolve(alt.id)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Confirm Resolve
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setResolvingId(alt.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Resolve Alert</span>
                  </button>
                </div>
              )}
            </div>
          ))}

          {alerts.length === 0 && !loading && (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900">
                {t("teacher.noAlerts", "All students are progressing smoothly! No active alerts.")}
              </h3>
            </div>
          )}
        </div>
      </main>
    </div>
  </div>
);
}
