/**
 * Format USD currency
 */
export const formatUSD = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Format NGN currency
 */
export const formatNGN = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Fetch live USD to NGN exchange rate
 */
export const fetchExchangeRate = async () => {
  try {
    const response = await fetch(import.meta.env.VITE_EXCHANGE_RATE_API)
    const data = await response.json()
    
    if (data && data.rates && data.rates.NGN) {
      return data.rates.NGN
    }
    
    // Fallback rate if API fails
    return 1550
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    // Fallback rate
    return 1550
  }
}

/**
 * Convert USD to NGN
 */
export const convertUSDtoNGN = (usdAmount, exchangeRate) => {
  return Number((usdAmount * exchangeRate).toFixed(2))
}

/**
 * Convert NGN to USD
 */
export const convertNGNtoUSD = (ngnAmount, exchangeRate) => {
  return Number((ngnAmount / exchangeRate).toFixed(2))
}

/**
 * Parse currency string to number
 */
export const parseCurrency = (currencyString) => {
  return Number(currencyString.replace(/[^0-9.-]+/g, ''))
}