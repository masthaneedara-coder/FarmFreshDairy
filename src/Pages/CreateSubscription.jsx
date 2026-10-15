import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchProducts, fetchCustomerAddresses, createAddress } from "../config/api";
import LocationButton from "../Components/LocationButton";
import AddressForm from "../Components/AddressForm";

const PRICE_MAP = { "500ml": 1350, "1L": 2700, "2L": 5400, "3L": 8100, "5L": 13500 };
const FREQUENCY_MULTIPLIER = { Daily: 1, "Alternate Days": 0.5, Weekly: 4 / 30 };
const SIZES = ["500ml", "1L", "2L", "3L", "5L"];
const PRODUCT_NAMES = ["Cow Milk", "Buffalo Milk", "Curd"];

export default function CreateSubscription() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [form, setForm] = useState({ size: "1L", quantity: 1, deliveryTime: "Morning", frequency: "Daily", startDate: new Date().toISOString().split("T")[0], addressId: "" });

  const monthlyAmount = useMemo(() => Math.round((PRICE_MAP[form.size] || 0) * Number(form.quantity || 1) * (FREQUENCY_MULTIPLIER[form.frequency] || 1)), [form.size, form.quantity, form.frequency]);

  useEffect(() => {
    let active = true;
    async function loadProducts() {
      setProductsLoading(true);
      try {
        const result = await fetchProducts();
        const list = Array.isArray(result) ? result : [];
        const dairyProducts = list.filter((p) => PRODUCT_NAMES.includes(p.name));
        if (!active) return;
        setProducts(dairyProducts);
        // Honor the product selected on SubscriptionPlans; use the first product only as a fallback.
        const match = dairyProducts.find((p) => String(p.id) === String(productId));
        setSelectedProduct(match || dairyProducts[0] || null);
      } catch (error) {
        console.error("Failed to load subscription products:", error);
        if (active) { setProducts([]); setSelectedProduct(null); }
      } finally {
        if (active) setProductsLoading(false);
      }
    }
    loadProducts();
    return () => { active = false; };
  }, [productId]);

  useEffect(() => {
    let active = true;
    async function loadAddresses() {
      setAddressesLoading(true);
      try {
        const customer = JSON.parse(localStorage.getItem("customer") || "null");
        if (!customer?.id) return;
        const result = await fetchCustomerAddresses(customer.id);
        const list = Array.isArray(result?.addresses) ? result.addresses : [];
        if (!active) return;
        setAddresses(list);
        if (list.length) {
          const preferred = list.find((address) => address.is_default) || list[0];
          setForm((prev) => ({ ...prev, addressId: prev.addressId || preferred.id }));
        }
      } catch (error) {
        console.error("Subscription address error:", error);
      } finally {
        if (active) setAddressesLoading(false);
      }
    }
    loadAddresses();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!productsLoading && !addressesLoading) setLoading(false);
  }, [productsLoading, addressesLoading]);

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }
  function handleAddAddress() { setEditingAddress(null); setShowAddressForm(true); }
  function handleLocationFound(location) {
    setEditingAddress({ ...location, is_default: false });
    setShowAddressForm(true);
  }
  async function handleSaveAddress(addressData) {
    try {
      const customer = JSON.parse(localStorage.getItem("customer") || "null");
      if (!customer?.id) { alert("Please login again."); return; }
      const response = await createAddress({ ...addressData, customer_id: customer.id });
      const result = await fetchCustomerAddresses(customer.id);
      const list = Array.isArray(result?.addresses) ? result.addresses : [];
      setAddresses(list);
      const created = response?.address || response?.data || response;
      const selected = created?.id ? list.find((item) => String(item.id) === String(created.id)) : list[list.length - 1];
      if (selected?.id) updateForm("addressId", selected.id);
      setShowAddressForm(false);
      setEditingAddress(null);
    } catch (error) {
      console.error("Create address error:", error);
      alert(error?.message || "Failed to create address.");
    }
  }
  function handleContinue() {
    if (!selectedProduct) { alert("Please select a product."); return; }
    if (!form.addressId) { alert("Please select a delivery address."); return; }
    navigate("/subscription/review", { state: { product: selectedProduct, form, monthlyAmount, addresses } });
  }

  if (loading) return <div className="flex min-h-[65vh] items-center justify-center bg-emerald-50 px-4"><div className="text-center"><div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600"/><h2 className="text-xl font-black text-emerald-800">Preparing your fresh subscription…</h2><p className="mt-2 text-sm text-slate-500">Loading products and delivery addresses</p></div></div>;

  if (!selectedProduct) return <div className="flex min-h-[60vh] items-center justify-center px-4"><div className="max-w-md rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-xl"><div className="text-5xl">🥛</div><h2 className="mt-4 text-2xl font-black text-slate-800">Product not found</h2><p className="mt-2 text-sm text-slate-500">We couldn't find the selected product. Please choose an available plan.</p><button onClick={() => navigate("/subscription-plans")} className="mt-5 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700">Browse Plans</button></div></div>;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f8f4] text-slate-800">
      <style>{`
        @keyframes freshIn {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes freshPulse {0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.22)}50%{box-shadow:0 0 0 7px rgba(16,185,129,0)}}
        .fresh-in{animation:freshIn .45s ease-out both}.fresh-pulse{animation:freshPulse 2.6s ease-out infinite}
        @media(prefers-reduced-motion:reduce){.fresh-in,.fresh-pulse{animation:none!important}}
      `}</style>

      <main className="mx-auto max-w-6xl px-3 pb-28 pt-3 sm:px-6 sm:pb-10 sm:pt-6">
        {/* Compact new header */}
        <header className="fresh-in relative overflow-hidden rounded-2xl bg-[#073f32] p-4 text-white shadow-lg sm:rounded-3xl sm:p-7">
          <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-emerald-400/20 blur-2xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.15em] text-emerald-100 sm:text-[10px]"><span className="h-1.5 w-1.5 rounded-full bg-lime-300"/> FarmFreshDairy</div>
              <h1 className="mt-2 text-xl font-black leading-tight sm:mt-3 sm:text-3xl">Build your milk plan<span className="text-lime-300">.</span></h1>
              <p className="mt-1 max-w-lg text-[11px] leading-4 text-emerald-50/85 sm:text-sm sm:leading-5">Fresh dairy, delivered your way. Choose your product, quantity and delivery details.</p>
            </div>
            <div className="fresh-pulse flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-3xl sm:h-20 sm:w-20 sm:text-4xl">🥛</div>
          </div>
          <div className="relative mt-4 grid grid-cols-4 gap-1.5 sm:mt-6 sm:gap-2">
            {[['01','Product'],['02','Plan'],['03','Address'],['04','Review']].map(([n,label],i)=><div key={n} className={`flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-2 sm:gap-2 sm:rounded-xl sm:px-3 ${i===0?'bg-lime-300 text-emerald-950':'bg-white/10 text-white/85'}`}><span className="text-[9px] font-black sm:text-xs">{n}</span><span className="truncate text-[9px] font-bold sm:text-xs">{label}</span></div>)}
          </div>
        </header>

        <div className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_290px] lg:items-start">
          <div className="space-y-4 sm:space-y-5">
            {/* Product picker */}
            <section className="fresh-in overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm sm:rounded-3xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-3 sm:px-5 sm:py-4"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-base sm:h-10 sm:w-10">🥛</span><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-emerald-700">Step 01</p><h2 className="text-sm font-black sm:text-lg">Choose your product</h2></div></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-700">{products.length} available</span></div>
              <div className="grid grid-cols-1 gap-2.5 p-3 sm:grid-cols-2 sm:gap-3 sm:p-5">
                {products.map((product)=>{const selected=String(selectedProduct?.id)===String(product.id);return <button key={product.id} type="button" onClick={()=>setSelectedProduct(product)} className={`group relative flex min-w-0 items-center gap-3 rounded-xl border-2 p-2 text-left transition sm:rounded-2xl sm:p-3 ${selected?'border-emerald-500 bg-emerald-50/80 shadow-sm':'border-slate-100 bg-white hover:border-emerald-200'}`}>
                  <div className="relative h-[68px] w-[86px] shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-emerald-100 to-lime-50 sm:h-20 sm:w-24 sm:rounded-xl">{product.image?<img src={product.image} alt={product.name||'Dairy product'} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" onError={e=>{e.currentTarget.style.display='none';}}/>:<div className="flex h-full items-center justify-center text-3xl">🥛</div>}</div>
                  <div className="min-w-0 flex-1"><p className="truncate text-xs font-black sm:text-sm">{product.name}</p><p className="mt-1 text-[10px] text-slate-500 sm:text-xs">Fresh, delivered to your door</p><p className="mt-2 text-[10px] font-extrabold text-emerald-700">{product.price!=null?`₹${product.price}`:'Fresh dairy'}</p></div>
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${selected?'bg-emerald-600 text-white':'border border-slate-200 text-transparent'}`}>✓</span>
                </button>})}
              </div>
            </section>

            {/* Plan controls */}
            <section className="fresh-in overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm sm:rounded-3xl">
              <div className="flex items-center gap-2.5 border-b border-slate-100 px-3 py-3 sm:px-5 sm:py-4"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-base sm:h-10 sm:w-10">⚙️</span><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-emerald-700">Step 02</p><h2 className="text-sm font-black sm:text-lg">Build your plan</h2></div></div>
              <div className="space-y-4 p-3 sm:space-y-5 sm:p-5">
                <div><div className="mb-2 flex items-center justify-between gap-2"><label className="text-xs font-extrabold sm:text-sm">Quantity per delivery</label><span className="text-[10px] font-bold text-slate-400">Selected: {form.size}</span></div><div className="grid grid-cols-4 gap-1.5 sm:gap-2">{SIZES.map(size=><button key={size} type="button" onClick={()=>updateForm('size',size)} className={`rounded-lg border px-1 py-2.5 text-[11px] font-black transition sm:rounded-xl sm:py-3 sm:text-sm ${form.size===size?'border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/15':'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'}`}>{size}</button>)}</div></div>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 p-3 sm:rounded-2xl sm:p-4"><div><p className="text-[9px] font-black uppercase tracking-[.14em] text-emerald-700">Daily quantity</p><p className="mt-1 text-xs font-bold text-slate-700 sm:text-sm">Units per delivery</p></div><div className="flex items-center gap-3 rounded-xl bg-white p-1 shadow-sm"><button type="button" aria-label="Decrease quantity" onClick={()=>setForm(p=>({...p,quantity:Math.max(1,Number(p.quantity)-1)}))} className="h-9 w-9 rounded-lg bg-slate-100 text-lg font-black hover:bg-slate-200">−</button><span className="min-w-5 text-center text-lg font-black text-emerald-700">{form.quantity}</span><button type="button" aria-label="Increase quantity" onClick={()=>setForm(p=>({...p,quantity:Number(p.quantity)+1}))} className="h-9 w-9 rounded-lg bg-emerald-600 text-lg font-black text-white hover:bg-emerald-700">+</button></div></div>
                <div className="grid grid-cols-2 gap-3"><label className="block"><span className="mb-1.5 block text-[11px] font-extrabold sm:text-xs">Frequency</span><select value={form.frequency} onChange={e=>updateForm('frequency',e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-3 text-xs font-semibold outline-none focus:border-emerald-500 sm:text-sm"><option>Daily</option><option>Alternate Days</option><option>Weekly</option></select></label><label className="block"><span className="mb-1.5 block text-[11px] font-extrabold sm:text-xs">Delivery time</span><select value={form.deliveryTime} onChange={e=>updateForm('deliveryTime',e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-3 text-xs font-semibold outline-none focus:border-emerald-500 sm:text-sm"><option>Morning</option><option>Evening</option></select></label></div>
                <label className="block"><span className="mb-1.5 block text-[11px] font-extrabold sm:text-xs">Start date</span><input type="date" min={new Date().toISOString().split('T')[0]} value={form.startDate} onChange={e=>updateForm('startDate',e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold outline-none focus:border-emerald-500 sm:text-sm"/></label>
              </div>
            </section>

            {/* Address */}
            <section className="fresh-in overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm sm:rounded-3xl">
              <div className="flex items-center gap-2.5 border-b border-slate-100 px-3 py-3 sm:px-5 sm:py-4"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-base sm:h-10 sm:w-10">📍</span><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-emerald-700">Step 03</p><h2 className="text-sm font-black sm:text-lg">Delivery address</h2></div></div>
              <div className="space-y-3 p-3 sm:p-5">{addressesLoading?<p className="text-xs text-slate-500">Loading saved addresses…</p>:addresses.length===0?<div className="rounded-xl border border-dashed border-slate-300 p-4 text-center"><p className="text-xs font-bold text-slate-700">No saved addresses yet</p><p className="mt-1 text-[10px] text-slate-500">Add your delivery address to continue.</p></div>:<div className="space-y-2">{addresses.map(address=><button type="button" key={address.id} onClick={()=>updateForm('addressId',address.id)} className={`w-full rounded-xl border-2 p-3 text-left transition ${String(form.addressId)===String(address.id)?'border-emerald-500 bg-emerald-50':'border-slate-100 bg-white hover:border-emerald-200'}`}><div className="flex items-start justify-between gap-2"><span className="text-xs font-black sm:text-sm">{address.label||address.name||'Delivery address'}</span><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${String(form.addressId)===String(address.id)?'bg-emerald-600 text-white':'bg-slate-100 text-slate-400'}`}>✓</span></div><p className="mt-1 text-[10px] leading-4 text-slate-500 sm:text-xs">{[address.address_line1,address.address_line2,address.area,address.city,address.state,address.pincode].filter(Boolean).join(', ')||address.address||'Saved delivery location'}</p>{address.is_default&&<span className="mt-2 inline-block rounded-full bg-sky-100 px-2 py-1 text-[9px] font-black text-sky-700">DEFAULT</span>}</button>)}</div>}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><button type="button" onClick={handleAddAddress} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs font-extrabold text-emerald-800 hover:bg-emerald-100">＋ Add new address</button><div className="flex items-center justify-center rounded-xl border border-slate-100 px-2 py-1"><LocationButton onLocationFound={handleLocationFound}/></div></div>
                {showAddressForm&&<div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 sm:p-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-black sm:text-sm">{editingAddress?'Address from current location':'Add delivery address'}</h3><button type="button" onClick={()=>{setShowAddressForm(false);setEditingAddress(null)}} className="rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-white">Close ✕</button></div><AddressForm initialData={editingAddress||undefined} onSave={handleSaveAddress} onCancel={()=>{setShowAddressForm(false);setEditingAddress(null)}}/></div>}
              </div>
            </section>
          </div>

          {/* Summary panel */}
          <aside className="fresh-in lg:sticky lg:top-24"><section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-md sm:rounded-3xl"><div className="bg-gradient-to-r from-emerald-700 to-teal-600 p-4 text-white sm:p-5"><p className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-100">Step 04 · Review</p><h2 className="mt-1 text-lg font-black sm:text-2xl">Plan summary</h2><p className="mt-1 text-[11px] text-emerald-50 sm:text-xs">Your fresh routine, at a glance.</p></div><div className="space-y-4 p-3 sm:p-5"><div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-2xl">🥛</div><div className="min-w-0"><p className="truncate text-xs font-black sm:text-sm">{selectedProduct.name}</p><p className="mt-1 text-[10px] text-slate-500">{form.size} · {form.quantity} unit{form.quantity===1?'':'s'} / delivery</p></div></div><div className="space-y-2.5 text-xs"><div className="flex justify-between gap-3"><span className="text-slate-500">Frequency</span><span className="text-right font-bold">{form.frequency}</span></div><div className="flex justify-between gap-3"><span className="text-slate-500">Delivery</span><span className="font-bold">{form.deliveryTime}</span></div><div className="flex justify-between gap-3"><span className="text-slate-500">Start date</span><span className="font-bold">{form.startDate}</span></div><div className="flex justify-between gap-3"><span className="text-slate-500">Address</span><span className={`font-bold ${form.addressId?'text-emerald-700':'text-amber-600'}`}>{form.addressId?'Selected':'Required'}</span></div></div><div className="rounded-xl bg-gradient-to-br from-lime-50 to-emerald-50 p-4"><p className="text-[9px] font-black uppercase tracking-[.15em] text-emerald-700">Estimated monthly amount</p><p className="mt-1 text-2xl font-black tracking-tight text-emerald-800">₹{monthlyAmount.toLocaleString('en-IN')}</p><p className="mt-1 text-[10px] leading-4 text-slate-500">Estimate based on size, quantity and frequency.</p></div><button type="button" onClick={handleContinue} disabled={!form.addressId} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-xs font-black text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm">Continue to review <span className="transition-transform group-hover:translate-x-1">→</span></button><button type="button" onClick={()=>navigate('/subscription-plans')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 sm:text-sm">← Back to plans</button><p className="text-center text-[10px] text-slate-400">You can review everything before confirming.</p></div></section></aside>
        </div>
      </main>
      {/* Mobile quick summary */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-emerald-100 bg-white/95 px-3 py-2.5 shadow-[0_-8px_30px_rgba(15,23,42,.08)] backdrop-blur sm:hidden"><div className="mx-auto flex max-w-xl items-center gap-3"><div className="min-w-0 flex-1"><p className="text-[9px] font-bold text-slate-500">ESTIMATED MONTHLY</p><p className="text-lg font-black leading-6 text-emerald-700">₹{monthlyAmount.toLocaleString('en-IN')}</p></div><button type="button" onClick={handleContinue} disabled={!form.addressId} className="rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white shadow-sm disabled:opacity-50">Continue →</button></div></div>
    </div>
  );
}
