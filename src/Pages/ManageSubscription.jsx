import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

function toDateInput(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

export default function ManageSubscription() {
  const { token } = useParams();
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [pauseFrom, setPauseFrom] = useState("");
  const [pauseTo, setPauseTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedSubscription = useMemo(
    () => subscriptions.find((item) => item.id === selectedId),
    [subscriptions, selectedId]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(
          `${API_BASE}/api/subscription-management/${encodeURIComponent(token || "")}`
        );
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || "This link is invalid or expired.");
        }
        if (cancelled) return;
        const rows = Array.isArray(result.subscriptions) ? result.subscriptions : [];
        setSubscriptions(rows);
        setSelectedId(rows[0]?.id || "");
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load subscriptions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (token) load();
    else {
      setError("The subscription link is missing its security token.");
      setLoading(false);
    }

    return () => { cancelled = true; };
  }, [token]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedId || !pauseFrom || !pauseTo) {
      setError("Please select a subscription and both pause dates.");
      return;
    }
    if (pauseFrom > pauseTo) {
      setError("Pause end date cannot be before pause start date.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        `${API_BASE}/api/subscription-management/${encodeURIComponent(token)}/pause`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscriptionId: selectedId,
            pauseFrom,
            pauseTo,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to pause subscription.");
      }
      setSuccess("Your subscription has been paused successfully. You can close this page.");
      setSubscriptions((current) => current.filter((item) => item.id !== selectedId));
      setSelectedId("");
    } catch (err) {
      setError(err.message || "Unable to submit your pause request.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main style={styles.shell}><section style={styles.card}>Checking your secure link…</section></main>;
  }

  return (
    <main style={styles.shell}>
      <section style={styles.card}>
        <div style={styles.brand}>🥛 Farm Fresh Dairy</div>
        <h1 style={styles.heading}>Manage milk delivery</h1>
        <p style={styles.subheading}>Choose the subscription and dates you want to pause.</p>

        {error && <div role="alert" style={styles.error}>{error}</div>}
        {success && <div role="status" style={styles.success}>{success}</div>}

        {!error && !success && subscriptions.length === 0 && (
          <div style={styles.notice}>There are no active subscriptions available to pause.</div>
        )}

        {!error && !success && subscriptions.length > 0 && (
          <form onSubmit={handleSubmit}>
            <label style={styles.label} htmlFor="subscription">Select subscription</label>
            <select
              id="subscription"
              value={selectedId}
              onChange={(event) => {
                setSelectedId(event.target.value);
                setPauseFrom("");
                setPauseTo("");
              }}
              style={styles.input}
              required
            >
              {subscriptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {`Subscription • ${item.start_date || "Start date unavailable"} • ${item.frequency || "Regular"}`}
                </option>
              ))}
            </select>

            {selectedSubscription && (
              <div style={styles.details}>
                <div><strong>Status:</strong> {selectedSubscription.status}</div>
                <div><strong>Valid until:</strong> {selectedSubscription.end_date || "Not available"}</div>
                <div><strong>Delivery time:</strong> {selectedSubscription.delivery_time || "Not specified"}</div>
              </div>
            )}

            <label style={styles.label} htmlFor="pauseFrom">Pause from</label>
            <input
              id="pauseFrom"
              type="date"
              value={pauseFrom}
              min={new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })}
              max={toDateInput(selectedSubscription?.end_date)}
              onChange={(event) => setPauseFrom(event.target.value)}
              style={styles.input}
              required
            />

            <label style={styles.label} htmlFor="pauseTo">Pause until</label>
            <input
              id="pauseTo"
              type="date"
              value={pauseTo}
              min={pauseFrom || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })}
              max={toDateInput(selectedSubscription?.end_date)}
              onChange={(event) => setPauseTo(event.target.value)}
              style={styles.input}
              required
            />

            <p style={styles.note}>Your delivery is not paused until you confirm below. The secure link can be used once and expires after 30 minutes.</p>
            <button type="submit" disabled={submitting} style={styles.button}>
              {submitting ? "Submitting…" : "Confirm pause"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

const styles = {
  shell: { minHeight: "100vh", display: "grid", placeItems: "center", padding: 20, background: "#f4f7f3", fontFamily: "Arial, sans-serif" },
  card: { width: "100%", maxWidth: 520, boxSizing: "border-box", background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 8px 30px rgba(0,0,0,.08)" },
  brand: { color: "#237447", fontWeight: 700, fontSize: 18, marginBottom: 12 },
  heading: { margin: "0 0 8px", fontSize: 26, color: "#17251c" },
  subheading: { color: "#5e6b62", margin: "0 0 22px", lineHeight: 1.5 },
  label: { display: "block", fontWeight: 600, margin: "16px 0 7px", color: "#26352b" },
  input: { width: "100%", boxSizing: "border-box", padding: 12, border: "1px solid #cbd5ce", borderRadius: 8, background: "#fff", fontSize: 16 },
  details: { display: "grid", gap: 7, background: "#f6f8f6", padding: 12, borderRadius: 8, marginTop: 12, color: "#425047", fontSize: 14 },
  note: { fontSize: 13, lineHeight: 1.5, color: "#66736a", margin: "18px 0" },
  button: { width: "100%", padding: 14, border: 0, borderRadius: 8, color: "#fff", background: "#237447", fontWeight: 700, fontSize: 16, cursor: "pointer" },
  error: { background: "#fff0f0", color: "#a11b1b", border: "1px solid #f2c5c5", borderRadius: 8, padding: 12, marginBottom: 16 },
  success: { background: "#edf8ef", color: "#1f6b35", border: "1px solid #bde2c5", borderRadius: 8, padding: 12, marginBottom: 16 },
  notice: { background: "#f6f8f6", padding: 14, borderRadius: 8, color: "#425047" },
};
