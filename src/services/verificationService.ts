import { api } from './api';

/**
 * Verification Service - Handles phone verification and OTP flows
 * Uses Twilio for SMS delivery
 */
export class VerificationService {
  private static readonly API_BASE = '/api/verification';

  /**
   * Send OTP to phone number via Twilio
   */
  static async sendOTP(phoneNumber: string): Promise<{ success: boolean; message: string }> {
    try {
      // Normalize phone number
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      
      const response = await api.post<{ success: boolean; message: string }>(`${this.API_BASE}/send-otp`, {
        phoneNumber: normalizedPhone,
      });

      return response;
    } catch (error) {
      console.error('Failed to send OTP:', error);
      throw error;
    }
  }

  /**
   * Verify OTP code
   */
  static async verifyOTP(phoneNumber: string, code: string): Promise<{ verified: boolean; token?: string }> {
    try {
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      
      const response = await api.post<{ verified: boolean; token?: string }>(`${this.API_BASE}/verify-otp`, {
        phoneNumber: normalizedPhone,
        code,
      });

      return response;
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      throw error;
    }
  }

  /**
   * Resend OTP to phone number
   */
  static async resendOTP(phoneNumber: string): Promise<{ success: boolean; message: string }> {
    try {
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      
      const response = await api.post<{ success: boolean; message: string }>(`${this.API_BASE}/resend-otp`, {
        phoneNumber: normalizedPhone,
      });

      return response;
    } catch (error) {
      console.error('Failed to resend OTP:', error);
      throw error;
    }
  }

  /**
   * Normalize phone number to international format
   * @param phoneNumber - Phone number in any format
   * @returns Normalized phone number with + prefix
   */
  static normalizePhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle Indian numbers (10 digits)
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    
    // Handle numbers with country code
    if (cleaned.length >= 12) {
      return `+${cleaned}`;
    }
    
    // Handle numbers that might already have country code
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }
    
    // Default case - assume Indian number
    return `+91${cleaned}`;
  }

  /**
   * Format phone number for display
   */
  static formatPhoneForDisplay(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    
    if (cleaned.length >= 10) {
      const countryCode = cleaned.slice(0, cleaned.length - 10);
      const localPart = cleaned.slice(-10);
      return `+${countryCode} ${localPart.slice(0, 5)} ${localPart.slice(5)}`;
    }
    
    return phoneNumber;
  }

  /**
   * Validate phone number format
   */
  static isValidPhoneNumber(phoneNumber: string): boolean {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  /**
   * Get the OTP expiry time in seconds (usually 5-10 minutes)
   */
  static getOTPExpiryTime(): number {
    return 5 * 60; // 5 minutes
  }
}
