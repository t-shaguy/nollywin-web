/**
 * Utility for generating human-readable summaries of change requests
 * Used by the approvals preview drawer
 */

import type { ChangeRequest } from "@/lib/api/admin";

/**
 * Generate a concise, human-readable summary of a change request
 * 
 * @param request - The change request to summarize
 * @returns A plain-English summary suitable for preview UI
 * 
 * @example
 * summarizeChangeRequest(triviaQuestionCreateRequest)
 * // Returns: "Create trivia question"
 * 
 * summarizeChangeRequest(packageUpdateRequest)
 * // Returns: "Update package: Daily Plan (₦500)"
 */
export function summarizeChangeRequest(request: ChangeRequest): string {
  const action = humanizeAction(request.action);
  const resourceType = humanizeResourceType(request.resourceType);
  
  // Parse request body to extract key identifying fields
  let details = "";
  try {
    if (!request.requestBody) {
      // No body to parse
      return `${action} ${resourceType}`;
    }
    const body = JSON.parse(request.requestBody);
    
    // Extract identifying details based on resource type
    switch (request.resourceType) {
      case "triviaQuestion":
        if (body.questionText) {
          const truncated = body.questionText.length > 50 
            ? body.questionText.substring(0, 50) + "..." 
            : body.questionText;
          details = `: "${truncated}"`;
        }
        break;
        
      case "triviaCategory":
        if (body.name) {
          details = `: ${body.name}`;
        }
        break;
        
      case "triviaStage":
        if (body.name) {
          details = `: ${body.name}`;
        }
        break;
        
      case "triviaPrize":
      case "raffleDraw":
        if (body.stageName || body.description) {
          const parts = [];
          if (body.stageName) parts.push(body.stageName);
          if (body.description) parts.push(body.description);
          details = `: ${parts.join(" - ")}`;
        } else if (body.prizeName) {
          // For raffleDraw
          details = `: ${body.prizeName}`;
        }
        break;
        
      case "subscriptionPackage":
      case "package":
        const pkgParts = [];
        if (body.name) pkgParts.push(body.name);
        if (body.fee !== undefined) {
          const fee = typeof body.fee === 'number' ? body.fee : parseFloat(String(body.fee));
          if (!isNaN(fee)) {
            pkgParts.push(`₦${fee.toLocaleString()}`);
          }
        }
        if (pkgParts.length > 0) {
          details = `: ${pkgParts.join(" (")}${pkgParts.length > 1 ? ")" : ""}`;
        }
        break;
      
      case "RaffleWinner":
        // V39: Handle REDEEM and FULFIL actions
        const parts = [];
        
        // Extract bank details for REDEEM actions
        if (body.bankName || body.accountNumber) {
          const bankDetails = [];
          if (body.bankName) bankDetails.push(body.bankName);
          if (body.accountNumber) {
            // Show only last 4 digits
            const accNum = String(body.accountNumber);
            const masked = accNum.length > 4 ? '****' + accNum.slice(-4) : accNum;
            bankDetails.push(masked);
          }
          if (bankDetails.length > 0) parts.push(bankDetails.join(' '));
        }
        
        // Extract delivery address for REDEEM actions
        if (body.deliveryAddress) {
          const addr = String(body.deliveryAddress);
          const truncated = addr.length > 40 ? addr.substring(0, 40) + '...' : addr;
          parts.push(truncated);
        }
        
        // Extract payout reference for FULFIL actions
        if (body.payoutReference) {
          parts.push(`Ref: ${body.payoutReference}`);
        }
        
        // Extract fulfilled date
        if (body.fulfilledOn) {
          parts.push(`on ${body.fulfilledOn}`);
        }
        
        // Show attached file indicator
        if (request.hasFile) {
          parts.push('Attached file: Yes');
        }
        
        if (parts.length > 0) {
          details = `: ${parts.join(', ')}`;
        }
        break;
        
      case "tokenExchangeRate":
        if (body.koboPerToken !== undefined) {
          const kobo = typeof body.koboPerToken === 'number' 
            ? body.koboPerToken 
            : parseFloat(String(body.koboPerToken));
          if (!isNaN(kobo)) {
            details = `: ₦${(kobo / 100).toFixed(2)} per token`;
          }
        }
        break;
        
      case "gameSetting":
        if (body.timePerQuestionSeconds !== undefined) {
          details = `: ${body.timePerQuestionSeconds}s per question`;
        }
        break;
        
      default:
        // Generic fallback: try to find a "name" or "title" field
        if (body.name) {
          details = `: ${body.name}`;
        } else if (body.title) {
          details = `: ${body.title}`;
        }
    }
  } catch {
    // If JSON parsing fails, just use base summary
  }
  
  return `${action} ${resourceType}${details}`;
}

/**
 * Convert camelCase to Title Case
 * @example "triviaQuestion" → "Trivia Question"
 * @example "RaffleWinner" → "Winner"
 */
function humanizeResourceType(resourceType: string): string {
  // Special case for raffleDraw -> "Draw"
  if (resourceType.toLowerCase() === 'raffledraw') {
    return 'Draw';
  }
  
  // Special case for RaffleWinner -> "Winner"
  if (resourceType.toLowerCase() === 'rafflewinner') {
    return 'Winner';
  }
  
  return resourceType
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert action string to readable format
 * @example "CREATE" → "Create"
 * @example "REDEEM" → "Redeem (claim details)"
 * @example "FULFIL" → "Fulfil (payout or handover)"
 */
function humanizeAction(action: string): string {
  const upperAction = action.toUpperCase();
  switch (upperAction) {
    case "CREATE": return "Create";
    case "UPDATE": return "Update";
    case "DELETE": return "Delete";
    case "CLOSE": return "Close";
    case "APPROVE": return "Approve";
    case "REDEEM": return "Redeem (claim details)";
    case "FULFIL": return "Fulfil (payout or handover)";
    default: 
      // Capitalize first letter of original action
      return action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
  }
}
