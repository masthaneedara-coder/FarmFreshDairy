import QRCode from "qrcode";
import { COMPANY } from "../config/company";

export async function generatePaymentQR(amount) {

  const upiUrl =
    `upi://pay` +
    `?pa=${COMPANY.upiId}` +
    `&pn=${encodeURIComponent(COMPANY.payeeName)}` +
    `&am=${amount}` +
    `&cu=INR`;

  return await QRCode.toDataURL(upiUrl);

}