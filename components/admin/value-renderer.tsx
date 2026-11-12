/**
 * Shared component for rendering structured data values from API responses
 * Used across admin pages (change requests, audit log, etc.)
 * NEVER renders raw JSON.stringify() output.
 */

import React from "react";

// JSON type for safe recursion
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

interface DetailValueProps {
  label?: string;
  value: unknown;
  compact?: boolean;
}

interface DetailListProps {
  data: unknown;
  compact?: boolean;
}

// Key humanization overrides
const KEY_LABELS: Record<string, string> = {
  startsOn: "Start Date",
  endsOn: "End Date",
  drawDate: "Draw Date",
  maxWinners: "Max Winners",
  prizeName: "Prize",
  scheduleLabel: "Schedule",
  koboPerToken: "Kobo per token",
  approvalNote: "Approval note",
  rejectionReason: "Rejection reason",
  prizeAmount: "Prize amount",
  winnersCount: "Winners",
  tierName: "Tier",
  displayName: "Display name",
  authUserId: "User ID",
  raffleCode: "Draw code",
  requestBody: "Request body",
  pathParams: "Path parameters",
  resultSummary: "Result summary",
};

// Type guards
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRecordArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.length > 0 && isRecord(value[0]);
}

function isPrimitive(value: unknown): value is string | number | boolean | null | undefined {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function isIsoDate(value: string): boolean {
  // Match YYYY-MM-DD or ISO 8601 formats
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/.test(value);
}

function isPrizeTiersArray(value: unknown, key: string): value is Record<string, unknown>[] {
  return (
    (key === "prizeTiers" || key === "tiers") &&
    isRecordArray(value) &&
    "tierName" in (value[0] || {})
  );
}

// Humanize camelCase/snake_case to Title Case
function humanizeKey(key: string): string {
  if (KEY_LABELS[key]) return KEY_LABELS[key];

  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// Parse potentially JSON string
function parseMaybeJson(input: unknown): unknown {
  if (typeof input !== "string") return input;
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
}

// Check if key likely represents money
function isMoneyField(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return (
    lowerKey.includes("amount") ||
    lowerKey.includes("fee") ||
    lowerKey.includes("price") ||
    lowerKey.includes("kobo")
  );
}

// Format money fields
function formatMoney(key: string, value: number): string {
  const lowerKey = key.toLowerCase();

  // Kobo fields show raw number + "kobo"
  if (lowerKey.includes("kobo")) {
    return `${value.toLocaleString()} kobo`;
  }

  // Amount/fee/price fields: assume naira, format with ₦
  return `₦${value.toLocaleString()}`;
}

// Format date as DD MMM YYYY (with time in Africa/Lagos if present)
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    // Check if the string has time component
    const hasTime = dateStr.includes("T");

    if (hasTime) {
      // Format with time in Africa/Lagos
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Lagos",
      }).format(date);
    } else {
      // Just date, use UTC
      const day = date.getUTCDate().toString().padStart(2, "0");
      const month = date.toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
      const year = date.getUTCFullYear();
      return `${day} ${month} ${year}`;
    }
  } catch {
    return dateStr;
  }
}

// Prize tiers table component
function PrizeTiersTable({ tiers, compact }: { tiers: Record<string, unknown>[]; compact?: boolean }) {
  // Sort by position
  const sorted = [...tiers].sort((a, b) => {
    const posA = typeof a.position === "number" ? a.position : 0;
    const posB = typeof b.position === "number" ? b.position : 0;
    return posA - posB;
  });

  // Calculate total winners
  const totalWinners = sorted.reduce((sum, t) => {
    const count = typeof t.winnersCount === "number" ? t.winnersCount : 0;
    return sum + count;
  }, 0);

  return (
    <div className="space-y-2 mt-1">
      {/* Desktop: table */}
      <div className="hidden md:block">
        <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left p-2 font-medium">Position</th>
              <th className="text-left p-2 font-medium">Tier</th>
              <th className="text-left p-2 font-medium">Prize</th>
              <th className="text-right p-2 font-medium">Winners</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((tier, i) => (
              <tr key={i}>
                <td className="p-2">
                  {typeof tier.position === "number" ? tier.position : "-"}
                </td>
                <td className="p-2">
                  {typeof tier.tierName === "string" ? tier.tierName : "-"}
                </td>
                <td className="p-2 break-words">
                  {typeof tier.prizeName === "string" ? tier.prizeName : "-"}
                </td>
                <td className="p-2 text-right font-mono">
                  {typeof tier.winnersCount === "number"
                    ? tier.winnersCount.toLocaleString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-secondary/50">
            <tr>
              <td colSpan={3} className="p-2 text-right font-medium">
                Total winners:
              </td>
              <td className="p-2 text-right font-mono font-medium">{totalWinners}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-2">
        {sorted.map((tier, i) => (
          <div key={i} className="bg-secondary/30 rounded-lg p-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Position:</span>
              <span className="font-medium">
                {typeof tier.position === "number" ? tier.position : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tier:</span>
              <span className="font-medium">
                {typeof tier.tierName === "string" ? tier.tierName : "-"}
              </span>
            </div>
            <div>
              <div className="text-muted-foreground mb-0.5">Prize:</div>
              <div className="font-medium break-words">
                {typeof tier.prizeName === "string" ? tier.prizeName : "-"}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Winners:</span>
              <span className="font-mono font-medium">
                {typeof tier.winnersCount === "number"
                  ? tier.winnersCount.toLocaleString()
                  : "-"}
              </span>
            </div>
          </div>
        ))}
        <div className="bg-secondary/50 rounded-lg p-2 flex justify-between text-xs font-medium">
          <span>Total winners:</span>
          <span className="font-mono">{totalWinners}</span>
        </div>
      </div>
    </div>
  );
}

// Generic object array table
function ObjectArrayTable({
  items,
  compact,
}: {
  items: Record<string, unknown>[];
  compact?: boolean;
}) {
  if (items.length === 0) {
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  const keys = Object.keys(items[0]);

  return (
    <div className="mt-1">
      {/* Desktop: table */}
      <div className="hidden md:block">
        <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
          <thead className="bg-secondary">
            <tr>
              {keys.map((key) => (
                <th key={key} className="text-left p-2 font-medium">
                  {humanizeKey(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item, i) => (
              <tr key={i}>
                {keys.map((key) => (
                  <td key={key} className="p-2 break-words">
                    {renderValue(item[key], 0, true)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-2">
        {items.map((item, i) => (
          <div key={i} className="bg-secondary/30 rounded-lg p-3 space-y-1.5 text-xs">
            {keys.map((key) => (
              <div key={key} className="flex justify-between gap-3">
                <span className="text-muted-foreground shrink-0">{humanizeKey(key)}:</span>
                <span className="font-medium text-right break-words">
                  {renderValue(item[key], 0, true)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Render a single value (recursive, max depth 3)
function renderValue(value: unknown, depth: number = 0, compact: boolean = false): React.ReactNode {
  // null/undefined/empty
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  // Booleans
  if (typeof value === "boolean") {
    return <span className="text-xs">{value ? "Yes" : "No"}</span>;
  }

  // Numbers
  if (typeof value === "number") {
    // Note: we can't know the key here, so no money formatting in recursion
    return <span className="text-xs font-mono">{value.toLocaleString()}</span>;
  }

  // Strings (check for dates)
  if (typeof value === "string") {
    // Check for ISO dates first
    const stringValue: string = value;
    
    if (isIsoDate(stringValue)) {
      return <span className="text-xs">{formatDate(stringValue)}</span>;
    }

    // Very long strings wrap
    if (stringValue.length > 200) {
      return (
        <span className="text-xs break-words bg-muted/30 px-2 py-1 rounded">{stringValue}</span>
      );
    }

    return <span className="text-xs break-words">{stringValue}</span>;
  }

  // Arrays
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground text-xs">-</span>;
    }

    // Array of records → table
    if (isRecordArray(value)) {
      return <ObjectArrayTable items={value} compact={compact} />;
    }

    // Array of primitives → chips
    const allPrimitives = value.every((item) => isPrimitive(item));
    if (allPrimitives) {
      return (
        <div className="flex flex-wrap gap-1.5">
          {value.map((item, i) => (
            <span key={i} className="text-xs bg-secondary/50 px-2 py-0.5 rounded-full">
              {String(item)}
            </span>
          ))}
        </div>
      );
    }

    // Mixed array: fallback to string representation
    return (
      <div className="text-xs bg-muted/30 px-2 py-1 rounded break-words">
        {value.map((v) => String(v)).join(", ")}
      </div>
    );
  }

  // Records (nested objects)
  if (isRecord(value)) {
    // Max depth 3
    if (depth >= 3) {
      const entries = Object.entries(value);
      return (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Show details
          </summary>
          <div className="mt-2 ml-4 space-y-1">
            {entries.map(([k, v]) => (
              <div key={k}>
                <span className="font-medium">{humanizeKey(k)}:</span>{" "}
                <span className="break-words">{String(v)}</span>
              </div>
            ))}
          </div>
        </details>
      );
    }

    // Render as indented sub-list
    const entries = Object.entries(value);
    return (
      <div className="ml-3 space-y-1.5 border-l-2 border-border pl-3 mt-1">
        {entries.map(([k, v]) => (
          <div key={k} className="text-xs">
            <span className="font-medium text-muted-foreground">{humanizeKey(k)}:</span>{" "}
            {renderValue(v, depth + 1, compact)}
          </div>
        ))}
      </div>
    );
  }

  // Fallback: convert to string
  return <span className="text-xs break-words">{String(value)}</span>;
}

/**
 * Render a single labeled value with special handling for keys
 */
export function DetailValue({ label, value, compact = false }: DetailValueProps) {
  const key = label || "";

  // Special case: prize tiers
  if (isPrizeTiersArray(value, key)) {
    return (
      <div className="space-y-1">
        {label && (
          <div className="text-xs text-muted-foreground font-medium">{label}:</div>
        )}
        <PrizeTiersTable tiers={value} compact={compact} />
      </div>
    );
  }

  // Handle money fields
  if (isMoneyField(key) && typeof value === "number") {
    return (
      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
        {label && (
          <span className="text-xs text-muted-foreground sm:min-w-[140px] font-medium leading-relaxed">
            {label}:
          </span>
        )}
        <div className="flex-1 min-w-0">
          <span className="text-xs font-mono leading-relaxed">{formatMoney(key, value)}</span>
        </div>
      </div>
    );
  }

  // Regular rendering
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
      {label && (
        <span className="text-xs text-muted-foreground sm:min-w-[140px] font-medium leading-relaxed">
          {label}:
        </span>
      )}
      <div className="flex-1 min-w-0 leading-relaxed">{renderValue(value, 0, compact)}</div>
    </div>
  );
}

/**
 * Render a full data object as a labeled list
 * Handles invalid JSON gracefully
 */
export function DetailList({ data, compact = false }: DetailListProps) {
  // Parse if string
  const parsed = parseMaybeJson(data);

  // If still a string (invalid JSON), show as wrapped text
  if (typeof parsed === "string") {
    return (
      <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground break-words">
        {parsed}
      </div>
    );
  }

  // If not a record, render directly
  if (!isRecord(parsed)) {
    return <div className="text-xs">{renderValue(parsed, 0, compact)}</div>;
  }

  // Render as labeled list
  return (
    <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
      {Object.entries(parsed).map(([key, value]) => (
        <DetailValue key={key} label={humanizeKey(key)} value={value} compact={compact} />
      ))}
    </div>
  );
}
