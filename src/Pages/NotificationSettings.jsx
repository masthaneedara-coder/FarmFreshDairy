import { useNotificationPreferences } from "../context/NotificationPreferenceContext";
import { NOTIFICATION_PREFERENCE_OPTIONS } from "../config/notificationPreferences";
import { useNavigate } from "react-router-dom";

export default function NotificationSettings() {
  const navigate = useNavigate();

  const {
    preferences,
    updatePreference,
    resetPreferences,
  } = useNotificationPreferences();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}

      <div className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 font-medium"
          >
            ← Back
          </button>

          <h1 className="text-2xl font-bold">
            Notification Settings
          </h1>

          <div />
        </div>
      </div>

      {/* Body */}

      <div className="max-w-4xl mx-auto p-4">

        <div className="bg-white rounded-xl shadow">

          <div className="p-6 border-b">

            <h2 className="text-xl font-semibold">
              Notification Preferences
            </h2>

            <p className="text-gray-500 mt-2">
              Choose which notifications you want to receive.
            </p>

          </div>

          <div>

            {NOTIFICATION_PREFERENCE_OPTIONS.map((item) => (

              <div
                key={item.key}
                className="flex items-center justify-between px-6 py-5 border-b hover:bg-gray-50 transition"
              >

                <div>

                  <h3 className="font-semibold">
                    {item.label}
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    {item.description}
                  </p>

                </div>

                <label className="relative inline-flex items-center cursor-pointer">

                  <input
                    type="checkbox"
                    checked={preferences[item.key]}
                    onChange={(e) =>
                      updatePreference(
                        item.key,
                        e.target.checked
                      )
                    }
                    className="sr-only peer"
                  />

                  <div
                    className="
                    w-11
                    h-6
                    bg-gray-300
                    rounded-full
                    peer
                    peer-checked:bg-green-500
                    after:content-['']
                    after:absolute
                    after:left-[2px]
                    after:top-[2px]
                    after:bg-white
                    after:h-5
                    after:w-5
                    after:rounded-full
                    after:transition-all
                    peer-checked:after:translate-x-full"
                  />

                </label>

              </div>

            ))}

          </div>

          <div className="flex flex-wrap gap-3 justify-end p-6">

            <button
              onClick={resetPreferences}
              className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
            >
              Reset Defaults
            </button>

            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}