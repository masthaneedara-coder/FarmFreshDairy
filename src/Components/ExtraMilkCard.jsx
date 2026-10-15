import { Milk, ArrowUpRight, Sparkles, Plus } from "lucide-react";

export default function ExtraMilkCard({ navigate }) {
  const handleRequest = () => navigate("/extra-milk");

  return (
    <>
      <style>{`
        @keyframes emAurora {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes emBottleFloat {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-6px) rotate(5deg); }
        }
        @keyframes emOrbit {
          from { transform: rotate(0deg) translateX(35px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(35px) rotate(-360deg); }
        }
        @keyframes emShine {
          0% { transform: translateX(-160%) skewX(-18deg); }
          55%, 100% { transform: translateX(250%) skewX(-18deg); }
        }
        @keyframes emPulse {
          0%, 100% { transform: scale(.94); opacity: .45; }
          50% { transform: scale(1.08); opacity: .8; }
        }
        .em-aurora { background-size: 220% 220%; animation: emAurora 10s ease-in-out infinite; }
        .em-bottle { animation: emBottleFloat 3.2s ease-in-out infinite; }
        .em-orbit { animation: emOrbit 8s linear infinite; }
        .em-shine { animation: emShine 5.8s ease-in-out infinite; }
        .em-pulse { animation: emPulse 3.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .em-aurora, .em-bottle, .em-orbit, .em-shine, .em-pulse { animation: none !important; }
        }
      `}</style>

      <button
        type="button"
        onClick={handleRequest}
        aria-label="Request extra milk"
        className="group relative block w-full overflow-hidden rounded-[22px] border border-emerald-100/80 bg-white text-left shadow-[0_8px_28px_rgba(15,118,80,0.09)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_38px_rgba(15,118,80,0.16)] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:scale-[0.99]"
      >
        {/* Colorful modern aurora backdrop */}
        <div className="em-aurora pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-emerald-50/80 to-cyan-50/90" />
        <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-lime-300/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 right-[28%] h-40 w-40 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 bottom-0 h-28 w-28 rounded-full bg-pink-200/25 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[4px] bg-gradient-to-r from-emerald-600 via-teal-400 to-lime-400" />

        <div className="relative flex min-h-[120px] items-center justify-between gap-2.5 px-3.5 py-4 sm:min-h-[145px] sm:gap-4 sm:px-6 sm:py-5">
          <div className="relative z-10 min-w-0 flex-1 sm:max-w-[68%]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-white/85 px-2.5 py-1 text-[9px] font-extrabold tracking-[0.12em] text-emerald-800 shadow-sm backdrop-blur-sm sm:px-3 sm:text-[10px]">
              <Sparkles size={11} className="shrink-0 text-amber-500" />
              A LITTLE EXTRA FRESHNESS
            </span>

            <h3 className="mt-2 text-[19px] font-black leading-tight tracking-tight text-slate-900 sm:mt-2.5 sm:text-2xl">
              Extra <span className="bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-600 bg-clip-text text-transparent">Milk</span>
            </h3>
            <p className="mt-1 max-w-[230px] text-[11px] leading-relaxed text-slate-600 sm:max-w-none sm:text-sm">
              Need more for today? We’ll bring the freshness.
            </p>

            <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-700 to-teal-600 py-2 pl-3.5 pr-2 text-[11px] font-extrabold text-white shadow-md shadow-emerald-700/20 transition-all duration-300 group-hover:gap-3 group-hover:shadow-lg group-hover:shadow-emerald-700/25 sm:mt-4 sm:py-2.5 sm:pl-4 sm:pr-2.5 sm:text-sm">
              Request Now
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 group-hover:rotate-45 sm:h-7 sm:w-7">
                <ArrowUpRight size={15} strokeWidth={2.5} />
              </span>
            </span>
          </div>

          {/* Small, animated milk badge */}
          <div className="relative mr-0.5 flex h-[76px] w-[76px] shrink-0 items-center justify-center sm:mr-3 sm:h-28 sm:w-28">
            <div className="em-pulse absolute inset-1 rounded-full bg-gradient-to-br from-emerald-300/60 via-cyan-200/50 to-lime-200/70 blur-md" />
            <div className="relative flex h-[58px] w-[58px] items-center justify-center rounded-[20px] border border-white/90 bg-gradient-to-br from-white via-emerald-50 to-cyan-100 shadow-[0_8px_20px_rgba(5,150,105,0.16)] transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 sm:h-[76px] sm:w-[76px] sm:rounded-[25px]">
              <div className="em-bottle flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 sm:h-12 sm:w-12">
                <Milk className="h-[22px] w-[22px] text-emerald-700 sm:h-7 sm:w-7" strokeWidth={2.3} />
              </div>
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-amber-300 to-orange-400 text-white shadow-sm sm:h-6 sm:w-6">
                <Plus size={11} strokeWidth={3} />
              </span>
            </div>
            <span className="em-orbit pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-cyan-400 shadow-sm" />
            <Sparkles className="absolute right-0 top-1 h-4 w-4 text-amber-400 drop-shadow-sm sm:right-1 sm:top-2 sm:h-5 sm:w-5" />
            <div className="em-shine pointer-events-none absolute left-2 top-2 h-12 w-4 rounded-full bg-white/60 blur-sm sm:left-3 sm:top-4 sm:h-16" />
          </div>
        </div>
      </button>
    </>
  );
}
