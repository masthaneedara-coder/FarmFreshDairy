import {
  getAllDeliveryBoysService,
  getDeliveryBoyByIdService,
} from "../services/deliveryBoy.service.js";
import {
  createDeliveryBoyService,
  updateDeliveryBoyService,
  deleteDeliveryBoyService,
  toggleDeliveryBoyStatusService,
} from "../services/deliveryBoy.service.js";
import {
    loginDeliveryBoyService,
    getAssignedOrdersService
} from "../services/deliveryBoy.service.js";


// Get All Delivery Boys
export const getAllDeliveryBoys = async (req, res) => {
  try {
    const { data, error } = await getAllDeliveryBoysService();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      deliveryBoys: data,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get Delivery Boy By ID
export const getDeliveryBoyById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } =
      await getDeliveryBoyByIdService(id);

    if (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      deliveryBoy: data,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
// Create
export const createDeliveryBoy = async (req, res) => {
  try {
    const { data, error } =
      await createDeliveryBoyService(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(201).json({
      success: true,
      deliveryBoy: data,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Update
export const updateDeliveryBoy = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } =
      await updateDeliveryBoyService(id, req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      deliveryBoy: data,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Delete
export const deleteDeliveryBoy = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } =
      await deleteDeliveryBoyService(id);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: "Delivery Boy deleted successfully",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Activate / Deactivate
export const toggleDeliveryBoyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const { data, error } =
      await toggleDeliveryBoyStatusService(
        id,
        is_active
      );

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      deliveryBoy: data,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const loginDeliveryBoy = async (req, res) => {

    try {

        console.log("Request Body:", req.body);

        const { phone, password } = req.body;

        const { data, error } =
            await loginDeliveryBoyService(phone);

        console.log("Supabase Data:", data);
        console.log("Supabase Error:", error);

        if (error || !data) {
            return res.status(401).json({
                success: false,
                message: "Invalid mobile number"
            });
        }

        console.log("DB Password:", data.password_hash);
        console.log("Entered Password:", password);

        if (data.password_hash !== password) {
            return res.status(401).json({
                success: false,
                message: "Invalid password"
            });
        }

        return res.json({
            success: true,
            deliveryBoy: data
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};
export const getAssignedOrders = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } =
      await getAssignedOrdersService(id);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      orders: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};