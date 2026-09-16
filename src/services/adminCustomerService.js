import { getJSON } from "../config/api";

const API_URL = "https://farmfreshdairy.onrender.com/api";

// ======================================
// Get Customers
// Backend pagination + search + filter
// ======================================
export async function getAllCustomers({
  page = 1,
  limit = 10,
  search = "",
  filter = "All",
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search.trim()) {
    params.set("search", search.trim());
  }

  if (filter && filter !== "All") {
    params.set("filter", filter);
  }

  const response = await getJSON(
    `${API_URL}/admin/customers?${params.toString()}`
  );

  return {
    customers: Array.isArray(response?.customers)
      ? response.customers
      : [],
    pagination: response?.pagination || {
      page,
      limit,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
};

// ======================================
// Get Customer By ID
// ======================================
export async function getCustomerById(id) {
  const response = await getJSON(
    `${API_URL}/admin/customers/${id}`
  );

  return response.customer;
}