import { supabaseAdmin } from "../config/supabase.js";

// Create Product
export const createProductService = async (product) => {
  return await supabaseAdmin
    .from("products")
    .insert(product)
    .select()
    .single();
};

// Update Product
export const updateProductService = async (id, product) => {
  return await supabaseAdmin
    .from("products")
    .update(product)
    .eq("id", id)
    .select()
    .single();
};

// Delete Product
export const deleteProductService = async (id) => {
  return await supabaseAdmin
    .from("products")
    .delete()
    .eq("id", id);
};
// Search Products
export const searchProductsService = async (search) => {
  return await supabaseAdmin
    .from("products")
    .select(`
  *,
  categories(name),
  product_sizes(
    id,
    label,
    price,
    sort_order,
    is_active
  )
`)
    .ilike("name", `%${search}%`)
    .order("display_order", { ascending: true });
};

// Products by Category
export const getProductsByCategoryService = async (categoryId) => {
  return await supabaseAdmin
    .from("products")
    .select(`
  *,
  categories(name),
  product_sizes(
    id,
    label,
    price,
    sort_order,
    is_active
  )
`)
    .eq("category_id", categoryId)
    .order("display_order", { ascending: true });
};

// Pagination
export const getPaginatedProductsService = async (page, limit) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return await supabaseAdmin
    .from("products")
    .select(`
  *,
  categories(name),
  product_sizes(
    id,
    label,
    price,
    sort_order,
    is_active
  )
`), { count: "exact" }
    .range(from, to)
    .order("display_order", { ascending: true });
};
export async function getProductByIdService(id) {
 return await supabaseAdmin
  .from("products")
  .select(
    `
    *,
    categories(name),
    product_sizes(
      id,
      label,
      price,
      sort_order,
      is_active
    )
    `,
    { count: "exact" }
  )
  .range(from, to)
  .order("display_order", { ascending: true })
    .eq("id", id)
    .single();
}