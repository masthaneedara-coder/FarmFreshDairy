import {
  getAllCustomersService,
  getCustomerByIdService,
} from "../services/adminCustomer.service.js";

// ===================================
// Get Customers - Paginated
// ===================================
export async function getAllCustomers(req, res) {
  try {
    const page = Math.max(
      Number.parseInt(req.query.page, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number.parseInt(req.query.limit, 10) || 10,
        1
      ),
      50
    );

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const filter =
      typeof req.query.filter === "string"
        ? req.query.filter
        : "All";

    const result =
      await getAllCustomersService({
        page,
        limit,
        search,
        filter,
      });

    res.status(200).json({
      success: true,
      customers: result.customers,
      pagination: result.pagination,
    });

  } catch (error) {
    console.error(
      "Get Customers Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// ===================================
// Get Customer By ID
// ===================================
export async function getCustomerById(req, res) {
  try {
    const { id } = req.params;

    const customer =
      await getCustomerByIdService(id);

    res.status(200).json({
      success: true,
      customer,
    });

  } catch (error) {
    console.error(
      "Get Customer Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}