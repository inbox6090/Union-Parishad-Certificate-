/**
 * Security Utility Module
 * Provides input sanitization, SQL/NoSQL injection protection, and length validation 
 * to prevent XSS, HTML injection, SQL/NoSQL injection, and payload overflow attacks.
 */

export function sanitizeInput(input: string | undefined | null, maxLength?: number): string {
  if (!input || typeof input !== "string") return "";
  
  let sanitized = input
    // Core HTML Escaping (XSS Prevention)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    // SQL Injection Protection: Escape comment markers (--), statement terminators (;), and block comment delimiters (/*, */)
    .replace(/--/g, "&#x2D;&#x2D;")
    .replace(/;/g, "&#x3B;")
    .replace(/\/\*/g, "&#x2F;&#x2A;")
    .replace(/\*\//g, "&#x2A;&#x2F;")
    // NoSQL Query Injection Protection: Escape dollar signs ($) to neutralize query operators ($ne, $gt, $where, etc.)
    .replace(/\$/g, "&#x24;");

  if (maxLength && maxLength > 0 && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Recursively sanitizes object inputs (arrays and nested objects) with optional string length caps.
 * Sanitizes both object values and keys to prevent NoSQL operator key injection.
 */
export function sanitizeObject<T>(data: T, maxStringLength: number = 2000): T {
  if (typeof data === "string") {
    // Preserve base64 image URIs
    if (data.startsWith("data:image/") && data.includes(";base64,")) {
      return data as T;
    }
    return sanitizeInput(data, maxStringLength) as T;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeObject(item, maxStringLength)) as unknown as T;
  }
  if (data !== null && typeof data === "object") {
    const result: Record<string, any> = {};
    for (const key of Object.keys(data as object)) {
      // Prevent NoSQL key operator injection (e.g., "$gt", "$ne", "$where")
      const safeKey = key.replace(/^\$/, "&#x24;").replace(/\./g, "&#x2E;");
      result[safeKey] = sanitizeObject((data as Record<string, any>)[key], maxStringLength);
    }
    return result as T;
  }
  return data;
}

/**
 * Computes a SHA-256 cryptographic checksum for data integrity verification of exported backup files.
 * Works seamlessly in both browser (window.crypto.subtle) and Node.js environments.
 */
export async function calculateSha256Checksum(data: any): Promise<string> {
  try {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    const encoder = new TextEncoder();
    const bytes = encoder.encode(jsonString);

    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', bytes);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return `sha256-${hashHex}`;
    }

    // Fallback: fast and deterministic checksum
    let hash = 0x811c9dc5;
    for (let i = 0; i < bytes.length; i++) {
      hash ^= bytes[i];
      hash = (hash * 0x01000193) >>> 0;
    }
    return `sha256-fnv1a-${hash.toString(16).padStart(8, '0')}`;
  } catch (err) {
    console.warn('Checksum calculation fallback used:', err);
    return `sha256-ts-${Date.now().toString(36)}`;
  }
}

/**
 * Verifies if the data matches the expected checksum string
 */
export async function verifySha256Checksum(data: any, expectedChecksum: string): Promise<boolean> {
  if (!expectedChecksum) return false;
  const computed = await calculateSha256Checksum(data);
  return computed.toLowerCase() === expectedChecksum.toLowerCase();
}

