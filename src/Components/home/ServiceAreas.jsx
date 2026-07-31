const areas = [
  "ECIL",
  "Dammaiguda",
  "Kapra",
  "Sainikpuri",
  "Nagaram",
  "Rampally",
  "Keesara",
  "Cherlapally",
];

export default function ServiceAreas() {
  return (
    <section className="py-20 bg-green-700 rounded-[40px] text-white">

      <h2 className="text-center text-5xl font-black">
        Delivery Areas
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-14">

        {areas.map((area) => (

          <div
            key={area}
            className="bg-white/10 rounded-3xl p-6 text-center text-xl font-bold"
          >
            📍 {area}
          </div>

        ))}

      </div>

    </section>
  );
}