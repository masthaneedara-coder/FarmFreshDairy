import { useToast } from "../context/ToastContext";
import Toast from "./Toast";

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
  className="
    fixed
    top-4
    right-4
    left-4
    md:left-auto
    md:right-5
    z-[9999]
    flex
    flex-col
    gap-3
    md:w-96
    pointer-events-none
  "
>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto"
        >
          <Toast
            toast={toast}
            onClose={removeToast}
          />
        </div>
      ))}
    </div>
  );
}