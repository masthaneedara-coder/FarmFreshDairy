import express from "express";
import {
  getAllDeliveryBoys,
  getDeliveryBoyById,
} from "../controllers/deliveryBoy.controller.js";
import {
  
  
  createDeliveryBoy,
  updateDeliveryBoy,
  deleteDeliveryBoy,
  toggleDeliveryBoyStatus,
} from "../controllers/deliveryBoy.controller.js";
import {
    loginDeliveryBoy
} from "../controllers/deliveryBoy.controller.js";
import {
  getAssignedOrders,
  getDeliveryBoyHistory
} from "../controllers/deliveryBoy.controller.js";

const router = express.Router();

router.get("/", getAllDeliveryBoys);
router.get("/:id", getDeliveryBoyById);
router.post("/", createDeliveryBoy);

router.put("/:id", updateDeliveryBoy);

router.delete("/:id", deleteDeliveryBoy);

router.patch("/:id/status", toggleDeliveryBoyStatus);
router.post("/login", loginDeliveryBoy);
router.get("/:id/orders", getAssignedOrders);
router.get(
  "/:id/history",
  getDeliveryBoyHistory
);

export default router;