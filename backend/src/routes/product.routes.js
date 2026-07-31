import express from "express";
import { upload } from "../middleware/upload.middleware.js";

import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductsByCategory,
  getPaginatedProducts,
  uploadImage,
} from "../controllers/product.controller.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/search", searchProducts);
router.get("/category/:id", getProductsByCategory);
router.get("/page", getPaginatedProducts);

router.post("/", createProduct);

// Upload Product Image
router.post("/upload", upload.single("image"), uploadImage);

router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);
router.get("/:id", getProductById);

export default router;