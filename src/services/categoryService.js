import { supabase } from '@/config/supabase'

/**
 * Fetch all active categories
 */
export const fetchAllCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return { data: null, error }
  }
}

/**
 * Fetch category by slug
 */
export const fetchCategoryBySlug = async (slug) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching category:', error)
    return { data: null, error }
  }
}

/**
 * Fetch category with product count
 */
export const fetchCategoriesWithCount = async () => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        products:products(count)
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching categories with count:', error)
    return { data: null, error }
  }
}