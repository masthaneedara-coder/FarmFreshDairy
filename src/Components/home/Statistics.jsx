import { useEffect, useState } from "react";

function Counter({ end }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let current = 0;

    const timer = setInterval(() => {
      current += Math.ceil(end / 50);

      if (current >= end) {
        current = end;
        clearInterval(timer);
      }

      setCount(current);
    }, 40);

    return () => clearInterval(timer);
  }, [end]);

  return count;
}

export default function Statistics() {
  return (
    <section className="py-20 bg-green-700 rounded-[40px] text-white">
      <div className="grid md:grid-cols-4 gap-8 text-center">

        <div>
          <h2 className="text-5xl font-black">
            <Counter end={5000}/>+
          </h2>
          <p>Happy Customers</p>
        </div>

        <div>
          <h2 className="text-5xl font-black">
            <Counter end={1200}/>+
          </h2>
          <p>Daily Deliveries</p>
        </div>

        <div>
          <h2 className="text-5xl font-black">
            <Counter end={50}/>+
          </h2>
          <p>Healthy Buffaloes</p>
        </div>

        <div>
          <h2 className="text-5xl font-black">
            <Counter end={10}/>+
          </h2>
          <p>Years Experience</p>
        </div>

      </div>
    </section>
  );
}