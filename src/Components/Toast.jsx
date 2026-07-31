import { useEffect, useState } from "react";

export default function Toast({
  toast,
  onClose,
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setVisible(false);

    setTimeout(() => {
      onClose(toast.id);
    }, 250);
  };

  const styles = {
    success: {
      bg: "bg-green-50",
      border: "border-green-500",
      icon: "✅",
      title: "text-green-700",
    },

    error: {
      bg: "bg-red-50",
      border: "border-red-500",
      icon: "❌",
      title: "text-red-700",
    },

    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-500",
      icon: "⚠️",
      title: "text-yellow-700",
    },

    info: {
      bg: "bg-blue-50",
      border: "border-blue-500",
      icon: "ℹ️",
      title: "text-blue-700",
    },
  };

  const style =
    styles[toast.type] || styles.info;

  return (
    <div
      className={`
        w-full
        max-w-sm
        rounded-xl
        border-l-4
        shadow-xl
        ${style.bg}
        ${style.border}
        transform
        transition-all
        duration-300
        ${
          visible
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0"
        }
      `}
    >
      <div className="flex items-start gap-3 p-4">

        <div className="text-2xl">
          {style.icon}
        </div>

        <div className="flex-1">

          <h3
            className={`font-bold ${style.title}`}
          >
            {toast.title}
          </h3>

          <p className="text-sm text-gray-600 mt-1">
            {toast.message}
          </p>

        </div>

        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-700 text-lg"
        >
          ✕
        </button>

      </div>

      {/* Progress Bar */}

      <div className="h-1 bg-gray-200 rounded-b-xl overflow-hidden">

        <div
          className="h-full bg-green-500 animate-toast-progress"
          style={{
            animationDuration: "5s",
            animationTimingFunction: "linear",
            animationFillMode: "forwards",
          }}
        />

      </div>

    </div>
  );
}