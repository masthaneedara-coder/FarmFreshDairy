import { useEffect, useState } from "react";
import DeliveryBoyTable from "../Components/admin/DeliveryBoyTable";
import DeliveryBoyForm from "../Components/admin/DeliveryBoyForm";
import {
  createDeliveryBoy,
  updateDeliveryBoy,
  getDeliveryBoys,
} from "../services/deliveryBoyService";

export default function AdminDeliveryBoys() {
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [search, setSearch] = useState("");
  const [openForm, setOpenForm] = useState(false);
const [editingBoy, setEditingBoy] = useState(null);
  const filtered = deliveryBoys.filter((boy) => {

  const text = (
    boy.full_name +
    boy.phone +
    (boy.email || "")
  ).toLowerCase();

  return text.includes(search.toLowerCase());

});

  useEffect(() => {
    loadDeliveryBoys();
  }, []);

  const loadDeliveryBoys = async () => {
    try {
      const data = await getDeliveryBoys();
      setDeliveryBoys(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async (form) => {
  try {
    if (editingBoy) {
      await updateDeliveryBoy(editingBoy.id, form);

      alert("Delivery Boy Updated Successfully");
    } else {
      await createDeliveryBoy(form);

      alert("Delivery Boy Added Successfully");
    }

    setOpenForm(false);
    setEditingBoy(null);

    await loadDeliveryBoys();

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};
  return (
    <div className="p-6">

  <h1 className="text-3xl font-bold mb-6">
    Delivery Boy Management
  </h1>

  <div className="flex justify-between mb-5">

    <input
      type="text"
      placeholder="Search Delivery Boy..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="border rounded-lg px-4 py-2 w-80"
    />

   <button
        onClick={() => {
            setEditingBoy(null);
            setOpenForm(true);
        }}
        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg"
        >
        + Add Delivery Boy
    </button>

  </div>

  <DeliveryBoyTable
    deliveryBoys={filtered}
    onEdit={(boy) => {setEditingBoy(boy); setOpenForm(true);}}
    onDelete={(id) => console.log(id)}
    onToggleStatus={(id, status) =>
      console.log(id, status)
    }
  />
 <DeliveryBoyForm
  open={openForm}
  editingBoy={editingBoy}
  onClose={() => {
    setOpenForm(false);
    setEditingBoy(null);
  }}
  onSave={handleSave}
/>

</div>
    
  );
}