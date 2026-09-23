import { supabaseAdmin } from "../config/supabase.js";

export async function debitWalletForDelivery({
  customerId,
  amount,
  deliveryId,
  deliveryNumber,
}) {
  if (!customerId) {
    throw new Error("Customer ID is required");
  }

  const debitAmount = Number(amount);

  if (!Number.isFinite(debitAmount) || debitAmount <= 0) {
    throw new Error("Wallet debit amount must be greater than zero");
  }

  const { data, error } = await supabaseAdmin.rpc("wallet_debit", {
    p_customer_id: customerId,
    p_amount: debitAmount,
    p_remarks: `Milk delivery - ${deliveryNumber || deliveryId}`,
    p_reference_id: deliveryId,
    p_reference_type: "SubscriptionDelivery",
  });

  if (error) {
    console.error("wallet_debit RPC error:", error);
    throw new Error("Unable to process wallet debit");
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result) {
    throw new Error("Wallet debit returned no result");
  }

  return {
    success: result.result_success,
    customerId: result.result_customer_id,
    previousBalance: Number(result.previous_balance || 0),
    debitedAmount: Number(result.debited_amount || 0),
    newBalance: Number(result.new_balance || 0),
    message: result.result_message,
  };
}
/* ==========================================================
   Credit Wallet
========================================================== */

export async function creditWallet({
  customerId,
  amount,
  referenceId = null,
  referenceType = "RazorpayPayment",
  remarks = "Online payment",
}) {
  if (!customerId) {
    throw new Error("Customer ID is required");
  }

  const creditAmount = Number(amount);

  if (!Number.isFinite(creditAmount) || creditAmount <= 0) {
    throw new Error("Wallet credit amount must be greater than zero");
  }

  const { data, error } = await supabaseAdmin.rpc("wallet_credit", {
    p_customer_id: customerId,
    p_amount: creditAmount,
    p_remarks: remarks,
    p_reference_id: referenceId,
    p_reference_type: referenceType,
  });

  if (error) {
    console.error("wallet_credit RPC error:", error);
    throw new Error("Unable to process wallet credit");
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result) {
    throw new Error("Wallet credit returned no result");
  }

  if (!result.result_success) {
    throw new Error(
      result.result_message || "Wallet credit failed"
    );
  }

  return {
    success: result.result_success,
    customerId: result.result_customer_id,
    previousBalance: Number(result.previous_balance || 0),
    creditedAmount: Number(result.credited_amount || 0),
    newBalance: Number(result.new_balance || 0),
    message: result.result_message,
  };
}