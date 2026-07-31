import {
  fetchProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} from "../config/api";

// ==============================
// Get All Products
// ==============================

export async function getProducts() {
  try {
    return await fetchProducts();
  } catch (error) {
    console.error("getProducts:", error);
    return [];
  }
}

// ==============================
// Add Product
// ==============================

export async function createProduct(product) {
  return await addProduct(product);
}

// ==============================
// Update Product
// ==============================

export async function editProduct(id, product) {
  return await updateProduct(id, product);
}

// ==============================
// Delete Product
// ==============================

export async function removeProduct(id) {
  return await deleteProduct(id);
}

// ==============================
// Upload Product Image
// ==============================

export async function uploadImage(file) {
  return await uploadProductImage(file);
}