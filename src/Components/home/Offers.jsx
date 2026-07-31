const offers = [
  {
    title: "Buy 10L Get 1L FREE",
    color: "from-green-500 to-emerald-600",
    icon: "🥛",
  },
  {
    title: "Free Home Delivery",
    color: "from-blue-500 to-cyan-600",
    icon: "🚚",
  },
  {
    title: "Monthly Subscription 10% OFF",
    color: "from-orange-500 to-red-500",
    icon: "🎁",
  },
  {
    title: "Fresh Grocery Combo",
    color: "from-purple-500 to-pink-600",
    icon: "🛒",
  },
];

export default function Offers() {
  return (
    <section className="py-20">
      <div className="text-center mb-14">
        <h2 className="text-5xl font-black text-green-800">
          Today's Offers
        </h2>

        <p className="text-gray-500 mt-4">
          Limited time offers for our customers
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

        {offers.map((offer) => (
          <div
            key={offer.title}
            className={`rounded-[30px] bg-gradient-to-r ${offer.color}
            text-white p-8 shadow-xl hover:scale-105 transition duration-300`}
          >
            <div className="text-6xl">
              {offer.icon}
            </div>

            <h3 className="text-2xl font-black mt-8">
              {offer.title}
            </h3>
          </div>
        ))}

      </div>
    </section>
  );
}