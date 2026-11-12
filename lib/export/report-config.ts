/**
 * Report Configuration
 * 
 * Central configuration for all admin reports with download support.
 * Maps report keys to their API functions and column definitions.
 * 
 * When real download endpoints become available, only this file needs to change.
 */

import {
  getAuditLog,
  getChangeRequests,
  getUsers,
  getRaffleReport,
  getSentNotifications,
  type AdminUserListItem,
} from "@/lib/api/admin";
import {
  listWinners,
  listRedemptions,
  type WinnerRow,
  type RedemptionRow,
} from "@/lib/api/admin-winners";
import { CsvColumn } from "./csv";

export type ReportKey =
  | "audit-log"
  | "change-requests"
  | "users"
  | "raffles"
  | "notifications"
  | "income"
  | "subscriptions"
  | "winners"
  | "redemptions";

export interface ReportConfig<T = Record<string, unknown>> {
  label: string;
  fetchAll: (filters?: Record<string, unknown>) => Promise<T[]>;
  columns: CsvColumn[];
}

/**
 * Format date as DD MMM YYYY in Africa/Lagos timezone
 */
function formatDateLagos(dateStr: unknown): string {
  if (!dateStr || typeof dateStr !== "string") return "";
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Africa/Lagos",
    }).format(date);
  } catch {
    return String(dateStr);
  }
}

/**
 * Format date and time in Africa/Lagos timezone
 */
function formatDateTimeLagos(dateStr: unknown): string {
  if (!dateStr || typeof dateStr !== "string") return "";
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Lagos",
    }).format(date);
  } catch {
    return String(dateStr);
  }
}

/**
 * Format boolean as Yes/No
 */
function formatBoolean(value: unknown): string {
  if (value == null) return "";
  return value ? "Yes" : "No";
}

/**
 * Flatten nested object/array to readable string
 * Uses DetailValue logic: JSON for objects, comma-separated for arrays
 */
function flattenValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "object" ? JSON.stringify(item) : String(item))).join(", ");
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Fetch all pages for a paginated endpoint
 * Stops at 10,000 rows or when no more data
 */
async function fetchAllPages<T>(
  fetchPage: (page: number, size: number) => Promise<{ entries: T[]; total: number }>,
  pageSize = 100,
  maxRows = 10000
): Promise<T[]> {
  const allData: T[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore && allData.length < maxRows) {
    const response = await fetchPage(page, pageSize);
    allData.push(...response.entries);

    // Stop if we've fetched all data or hit the max
    if (response.entries.length === 0 || allData.length >= response.total || allData.length >= maxRows) {
      hasMore = false;
    } else {
      page++;
    }
  }

  return allData.slice(0, maxRows);
}

/**
 * Report configurations
 */
export const REPORT_CONFIGS: Record<ReportKey, ReportConfig> = {
  "audit-log": {
    label: "Audit Log",
    fetchAll: async (filters = {}) => {
      const result = await fetchAllPages<Record<string, unknown>>(
        (page, size) =>
          getAuditLog({
            ...filters,
            page,
            size,
          }),
        100,
        10000
      );
      return result;
    },
    columns: [
      { key: "occurredAt", label: "Time", format: formatDateTimeLagos },
      { key: "actorEmail", label: "Admin Email" },
      { key: "actorRoles", label: "Role" },
      { key: "description", label: "Action" },
      { key: "resourceType", label: "Resource Type" },
      { key: "resourcePath", label: "Resource Path" },
      { key: "httpMethod", label: "HTTP Method" },
      { key: "responseStatus", label: "HTTP Status" },
      { key: "success", label: "Success", format: formatBoolean },
      { key: "pathParams", label: "Path Params", format: flattenValue },
      { key: "requestBody", label: "Request Body", format: flattenValue },
    ],
  },

  "change-requests": {
    label: "Change Requests",
    fetchAll: async (filters = {}) => {
      const status = filters.status as "PENDING" | "APPROVED" | "REJECTED" | undefined;
      const result = await getChangeRequests(status);
      return result;
    },
    columns: [
      { key: "id", label: "Request ID" },
      { key: "resourceType", label: "Resource Type" },
      { key: "action", label: "Action" },
      { key: "httpMethod", label: "HTTP Method" },
      { key: "financial", label: "Financial", format: formatBoolean },
      { key: "proposedByEmail", label: "Proposed By" },
      { key: "proposedByRoles", label: "Proposer Role" },
      { key: "status", label: "Status" },
      { key: "reviewedByEmail", label: "Reviewed By" },
      { key: "reviewedAt", label: "Reviewed At", format: formatDateTimeLagos },
      { key: "approvalNote", label: "Approval Note" },
      { key: "rejectionReason", label: "Rejection Reason" },
      { key: "resultSummary", label: "Result Summary" },
      { key: "createdAt", label: "Created At", format: formatDateTimeLagos },
      { key: "resourcePath", label: "Resource Path" },
      { key: "pathParams", label: "Path Params", format: flattenValue },
      { key: "requestBody", label: "Request Details", format: flattenValue },
    ],
  },

  users: {
    label: "Users",
    fetchAll: async () => {
      const result = await fetchAllPages<AdminUserListItem>(
        (page, size) => getUsers(page, size),
        100,
        10000
      );
      return result;
    },
    columns: [
      { key: "authUserId", label: "User ID" },
      { key: "alias", label: "Alias" },
      { key: "firstName", label: "First Name" },
      { key: "lastName", label: "Last Name" },
      { key: "email", label: "Email" },
      { key: "phoneNumber", label: "Phone Number" },
      { key: "role", label: "Role" },
      { key: "packageName", label: "Package" },
      { key: "plan", label: "Plan" },
      { key: "subscriptionStatus", label: "Subscription Status" },
      { key: "tokenBalance", label: "Token Balance" },
      { key: "joinedAt", label: "Joined At", format: formatDateLagos },
    ],
  },

  raffles: {
    label: "Draws",
    fetchAll: async (filters = {}) => {
      const result = await fetchAllPages<Record<string, unknown>>(
        (page, size) =>
          getRaffleReport({
            ...filters,
            page,
            size,
          }) as Promise<{ entries: Record<string, unknown>[]; total: number }>,
        100,
        10000
      );
      return result;
    },
    columns: [
      { key: "raffleCode", label: "Draw Code" },
      { key: "prizeName", label: "Prize Name" },
      { key: "startsOn", label: "Start Date", format: formatDateLagos },
      { key: "endsOn", label: "End Date", format: formatDateLagos },
      { key: "drawDate", label: "Draw Date", format: formatDateLagos },
      { key: "maxWinners", label: "Max Winners" },
      { key: "scheduleLabel", label: "Schedule" },
      { key: "status", label: "Status" },
      { key: "entryCount", label: "Total Entries" },
      { key: "winnersSelected", label: "Winners Selected", format: formatBoolean },
      { key: "createdAt", label: "Created At", format: formatDateLagos },
    ],
  },

  notifications: {
    label: "Sent Notifications",
    fetchAll: async (filters = {}) => {
      const result = await fetchAllPages<Record<string, unknown>>(
        async (page, size) => {
          const response = await getSentNotifications({
            ...filters,
            page,
            size,
          });
          return {
            entries: response.entries as unknown as Record<string, unknown>[],
            total: response.total,
          };
        },
        100,
        10000
      );
      return result;
    },
    columns: [
      { key: "id", label: "Notification ID" },
      { key: "authUserId", label: "User ID" },
      { key: "recipientEmail", label: "Recipient Email" },
      { key: "recipientName", label: "Recipient Name" },
      { key: "recipientPhone", label: "Recipient Phone" },
      { key: "type", label: "Type" },
      { key: "title", label: "Title" },
      { key: "body", label: "Message Body" },
      { key: "read", label: "Read", format: formatBoolean },
      { key: "readAt", label: "Read At", format: formatDateTimeLagos },
      { key: "sentAt", label: "Sent At", format: formatDateTimeLagos },
    ],
  },

  income: {
    label: "Income Report",
    fetchAll: async () => {
      // Income report is summary data, not a paginated list
      // Return empty array for now (will be skipped in download)
      return [];
    },
    columns: [],
  },

  subscriptions: {
    label: "Subscriptions Report",
    fetchAll: async () => {
      // Subscriptions list endpoint returns 404
      // Return empty array for now (will be skipped in download)
      return [];
    },
    columns: [],
  },

  winners: {
    label: "Winners Report",
    fetchAll: async (filters = {}) => {
      const result = await fetchAllPages<WinnerRow>(
        (page, size) =>
          listWinners({
            ...filters,
            page,
            size,
          }),
        100,
        10000
      );
      return result as unknown as Record<string, unknown>[];
    },
    columns: [
      { key: "id", label: "Winner ID" },
      { key: "drawId", label: "Draw ID" },
      { key: "raffleCode", label: "Draw Code" },
      { key: "drawName", label: "Draw Name" },
      { key: "drawDate", label: "Draw Date", format: formatDateLagos },
      { key: "subscriberName", label: "Winner Name" },
      { key: "email", label: "Email" },
      { key: "phoneNumber", label: "Phone Number" },
      { key: "subscriptionPackage", label: "Subscription Package" },
      { key: "subscriptionStatus", label: "Subscription Status" },
      { key: "tierName", label: "Tier" },
      { key: "prizeName", label: "Prize Name" },
      { key: "prizeType", label: "Prize Type" },
      { key: "cashAmount", label: "Cash Amount" },
      { key: "rankPosition", label: "Rank" },
      { key: "points", label: "Points" },
      { key: "status", label: "Status" },
      { key: "pendingAction", label: "Pending Action" },
      { key: "selectedAt", label: "Selected At", format: formatDateTimeLagos },
      { key: "redeemedAt", label: "Redeemed At", format: formatDateTimeLagos },
      { key: "fulfilledAt", label: "Fulfilled At", format: formatDateTimeLagos },
    ],
  },

  redemptions: {
    label: "Redemptions Report",
    fetchAll: async (filters = {}) => {
      const result = await fetchAllPages<RedemptionRow>(
        (page, size) =>
          listRedemptions({
            ...filters,
            page,
            size,
          }),
        100,
        10000
      );
      return result as unknown as Record<string, unknown>[];
    },
    columns: [
      { key: "id", label: "Redemption ID" },
      { key: "drawId", label: "Draw ID" },
      { key: "raffleCode", label: "Draw Code" },
      { key: "drawName", label: "Draw Name" },
      { key: "drawDate", label: "Draw Date", format: formatDateLagos },
      { key: "subscriberName", label: "Winner Name" },
      { key: "email", label: "Email" },
      { key: "phoneNumber", label: "Phone Number" },
      { key: "prizeName", label: "Prize Name" },
      { key: "redeemType", label: "Type" },
      { key: "cashAmount", label: "Cash Amount" },
      { key: "status", label: "Status" },
      { key: "redeemedAt", label: "Redeemed At", format: formatDateTimeLagos },
      { key: "fulfilledAt", label: "Fulfilled At", format: formatDateTimeLagos },
    ],
  },
};

/**
 * Get report configuration by key
 */
export function getReportConfig(key: ReportKey): ReportConfig | null {
  return REPORT_CONFIGS[key] || null;
}
