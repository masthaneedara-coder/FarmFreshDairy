const brands = [
  "🥛 Farm Fresh",
  "🌾 Organic",
  "🐃 Buffalo",
  "🐄 Cow Milk",
  "🥣 Dairy",
  "🛒 Grocery",
];

export default function TrustedBrands() {
  return (
    <section className="py-20 bg-white">
      <h2 className="text-center text-4xl font-black text-green-800">
        Trusted by Thousands
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mt-12">
        {brands.map((brand) => (
          <div
            key={brand}
            className="rounded-3xl bg-green-50 p-8 text-center font-bold text-xl hover:bg-green-100 transition"
          >
            {brand}
          </div>
        ))}
      </div>
    </section>
  );
}