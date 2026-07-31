import {
  getCustomerAddressesService,
  getAddressByIdService,
  createAddressService,
  updateAddressService,
  deleteAddressService,
  setDefaultAddressService,
} from "../services/address.service.js";

/* ==========================================================
   Get Customer Addresses
========================================================== */

export async function getCustomerAddresses(req, res) {
  try {
    const { customerId } = req.params;

    const { data, error } =
      await getCustomerAddressesService(customerId);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      addresses: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* ==========================================================
   Get Address By ID
========================================================== */

export async function getAddressById(req, res) {
  try {
    const { id } = req.params;

    const { data, error } =
      await getAddressByIdService(id);

    if (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      address: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* ==========================================================
   Create Address
========================================================== */

export async function createAddress(req, res) {
  try {
    const { data, error } =
      await createAddressService(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      address: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* ==========================================================
   Update Address
========================================================== */

export async function updateAddress(req, res) {
  try {
    const { id } = req.params;

    const { data, error } =
      await updateAddressService(id, req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      address: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* ==========================================================
   Delete Address
========================================================== */

export async function deleteAddress(req, res) {
  try {
    const { id } = req.params;

    const { error } =
      await deleteAddressService(id);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      message: "Address deleted successfully.",
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

/* ==========================================================
   Set Default Address
========================================================== */

export async function setDefaultAddress(req, res) {
  try {
    const { id } = req.params;
    const { customer_id } = req.body;

    const { data, error } =
      await setDefaultAddressService(customer_id, id);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      address: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}