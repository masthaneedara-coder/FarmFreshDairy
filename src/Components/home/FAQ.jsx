import { useState } from "react";

const faqs = [
  {
    q: "Do you deliver daily?",
    a: "Yes, every morning.",
  },
  {
    q: "Can I pause my subscription?",
    a: "Yes. Anytime.",
  },
  {
    q: "Is buffalo milk available?",
    a: "Yes, every day.",
  },
  {
    q: "Do you sell groceries?",
    a: "Yes. Fresh groceries are available.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <section className="py-20">

      <h2 className="text-center text-5xl font-black text-green-800">
        Frequently Asked Questions
      </h2>

      <div className="max-w-4xl mx-auto mt-16">

        {faqs.map((faq, index) => (

          <div
            key={faq.q}
            className="bg-white rounded-3xl shadow-lg mb-6"
          >

            <button
              onClick={() => setOpen(open === index ? -1 : index)}
              className="w-full flex justify-between items-center p-7 font-bold text-xl"
            >
              {faq.q}

              <span>
                {open === index ? "−" : "+"}
              </span>
            </button>

            {open === index && (
              <div className="px-7 pb-7 text-gray-600">
                {faq.a}
              </div>
            )}

          </div>

        ))}

      </div>

    </section>
  );
}