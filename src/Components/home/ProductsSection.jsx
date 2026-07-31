import { Link } from "react-router-dom";

export default function ProductsSection({
  productsRef,
  filteredProducts,
  goToSubscription,
}) {
  return (
    <section
      ref={productsRef}
      className="py-8 sm:py-10 lg:py-12"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">

          <div>
            <h3 className="text-3xl sm:text-4xl font-black text-green-800">
              Our Dairy Products
            </h3>

            <p className="mt-2 text-gray-500">
              Fresh dairy essentials for your family.
            </p>
          </div>

          <Link
            to="/products"
            className="inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold shadow transition"
          >
            View All Products
          </Link>

        </div>

        {filteredProducts.length === 0 ? (

          <div className="rounded-3xl bg-white border border-green-100 p-10 text-center shadow-sm">

            <div className="text-5xl mb-3">
              🥛
            </div>

            <h4 className="text-2xl font-black text-green-700">
              No products found
            </h4>
          </div>

        ) : (

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">

            {filteredProducts.map((product, index) => (

              <div
                key={index}
                className="bg-white rounded-3xl border border-green-100 shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >

                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-52 object-cover"
                />

                <div className="p-5">

                  <h4 className="text-xl font-black text-green-800">
                    {product.name}
                  </h4>

                  <p className="text-2xl font-black text-green-600 mt-2">
                    ₹{product.price}
                  </p>

                  <div className="mt-5 flex gap-3">

                    <Link
                      to="/products"
                      className="flex-1 text-center bg-green-600 hover:bg-green-700 text-white rounded-2xl py-3 font-bold"
                    >
                      Order Now
                    </Link>

                    <button
                      onClick={goToSubscription}
                      className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-2xl py-3 font-bold"
                    >
                      Subscribe
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>
    </section>
  );
}