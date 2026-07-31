export default function MapSection() {
  return (
    <section className="py-20">

      <h2 className="text-center text-4xl font-black text-green-800 mb-12">
        Visit Our Farm
      </h2>

      <iframe
        title="Map"
        src="https://www.google.com/maps/embed?..."
        className="w-full h-[450px] rounded-[30px]"
        loading="lazy"
      />

    </section>
  );
}