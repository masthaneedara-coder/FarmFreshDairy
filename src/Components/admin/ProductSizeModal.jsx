import { useState } from "react";

export default function ProductSizeModal({
    initialData,
    onSave,
    onClose
}) {

    const [label, setLabel] = useState(initialData?.label || "");
    const [price, setPrice] = useState(initialData?.price || "");
    const [sortOrder, setSortOrder] = useState(initialData?.sort_order || 1);

    const submit = () => {

    if (!label.trim()) {
        alert("Please enter size label");
        return;
    }

    if (!price || Number(price) <= 0) {
        alert("Please enter valid price");
        return;
    }

    onSave({
        label: label.trim(),
        price: Number(price),
        sort_order: Number(sortOrder),
    });

};

    return (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

            <div className="bg-white rounded-xl p-6 w-96">

                <h2 className="text-xl font-bold mb-4">
                    {initialData ? "Edit Size" : "Add Size"}
                </h2>

                <input
                    className="border w-full p-2 mb-3"
                    placeholder="500 ml"
                    value={label}
                    onChange={(e)=>setLabel(e.target.value)}
                />

                <input
                    className="border w-full p-2 mb-3"
                    placeholder="Price"
                    type="number"
                    value={price}
                    onChange={(e)=>setPrice(e.target.value)}
                />

                <input
                    className="border w-full p-2 mb-4"
                    placeholder="Sort Order"
                    type="number"
                    value={sortOrder}
                    onChange={(e)=>setSortOrder(e.target.value)}
                />

                <div className="flex justify-end gap-3">

                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={submit}
                        className="px-4 py-2 bg-green-600 text-white rounded"
                    >
                        Save
                    </button>

                </div>

            </div>

        </div>

    );

}