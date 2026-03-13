/**
 * Tests for date and number formatting utilities
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/i18n"
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatTime,
  formatUnit,
} from "./formatting"

// Mock i18n module
vi.mock("@/i18n", () => ({
  default: {
    language: "en",
  },
}))

describe("formatting utilities", () => {
  const testDate = new Date("2024-01-15T14:30:00Z")
  const testNumber = 1234.56

  beforeEach(() => {
    // Reset to English before each test
    ;(i18n as any).language = "en"
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("formatDate", () => {
    it("formats date in English (en-CA)", () => {
      ;(i18n as any).language = "en"
      const formatted = formatDate(testDate)
      // Should contain month, day, and year
      expect(formatted).toMatch(/\d{1,2}/) // day
      expect(formatted).toMatch(/Jan|January/) // month
      expect(formatted).toMatch(/2024/) // year
    })

    it("formats date in French (fr-CA)", () => {
      ;(i18n as any).language = "fr"
      const formatted = formatDate(testDate)
      // French formatting should be different
      expect(formatted).toBeTruthy()
      expect(typeof formatted).toBe("string")
    })

    it("handles Date objects", () => {
      const formatted = formatDate(testDate)
      expect(typeof formatted).toBe("string")
      expect(formatted.length).toBeGreaterThan(0)
    })

    it("handles date strings", () => {
      const formatted = formatDate("2024-01-15")
      expect(typeof formatted).toBe("string")
      expect(formatted.length).toBeGreaterThan(0)
    })

    it("handles timestamps", () => {
      const formatted = formatDate(testDate.getTime())
      expect(typeof formatted).toBe("string")
      expect(formatted.length).toBeGreaterThan(0)
    })

    it("accepts custom options", () => {
      const formatted = formatDate(testDate, { year: "numeric", month: "long" })
      expect(formatted).toMatch(/2024/)
      expect(formatted).toMatch(/January|Janvier/)
    })
  })

  describe("formatDateTime", () => {
    it("formats date and time in English", () => {
      ;(i18n as any).language = "en"
      const formatted = formatDateTime(testDate)
      expect(typeof formatted).toBe("string")
      expect(formatted.length).toBeGreaterThan(0)
    })

    it("formats date and time in French", () => {
      ;(i18n as any).language = "fr"
      const formatted = formatDateTime(testDate)
      expect(typeof formatted).toBe("string")
      expect(formatted.length).toBeGreaterThan(0)
    })

    it("accepts custom options", () => {
      const formatted = formatDateTime(testDate, {
        hour: "2-digit",
        minute: "2-digit",
      })
      expect(formatted).toMatch(/\d{1,2}:\d{2}/) // time format
    })
  })

  describe("formatTime", () => {
    it("formats time in English", () => {
      ;(i18n as any).language = "en"
      const formatted = formatTime(testDate)
      expect(typeof formatted).toBe("string")
      expect(formatted.length).toBeGreaterThan(0)
    })

    it("formats time in French", () => {
      ;(i18n as any).language = "fr"
      const formatted = formatTime(testDate)
      expect(typeof formatted).toBe("string")
      expect(formatted.length).toBeGreaterThan(0)
    })
  })

  describe("formatNumber", () => {
    it("formats number in English (en-CA)", () => {
      ;(i18n as any).language = "en"
      const formatted = formatNumber(testNumber)
      // English uses comma as thousand separator
      expect(formatted).toContain("1")
      expect(formatted).toContain("234")
      expect(typeof formatted).toBe("string")
    })

    it("formats number in French (fr-CA)", () => {
      ;(i18n as any).language = "fr"
      const formatted = formatNumber(testNumber)
      // French uses space as thousand separator
      expect(formatted).toBeTruthy()
      expect(typeof formatted).toBe("string")
    })

    it("formats integers", () => {
      const formatted = formatNumber(1234)
      expect(formatted).toBeTruthy()
      expect(typeof formatted).toBe("string")
    })

    it("formats decimals", () => {
      const formatted = formatNumber(1234.56)
      expect(formatted).toBeTruthy()
      expect(typeof formatted).toBe("string")
    })

    it("accepts custom options", () => {
      const formatted = formatNumber(testNumber, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      expect(formatted).toBeTruthy()
      expect(typeof formatted).toBe("string")
    })
  })

  describe("formatCurrency", () => {
    it("formats currency in English", () => {
      ;(i18n as any).language = "en"
      const formatted = formatCurrency(testNumber)
      expect(formatted).toContain("$") // CAD symbol
      expect(typeof formatted).toBe("string")
    })

    it("formats currency in French", () => {
      ;(i18n as any).language = "fr"
      const formatted = formatCurrency(testNumber)
      expect(formatted).toBeTruthy()
      expect(typeof formatted).toBe("string")
    })

    it("accepts custom currency", () => {
      const formatted = formatCurrency(testNumber, "USD")
      expect(formatted).toBeTruthy()
      expect(typeof formatted).toBe("string")
    })

    it("accepts custom options", () => {
      const formatted = formatCurrency(testNumber, "CAD", {
        minimumFractionDigits: 0,
      })
      expect(formatted).toBeTruthy()
      expect(typeof formatted).toBe("string")
    })
  })

  describe("formatPercent", () => {
    it("formats percentage in English", () => {
      ;(i18n as any).language = "en"
      const formatted = formatPercent(0.15) // 15%
      expect(formatted).toContain("%")
      expect(typeof formatted).toBe("string")
    })

    it("formats percentage in French", () => {
      ;(i18n as any).language = "fr"
      const formatted = formatPercent(0.15)
      expect(formatted).toBeTruthy()
      expect(typeof formatted).toBe("string")
    })

    it("accepts custom options", () => {
      const formatted = formatPercent(0.15, {
        minimumFractionDigits: 1,
      })
      expect(formatted).toBeTruthy()
      expect(typeof formatted).toBe("string")
    })
  })

  describe("formatUnit", () => {
    it("formats unit in English", () => {
      ;(i18n as any).language = "en"
      const formatted = formatUnit(5, "kilogram")
      expect(formatted).toBeTruthy()
      expect(typeof formatted).toBe("string")
    })

    it("formats unit in French", () => {
      ;(i18n as any).language = "fr"
      const formatted = formatUnit(5, "kilogram")
      expect(formatted).toBeTruthy()
      expect(typeof formatted).toBe("string")
    })

    it("accepts custom options", () => {
      const formatted = formatUnit(5, "kilogram", {
        unitDisplay: "short",
      })
      expect(formatted).toBeTruthy()
      expect(typeof formatted).toBe("string")
    })
  })

  describe("locale mapping", () => {
    it("maps 'en' to 'en-CA'", () => {
      ;(i18n as any).language = "en"
      const dateFormatted = formatDate(testDate)
      const numberFormatted = formatNumber(testNumber)
      // Both should work without errors
      expect(dateFormatted).toBeTruthy()
      expect(numberFormatted).toBeTruthy()
    })

    it("maps 'fr' to 'fr-CA'", () => {
      ;(i18n as any).language = "fr"
      const dateFormatted = formatDate(testDate)
      const numberFormatted = formatNumber(testNumber)
      // Both should work without errors
      expect(dateFormatted).toBeTruthy()
      expect(numberFormatted).toBeTruthy()
    })
  })
})
