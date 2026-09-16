const categories = [
  { icon: "🛍️", name: "All" },
  { icon: "🐃", name: "Buffalo Milk" },
  { icon: "🐄", name: "Cow Milk" },
  { icon: "🥣", name: "Curd" },
  { icon: "🧈", name: "Ghee" },
  { icon: "🧀", name: "Paneer" },
  { icon: "🥚", name: "Eggs" },
  { icon: "🥬", name: "Vegetables" },
  { icon: "🛒", name: "Groceries" },
];

export default function Categories({ selectedCategory, setSelectedCategory }) {
  return (
    <section className="py-2 sm:py-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-600">
            Shop by category
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            What are you looking for?
          </h2>
        </div>
        <span className="hidden text-xs font-semibold text-slate-400 sm:block">
          Fresh essentials
        </span>
      </div>

      <div className="mt-4 flex gap-2.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((cat) => {
          const active = selectedCategory === cat.name;

          return (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`group flex min-w-[88px] shrink-0 flex-col items-center justify-center rounded-2xl border px-3 py-3 transition-all duration-300 sm:min-w-[100px] sm:rounded-3xl sm:px-4 sm:py-4 ${
                active
                  ? "border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                  : "border-slate-200 bg-white text-slate-700 shadow-sm hover:-translate-y-1 hover:border-emerald-200 hover:bg-emerald-50"
              }`}
            >
              <span className={`text-2xl transition-transform duration-300 group-hover:scale-110 ${active ? "ff-float" : ""}`}>
                {cat.icon}
              </span>
              <span className={`mt-2 text-[10px] font-black leading-tight sm:text-xs ${active ? "text-white" : "text-slate-700"}`}>
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
