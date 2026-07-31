import express from "express";

import {

    getProductSizes,

    createProductSize,

    updateProductSize,

    deleteProductSize,

} from "../controllers/productSize.controller.js";

const router = express.Router();

/* Product Sizes */

router.get("/:id/sizes", getProductSizes);

router.post("/:id/sizes", createProductSize);

router.put("/size/:id", updateProductSize);

router.delete("/size/:id", deleteProductSize);

export default router;