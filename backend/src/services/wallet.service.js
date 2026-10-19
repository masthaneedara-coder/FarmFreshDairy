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

  // Create a zero-balance Prepaid wallet only if this customer
  // does not already have a wallet. Do not reactivate a closed
  // or blocked wallet automatically.
  const { error: createError } = await supabaseAdmin
    .from("wallet_accounts")
    .upsert(
      {
        customer_id: customerId,
        balance: 0,
        wallet_type: "Prepaid",
        status: "Active",
      },
      {
        onConflict: "customer_id",
        ignoreDuplicates: true,
      }
    );

  if (createError) {
    console.error("Wallet initialization error:", createError);
    throw new Error("Unable to initialize customer wallet");
  }

  const { data: wallet, error: walletError } = await supabaseAdmin
    .from("wallet_accounts")
    .select("id, status")
    .eq("customer_id", customerId)
    .maybeSingle();

  if (walletError) {
    console.error("Wallet lookup error:", walletError);
    throw new Error("Unable to verify customer wallet");
  }

  if (!wallet || wallet.status !== "Active") {
    throw new Error("Customer does not have an active wallet");
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

    // A concurrent request may have credited the same payment.
    // Check the transaction before treating the RPC failure as fatal.
    if (referenceId && referenceType) {
      const { data: existingCredit, error: lookupError } =
        await supabaseAdmin
          .from("wallet_transactions")
          .select("id, amount")
          .eq("customer_id", customerId)
          .eq("transaction_type", "CREDIT")
          .eq("reference_id", referenceId)
          .eq("reference_type", referenceType)
          .maybeSingle();

      if (!lookupError && existingCredit) {
        return {
          success: true,
          customerId,
          previousBalance: 0,
          creditedAmount: 0,
          newBalance: 0,
          message: "Payment already credited",
        };
      }
    }

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
    success: true,
    customerId: result.result_customer_id,
    previousBalance: Number(result.previous_balance || 0),
    creditedAmount: Number(result.credited_amount || 0),
    newBalance: Number(result.new_balance || 0),
    message: result.result_message,
  };
}


