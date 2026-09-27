/**
 * MyWallet — UPI Intent & Deep-Linking Utility (Phase 17)
 * 
 * Implements NPCI UPI Linking Specification (upi://pay):
 * - pa: Payee VPA / UPI ID (e.g. rahul@okaxis, 9876543210@paytm)
 * - pn: Payee Name
 * - am: Transaction Amount in INR (formatted to 2 decimal places)
 * - cu: Currency code (strictly 'INR')
 * - tn: Transaction Note / Description
 * - tr: Optional Transaction Reference ID
 * 
 * Works across all NPCI-compliant UPI applications:
 * Google Pay, PhonePe, Paytm, CRED, BHIM, Amazon Pay, etc.
 */

import { Linking, Platform } from 'react-native';

export interface UpiPaymentParams {
  upiId: string;
  payeeName?: string;
  amount?: number;
  note?: string;
  transactionRef?: string;
}

export interface UpiLaunchResult {
  success: boolean;
  url: string;
  error?: string;
}

/**
 * Common Indian bank UPI handle suffixes for quick autocomplete chips
 */
export const COMMON_UPI_HANDLES = [
  '@okaxis',     // Google Pay (Axis)
  '@okhdfcbank', // Google Pay (HDFC)
  '@oksbi',      // Google Pay (SBI)
  '@okicici',    // Google Pay (ICICI)
  '@paytm',      // Paytm Payments Bank / Wallet
  '@ybl',        // PhonePe (Yes Bank)
  '@ibl',        // PhonePe (ICICI Bank)
  '@axl',        // PhonePe (Axis Bank)
  '@apl',        // Amazon Pay
] as const;

/**
 * Regex for standard NPCI UPI Virtual Payment Address (VPA)
 * Allows alphanumeric characters, dots, hyphens, and underscores before '@',
 * followed by a bank handle of 2-64 alphabetic characters.
 */
export const UPI_ID_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

/**
 * Validates whether the given string is a valid UPI VPA format.
 */
export function validateUpiId(upiId: string | null | undefined): boolean {
  if (!upiId) return false;
  const trimmed = upiId.trim();
  return UPI_ID_REGEX.test(trimmed);
}

/**
 * Normalizes a UPI ID (trims whitespace and converts handle to lowercase).
 */
export function normalizeUpiId(upiId: string): string {
  const trimmed = upiId.trim();
  const atIdx = trimmed.indexOf('@');
  if (atIdx === -1) return trimmed;
  const username = trimmed.substring(0, atIdx);
  const handle = trimmed.substring(atIdx).toLowerCase();
  return `${username}${handle}`;
}

/**
 * Constructs a compliant NPCI `upi://pay` deep link URL.
 */
export function buildUpiUrl(params: UpiPaymentParams): string {
  const cleanUpiId = normalizeUpiId(params.upiId);
  const cleanPayee = (params.payeeName || 'Friend').trim();
  const cleanNote = (params.note || 'Debt Repayment').trim().slice(0, 80); // NPCI note limit ~80 chars

  const queryParts: string[] = [
    `pa=${encodeURIComponent(cleanUpiId)}`,
    `pn=${encodeURIComponent(cleanPayee)}`,
    `cu=INR`,
    `tn=${encodeURIComponent(cleanNote)}`,
  ];

  if (params.amount !== undefined && params.amount > 0) {
    // Format to 2 decimal places per NPCI spec (e.g. 500.00)
    queryParts.push(`am=${params.amount.toFixed(2)}`);
  }

  if (params.transactionRef) {
    queryParts.push(`tr=${encodeURIComponent(params.transactionRef)}`);
  }

  return `upi://pay?${queryParts.join('&')}`;
}

/**
 * Checks whether the host device can handle a `upi://pay` intent.
 * Note: On Android 11+ (API 30+), canOpenURL may return false if package visibility
 * is restricted, but openURL may still succeed by delegating to Android's system chooser.
 */
export async function isUpiSupported(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return await Linking.canOpenURL('upi://pay');
  } catch {
    return false;
  }
}

/**
 * Launches the device's default UPI application or presents the system app chooser
 * (Google Pay, PhonePe, Paytm, CRED, BHIM) with pre-filled payment details.
 */
export async function launchUpiPayment(params: UpiPaymentParams): Promise<UpiLaunchResult> {
  const url = buildUpiUrl(params);

  if (Platform.OS === 'web') {
    return {
      success: false,
      url,
      error: 'UPI Quick Pay deep-linking is supported on mobile devices.',
    };
  }

  try {
    await Linking.openURL(url);
    return { success: true, url };
  } catch (err: any) {
    console.warn('Failed to launch UPI intent via Linking.openURL:', err);
    return {
      success: false,
      url,
      error:
        err?.message ||
        'No compatible UPI application found. Please ensure Google Pay, PhonePe, or Paytm is installed.',
    };
  }
}
