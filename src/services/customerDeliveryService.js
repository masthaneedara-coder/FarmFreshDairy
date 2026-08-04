import { getJSON } from "../config/api";

export async function getCustomerDeliverySummary(customerId) {
  const response = await getJSON(
    `/subscription-deliveries/customer/${customerId}/summary`
  );

  return response.summary;
}