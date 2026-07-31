import { useEffect, useState } from "react";
//import ProductCard from "./ProgressCard";
import { fetchProducts } from "../../config/api";
import ProductCard from "./ProductCard";

export default function ProductSelector({ onSelectProduct }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Store selected quantity for every product
  const [quantities, setQuantities] = useState({});

  // Store selected size for every product
  const [sizes, setSizes] = useState({});

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);

     const data = await fetchProducts();

      const dairyProducts = data.filter((p) => {
      console.log(p.name, p.product_name);

      return (
        p.name === "Cow Milk" ||
        p.name === "Buffalo Milk" ||
        p.name === "Curd" ||
        p.product_name === "Cow Milk" ||
        p.product_name === "Buffalo Milk" ||
        p.product_name === "Curd"
      );
    });

setProducts(dairyProducts);

      // Initialize quantity and size
      const qty = {};
      const size = {};

      dairyProducts.forEach((p) => {
        qty[p.id] = 1;
        size[p.id] = "1L";
      });

      setQuantities(qty);
      setSizes(size);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const increaseQty = (id) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: prev[id] + 1,
    }));
  };

  const decreaseQty = (id) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, prev[id] - 1),
    }));
  };

  const changeSize = (id, size) => {
    setSizes((prev) => ({
      ...prev,
      [id]: size,
    }));
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-500">
        Loading Products...
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="bg-white rounded-3xl shadow p-10 text-center">
        <h2 className="text-xl font-bold">
          No Products Available
        </h2>
      </div>
    );
  }

  return (
    <div>

      <div className="flex items-center justify-between mb-6">

        <div>
          <h2 className="text-3xl font-bold text-green-700">
            Choose Products
          </h2>

          <p className="text-gray-500">
            Select your daily fresh products
          </p>
        </div>

      </div>

      <div
          className="
          grid
          grid-cols-1
          sm:grid-cols-2
          md:grid-cols-3
          gap-4
          ">

        {products.map((product) => (

          <ProductCard
            key={product.id}
            product={product}

            quantity={quantities[product.id]}

            selectedSize={sizes[product.id]}

            onIncrease={() => increaseQty(product.id)}

            onDecrease={() => decreaseQty(product.id)}

            onSizeChange={(size) =>
              changeSize(product.id, size)
            }

            onSubscribe={() =>
              onSelectProduct?.({
                ...product,
                quantity: quantities[product.id],
                size: sizes[product.id],
              })
            }
          />

        ))}

      </div>

    </div>
  );
}