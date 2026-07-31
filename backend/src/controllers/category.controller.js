import { getCategoriesService } from "../services/category.service.js";

export const getCategories = async (req, res) => {
  try {
    const { data, error } = await getCategoriesService();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      categories: data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};