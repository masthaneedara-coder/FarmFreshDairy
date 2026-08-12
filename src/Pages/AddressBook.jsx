import { useEffect, useState } from "react";

import {
  MapPin,
  Plus,
  CheckCircle2,
  Navigation,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  fetchCustomerAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../config/api";

import AddressForm from "../Components/AddressForm";

import LocationButton from "../Components/LocationButton";

export default function AddressBook() {
  const [addresses, setAddresses] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);

  const [editingAddress, setEditingAddress] =
    useState(null);

  const [locationLoading, setLocationLoading] =
    useState(false);

  // ============================================
  // LOAD ADDRESSES
  // ============================================

  useEffect(() => {
    loadAddresses();
  }, []);

  async function loadAddresses() {
    try {
      setLoading(true);

      const customer = JSON.parse(
        localStorage.getItem("customer") || "null"
      );

      if (!customer?.id) {
        setAddresses([]);
        return;
      }

      const res =
        await fetchCustomerAddresses(customer.id);

      setAddresses(res.addresses || []);
    } catch (err) {
      console.error(
        "Load addresses error:",
        err
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================
  // ADD / UPDATE ADDRESS
  // ============================================

  async function handleSaveAddress(addressData) {
    try {
      const customer = JSON.parse(
        localStorage.getItem("customer") || "null"
      );

      if (!customer?.id) {
        alert("Please login again.");
        return;
      }

      const payload = {
        ...addressData,
        customer_id: customer.id,
      };

      if (editingAddress) {
        await updateAddress(
          editingAddress.id,
          payload
        );
      } else {
        await createAddress(payload);
      }

      setEditingAddress(null);
      setShowForm(false);

      await loadAddresses();
    } catch (err) {
      console.error(
        "Save address error:",
        err
      );

      alert(
        err.message ||
          "Failed to save address."
      );
    }
  }

  // ============================================
  // DELETE
  // ============================================

  async function handleDeleteAddress(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this address?"
    );

    if (!confirmed) return;

    try {
      await deleteAddress(id);

      await loadAddresses();
    } catch (err) {
      console.error(err);

      alert(
        err.message ||
          "Failed to delete address."
      );
    }
  }

  // ============================================
  // DEFAULT ADDRESS
  // ============================================

  async function handleSetDefault(address) {
    try {
      const customer = JSON.parse(
        localStorage.getItem("customer") || "null"
      );

      if (!customer?.id) {
        alert("Please login again.");
        return;
      }

      await setDefaultAddress(
        address.id,
        customer.id
      );

      await loadAddresses();
    } catch (err) {
      console.error(err);

      alert(
        err.message ||
          "Failed to set default address."
      );
    }
  }

  // ============================================
  // CURRENT LOCATION
  // ============================================

  function handleCurrentLocation(location) {
    console.log(
      "Detected location:",
      location
    );

    /*
      Convert detected location into
      AddressForm-compatible data.
    */

    const newAddress = {
      house_no:
        location.house_no || "",

      street:
        location.street || "",

      area:
        location.area || "",

      city:
        location.city || "",

      state:
        location.state || "",

      pincode:
        location.pincode || "",

      latitude:
        location.latitude || null,

      longitude:
        location.longitude || null,

      is_default: false,
    };

    /*
      Open address form with
      detected location.
    */

    setEditingAddress(newAddress);

    setShowForm(true);
  }

  // ============================================
  // OPEN ADD FORM
  // ============================================

  function handleAddAddress() {
    setEditingAddress(null);
    setShowForm(true);
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white">

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* ======================================
            HEADER
        ====================================== */}

        <div className="
          flex
          flex-col
          sm:flex-row
          sm:items-center
          sm:justify-between
          gap-4
          mb-8
        ">

          <div>

            <div className="
              inline-flex
              items-center
              gap-2
              bg-green-100
              text-green-700
              px-3
              py-1
              rounded-full
              text-xs
              font-bold
              mb-2
            ">
              <MapPin size={14} />
              DELIVERY LOCATIONS
            </div>

            <h1 className="
              text-2xl
              sm:text-3xl
              font-black
              text-gray-900
            ">
              My Addresses
            </h1>

            <p className="
              text-gray-500
              mt-1
              text-sm
              sm:text-base
            ">
              Manage your milk delivery locations
            </p>

          </div>

          <button
            onClick={handleAddAddress}
            className="
              w-full
              sm:w-auto
              flex
              items-center
              justify-center
              gap-2
              bg-green-600
              hover:bg-green-700
              active:scale-95
              text-white
              px-5
              py-3
              rounded-2xl
              font-bold
              shadow-lg
              shadow-green-200
              transition-all
            "
          >
            <Plus size={19} />
            Add Address
          </button>

        </div>


        {/* ======================================
            CURRENT LOCATION
        ====================================== */}

        <div className="
          bg-white
          rounded-3xl
          border
          border-green-100
          shadow-sm
          p-4
          sm:p-5
          mb-6
        ">

          <div className="
            flex
            flex-col
            sm:flex-row
            sm:items-center
            gap-4
          ">

            <div className="
              w-12
              h-12
              rounded-2xl
              bg-green-100
              text-green-700
              flex
              items-center
              justify-center
              shrink-0
            ">
              <Navigation size={22} />
            </div>

            <div className="flex-1">

              <h2 className="
                font-bold
                text-gray-900
              ">
                Add your current location
              </h2>

              <p className="
                text-sm
                text-gray-500
                mt-1
              ">
                Quickly detect your location and
                use it as your delivery address.
              </p>

            </div>

            <div className="w-full sm:w-auto">

              <LocationButton
                onLocationFound={
                  handleCurrentLocation
                }
              />

            </div>

          </div>

        </div>


        {/* ======================================
            LOADING
        ====================================== */}

        {loading ? (

          <div className="
            flex
            flex-col
            items-center
            justify-center
            py-20
            text-gray-500
          ">

            <Loader2
              size={35}
              className="
                animate-spin
                text-green-600
                mb-3
              "
            />

            <p>
              Loading your addresses...
            </p>

          </div>

        ) : addresses.length === 0 ? (

          /* ====================================
             EMPTY STATE
          ==================================== */

          <div className="
            bg-white
            rounded-3xl
            border-2
            border-dashed
            border-green-200
            p-8
            sm:p-14
            text-center
          ">

            <div className="
              w-20
              h-20
              mx-auto
              rounded-full
              bg-green-100
              flex
              items-center
              justify-center
              text-green-600
              mb-5
              animate-pulse
            ">

              <MapPin size={38} />

            </div>

            <h2 className="
              text-xl
              sm:text-2xl
              font-black
              text-gray-900
            ">
              No addresses yet
            </h2>

            <p className="
              text-gray-500
              mt-2
              mb-6
            ">
              Add your delivery address to
              start ordering fresh milk.
            </p>

            <button
              onClick={handleAddAddress}
              className="
                bg-green-600
                hover:bg-green-700
                text-white
                px-6
                py-3
                rounded-2xl
                font-bold
              "
            >
              + Add Your Address
            </button>

          </div>

        ) : (

          /* ====================================
             ADDRESS LIST
          ==================================== */

          <div className="
            grid
            grid-cols-1
            md:grid-cols-2
            gap-5
          ">

            {addresses.map((address) => (

              <div
                key={address.id}
                className="
                  group
                  relative
                  bg-white
                  rounded-3xl
                  border
                  border-gray-100
                  shadow-sm
                  hover:shadow-xl
                  hover:-translate-y-1
                  transition-all
                  duration-300
                  overflow-hidden
                "
              >

                {/* Green top line */}

                <div className="
                  h-1
                  bg-gradient-to-r
                  from-green-500
                  to-emerald-400
                " />

                <div className="p-5">

                  {/* Header */}

                  <div className="
                    flex
                    items-start
                    justify-between
                    gap-3
                  ">

                    <div className="
                      flex
                      items-center
                      gap-3
                    ">

                      <div className="
                        w-11
                        h-11
                        rounded-2xl
                        bg-green-100
                        text-green-700
                        flex
                        items-center
                        justify-center
                      ">
                        <MapPin size={21} />
                      </div>

                      <div>

                        <h3 className="
                          font-black
                          text-gray-900
                        ">
                          {address.house_no ||
                            "Delivery Address"}
                        </h3>

                        {address.is_default && (
                          <span className="
                            text-xs
                            text-green-600
                            font-bold
                          ">
                            Default Address
                          </span>
                        )}

                      </div>

                    </div>


                    {/* GPS badge */}

                    {address.latitude &&
                      address.longitude && (
                        <span className="
                          inline-flex
                          items-center
                          gap-1
                          text-[11px]
                          font-bold
                          text-green-700
                          bg-green-50
                          px-2
                          py-1
                          rounded-full
                        ">
                          <Navigation size={11} />
                          GPS
                        </span>
                      )}

                  </div>


                  {/* Address */}

                  <div className="
                    mt-4
                    text-sm
                    text-gray-600
                    leading-6
                  ">

                    <p>
                      {address.street}
                      {address.area &&
                        `, ${address.area}`}
                    </p>

                    <p>
                      {address.city}
                      {address.state &&
                        `, ${address.state}`}
                    </p>

                    <p className="
                      font-semibold
                      text-gray-700
                    ">
                      {address.pincode}
                    </p>

                  </div>


                  {/* Default badge */}

                  {address.is_default && (

                    <div className="
                      mt-4
                      flex
                      items-center
                      gap-2
                      bg-green-50
                      border
                      border-green-100
                      rounded-xl
                      px-3
                      py-2
                      text-sm
                      text-green-700
                      font-semibold
                    ">

                      <CheckCircle2 size={16} />

                      Used for Subscription

                    </div>

                  )}


                  {/* Actions */}

                  <div className="
                    flex
                    gap-2
                    mt-5
                  ">

                    {!address.is_default && (
                      <button
                        onClick={() =>
                          handleSetDefault(
                            address
                          )
                        }
                        className="
                          flex-1
                          px-3
                          py-2.5
                          rounded-xl
                          bg-green-50
                          text-green-700
                          font-bold
                          text-sm
                          hover:bg-green-100
                        "
                      >
                        Set Default
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setEditingAddress(
                          address
                        );

                        setShowForm(true);
                      }}
                      className="
                        flex
                        items-center
                        justify-center
                        gap-1
                        px-4
                        py-2.5
                        rounded-xl
                        bg-blue-50
                        text-blue-700
                        font-bold
                        text-sm
                        hover:bg-blue-100
                      "
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        handleDeleteAddress(
                          address.id
                        )
                      }
                      disabled={
                        address.is_used
                      }
                      className={`
                        flex
                        items-center
                        justify-center
                        gap-1
                        px-4
                        py-2.5
                        rounded-xl
                        font-bold
                        text-sm
                        ${
                          address.is_used
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-red-50 text-red-600 hover:bg-red-100"
                        }
                      `}
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}


        {/* ======================================
            ADDRESS FORM
        ====================================== */}

        {showForm && (

          <AddressForm
            customerId={
              JSON.parse(
                localStorage.getItem(
                  "customer"
                ) || "null"
              )?.id
            }

            address={
              editingAddress
            }

            onSave={
              handleSaveAddress
            }

            onCancel={() => {
              setShowForm(false);
              setEditingAddress(null);
            }}
          />

        )}

      </div>

    </div>
  );
}