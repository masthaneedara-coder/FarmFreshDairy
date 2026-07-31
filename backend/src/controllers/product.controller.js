import { supabaseAdmin } from "../config/supabase.js";


import {
  createProductService,
  updateProductService,
  deleteProductService,
  searchProductsService,
  getProductsByCategoryService,
  getPaginatedProductsService,
  getProductByIdService,
} from "../services/product.service.js";
import { uploadProductImage } from "../services/storage.service.js";




// Get all products
export const getProducts = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
  .from("products")
  .select(`
    *,
    categories(name),
    product_sizes(
      id,
      label,
      price,
      volume,
      sort_order,
      is_active
    )
  `)
  .order("display_order", { ascending: true });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    for (const product of data) {

  const stock = Number(product.stock || 0);

  product.product_sizes =
    (product.product_sizes || []).map(size => ({

      ...size,

      available:
        stock >= Number(size.volume || 0)

    }));

}

    return res.json({
      success: true,
      products: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    const {
      category_id,
      name,
      description,
      price,
      offer_price,
      stock,
      size,
      sku,
      image,
      featured
    } = req.body;

    const { data, error } = await createProductService({
      category_id,
      name,
      description,
      price,
      offer_price,
      stock,
      size,
      sku,
      image,
      featured
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: "Product Added Successfully",
      product: data
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Update Product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } =
      await updateProductService(id, req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: "Product Updated Successfully",
      product: data,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Delete Product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } =
      await deleteProductService(id);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: "Product Deleted Successfully",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    const { data, error } = await searchProductsService(q || "");

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      products: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } =
      await getProductsByCategoryService(id);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    for (const product of data) {

  const stock =
    Number(product.stock || 0);

  product.product_sizes =
    (product.product_sizes || []).map(size => ({

      ...size,

      available:
        stock >= Number(size.volume)

    }));
}

    return res.json({
      success: true,
      products: data,
      
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getPaginatedProducts = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    const { data, count, error } =
      await getPaginatedProductsService(page, limit);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      total: count,
      page,
      limit,
      products: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const uploadImage = async (req, res) => {
  try {
    console.log("FILE RECEIVED:", req.file);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    const imageUrl = await uploadProductImage(req.file);

    return res.json({
      success: true,
      image: imageUrl,
    });

  } catch (err) {
    console.error("========== UPLOAD ERROR ==========");
    console.error(err);
    console.error("==================================");

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } =
      await getProductByIdService(id);

    if (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      product: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};