/**
 * Date and number formatting utilities using Intl API
 * Integrates with i18next for locale-aware formatting
 *
 * @example
 * ```tsx
 * import { formatDate, formatNumber, formatCurrency } from '@/utils'
 *
 * // Date formatting (automatically uses current i18n language)
 * const dateStr = formatDate(new Date()) // "Jan 15, 2024" (en) or "15 janv. 2024" (fr)
 *
 * // Number formatting
 * const numStr = formatNumber(1234.56) // "1,234.56" (en) or "1 234,56" (fr)
 *
 * // Currency formatting
 * const currencyStr = formatCurrency(1234.56) // "$1,234.56" (en) or "1 234,56 $ CA" (fr)
 * ```
 */

import i18n from "@/i18n"

/**
 * Maps i18next language codes to Intl locale codes
 * e.g., 'fr' → 'fr-CA' for Canadian French formatting
 */
const getIntlLocale = (language: string): string => {
  const localeMap: Record<string, string> = {
    en: "en-CA", // Canadian English
    fr: "fr-CA", // Canadian French
  }
  return localeMap[language] || language
}

/**
 * Gets the current locale for formatting based on i18next language
 */
const getCurrentLocale = (): string => {
  const currentLanguage = i18n.language || "en"
  return getIntlLocale(currentLanguage)
}

/**
 * Formats a date using Intl.DateTimeFormat
 * @param date - Date object, string, or timestamp
 * @param options - Intl.DateTimeFormatOptions (defaults to medium date format)
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string => {
  const locale = getCurrentLocale()
  const dateObj =
    typeof date === "string" || typeof date === "number" ? new Date(date) : date

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  }

  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj)
}

/**
 * Formats a date and time using Intl.DateTimeFormat
 * @param date - Date object, string, or timestamp
 * @param options - Intl.DateTimeFormatOptions (defaults to medium date/time format)
 * @returns Formatted date and time string
 */
export const formatDateTime = (
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string => {
  const locale = getCurrentLocale()
  const dateObj =
    typeof date === "string" || typeof date === "number" ? new Date(date) : date

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...options,
  }

  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj)
}

/**
 * Formats a time using Intl.DateTimeFormat
 * @param date - Date object, string, or timestamp
 * @param options - Intl.DateTimeFormatOptions (defaults to time format)
 * @returns Formatted time string
 */
export const formatTime = (
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string => {
  const locale = getCurrentLocale()
  const dateObj =
    typeof date === "string" || typeof date === "number" ? new Date(date) : date

  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    ...options,
  }

  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj)
}

/**
 * Formats a number using Intl.NumberFormat
 * @param value - Number to format
 * @param options - Intl.NumberFormatOptions (defaults to standard number format)
 * @returns Formatted number string
 */
export const formatNumber = (
  value: number,
  options?: Intl.NumberFormatOptions,
): string => {
  const locale = getCurrentLocale()
  const defaultOptions: Intl.NumberFormatOptions = {
    ...options,
  }

  return new Intl.NumberFormat(locale, defaultOptions).format(value)
}

/**
 * Formats a number as currency using Intl.NumberFormat
 * @param value - Number to format
 * @param currency - Currency code (defaults to 'CAD')
 * @param options - Additional Intl.NumberFormatOptions
 * @returns Formatted currency string
 */
export const formatCurrency = (
  value: number,
  currency: string = "CAD",
  options?: Intl.NumberFormatOptions,
): string => {
  const locale = getCurrentLocale()
  const defaultOptions: Intl.NumberFormatOptions = {
    style: "currency",
    currency,
    ...options,
  }

  return new Intl.NumberFormat(locale, defaultOptions).format(value)
}

/**
 * Formats a number as a percentage using Intl.NumberFormat
 * @param value - Number to format (e.g., 0.15 for 15%)
 * @param options - Additional Intl.NumberFormatOptions
 * @returns Formatted percentage string
 */
export const formatPercent = (
  value: number,
  options?: Intl.NumberFormatOptions,
): string => {
  const locale = getCurrentLocale()
  const defaultOptions: Intl.NumberFormatOptions = {
    style: "percent",
    ...options,
  }

  return new Intl.NumberFormat(locale, defaultOptions).format(value)
}

/**
 * Formats a number with unit using Intl.NumberFormat
 * @param value - Number to format
 * @param unit - Unit string (e.g., 'kilogram', 'meter', 'liter')
 * @param options - Additional Intl.NumberFormatOptions
 * @returns Formatted number with unit string
 */
export const formatUnit = (
  value: number,
  unit: string,
  options?: Intl.NumberFormatOptions,
): string => {
  const locale = getCurrentLocale()
  const defaultOptions: Intl.NumberFormatOptions = {
    style: "unit",
    unit,
    ...options,
  }

  return new Intl.NumberFormat(locale, defaultOptions).format(value)
}
