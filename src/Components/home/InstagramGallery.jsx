const images = [
  "https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=800",
  "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?q=80&w=800",
  "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800",
  "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?q=80&w=800",
];

export default function InstagramGallery() {
  return (
    <section className="py-20">

      <h2 className="text-center text-4xl font-black text-green-800">
        Farm Gallery
      </h2>

      <div className="grid md:grid-cols-4 gap-5 mt-12">

        {images.map((img) => (

          <img
            key={img}
            src={img}
            alt=""
            className="rounded-3xl h-72 w-full object-cover hover:scale-105 transition"
          />

        ))}

      </div>

    </section>
  );
}