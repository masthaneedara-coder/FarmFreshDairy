import { useEffect, useState } from "react";

export default function FloatingButtons() {

  const [showTop, setShowTop] = useState(false);

  useEffect(() => {

    const scroll = () => {
      setShowTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", scroll);

    return () => window.removeEventListener("scroll", scroll);

  }, []);

  return (
    <>

      <a
        href="https://wa.me/919989663837"
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-green-600 text-white text-3xl flex items-center justify-center shadow-2xl hover:scale-110 z-50"
      >
        💬
      </a>

      <a
        href="tel:+91 9989663837"
        className="fixed bottom-24 right-6 w-16 h-16 rounded-full bg-blue-600 text-white text-3xl flex items-center justify-center shadow-2xl hover:scale-110 z-50"
      >
        📞
      </a>

      {showTop && (

        <button
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
          className="fixed bottom-42 right-6 w-16 h-16 rounded-full bg-black text-white text-2xl shadow-2xl hover:scale-110 z-50"
        >
          ↑
        </button>

      )}

    </>
  );
}