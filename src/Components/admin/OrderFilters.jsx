export default function OrderFilters({
  search,
  setSearch,
  status,
  setStatus,
}) {
  return (
    <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-4">

      <input
        type="text"
        placeholder="Search Order / Customer / Phone"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border rounded-lg px-4 py-2 w-80"
      />

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="border rounded-lg px-4 py-2"
      >
        <option value="">All Status</option>
        <option>Pending</option>
        <option>Confirmed</option>
        <option>Packed</option>
        <option>Out For Delivery</option>
        <option>Delivered</option>
        <option>Cancelled</option>
      </select>

    </div>
  );
}