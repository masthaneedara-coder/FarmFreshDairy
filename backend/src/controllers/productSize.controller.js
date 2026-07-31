import {
  getProductSizesService,
  createProductSizeService,
  updateProductSizeService,
  deleteProductSizeService,
} from "../services/productSize.service.js";

/* -----------------------------
   GET Sizes
------------------------------*/
export const getProductSizes = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } =
      await getProductSizesService(id);

   if (error) {
        console.error("Supabase Error:", error);

        return res.status(400).json({
            success: false,
            error,
            message: error.message,
        });
        }

    res.json({
      success: true,
      sizes: data,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* -----------------------------
   CREATE Size
------------------------------*/
export const createProductSize = async (req, res) => {

  try {

    const { id } = req.params;

    const {
      label,
      price,
      sort_order,
    } = req.body;

    const { data, error } =
      await createProductSizeService({

        product_id: id,

        label,

        price,

        sort_order,

      });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(201).json({
      success: true,
      size: data,
    });

  } catch (err) {

    res.status(500).json({

      success: false,

      message: err.message,

    });

  }

};

/* -----------------------------
   UPDATE Size
------------------------------*/
export const updateProductSize = async (req, res) => {

  try {

    const { id } = req.params;

    const { label, price, sort_order } = req.body;

    const { data, error } =
      await updateProductSizeService(id, {
        label,
        price,
        sort_order,
      });

    if (error) {

      return res.status(400).json({
        success: false,
        message: error.message,
      });

    }

    res.json({
      success: true,
      size: data,
    });

  } catch (err) {

    res.status(500).json({

      success: false,

      message: err.message,

    });

  }

};

/* -----------------------------
   DELETE Size
------------------------------*/
export const deleteProductSize = async (req, res) => {

  try {

    const { id } = req.params;

    const { error } =
      await deleteProductSizeService(id);

    if (error) {

      return res.status(400).json({
        success: false,
        message: error.message,
      });

    }

    res.json({
      success: true,
      message: "Product size deleted successfully",
    });

  } catch (err) {

    res.status(500).json({

      success: false,

      message: err.message,

    });

  }

};