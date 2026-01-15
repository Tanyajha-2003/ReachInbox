import { useEffect, useState } from "react";
import axios from "axios";
import ComposeModal from "../components/ComposeModal";

axios.defaults.withCredentials = true;

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<"scheduled" | "sent">("scheduled");
  const [scheduled, setScheduled] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:4001/api/me")
      .then(res => setUser(res.data))
      .catch(() => (window.location.href = "/"));
  }, []);
  useEffect(() => {
    if (tab !== "sent") return;

    const interval = setInterval(() => {
      axios.get("http://localhost:4001/api/sent")
        .then(r => setSent(r.data));
    }, 5000);

    return () => clearInterval(interval);
  }, [tab]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      axios.get("http://localhost:4001/api/scheduled"),
      axios.get("http://localhost:4001/api/sent")
    ]).then(([s, se]) => {
      setScheduled(s.data);
      setSent(se.data);
      setLoading(false);
    });
  }, [user]);

  const data = tab === "scheduled" ? scheduled : sent;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Top Bar */}
      <div className="bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-indigo-600">
            ReachInbox
          </h1>

          <div className="flex items-center gap-4">
            <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-indigo-500" />
            <div className="text-sm">
              <p className="font-semibold text-slate-900">{user.name}</p>
              <p className="text-slate-500">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header + Compose */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              Email Campaigns
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Schedule and monitor outbound email jobs
            </p>
          </div>

          <button
            onClick={() => setShowCompose(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:scale-[1.02] transition-transform"
          >
            Compose Campaign
          </button>
        </div>

        {/* Tabs */}
        <div className="inline-flex bg-indigo-50 rounded-xl p-1 mb-6 shadow-inner">
          {["scheduled", "sent"].map(t => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className={`px-5 py-2 rounded-xl font-medium transition ${tab === t
                  ? "bg-white shadow text-indigo-700"
                  : "text-indigo-400 hover:text-indigo-600"
                }`}
            >
              {t === "scheduled" ? "Scheduled" : "Sent"}
            </button>
          ))}
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-indigo-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left font-medium text-indigo-600">
                  Recipient
                </th>
                <th className="px-6 py-4 text-left font-medium text-indigo-600">
                  Subject
                </th>
                <th className="px-6 py-4 text-left font-medium text-indigo-600">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={3} className="px-6 py-16 text-center text-slate-400">
                    Loading emails…
                  </td>
                </tr>
              )}

              {!loading && data.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-20 text-center text-slate-400">
                    {tab === "scheduled"
                      ? "No scheduled campaigns yet"
                      : "No emails sent yet"}
                  </td>
                </tr>
              )}

              {data.map(e => (
                <tr key={e.id} className="border-t hover:bg-indigo-50 transition">
                  <td className="px-6 py-4 text-slate-900">{e.email}</td>
                  <td className="px-6 py-4 text-slate-700">{e.subject}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${e.status === "sent"
                          ? "bg-emerald-100 text-emerald-700"
                          : e.status === "failed"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                    >
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCompose && (
        <ComposeModal
          onClose={() => setShowCompose(false)}
          onSuccess={() => {
            Promise.all([
              axios.get("http://localhost:4001/api/scheduled"),
              axios.get("http://localhost:4001/api/sent")
            ]).then(([s, se]) => {
              setScheduled(s.data);
              setSent(se.data);
            });
          }}

        />
      )}
    </div>
  );
}
