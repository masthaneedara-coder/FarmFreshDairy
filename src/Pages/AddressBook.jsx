import { useEffect, useState } from "react";
import {
  MapPin,
  Plus,
} from "lucide-react";

import { fetchCustomerAddresses,createAddress, updateAddress,deleteAddress } from "../config/api";
import AddressForm from "../Components/AddressForm";

export default function AddressBook() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  async function loadAddresses() {
    try {
      setLoading(true);

      const customer = JSON.parse(
        localStorage.getItem("customer")
      );

      if (!customer?.id) return;

      const res =
        await fetchCustomerAddresses(customer.id);

      setAddresses(res.addresses || []);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  async function handleSaveAddress(addressData) {
  try {
    if (editingAddress) {
      await updateAddress(editingAddress.id, addressData);
    } else {
      await createAddress(addressData);
    }

    setEditingAddress(null);
    setShowForm(false);

    await loadAddresses();

  } catch (err) {
    console.error(err);
    alert("Failed to save address.");
  }
}
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
    alert("Failed to delete address.");
  }
}
async function handleSetDefault(address) {
  try {
    const customer = JSON.parse(
      localStorage.getItem("customer")
    );

    await setDefaultAddress(
      address.id,
      customer.id
    );

    await loadAddresses();

  } catch (err) {
    console.error(err);
    alert("Failed to set default address.");
  }
}
  return (
    <div className="max-w-6xl mx-auto p-6">

      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-3 mt-5">

            </div>

        <div>
          <h1 className="text-3xl font-bold">
            My Addresses
          </h1>

          <p className="text-gray-500">
            Manage your delivery addresses
          </p>
        </div>

        <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl flex items-center gap-2"
            >
            <Plus size={18} />
            Add Address
            </button>

      </div>

      {loading ? (

        <div className="text-center py-20">
          Loading...
        </div>

      ) : addresses.length === 0 ? (

        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">

          <MapPin
            className="mx-auto text-green-600 mb-4"
            size={50}
          />

          <h2 className="text-2xl font-bold">
            No Addresses
          </h2>

          <p className="text-gray-500 mt-2">
            Add your first delivery address.
          </p>

        </div>

      ) : (

        <div className="grid gap-5">
            

          {addresses.map((address) => (
            
            <div
              key={address.id}
              className="bg-white rounded-2xl border p-5 shadow-sm"
            >
              <h3 className="font-bold">
                {address.house_no}
              </h3>

              <p className="text-gray-600">
                {address.street}, {address.area}
              </p>

              <p className="text-gray-600">
                {address.city}, {address.state}
              </p>

              <p className="text-gray-600">
                {address.pincode}
              </p>

              {address.is_default && (
                 <span className="inline-block mt-3 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                    Used for Subscription
                </span>
              )}
              <div className="flex gap-3 mt-5">

                <button
                    onClick={() => {
                    setEditingAddress(address);
                    setShowForm(true);
                    }}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white"
                >
                    Edit
                </button>
                <button
                    onClick={() => handleDeleteAddress(address.id)}
                    disabled={address.is_used}
                    className={`px-4 py-2 rounded-lg text-white ${
                        address.is_used
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                    >
                    Delete
                    </button>

                </div>
            </div>
            

          ))}

        </div>

      )}
      {showForm && (
            <AddressForm
                customerId={
                    JSON.parse(localStorage.getItem("customer"))?.id
                }
                address={editingAddress}
                onSave={handleSaveAddress}
                onCancel={() => {
                    setShowForm(false);
                    setEditingAddress(null);
                }}
                />
            )}

    </div>
    
  );
}