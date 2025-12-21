import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'

/**
 * Format date to readable string
 */
export const formatDate = (date, formatString = 'MMM dd, yyyy') => {
  if (!date) return ''
  
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  
  if (!isValid(parsedDate)) return ''
  
  return format(parsedDate, formatString)
}

/**
 * Format date with time
 */
export const formatDateTime = (date) => {
  return formatDate(date, 'MMM dd, yyyy - hh:mm a')
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (date) => {
  if (!date) return ''
  
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  
  if (!isValid(parsedDate)) return ''
  
  return formatDistanceToNow(parsedDate, { addSuffix: true })
}

/**
 * Check if date is in the past
 */
export const isPast = (date) => {
  if (!date) return false
  
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  
  return parsedDate < new Date()
}

/**
 * Check if date is in the future
 */
export const isFuture = (date) => {
  if (!date) return false
  
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  
  return parsedDate > new Date()
}