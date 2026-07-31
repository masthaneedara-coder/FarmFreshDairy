const reviews = [
  {
    name: "Ramesh",
    place: "ECIL",
    review:
      "Milk quality is excellent. Delivery is always on time.",
  },
  {
    name: "Lakshmi",
    place: "Dammaiguda",
    review:
      "Very fresh buffalo milk. My children love it.",
  },
  {
    name: "Prasad",
    place: "Kapra",
    review:
      "Best dairy service in our area.",
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 bg-green-50 rounded-[40px]">

      <h2 className="text-center text-5xl font-black text-green-800">
        Happy Customers
      </h2>

      <div className="grid lg:grid-cols-3 gap-8 mt-16">

        {reviews.map((review) => (

          <div
            key={review.name}
            className="bg-white rounded-3xl p-8 shadow-lg hover:-translate-y-2 transition"
          >
            <div className="text-yellow-500 text-2xl">
              ⭐⭐⭐⭐⭐
            </div>

            <p className="mt-5 text-gray-600 italic">
              "{review.review}"
            </p>

            <h3 className="mt-8 font-black text-xl">
              {review.name}
            </h3>

            <p className="text-green-700">
              {review.place}
            </p>

          </div>

        ))}

      </div>

    </section>
  );
}