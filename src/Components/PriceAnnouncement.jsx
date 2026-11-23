
import { useEffect, useState } from "react";

function getIndiaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function PriceAnnouncement({ isLoggedIn }) {
  const [today, setToday] = useState(getIndiaDate());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setToday(getIndiaDate());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  if (
    !isLoggedIn ||
    today >= "2027-01-01" ||
    dismissed
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-3 left-3 right-3 z-[9999] mx-auto max-w-2xl motion-safe:animate-[slideUp_.6s_ease-out]">

      <div className="relative overflow-hidden rounded-2xl border-2 border-orange-400 bg-white shadow-[0_0_22px_rgba(249,115,22,0.35)] motion-safe:animate-[alertGlow_2s_ease-in-out_infinite]">

        {/* Animated alert strip */}
        <div className="flex items-center justify-between bg-gradient-to-r from-red-600 via-orange-500 to-red-600 px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="motion-safe:animate-bounce text-xl">
              🔔
            </span>

            <span className="text-sm font-extrabold tracking-wide text-white motion-safe:animate-pulse">
              IMPORTANT PRICE ALERT
            </span>
          </div>

          <span className="rounded-full bg-white px-2 py-1 text-xs font-extrabold text-red-600 motion-safe:animate-pulse">
            NEW
          </span>
        </div>

        <div className="p-4 sm:p-5">

          <button
            onClick={() => setDismissed(true)}
            className="absolute right-3 top-12 rounded-full bg-gray-100 px-3 py-1 text-gray-600 hover:bg-gray-200"
            aria-label="Close announcement"
          >
            ✕
          </button>

          <h2 className="pr-10 text-xl font-extrabold text-gray-900 sm:text-2xl">
            Milk Price Revision Notice!
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            Dear Customers, please note that our revised
            milk prices will be effective from
            <strong className="text-red-600">
              {" "}1 January 2027.
            </strong>
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">

            <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-center">
              <p className="text-3xl font-extrabold text-green-700">
                ₹100
              </p>
              <p className="text-sm font-bold text-gray-800">
                1 Litre
              </p>
            </div>

            <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-center">
              <p className="text-3xl font-extrabold text-green-700">
                ₹50
              </p>
              <p className="text-sm font-bold text-gray-800">
                500 ml
              </p>
            </div>

          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <p className="text-xs text-gray-500">
              Thank you for your continued support.
              <br />
              Farm Fresh Dairy
            </p>

            <button
              onClick={() => setDismissed(true)}
              className="shrink-0 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-green-800"
            >
              Got it ✓
            </button>
          </div>

        </div>
      </div>

     <style>{`
  @keyframes mobileSlideUp {
    0% {
      opacity: 0;
      transform: translateY(100%);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes alertGlow {
    0%, 100% {
      box-shadow: 0 0 8px rgba(249,115,22,.25);
    }
    50% {
      box-shadow: 0 0 22px rgba(239,68,68,.5);
    }
  }

  @keyframes bellShake {
    0%, 100% { transform: rotate(0); }
    20% { transform: rotate(-15deg); }
    40% { transform: rotate(15deg); }
    60% { transform: rotate(-10deg); }
    80% { transform: rotate(10deg); }
  }

  @keyframes pricePulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.035); }
  }

  .price-announcement {
    animation: mobileSlideUp .65s ease-out,
               alertGlow 2s ease-in-out infinite;
  }

  .price-bell {
    display: inline-block;
    animation: bellShake 1.5s ease-in-out infinite;
    transform-origin: top center;
  }

  .price-card {
    animation: pricePulse 2.5s ease-in-out infinite;
  }

  @media (min-width: 768px) {
    .price-announcement {
      max-width: 650px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .price-announcement,
    .price-bell,
    .price-card {
      animation: none !important;
    }
  }
`}</style>

    </div>
  );
}
