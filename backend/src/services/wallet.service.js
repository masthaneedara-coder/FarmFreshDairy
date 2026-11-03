
import { supabaseAdmin } from "../config/supabase.js";

/* ==========================================================
   Debit Wallet - Delivery
========================================================== */

export async function debitWalletForDelivery({
  customerId,
  amount,
  deliveryId,
  deliveryNumber,
}) {
  if (!customerId) {
    throw new Error("Customer ID is required");
  }

  if (!deliveryId) {
    throw new Error("Delivery ID is required for wallet debit");
  }

  const debitAmount = Number(amount);

  if (!Number.isFinite(debitAmount) || debitAmount <= 0) {
    throw new Error("Wallet debit amount must be greater than zero");
  }}
/* ==========================================================
   Credit Wallet - Verified Online Payments Only
========================================================== */

export async function creditWallet({
  customerId,
  amount,
  referenceId,
  referenceType = "PaymentRecord",
  remarks = "Verified online payment",
  paymentMethod = "ONLINE",
}) {
  if (!customerId) {
    throw new Error("Customer ID is required");
  }

  if (paymentMethod !== "ONLINE") {
    throw new Error("Wallet credit is allowed only for online payments");
  }

  if (!referenceId) {
    throw new Error("Payment reference ID is required for wallet credit");
  }

  const creditAmount = Number(amount);

  if (!Number.isFinite(creditAmount) || creditAmount <= 0) {
    throw new Error("Wallet credit amount must be greater than zero");
  }

  console.log("[WALLET][CREDIT][START]", {
    customerId,
    amount: creditAmount,
    referenceId,
    referenceType,
  });

  // Create wallet only when one does not already exist.
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
    console.error("[WALLET][CREDIT][INITIALIZATION_FAILED]", createError);
    throw new Error("Unable to initialize customer wallet");
  }

  // Verify wallet exists and is active.
  const { data: wallet, error: walletError } = await supabaseAdmin
    .from("wallet_accounts")
    .select("id, balance, status, wallet_type")
    .eq("customer_id", customerId)
    .maybeSingle();

  if (walletError) {
    console.error("[WALLET][CREDIT][LOOKUP_FAILED]", walletError);
    throw new Error("Unable to verify customer wallet");
  }

  if (!wallet || wallet.status !== "Active") {
    console.error("[WALLET][CREDIT][INACTIVE_OR_MISSING]", {
      customerId,
      wallet,
    });
    throw new Error("Customer does not have an active wallet");
  }

  // Use the database function for atomic, idempotent crediting.
  const { data, error } = await supabaseAdmin.rpc("wallet_credit", {
    p_customer_id: customerId,
    p_amount: creditAmount,
    p_remarks: remarks,
    p_reference_id: referenceId,
    p_reference_type: referenceType,
  });

  if (error) {
    console.error("[WALLET][CREDIT][RPC_FAILED]", error);

    // Check whether another request already credited this payment.
    const { data: existingCredit, error: lookupError } = await supabaseAdmin
      .from("wallet_transactions")
      .select("id, amount")
      .eq("customer_id", customerId)
      .eq("transaction_type", "CREDIT")
      .eq("reference_id", referenceId)
      .eq("reference_type", referenceType)
      .maybeSingle();

    if (lookupError) {
      console.error("[WALLET][CREDIT][DUPLICATE_CHECK_FAILED]", lookupError);
    }

    if (!lookupError && existingCredit) {
      const { data: latestWallet, error: latestWalletError } =
        await supabaseAdmin
          .from("wallet_accounts")
          .select("balance")
          .eq("customer_id", customerId)
          .single();

      if (latestWalletError) {
        throw new Error("Credit exists, but wallet balance could not be verified");
      }

      return {
        success: true,
        alreadyCredited: true,
        customerId,
        previousBalance: Number(latestWallet.balance || 0),
        creditedAmount: 0,
        newBalance: Number(latestWallet.balance || 0),
        message: "Payment already credited",
      };
    }

    throw new Error("Unable to process wallet credit");
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result || !result.result_success) {
    throw new Error(
      result?.result_message || "Wallet credit failed"
    );
  }

  const alreadyCredited =
    Number(result.credited_amount || 0) === 0;

  console.log("[WALLET][CREDIT][SUCCESS]", {
    customerId,
    referenceId,
    amount: Number(result.credited_amount || 0),
    newBalance: Number(result.new_balance || 0),
    alreadyCredited,
  });

  return {
    success: true,
    alreadyCredited,
    customerId: result.result_customer_id,
    previousBalance: Number(result.previous_balance || 0),
    creditedAmount: Number(result.credited_amount || 0),
    newBalance: Number(result.new_balance || 0),
    message: result.result_message,
  };
}
