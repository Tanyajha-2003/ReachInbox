import { useState, useMemo } from "react";
import axios from "axios";

axios.defaults.withCredentials = true;

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ComposeModal({ onClose, onSuccess }: Props) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [emails, setEmails] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("");
  const [delaySeconds, setDelaySeconds] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  //CSV / TXT parsing
  const handleFileChange = (f: File) => {
    setFile(f);
    setError(null);

    const reader = new FileReader();
    reader.onload = e => {
      const raw = (e.target?.result as string) || "";
      const parsed = raw
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0);

      if (parsed.length === 0) {
        setError("No email addresses found in file");
        setEmails([]);
        return;
      }

      setEmails(parsed);
    };

    reader.readAsText(f);
  };

  //Validation
  const isValid = useMemo(() => {
    return (
      subject.trim().length > 0 &&
      file !== null &&
      emails.length > 0 &&
      startTime.length > 0 &&
      delaySeconds > 0 &&
      hourlyLimit > 0
    );
  }, [subject, file, emails, startTime, delaySeconds, hourlyLimit]);

  //Submit
  const handleSubmit = async () => {
    if (!isValid || loading) return;

    setLoading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("file", file!);
      form.append("subject", subject);
      form.append("body", body);
      form.append("startTime", startTime);
      form.append("delaySeconds", String(delaySeconds));
      form.append("hourlyLimit", String(hourlyLimit));

      await axios.post(
        "http://localhost:4001/api/schedule/csv",
        form
      );

      onSuccess();
      onClose();
    } catch {
      setError("Failed to schedule emails. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-[580px] rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <h2 className="text-xl font-semibold text-slate-900 mb-1">
          Compose Email Campaign
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Upload a CSV or text file containing recipient emails
        </p>

        {/* Form */}
        <div className="space-y-4">
          <input
            placeholder="Email subject *"
            className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={subject}
            onChange={e => setSubject(e.target.value)}
          />

          <textarea
            placeholder="Email body (optional)"
            className="w-full px-4 py-2 h-32 rounded-xl border border-slate-300 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
            value={body}
            onChange={e => setBody(e.target.value)}
          />

          {/* File */}
          <div>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={e =>
                e.target.files && handleFileChange(e.target.files[0])
              }
              className="text-sm"
            />
            {emails.length > 0 && (
              <p className="text-xs text-slate-500 mt-1">
                {emails.length} recipients detected
              </p>
            )}
          </div>

          {/* Scheduling */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">
                Start time
              </p>
            </div>

            <div>
              <input
                type="number"
                min={1}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
                value={delaySeconds}
                onChange={e => setDelaySeconds(+e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">
                Delay (seconds)
              </p>
            </div>

            <div>
              <input
                type="number"
                min={1}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
                value={hourlyLimit}
                onChange={e => setHourlyLimit(+e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">
                Hourly limit
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className={`px-6 py-2 rounded-xl font-medium text-white transition ${
              isValid
                ? "bg-indigo-600 hover:bg-indigo-500"
                : "bg-slate-400 cursor-not-allowed"
            }`}
          >
            {loading ? "Scheduling…" : "Schedule Campaign"}
          </button>
        </div>
      </div>
    </div>
  );
}
