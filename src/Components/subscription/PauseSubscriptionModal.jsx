import { useEffect, useMemo, useState } from "react";

export default function PauseSubscriptionModal({
  open,
  subscription,
  loading,
  onClose,
  onConfirm,
}) {
  const [pauseFrom, setPauseFrom] = useState("");
  const [pauseTo, setPauseTo] = useState("");
  const [error, setError] = useState("");

  const todayString = useMemo(() => {
    const today = new Date();
    const local = new Date(
      today.getTime() - today.getTimezoneOffset() * 60000
    );
    return local.toISOString().split("T")[0];
  }, []);

  useEffect(() => {
    if (!open) {
      setPauseFrom("");
      setPauseTo("");
      setError("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, loading, onClose]);

  if (!open) return null;

  const subscriptionEndDate = subscription?.end_date || "";

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleFromChange = (value) => {
    setError("");
    setPauseFrom(value);

    if (pauseTo && value && pauseTo < value) {
      setPauseTo("");
    }
  };

  const handleSubmit = () => {
    setError("");

    if (!pauseFrom || !pauseTo) {
      setError("Please select both pause dates.");
      return;
    }

    const from = new Date(`${pauseFrom}T00:00:00`);
    const to = new Date(`${pauseTo}T00:00:00`);
    const today = new Date(`${todayString}T00:00:00`);
    const endDate = new Date(`${subscriptionEndDate}T00:00:00`);

    if (from < today) {
      setError("Pause From cannot be before today.");
      return;
    }

    if (to < from) {
      setError("Pause To cannot be earlier than Pause From.");
      return;
    }

    if (
      subscriptionEndDate &&
      !Number.isNaN(endDate.getTime()) &&
      to > endDate
    ) {
      setError("Pause To cannot exceed the subscription end date.");
      return;
    }

    onConfirm(pauseFrom, pauseTo);
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !loading) {
      onClose();
    }
  };

  return (
    <>
      <style>{`
        .pause-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          box-sizing: border-box;
          background: rgba(15, 23, 42, .62);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          animation: pauseBackdropIn .22s ease-out both;
        }

        .pause-modal {
          width: min(100%, 430px);
          max-height: min(92dvh, 720px);
          overflow-y: auto;
          box-sizing: border-box;
          padding: 22px;
          border: 1px solid rgba(255,255,255,.9);
          border-radius: 26px;
          background: #fff;
          box-shadow:
            0 30px 80px rgba(15,23,42,.25),
            0 8px 30px rgba(5,150,105,.08);
          animation: pauseModalIn .32s cubic-bezier(.22,1,.36,1) both;
        }

        .pause-modal-header {
          display: flex;
          align-items: flex-start;
          gap: 13px;
        }

        .pause-modal-icon {
          width: 46px;
          height: 46px;
          min-width: 46px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          background: linear-gradient(135deg, #dcfce7, #ccfbf1);
          color: #047857;
          box-shadow: 0 8px 20px rgba(5,150,105,.10);
        }

        .pause-modal-eyebrow {
          margin-top: 2px;
          color: #059669;
          font-size: 8px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .pause-modal-title {
          margin: 5px 0 0;
          color: #0f172a;
          font-size: 22px;
          line-height: 1.1;
          font-weight: 950;
          letter-spacing: -.035em;
        }

        .pause-modal-subtitle {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 10px;
          line-height: 1.45;
          font-weight: 650;
        }

        .pause-modal-plan {
          margin-top: 18px;
          padding: 11px 12px;
          border: 1px solid #d1fae5;
          border-radius: 14px;
          background: linear-gradient(135deg, #f0fdf4, #f0fdfa);
        }

        .pause-modal-plan-label {
          color: #64748b;
          font-size: 7px;
          font-weight: 850;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .pause-modal-plan-value {
          margin-top: 3px;
          color: #047857;
          font-size: 11px;
          font-weight: 950;
        }

        .pause-modal-form {
          margin-top: 18px;
          display: grid;
          gap: 13px;
        }

        .pause-date-group {
          display: grid;
          gap: 6px;
        }

        .pause-date-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          color: #334155;
          font-size: 10px;
          font-weight: 900;
        }

        .pause-date-hint {
          color: #94a3b8;
          font-size: 7px;
          font-weight: 750;
        }

        .pause-date-wrap {
          position: relative;
        }

        .pause-date-input {
          width: 100%;
          min-height: 48px;
          box-sizing: border-box;
          padding: 0 12px;
          border: 1px solid #dbe4ea;
          border-radius: 14px;
          outline: none;
          background: #f8fafc;
          color: #0f172a;
          font: inherit;
          font-size: 12px;
          font-weight: 750;
          transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
          color-scheme: light;
        }

        .pause-date-input:hover {
          border-color: #a7f3d0;
          background: #fff;
        }

        .pause-date-input:focus {
          border-color: #10b981;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(16,185,129,.10);
        }

        .pause-date-input::-webkit-calendar-picker-indicator {
          width: 18px;
          height: 18px;
          cursor: pointer;
          opacity: .75;
        }

        .pause-date-preview {
          margin-top: 5px;
          color: #059669;
          font-size: 8px;
          font-weight: 800;
        }

        .pause-error {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          padding: 10px 11px;
          border: 1px solid #fecaca;
          border-radius: 12px;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 9px;
          line-height: 1.4;
          font-weight: 800;
          animation: pauseErrorIn .2s ease-out both;
        }

        .pause-modal-actions {
          display: grid;
          grid-template-columns: 1fr 1.25fr;
          gap: 9px;
          margin-top: 20px;
        }

        .pause-modal-button {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border-radius: 13px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 950;
          transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
        }

        .pause-modal-button:active {
          transform: scale(.97);
        }

        .pause-cancel-button {
          border: 1px solid #dbe4ea;
          background: #fff;
          color: #475569;
        }

        .pause-cancel-button:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .pause-confirm-button {
          border: 0;
          background: linear-gradient(135deg, #059669, #0d9488);
          color: #fff;
          box-shadow: 0 10px 22px rgba(5,150,105,.22);
        }

        .pause-confirm-button:hover {
          filter: brightness(1.04);
          box-shadow: 0 13px 28px rgba(5,150,105,.27);
        }

        .pause-confirm-button:disabled {
          cursor: not-allowed;
          opacity: .65;
          box-shadow: none;
        }

        .pause-button-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: pauseSpin .7s linear infinite;
        }

        .pause-modal-note {
          margin: 12px 2px 0;
          color: #94a3b8;
          font-size: 7px;
          line-height: 1.45;
          font-weight: 700;
          text-align: center;
        }

        @keyframes pauseBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes pauseModalIn {
          from {
            opacity: 0;
            transform: translateY(18px) scale(.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes pauseErrorIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pauseSpin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 560px) {
          .pause-modal-backdrop {
            align-items: flex-end;
            padding: 0;
          }

          .pause-modal {
            width: 100%;
            max-width: none;
            max-height: 90dvh;
            padding: 20px 16px calc(16px + env(safe-area-inset-bottom));
            border-radius: 25px 25px 0 0;
            animation: pauseSheetIn .32s cubic-bezier(.22,1,.36,1) both;
          }

          .pause-modal::before {
            content: "";
            width: 38px;
            height: 4px;
            margin: -7px auto 16px;
            border-radius: 999px;
            background: #cbd5e1;
          }

          .pause-modal-icon {
            width: 42px;
            height: 42px;
            min-width: 42px;
            border-radius: 13px;
          }

          .pause-modal-title {
            font-size: 20px;
          }

          .pause-date-input {
            min-height: 50px;
            font-size: 13px;
          }

          .pause-modal-button {
            min-height: 50px;
            font-size: 10px;
          }

          @keyframes pauseSheetIn {
            from {
              opacity: 0;
              transform: translateY(100%);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        }

        @media (max-width: 360px) {
          .pause-modal {
            padding-left: 13px;
            padding-right: 13px;
          }

          .pause-modal-title {
            font-size: 18px;
          }

          .pause-modal-subtitle {
            font-size: 9px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pause-modal-backdrop,
          .pause-modal,
          .pause-error,
          .pause-button-spinner {
            animation: none !important;
          }
        }
      `}</style>

      <div
        className="pause-modal-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-subscription-title"
        onMouseDown={handleBackdropClick}
      >
        <div
          className="pause-modal"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="pause-modal-header">
            <div className="pause-modal-icon" aria-hidden="true">
              <span style={{ fontSize: 21 }}>🥛</span>
            </div>

            <div>
              <div className="pause-modal-eyebrow">
                Delivery controls
              </div>

              <h2
                id="pause-subscription-title"
                className="pause-modal-title"
              >
                Pause Subscription
              </h2>

              <p className="pause-modal-subtitle">
                Temporarily stop your milk deliveries for the selected dates.
              </p>
            </div>
          </div>

          <div className="pause-modal-plan">
            <div className="pause-modal-plan-label">
              Current subscription
            </div>

            <div className="pause-modal-plan-value">
              {subscription?.product_name ||
                subscription?.product?.name ||
                "Milk Subscription"}
              {subscription?.quantity
                ? ` • ${subscription.quantity}`
                : ""}
            </div>
          </div>

          <div className="pause-modal-form">
            <div className="pause-date-group">
              <label
                className="pause-date-label"
                htmlFor="pause-from-date"
              >
                <span>Pause From</span>
                <span className="pause-date-hint">Start date</span>
              </label>

              <div className="pause-date-wrap">
                <input
                  id="pause-from-date"
                  type="date"
                  className="pause-date-input"
                  value={pauseFrom}
                  min={todayString}
                  max={subscriptionEndDate}
                  onChange={(event) =>
                    handleFromChange(event.target.value)
                  }
                  disabled={loading}
                />
              </div>

              {pauseFrom && (
                <div className="pause-date-preview">
                  {formatDate(pauseFrom)}
                </div>
              )}
            </div>

            <div className="pause-date-group">
              <label
                className="pause-date-label"
                htmlFor="pause-to-date"
              >
                <span>Pause To</span>
                <span className="pause-date-hint">End date</span>
              </label>

              <div className="pause-date-wrap">
                <input
                  id="pause-to-date"
                  type="date"
                  className="pause-date-input"
                  value={pauseTo}
                  min={pauseFrom || todayString}
                  max={subscriptionEndDate}
                  onChange={(event) => {
                    setError("");
                    setPauseTo(event.target.value);
                  }}
                  disabled={loading}
                />
              </div>

              {pauseTo && (
                <div className="pause-date-preview">
                  {formatDate(pauseTo)}
                </div>
              )}
            </div>

            {error && (
              <div className="pause-error" role="alert">
                <span aria-hidden="true">⚠️</span>
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="pause-modal-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="pause-modal-button pause-cancel-button"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="pause-modal-button pause-confirm-button"
            >
              {loading ? (
                <>
                  <span className="pause-button-spinner" />
                  Pausing...
                </>
              ) : (
                <>
                  <span aria-hidden="true">⏸</span>
                  Pause Delivery
                </>
              )}
            </button>
          </div>

          <p className="pause-modal-note">
            You can pause only from today until your subscription end date.
          </p>
        </div>
      </div>
    </>
  );
}
