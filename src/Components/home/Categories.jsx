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

export default function Categories({
  selectedCategory,
  setSelectedCategory,
}) {
  return (
    <section className="py-5">
      <div className="max-w-7xl mx-auto px-4">

        <h2 className="text-4xl font-black text-center text-green-800">
           Category
        </h2>        
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-5 mt-10">

          {categories.map((cat) => (

            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`group rounded-3xl p-3 border transition-all duration-300 shadow-lg min-h-[120px]

                ${
                  selectedCategory === cat.name
                    ? "bg-green-600 text-white border-green-600 scale-105 shadow-2xl"
                    : "bg-white hover:bg-green-50 border-green-100 hover:-translate-y-2"
                }

              `}
            >

              <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
                {cat.icon}
              </div>

              <h3 className="mt-2 text-xs font-semibold leading-tight">
                {cat.name}
              </h3>

            </button>

          ))}

        </div>

      </div>
    </section>
  );
}