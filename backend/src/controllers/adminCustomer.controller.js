import {
  getAllCustomersService,
  getCustomerByIdService,
} from "../services/adminCustomer.service.js";

// ===================================
// Get All Customers
// ===================================
export async function getAllCustomers(req, res) {
  try {
    const customers = await getAllCustomersService();

    res.status(200).json({
      success: true,
      customers,
    });

  } catch (error) {
    console.error("Get Customers Error:", error);

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

    const customer = await getCustomerByIdService(id);

    res.status(200).json({
      success: true,
      customer,
    });

  } catch (error) {
    console.error("Get Customer Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}