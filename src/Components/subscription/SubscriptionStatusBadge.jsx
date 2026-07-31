export default function SubscriptionStatusBadge({
  status,
}) {

  const colors = {
    active: "bg-green-500",
    paused: "bg-yellow-500",
    cancelled: "bg-red-500",
    pending: "bg-blue-500",
    completed: "bg-purple-500",
  };

  return (

    <span
      className={`px-4 py-2 rounded-full text-white font-semibold ${colors[status]}`}
    >

      {status.toUpperCase()}

    </span>

  );

}