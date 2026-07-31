import Razorpay from "razorpay";

console.log("KEY ID:", process.env.RAZORPAY_KEY_ID);
console.log(
  "SECRET:",
  process.env.RAZORPAY_KEY_SECRET ? "Loaded" : "Missing"
);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default razorpay;