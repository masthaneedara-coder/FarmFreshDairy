import { getAllOrdersService } from "../services/adminOrder.service.js";
import { updateOrderStatusService } from "../services/adminOrder.service.js";
import { assignDeliveryBoyService } from "../services/adminOrder.service.js";

export const getAllOrders = async (req, res) => {
  try {
    const { data, error } = await getAllOrdersService();

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
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } =
      await getOrderByIdService(id);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      order: data,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatus = [
      "Pending",
      "Confirmed",
      "Packed",
      "Out For Delivery",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const { data, error } =
      await updateOrderStatusService(id, status);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      message: "Order status updated successfully",
      order: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const assignDeliveryBoy = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryBoyId } = req.body;

    const { data, error } =
      await assignDeliveryBoyService(
        id,
        deliveryBoyId
      );

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      order: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

