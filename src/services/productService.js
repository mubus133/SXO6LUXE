import { supabase } from '@/config/supabase'

/**
 * Fetch all active products with images and variants
 */
export const fetchAllProducts = async (filters = {}) => {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        images:product_images(*),
        variants:product_variants(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id)
    }

    if (filters.is_featured) {
      query = query.eq('is_featured', true)
    }

    if (filters.min_price) {
      query = query.gte('price_usd', filters.min_price)
    }

    if (filters.max_price) {
      query = query.lte('price_usd', filters.max_price)
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching products:', error)
    return { data: null, error }
  }
}

/**
 * Fetch single product by slug
 */
export const fetchProductBySlug = async (slug) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        images:product_images(*),
        variants:product_variants(*)
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching product:', error)
    return { data: null, error }
  }
}

/**
 * Fetch single product by ID
 */
export const fetchProductById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        images:product_images(*),
        variants:product_variants(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching product:', error)
    return { data: null, error }
  }
}

/**
 * Fetch featured products
 */
export const fetchFeaturedProducts = async (limit = 8) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        images:product_images(*)
      `)
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching featured products:', error)
    return { data: null, error }
  }
}

/**
 * Fetch products by category
 */
export const fetchProductsByCategory = async (categorySlug) => {
  try {
    // First get category
    const { data: category, error: catError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .eq('is_active', true)
      .single()

    if (catError) throw catError

    // Then get products
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        images:product_images(*),
        variants:product_variants(*)
      `)
      .eq('category_id', category.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching products by category:', error)
    return { data: null, error }
  }
}

/**
 * Fetch related products
 */
export const fetchRelatedProducts = async (productId, categoryId, limit = 4) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        images:product_images(*)
      `)
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .neq('id', productId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching related products:', error)
    return { data: null, error }
  }
}

/**
 * Search products
 */
export const searchProducts = async (searchTerm) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        images:product_images(*)
      `)
      .eq('is_active', true)
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error searching products:', error)
    return { data: null, error }
  }
}

/**
 * Check product availability
 */
export const checkProductAvailability = async (productId, variantId = null, quantity = 1) => {
  try {
    if (variantId) {
      const { data, error } = await supabase
        .from('product_variants')
        .select('inventory_quantity, is_active')
        .eq('id', variantId)
        .single()

      if (error) throw error

      return {
        available: data.is_active && data.inventory_quantity >= quantity,
        stock: data.inventory_quantity
      }
    } else {
      const { data, error } = await supabase
        .from('products')
        .select('inventory_quantity, track_inventory, is_active')
        .eq('id', productId)
        .single()

      if (error) throw error

      if (!data.track_inventory) {
        return { available: data.is_active, stock: null }
      }

      return {
        available: data.is_active && data.inventory_quantity >= quantity,
        stock: data.inventory_quantity
      }
    }
  } catch (error) {
    console.error('Error checking availability:', error)
    return { available: false, stock: 0 }
  }
}