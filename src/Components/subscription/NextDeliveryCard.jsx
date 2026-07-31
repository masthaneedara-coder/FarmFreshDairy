import {
Truck,
Clock3,
Calendar
} from "lucide-react";

export default function NextDeliveryCard({
subscription,
}){

if(!subscription)return null;

return(

<div className="bg-white rounded-3xl shadow-lg p-6">

<h2 className="font-bold text-2xl mb-6">
Next Delivery
</h2>

<div className="space-y-3">

<p>
🚚
Tomorrow
</p>

<p>
🗓
{subscription.nextDeliveryDate}
</p>

<p>
🕒
{subscription.delivery_time}
</p>

<p>
🥛
{subscription.product_name}
</p>

<p>
Quantity
{subscription.quantity}
</p>

</div>

</div>

);

}