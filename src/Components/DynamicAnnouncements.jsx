
import { useCallback, useEffect, useRef, useState } from "react";
import { API_URL } from "../config/api";

const styles = `
.da-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  background: rgba(5, 20, 12, .78);
  backdrop-filter: blur(9px);
  animation: daFade .35s ease both;
}

.da-popup {
  position: relative;
  width: 100%;
  max-width: 440px;
  max-height: 86vh;
  max-height: 86dvh;
  overflow-y: auto;
  box-sizing: border-box;
  padding: 24px 20px 20px;
  text-align: center;
  border: 2px solid #d9b64c;
  border-radius: 24px;
  background: linear-gradient(145deg, #ffffff, #f2fff3);
  box-shadow: 0 0 15px rgba(255, 208, 70, .65),
              0 0 35px rgba(34, 130, 62, .35),
              0 20px 60px rgba(0,0,0,.35);
  animation: daEnter .5s ease both, daGlow 2.5s ease-in-out infinite;
}

.da-popup::-webkit-scrollbar { width: 5px; }
.da-popup::-webkit-scrollbar-thumb {
  background: #b9d4bd;
  border-radius: 10px;
}

.da-close {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 5;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: #eaf3eb;
  color: #183d24;
  font-size: 25px;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(0,0,0,.12);
}

.da-heading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin: 8px 0 16px;
}

.da-bell {
  display: inline-block;
  font-size: 34px;
  transform-origin: top center;
  animation: daBell 1.8s ease-in-out infinite;
}

.da-brand {
  color: #15552d;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 1.2px;
}

.da-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 15px;
  border-radius: 30px;
  background: linear-gradient(100deg, #ffda65, #ffa51e, #ffda65);
  background-size: 200% 100%;
  color: #442700;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 1px;
  box-shadow: 0 0 13px rgba(255,174,30,.45);
  animation: daBadge 1.4s ease-in-out infinite;
}

.da-badge::before {
  content: "";
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #a52c00;
  animation: daDot .8s infinite;
}

.da-title {
  margin: 12px 0;
  color: #173e25;
  font-size: clamp(21px, 5vw, 27px);
  line-height: 1.25;
  font-weight: 900;
  overflow-wrap: anywhere;
}

.da-image-wrap {
  margin: 14px auto;
  overflow: hidden;
  border: 2px solid #e4cb7e;
  border-radius: 15px;
  background: #f5f8ee;
  cursor: zoom-in;
  animation: daImageGlow 2s infinite;
}

.da-image {
  display: block;
  width: 100%;
  max-height: 260px;
  object-fit: contain;
}

.da-image-hint {
  display: block;
  padding: 7px;
  background: #173e25;
  color: white;
  font-size: 11px;
  font-weight: 700;
}

.da-price-section {
  margin: 18px 0;
  padding: 17px 12px;
  border: 1px solid #d8e8cc;
  border-radius: 18px;
  background: linear-gradient(145deg, #edf9ed, #fff8e8);
}

.da-price-heading {
  margin-bottom: 14px;
  color: #17552d;
  font-size: 15px;
  font-weight: 900;
  letter-spacing: .8px;
}

.da-price-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 11px;
}

.da-price-card {
  padding: 17px 7px;
  border: 1px solid #e5d18b;
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 4px 14px rgba(25,90,40,.12);
  animation: daPricePulse 2s ease-in-out infinite;
}

.da-price-card:nth-child(2) {
  animation-delay: .4s;
}

.da-price-amount {
  color: #17612e;
  font-size: clamp(27px, 7vw, 36px);
  font-weight: 900;
  line-height: 1.2;
}

.da-price-size {
  margin-top: 5px;
  color: #526b55;
  font-size: 13px;
  font-weight: 800;
}

.da-effective {
  display: inline-block;
  margin-top: 15px;
  padding: 9px 14px;
  border-radius: 30px;
  background: #174d2b;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
}

.da-message {
  margin: 12px 0;
  color: #46594b;
  font-size: 14px;
  line-height: 1.65;
  overflow-wrap: anywhere;
}

.da-message p {
  margin: 9px 0;
}

.da-footer {
  margin-top: 16px;
  color: #52705a;
  font-size: 11px;
  font-weight: 800;
}

.da-button {
  width: 100%;
  margin-top: 13px;
  padding: 14px 18px;
  border: 0;
  border-radius: 13px;
  background: linear-gradient(100deg, #155b2d, #2b9148, #155b2d);
  background-size: 200% 100%;
  color: white;
  font-size: 15px;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 5px 15px rgba(21,91,45,.28);
  animation: daButtonGlow 2s infinite;
}

.da-lightbox {
  position: fixed;
  inset: 0;
  z-index: 100001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px;
  background: rgba(0,0,0,.95);
}

.da-lightbox img {
  max-width: 100%;
  max-height: 88vh;
  object-fit: contain;
  border-radius: 10px;
}

.da-lightbox-close {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 50%;
  background: white;
  color: #111;
  font-size: 26px;
  cursor: pointer;
}

@keyframes daFade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes daEnter {
  from { opacity: 0; transform: translateY(30px) scale(.92); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes daGlow {
  0%, 100% {
    border-color: #d9b64c;
    box-shadow: 0 0 12px rgba(255,208,70,.5),
                0 0 25px rgba(34,130,62,.25),
                0 20px 60px rgba(0,0,0,.35);
  }
  50% {
    border-color: #45a85b;
    box-shadow: 0 0 22px rgba(255,208,70,.9),
                0 0 40px rgba(34,130,62,.5),
                0 20px 60px rgba(0,0,0,.35);
  }
}

@keyframes daBell {
  0%, 75%, 100% { transform: rotate(0); }
  80% { transform: rotate(17deg); }
  85% { transform: rotate(-17deg); }
  90% { transform: rotate(10deg); }
  95% { transform: rotate(-6deg); }
}

@keyframes daBadge {
  0%, 100% { opacity: 1; background-position: 0% 50%; }
  50% { opacity: .78; background-position: 100% 50%; }
}

@keyframes daDot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: .25; transform: scale(.7); }
}

@keyframes daPricePulse {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes daImageGlow {
  0%, 100% { box-shadow: 0 4px 14px rgba(20,75,35,.12); }
  50% { box-shadow: 0 5px 22px rgba(218,171,44,.4); }
}

@keyframes daButtonGlow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@media (max-width: 480px) {
  .da-overlay { padding: 10px; }

  .da-popup {
    max-width: 100%;
    max-height: 84vh;
    max-height: 84dvh;
    padding: 55px 14px 17px;
    border-radius: 20px;
  }

  .da-title { font-size: 22px; }
  .da-image { max-height: 210px; }
  .da-message { font-size: 13px; line-height: 1.6; }
  .da-price-section { padding: 14px 9px; }
}

@media (prefers-reduced-motion: reduce) {
  .da-popup,
  .da-bell,
  .da-badge,
  .da-badge::before,
  .da-price-card,
  .da-image-wrap,
  .da-button {
    animation: none !important;
    transition: none !important;
  }
}
`;

function AnnouncementContent({ message }) {
  const text = String(message || "");

  // Special layout for the milk price announcement.
  const hasMilkPrices =
    /500\s*ml/i.test(text) &&
    /1\s*litre/i.test(text) &&
    /₹\s*50/.test(text) &&
    /₹\s*100/.test(text);

  if (!hasMilkPrices) {
    return (
      <div className="da-message">
        {text.split(/\n+/).map((line, index) => (
          <p key={index}>{line.replace(/\*\*/g, "")}</p>
        ))}
      </div>
    );
  }

  const dateMatch = text.match(
    /Effective Date:\s*([^\n*]+)/i
  );

  const paragraphs = text
    .split(/\n+/)
    .map((line) => line.replace(/\*/g, "").trim())
    .filter(Boolean)
    .filter((line) =>
      !/NEW MILK PRICES|500\s*ml|1\s*litre|Effective Date:/i.test(line)
    )
    .filter((line) =>
      !/^Fresh Nest Mart$/i.test(line) &&
      !/^Pure Milk\s*[•·]/i.test(line)
    );

  return (
    <div>
      <div className="da-price-section">
        <div className="da-price-heading">
          ✨ NEW MILK PRICES ✨
        </div>

        <div className="da-price-grid">
          <div className="da-price-card">
            <div className="da-price-amount">₹50</div>
            <div className="da-price-size">500 ml</div>
          </div>

          <div className="da-price-card">
            <div className="da-price-amount">₹100</div>
            <div className="da-price-size">1 Litre</div>
          </div>
        </div>

        {dateMatch && (
          <div className="da-effective">
            📅 Effective {dateMatch[1].trim()}
          </div>
        )}
      </div>

      {paragraphs.map((paragraph, index) => (
        <p className="da-message" key={index}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export default function DynamicAnnouncements({ placement = "home" }) {
  const [announcements, setAnnouncements] = useState([]);
  const [visible, setVisible] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  const popupRef = useRef(null);

  const loadAnnouncements = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_URL}/announcements/active?placement=${encodeURIComponent(placement)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(`Announcement API error: ${response.status}`);
      }

      const data = await response.json();

      const items = Array.isArray(data.announcements)
        ? data.announcements
        : [];

      const today = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      });

      // Show each announcement maximum twice per day.
      const eligible = items.filter((item) => {
        const storageKey = `announcement_count_${item.id}_${placement}_${today}`;
        const count = Number(localStorage.getItem(storageKey) || 0);
        return count < 2;
      });

      setAnnouncements(eligible);
      setVisible(eligible.length > 0);

    } catch (error) {
      console.error("Failed to load announcements:", error);
      setAnnouncements([]);
      setVisible(false);
    }
  }, [placement]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  useEffect(() => {
    if (!visible) return;

    const frame = requestAnimationFrame(() => {
      if (popupRef.current) {
        popupRef.current.scrollTop = 0;
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [visible, announcements]);

  useEffect(() => {
    if (!imageOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setImageOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [imageOpen]);

  const closePopup = () => {
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    announcements.forEach((item) => {
      const storageKey = `announcement_count_${item.id}_${placement}_${today}`;
      const currentCount = Number(localStorage.getItem(storageKey) || 0);

      if (currentCount < 2) {
        localStorage.setItem(
          storageKey,
          String(currentCount + 1)
        );
      }
    });

    setImageOpen(false);
    setVisible(false);
  };

  if (!visible || announcements.length === 0) {
    return null;
  }

  const item = announcements[0];

  return (
    <>
      <style>{styles}</style>

      <div
        className="da-overlay"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            closePopup();
          }
        }}
      >
        <div
          ref={popupRef}
          className="da-popup"
          role="dialog"
          aria-modal="true"
          aria-labelledby="da-announcement-title"
        >
          <button
            type="button"
            onClick={closePopup}
            className="da-close"
            aria-label="Close announcement"
          >
            ×
          </button>

          <div className="da-heading">
            <span className="da-bell">🔔</span>

            <span className="da-brand">
              FARM FRESH DAIRY
            </span>

            <span className="da-badge">
              IMPORTANT UPDATE
            </span>
          </div>

          <h2
            id="da-announcement-title"
            className="da-title"
          >
            {item.title}
          </h2>

          {item.image_url && (
            <div
              className="da-image-wrap"
              onClick={() => setImageOpen(true)}
              role="button"
              tabIndex={0}
              aria-label="View full announcement image"
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setImageOpen(true);
                }
              }}
            >
              <img
                src={item.image_url}
                alt={item.title || "Farm Fresh Dairy announcement"}
                className="da-image"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />

              <span className="da-image-hint">
                🔍 Tap to view full image
              </span>
            </div>
          )}

          <AnnouncementContent message={item.message} />

          <button
            type="button"
            onClick={closePopup}
            className="da-button"
          >
            ✓ Got it!
          </button>

          <div className="da-footer">
            🥛 Pure Milk • Pure Promise • Pure Care
          </div>
        </div>
      </div>

      {imageOpen && item.image_url && (
        <div
          className="da-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Full announcement image"
          onClick={() => setImageOpen(false)}
        >
          <button
            type="button"
            className="da-lightbox-close"
            onClick={() => setImageOpen(false)}
            aria-label="Close image"
          >
            ×
          </button>

          <img
            src={item.image_url}
            alt={item.title || "Full announcement"}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
