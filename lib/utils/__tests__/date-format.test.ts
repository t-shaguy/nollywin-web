/**
 * Unit tests for date-format utilities
 */

import { lagosToUtcISO, getStartOfDayUTC, getEndOfDayUTC } from "../date-format";

describe("lagosToUtcISO", () => {
  it("converts Lagos 2026-11-06 00:00:00 to 2026-11-05T23:00:00Z", () => {
    const result = lagosToUtcISO(2026, 11, 6, 0, 0, 0);
    expect(result).toBe("2026-11-05T23:00:00Z");
  });

  it("converts Lagos 2026-11-13 23:59:59 to 2026-11-13T22:59:59Z", () => {
    const result = lagosToUtcISO(2026, 11, 13, 23, 59, 59);
    expect(result).toBe("2026-11-13T22:59:59Z");
  });

  it("output contains no percent signs", () => {
    const result = lagosToUtcISO(2026, 11, 6, 14, 30, 0);
    expect(result).not.toContain("%");
  });

  it("output contains no plus signs", () => {
    const result = lagosToUtcISO(2026, 11, 6, 14, 30, 0);
    expect(result).not.toContain("+");
  });

  it("output ends with Z", () => {
    const result = lagosToUtcISO(2026, 11, 6, 14, 30, 0);
    expect(result.endsWith("Z")).toBe(true);
  });

  it("handles Lagos midnight correctly", () => {
    // Lagos 2026-01-01 00:00:00 → UTC 2025-12-31 23:00:00
    const result = lagosToUtcISO(2026, 1, 1, 0, 0, 0);
    expect(result).toBe("2025-12-31T23:00:00Z");
  });

  it("handles Lagos noon correctly", () => {
    // Lagos 2026-06-15 12:00:00 → UTC 2026-06-15 11:00:00
    const result = lagosToUtcISO(2026, 6, 15, 12, 0, 0);
    expect(result).toBe("2026-06-15T11:00:00Z");
  });
});

describe("getStartOfDayUTC", () => {
  it("returns start of day converted to UTC", () => {
    const date = new Date(2026, 10, 6); // November 6, 2026 (month is 0-indexed)
    const result = getStartOfDayUTC(date);
    expect(result).toBe("2026-11-05T23:00:00Z");
  });

  it("works for any input timezone", () => {
    // Date object will be in local timezone, but we extract wall-clock values
    const date = new Date(2026, 0, 1, 15, 30, 45); // Time component should be ignored
    const result = getStartOfDayUTC(date);
    expect(result).toBe("2025-12-31T23:00:00Z"); // Lagos 2026-01-01 00:00:00
  });
});

describe("getEndOfDayUTC", () => {
  it("returns end of day converted to UTC", () => {
    const date = new Date(2026, 10, 13); // November 13, 2026
    const result = getEndOfDayUTC(date);
    expect(result).toBe("2026-11-13T22:59:59Z");
  });

  it("handles end of month correctly", () => {
    const date = new Date(2026, 10, 30); // November 30, 2026
    const result = getEndOfDayUTC(date);
    expect(result).toBe("2026-11-30T22:59:59Z");
  });
});
