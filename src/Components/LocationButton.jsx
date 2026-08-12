import { useState } from "react";
import {
  Navigation,
  Loader2,
  MapPin,
} from "lucide-react";

export default function LocationButton({
  onLocationFound,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function getCurrentLocation() {
    setError("");

    if (!navigator.geolocation) {
      setError(
        "Location is not supported by this browser."
      );
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const {
            latitude,
            longitude,
            accuracy,
          } = position.coords;

          console.log("GPS Location:", {
            latitude,
            longitude,
            accuracy,
          });

          // =====================================
          // REVERSE GEOCODING
          // =====================================

          const url =
            `https://nominatim.openstreetmap.org/reverse` +
            `?format=jsonv2` +
            `&lat=${latitude}` +
            `&lon=${longitude}` +
            `&zoom=18` +
            `&addressdetails=1` +
            `&layer=address`;

          const response = await fetch(url, {
            headers: {
              Accept:
                "application/json",
            },
          });

          if (!response.ok) {
            throw new Error(
              "Unable to detect address."
            );
          }

          const data =
            await response.json();

          console.log(
            "Reverse Geocode:",
            data
          );

          const address =
            data.address || {};

          // =====================================
          // ADDRESS MAPPING
          // =====================================

          const detectedAddress = {
            house_no:
              address.house_number ||
              "",

            street:
              address.road ||
              address.pedestrian ||
              address.street ||
              "",

            area:
              address.neighbourhood ||
              address.suburb ||
              address.residential ||
              address.village ||
              address.town ||
              "",

            city:
              address.city ||
              address.town ||
              address.village ||
              address.municipality ||
              "",

            state:
              address.state ||
              "",

            pincode:
              address.postcode ||
              "",

            landmark:
              "",

            latitude,
            longitude,

            accuracy,

            displayAddress:
              data.display_name ||
              "",

            is_default: false,
          };

          console.log(
            "Detected Address:",
            detectedAddress
          );

          // Send address to parent
          onLocationFound(
            detectedAddress
          );

        } catch (err) {
          console.error(
            "Location reverse geocoding error:",
            err
          );

          setError(
            "Location found, but address could not be detected. Please enter it manually."
          );
        } finally {
          setLoading(false);
        }
      },

      (error) => {
        console.error(
          "GPS Error:",
          error
        );

        let message =
          "Unable to get your location.";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            message =
              "Location permission was denied. Please allow location access.";
            break;

          case error.POSITION_UNAVAILABLE:
            message =
              "Your current location is unavailable.";
            break;

          case error.TIMEOUT:
            message =
              "Location request timed out. Please try again.";
            break;

          default:
            message =
              "Unable to get your current location.";
        }

        setError(message);
        setLoading(false);
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  return (
    <div className="w-full">

      {/* =====================================
          BUTTON
      ====================================== */}

      <button
        type="button"
        onClick={getCurrentLocation}
        disabled={loading}
        className="
          w-full
          sm:w-auto
          inline-flex
          items-center
          justify-center
          gap-2
          px-5
          py-3
          rounded-2xl
          bg-green-600
          hover:bg-green-700
          disabled:bg-green-400
          text-white
          font-bold
          shadow-lg
          shadow-green-200
          active:scale-95
          transition-all
          duration-200
        "
      >

        {loading ? (
          <>
            <Loader2
              size={18}
              className="animate-spin"
            />

            Detecting...
          </>
        ) : (
          <>
            <Navigation
              size={18}
            />

            Use Current Location
          </>
        )}

      </button>


      {/* =====================================
          ERROR
      ====================================== */}

      {error && (

        <div
          className="
            mt-3
            flex
            items-start
            gap-2
            text-sm
            text-red-600
            bg-red-50
            border
            border-red-100
            rounded-xl
            p-3
          "
        >

          <MapPin
            size={17}
            className="mt-0.5 shrink-0"
          />

          <span>
            {error}
          </span>

        </div>

      )}


      {/* =====================================
          ATTRIBUTION
      ====================================== */}

      <p className="
        text-[10px]
        text-gray-400
        mt-2
      ">
        Address data © OpenStreetMap contributors
      </p>

    </div>
  );
}