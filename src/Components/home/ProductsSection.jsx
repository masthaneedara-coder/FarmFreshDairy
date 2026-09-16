import { Link } from "react-router-dom";

export default function ProductsSection({
  productsRef,
  filteredProducts = [],
  goToSubscription,
}) {
  return (
    <section ref={productsRef} className="py-8 sm:py-10 lg:py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-600">
            Fresh picks
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Popular products
          </h2>
          <p className="mt-1.5 text-xs font-medium text-slate-500 sm:text-sm">
            Everyday dairy and fresh essentials.
          </p>
        </div>

        <Link
          to="/products"
          className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700"
        >
          View all →
        </Link>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="text-5xl">🥛</div>
          <h3 className="mt-3 text-xl font-black text-slate-800">No products found</h3>
          <p className="mt-1 text-sm text-slate-400">Try another category.</p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.slice(0, 8).map((product, index) => {
            const stock = Number(product.stock || 0);
            const price = Number(product.offer_price ?? product.price ?? 0);

            return (
              <article
                key={product.id || index}
                style={{ animationDelay: `${index * 60}ms` }}
                className="group overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
              >
                <Link to="/products" className="block">
                  <div className="relative aspect-[1/1] overflow-hidden bg-slate-100">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name || "Product"}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        loading={index > 3 ? "lazy" : "eager"}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl">🥛</div>
                    )}

                    <div className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2 py-1 text-[9px] font-black text-slate-700 backdrop-blur">
                      {stock > 0 ? "In stock" : "Sold out"}
                    </div>
                  </div>
                </Link>

                <div className="p-3.5 sm:p-4">
                  <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600">
                    {product.categories?.name || product.category || "Fresh"}
                  </p>

                  <h3 className="mt-1 line-clamp-2 min-h-[34px] text-sm font-black text-slate-900 sm:text-base">
                    {product.name || "Fresh Product"}
                  </h3>

                  <div className="mt-2 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-lg font-black text-emerald-700 sm:text-xl">
                        ₹{price.toLocaleString("en-IN")}
                      </p>
                      {product.offer_price && Number(product.offer_price) < Number(product.price) && (
                        <p className="text-[10px] font-semibold text-slate-400 line-through">
                          ₹{Number(product.price).toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Link
                      to="/products"
                      className="rounded-xl bg-emerald-600 py-2.5 text-center text-[10px] font-black text-white transition hover:bg-emerald-700 sm:text-xs"
                    >
                      Order
                    </Link>
                    <button
                      onClick={goToSubscription}
                      className="rounded-xl bg-emerald-50 py-2.5 text-[10px] font-black text-emerald-700 transition hover:bg-emerald-100 sm:text-xs"
                    >
                      Subscribe
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
