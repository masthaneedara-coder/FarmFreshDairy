import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProducts } from "../config/api";

export default function SubscriptionPlans() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
  try {
   const products = await fetchProducts();
   console.log(products);
   setProducts(products);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
}

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading Plans...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-7xl mx-auto px-6 py-10">

        <h1 className="text-4xl font-black text-green-700 mb-2">
          Choose Your Subscription
        </h1>

        <p className="text-gray-500 mb-10">
          Fresh milk delivered to your doorstep every day.
        </p>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">

            {products.length === 0 && (
                <div className="text-red-600 font-bold">
                No products found
                </div>
            )}

            {products.map((product) => (

            <div
              key={product.id}
              className="bg-white rounded-3xl shadow-lg overflow-hidden border hover:shadow-xl transition"
            >

              <img
                src={product.image}
                alt={product.name}
                className="h-60 w-full object-cover"
              />

              <div className="p-6">

                <h2 className="text-2xl font-bold">
                  {product.name}
                </h2>

                <p className="text-gray-500 mt-2">
                  Fresh dairy product.
                </p>

                <div className="mt-6 space-y-2">

                  <p>500ml - ₹900 / Month</p>

                  <p>1L - ₹1800 / Month</p>

                  <p>2L - ₹3600 / Month</p>

                </div>

                <button
                    onClick={() => {
                        console.log("Product:", product);
                        console.log("Navigate URL:", `/subscription/create/${product.id}`);

                        navigate(`/subscription/create/${product.id}`);
                    }}
                    className="mt-8 w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 font-bold"
                    >
                    Choose Plan
                    </button>
              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}