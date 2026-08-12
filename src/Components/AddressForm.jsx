import { useEffect, useState } from "react";
import {
  MapPin,
  Navigation,
  X,
  Home,
  Building2,
  MapPinned,
  Star,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function AddressForm({
  customerId,
  onSave,
  onCancel,
  address = null,
}) {
  const [form, setForm] = useState({
    house_no: address?.house_no || "",
    street: address?.street || "",
    area: address?.area || "",
    city: address?.city || "",
    state: address?.state || "",
    pincode: address?.pincode || "",
    landmark: address?.landmark || "",

    latitude: address?.latitude || null,
    longitude: address?.longitude || null,

    is_default: address?.is_default || false,
  });

  const [saving, setSaving] = useState(false);

  /*
   * Update form when a new address is passed.
   * Useful when opening the form from
   * "Use Current Location".
   */
  useEffect(() => {
    setForm({
      house_no: address?.house_no || "",
      street: address?.street || "",
      area: address?.area || "",
      city: address?.city || "",
      state: address?.state || "",
      pincode: address?.pincode || "",
      landmark: address?.landmark || "",

      latitude: address?.latitude || null,
      longitude: address?.longitude || null,

      is_default: address?.is_default || false,
    });
  }, [address]);

  function handleChange(e) {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);

      await onSave({
        customer_id: customerId,
        ...form,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        bg-black/50
        backdrop-blur-sm
        flex
        items-center
        justify-center
        p-3
        sm:p-6
      "
    >
      {/* Modal */}

      <div
        className="
          bg-white
          w-full
          max-w-2xl
          max-h-[92vh]
          overflow-hidden
          rounded-3xl
          shadow-2xl
          animate-[fadeIn_.2s_ease-out]
        "
      >

        {/* =====================================
            HEADER
        ====================================== */}

        <div
          className="
            bg-gradient-to-r
            from-green-600
            to-emerald-500
            text-white
            px-5
            sm:px-7
            py-5
            flex
            items-center
            justify-between
          "
        >

          <div className="flex items-center gap-3">

            <div
              className="
                w-11
                h-11
                rounded-2xl
                bg-white/20
                flex
                items-center
                justify-center
              "
            >
              <MapPin size={23} />
            </div>

            <div>

              <h2 className="
                text-xl
                sm:text-2xl
                font-black
              ">
                {address?.id
                  ? "Edit Address"
                  : "Add Address"}
              </h2>

              <p className="
                text-green-100
                text-xs
                sm:text-sm
              ">
                Enter your milk delivery location
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={onCancel}
            className="
              w-9
              h-9
              rounded-full
              bg-white/15
              hover:bg-white/25
              flex
              items-center
              justify-center
              transition
            "
          >
            <X size={20} />
          </button>

        </div>


        {/* =====================================
            FORM
        ====================================== */}

        <form
          onSubmit={handleSubmit}
          className="
            overflow-y-auto
            max-h-[calc(92vh-90px)]
            p-5
            sm:p-7
            space-y-5
          "
        >

          {/* GPS detected */}

          {form.latitude &&
            form.longitude && (

              <div
                className="
                  flex
                  items-center
                  gap-3
                  bg-green-50
                  border
                  border-green-200
                  rounded-2xl
                  p-3
                "
              >

                <div
                  className="
                    w-10
                    h-10
                    rounded-xl
                    bg-green-100
                    text-green-700
                    flex
                    items-center
                    justify-center
                  "
                >
                  <Navigation size={19} />
                </div>

                <div className="flex-1">

                  <p className="
                    text-sm
                    font-bold
                    text-green-800
                  ">
                    Current location detected
                  </p>

                  <p className="
                    text-xs
                    text-green-600
                  ">
                    GPS coordinates saved with this
                    address
                  </p>

                </div>

                <CheckCircle2
                  className="text-green-600"
                  size={20}
                />

              </div>
            )}


          {/* =====================================
              HOUSE + STREET
          ====================================== */}

          <div className="
            grid
            grid-cols-1
            sm:grid-cols-2
            gap-4
          ">

            {/* House */}

            <div>

              <label className="
                block
                text-sm
                font-bold
                text-gray-700
                mb-2
              ">
                House / Flat No.
              </label>

              <div className="relative">

                <Home
                  size={18}
                  className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-gray-400
                  "
                />

                <input
                  name="house_no"
                  placeholder="Ex: 2-4-15"
                  value={form.house_no}
                  onChange={handleChange}
                  className="
                    w-full
                    border
                    border-gray-200
                    rounded-xl
                    pl-10
                    pr-3
                    py-3
                    outline-none
                    focus:border-green-500
                    focus:ring-2
                    focus:ring-green-100
                    transition
                  "
                  required
                />

              </div>

            </div>


            {/* Street */}

            <div>

              <label className="
                block
                text-sm
                font-bold
                text-gray-700
                mb-2
              ">
                Street
              </label>

              <div className="relative">

                <Building2
                  size={18}
                  className="
                    absolute
                    left-3
                    top-1/2
                    -translate-y-1/2
                    text-gray-400
                  "
                />

                <input
                  name="street"
                  placeholder="Street / Road"
                  value={form.street}
                  onChange={handleChange}
                  className="
                    w-full
                    border
                    border-gray-200
                    rounded-xl
                    pl-10
                    pr-3
                    py-3
                    outline-none
                    focus:border-green-500
                    focus:ring-2
                    focus:ring-green-100
                  "
                  required
                />

              </div>

            </div>

          </div>


          {/* =====================================
              AREA
          ====================================== */}

          <div>

            <label className="
              block
              text-sm
              font-bold
              text-gray-700
              mb-2
            ">
              Area / Locality
            </label>

            <div className="relative">

              <MapPinned
                size={18}
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-gray-400
                "
              />

              <input
                name="area"
                placeholder="Ex: Dammaiguda"
                value={form.area}
                onChange={handleChange}
                className="
                  w-full
                  border
                  border-gray-200
                  rounded-xl
                  pl-10
                  pr-3
                  py-3
                  outline-none
                  focus:border-green-500
                  focus:ring-2
                  focus:ring-green-100
                "
                required
              />

            </div>

          </div>


          {/* =====================================
              CITY + STATE
          ====================================== */}

          <div className="
            grid
            grid-cols-1
            sm:grid-cols-2
            gap-4
          ">

            <div>

              <label className="
                block
                text-sm
                font-bold
                text-gray-700
                mb-2
              ">
                City
              </label>

              <input
                name="city"
                placeholder="Hyderabad"
                value={form.city}
                onChange={handleChange}
                className="
                  w-full
                  border
                  border-gray-200
                  rounded-xl
                  px-3
                  py-3
                  outline-none
                  focus:border-green-500
                  focus:ring-2
                  focus:ring-green-100
                "
                required
              />

            </div>


            <div>

              <label className="
                block
                text-sm
                font-bold
                text-gray-700
                mb-2
              ">
                State
              </label>

              <input
                name="state"
                placeholder="Telangana"
                value={form.state}
                onChange={handleChange}
                className="
                  w-full
                  border
                  border-gray-200
                  rounded-xl
                  px-3
                  py-3
                  outline-none
                  focus:border-green-500
                  focus:ring-2
                  focus:ring-green-100
                "
                required
              />

            </div>

          </div>


          {/* =====================================
              PINCODE
          ====================================== */}

          <div>

            <label className="
              block
              text-sm
              font-bold
              text-gray-700
              mb-2
            ">
              Pincode
            </label>

            <input
              name="pincode"
              placeholder="500083"
              value={form.pincode}
              onChange={handleChange}
              inputMode="numeric"
              maxLength={6}
              className="
                w-full
                border
                border-gray-200
                rounded-xl
                px-3
                py-3
                outline-none
                focus:border-green-500
                focus:ring-2
                focus:ring-green-100
              "
              required
            />

          </div>


          {/* =====================================
              LANDMARK
          ====================================== */}

          <div>

            <label className="
              block
              text-sm
              font-bold
              text-gray-700
              mb-2
            ">
              Landmark
              <span className="
                text-gray-400
                font-normal
                ml-1
              ">
                (Optional)
              </span>
            </label>

            <input
              name="landmark"
              placeholder="Near temple / school / supermarket"
              value={form.landmark}
              onChange={handleChange}
              className="
                w-full
                border
                border-gray-200
                rounded-xl
                px-3
                py-3
                outline-none
                focus:border-green-500
                focus:ring-2
                focus:ring-green-100
              "
            />

          </div>


          {/* =====================================
              DEFAULT ADDRESS
          ====================================== */}

          <label
            className="
              flex
              items-center
              gap-3
              p-4
              bg-gray-50
              hover:bg-green-50
              border
              border-gray-100
              rounded-2xl
              cursor-pointer
              transition
            "
          >

            <input
              type="checkbox"
              name="is_default"
              checked={form.is_default}
              onChange={handleChange}
              className="
                w-5
                h-5
                accent-green-600
              "
            />

            <div className="flex-1">

              <div className="
                flex
                items-center
                gap-2
              ">

                <Star
                  size={16}
                  className="text-yellow-500"
                />

                <span className="
                  font-bold
                  text-gray-800
                ">
                  Set as Default Address
                </span>

              </div>

              <p className="
                text-xs
                text-gray-500
                mt-1
              ">
                Use this address for your
                subscription deliveries
              </p>

            </div>

          </label>


          {/* =====================================
              GPS COORDINATES
          ====================================== */}

          {form.latitude &&
            form.longitude && (

              <div className="
                grid
                grid-cols-2
                gap-3
                text-xs
              ">

                <div className="
                  bg-gray-50
                  rounded-xl
                  p-3
                ">

                  <span className="
                    text-gray-400
                    block
                  ">
                    Latitude
                  </span>

                  <span className="
                    font-semibold
                    text-gray-700
                  ">
                    {form.latitude}
                  </span>

                </div>

                <div className="
                  bg-gray-50
                  rounded-xl
                  p-3
                ">

                  <span className="
                    text-gray-400
                    block
                  ">
                    Longitude
                  </span>

                  <span className="
                    font-semibold
                    text-gray-700
                  ">
                    {form.longitude}
                  </span>

                </div>

              </div>

            )}


          {/* =====================================
              ACTIONS
          ====================================== */}

          <div className="
            flex
            flex-col-reverse
            sm:flex-row
            sm:justify-end
            gap-3
            pt-3
            border-t
            border-gray-100
          ">

            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="
                w-full
                sm:w-auto
                px-6
                py-3
                rounded-xl
                border
                border-gray-200
                text-gray-700
                font-bold
                hover:bg-gray-50
                transition
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="
                w-full
                sm:w-auto
                px-7
                py-3
                rounded-xl
                bg-green-600
                hover:bg-green-700
                text-white
                font-bold
                shadow-lg
                shadow-green-200
                active:scale-95
                transition
                flex
                items-center
                justify-center
                gap-2
              "
            >

              {saving ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Save Address
                </>
              )}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}