import { Milk } from "lucide-react";

export default function ExtraMilkCard({ navigate }) {
  return (
    <div
      onClick={() => navigate("/extra-milk")}
      className="
        extra-milk-card
        group
        relative
        overflow-hidden
        cursor-pointer
        w-full
        rounded-2xl
        border
        border-green-100
        bg-white
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-lg
      "
    >

      {/* Green bottom highlight */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600" />

      {/* Background glow */}
      <div className="
        absolute
        -right-10
        -top-10
        w-36
        h-36
        rounded-full
        bg-green-100
        blur-3xl
        opacity-70
      " />

      <div className="
        relative
        flex
        items-center
        justify-between
        min-h-[145px]
        px-5
        py-5
        sm:px-7
      ">

        {/* LEFT SIDE */}
        <div className="relative z-10 max-w-[58%]">

          {/* Badge */}
          <div className="
            inline-flex
            items-center
            gap-1
            rounded-full
            bg-green-50
            px-3
            py-1
            text-[10px]
            sm:text-xs
            font-bold
            text-green-700
          ">
            ✨ EXTRA MILK
          </div>

          {/* Title */}
          <h3 className="
            mt-2
            text-xl
            sm:text-2xl
            font-black
            text-gray-900
          ">
            Extra Milk
          </h3>

          {/* Description */}
          <p className="
            mt-1
            text-xs
            sm:text-sm
            text-gray-500
          ">
            Request temporary extra milk
          </p>

          {/* Button */}
          <div className="
            mt-3
            inline-flex
            items-center
            gap-2
            text-sm
            font-bold
            text-green-700
          ">
            Request Now

            <span className="
              flex
              items-center
              justify-center
              w-7
              h-7
              rounded-full
              bg-green-50
              transition-all
              duration-300
              group-hover:translate-x-1
              group-hover:bg-green-100
            ">
              →
            </span>
          </div>

        </div>


        {/* RIGHT ANIMATION */}
        <div className="
          absolute
          right-3
          sm:right-8
          top-0
          bottom-0
          w-[42%]
        ">

          {/* Green glow */}
          <div className="
            absolute
            right-0
            top-1/2
            -translate-y-1/2
            w-24
            h-24
            sm:w-32
            sm:h-32
            rounded-full
            bg-green-100
            blur-xl
          " />

          {/* Moving highlight */}
          <div className="milk-highlight" />

          {/* Moving bottle */}
          <div className="milk-moving">

            <div className="
              relative
              flex
              items-center
              justify-center
              w-14
              h-14
              sm:w-20
              sm:h-20
              rounded-full
              bg-gradient-to-br
              from-green-100
              to-emerald-200
              shadow-lg
            ">

              <Milk
                className="
                  text-green-700
                  w-8
                  h-8
                  sm:w-10
                  sm:h-10
                "
                strokeWidth={2.5}
              />

              {/* Sparkle */}
              <span className="
                absolute
                -top-2
                -right-1
                text-sm
                animate-pulse
              ">
                ✨
              </span>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}