export default function MobileApp() {
  return (
    <section className="py-20">

      <div className="rounded-[40px] bg-gradient-to-r from-green-700 to-green-500 p-14 text-white">

        <h2 className="text-5xl font-black">
          Download Our App
        </h2>

        <p className="mt-6 text-xl">
          Order Milk, Grocery and Track Delivery.
        </p>

        <div className="flex gap-5 mt-10">

          <button className="bg-black px-8 py-4 rounded-2xl">
            Google Play
          </button>

          <button className="bg-white text-black px-8 py-4 rounded-2xl">
            App Store
          </button>

        </div>

      </div>
    </section>
  );
}