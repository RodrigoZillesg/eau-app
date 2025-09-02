import { supabase } from '../lib/supabase/client';

// SecurePay configuration
const SECUREPAY_CONFIG = {
  merchantId: process.env.VITE_SECUREPAY_MERCHANT_ID || '',
  publicKey: process.env.VITE_SECUREPAY_PUBLIC_KEY || '',
  apiUrl: process.env.VITE_SECUREPAY_API_URL || 'https://api.securepay.com.au/v2',
  testMode: process.env.VITE_SECUREPAY_TEST_MODE === 'true'
};

export interface SecurePayPayment {
  amount: number; // In cents
  currency: string;
  merchantCode: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  description: string;
}

export interface SecurePayResponse {
  success: boolean;
  transactionId?: string;
  paymentReference?: string;
  receiptNumber?: string;
  cardType?: string;
  cardLast4?: string;
  errorMessage?: string;
  errorCode?: string;
}

export interface SecurePayCardDetails {
  cardNumber: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

export class SecurePayService {
  /**
   * Initialize SecurePay payment for event registration
   */
  static async initializePayment(
    registrationId: string,
    amount: number,
    eventTitle: string,
    userEmail: string,
    userName: string
  ): Promise<SecurePayResponse> {
    try {
      // Generate unique order number
      const orderNumber = `REG-${registrationId.substring(0, 8).toUpperCase()}`;
      
      // In production, this would call SecurePay's API
      // For now, we'll simulate the response
      if (SECUREPAY_CONFIG.testMode) {
        // Simulate test payment
        return this.simulateTestPayment(orderNumber, amount);
      }
      
      // Production payment flow would go here
      const paymentData: SecurePayPayment = {
        amount,
        currency: 'AUD',
        merchantCode: SECUREPAY_CONFIG.merchantId,
        orderNumber,
        customerEmail: userEmail,
        customerName: userName,
        description: `Registration for ${eventTitle}`
      };
      
      // This would make actual API call to SecurePay
      // const response = await fetch(`${SECUREPAY_CONFIG.apiUrl}/payments`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${SECUREPAY_CONFIG.publicKey}`
      //   },
      //   body: JSON.stringify(paymentData)
      // });
      
      // For now, return test response
      return this.simulateTestPayment(orderNumber, amount);
    } catch (error: any) {
      console.error('SecurePay initialization error:', error);
      return {
        success: false,
        errorMessage: error.message || 'Failed to initialize payment',
        errorCode: 'INIT_ERROR'
      };
    }
  }

  /**
   * Process card payment
   */
  static async processCardPayment(
    registrationId: string,
    amount: number,
    cardDetails: SecurePayCardDetails,
    eventTitle: string,
    userEmail: string,
    userName: string
  ): Promise<SecurePayResponse> {
    try {
      // Validate card details
      if (!this.validateCardDetails(cardDetails)) {
        return {
          success: false,
          errorMessage: 'Invalid card details',
          errorCode: 'INVALID_CARD'
        };
      }
      
      // Initialize payment first
      const initResponse = await this.initializePayment(
        registrationId,
        amount,
        eventTitle,
        userEmail,
        userName
      );
      
      if (!initResponse.success) {
        return initResponse;
      }
      
      // In production, this would tokenize card and process payment
      // For now, simulate successful payment
      const response = await this.simulateCardPayment(
        cardDetails,
        amount,
        initResponse.paymentReference!
      );
      
      // Update registration with payment details
      if (response.success) {
        await this.updateRegistrationPayment(registrationId, response);
      }
      
      return response;
    } catch (error: any) {
      console.error('SecurePay payment error:', error);
      return {
        success: false,
        errorMessage: error.message || 'Payment processing failed',
        errorCode: 'PAYMENT_ERROR'
      };
    }
  }

  /**
   * Verify payment status
   */
  static async verifyPayment(transactionId: string): Promise<SecurePayResponse> {
    try {
      // In production, this would call SecurePay's verification API
      // For now, return test response
      if (SECUREPAY_CONFIG.testMode) {
        return {
          success: true,
          transactionId,
          paymentReference: `PAY-${Date.now()}`,
          receiptNumber: `REC-${Date.now()}`
        };
      }
      
      // Production verification would go here
      // const response = await fetch(`${SECUREPAY_CONFIG.apiUrl}/payments/${transactionId}`, {
      //   headers: {
      //     'Authorization': `Bearer ${SECUREPAY_CONFIG.publicKey}`
      //   }
      // });
      
      return {
        success: true,
        transactionId
      };
    } catch (error: any) {
      console.error('SecurePay verification error:', error);
      return {
        success: false,
        errorMessage: error.message || 'Payment verification failed',
        errorCode: 'VERIFY_ERROR'
      };
    }
  }

  /**
   * Process refund
   */
  static async processRefund(
    transactionId: string,
    amount: number,
    reason: string
  ): Promise<SecurePayResponse> {
    try {
      // In production, this would call SecurePay's refund API
      if (SECUREPAY_CONFIG.testMode) {
        return {
          success: true,
          transactionId: `REFUND-${transactionId}`,
          paymentReference: `REF-${Date.now()}`
        };
      }
      
      // Production refund would go here
      // const response = await fetch(`${SECUREPAY_CONFIG.apiUrl}/refunds`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${SECUREPAY_CONFIG.publicKey}`
      //   },
      //   body: JSON.stringify({
      //     transactionId,
      //     amount,
      //     reason
      //   })
      // });
      
      return {
        success: true,
        transactionId: `REFUND-${transactionId}`
      };
    } catch (error: any) {
      console.error('SecurePay refund error:', error);
      return {
        success: false,
        errorMessage: error.message || 'Refund processing failed',
        errorCode: 'REFUND_ERROR'
      };
    }
  }

  /**
   * Update registration with payment details
   */
  private static async updateRegistrationPayment(
    registrationId: string,
    paymentResponse: SecurePayResponse
  ): Promise<void> {
    try {
      const updateData: any = {
        payment_status: paymentResponse.success ? 'completed' : 'failed',
        payment_date: new Date().toISOString(),
        payment_method: 'card',
        securepay_transaction_id: paymentResponse.transactionId,
        securepay_payment_reference: paymentResponse.paymentReference,
        securepay_receipt_number: paymentResponse.receiptNumber,
        securepay_card_type: paymentResponse.cardType,
        securepay_card_last4: paymentResponse.cardLast4,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('event_registrations')
        .update(updateData)
        .eq('id', registrationId);
      
      if (error) {
        console.error('Failed to update registration payment:', error);
      }
    } catch (error) {
      console.error('Error updating registration payment:', error);
    }
  }

  /**
   * Validate card details
   */
  private static validateCardDetails(cardDetails: SecurePayCardDetails): boolean {
    // Basic validation
    const { cardNumber, cardholderName, expiryMonth, expiryYear, cvv } = cardDetails;
    
    // Remove spaces from card number
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    
    // Check card number length (13-19 digits)
    if (!/^\d{13,19}$/.test(cleanCardNumber)) {
      return false;
    }
    
    // Luhn algorithm validation
    if (!this.luhnCheck(cleanCardNumber)) {
      return false;
    }
    
    // Check cardholder name
    if (!cardholderName || cardholderName.length < 3) {
      return false;
    }
    
    // Check expiry
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    const expMonth = parseInt(expiryMonth);
    const expYear = parseInt(expiryYear);
    
    if (expMonth < 1 || expMonth > 12) {
      return false;
    }
    
    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      return false;
    }
    
    // Check CVV
    if (!/^\d{3,4}$/.test(cvv)) {
      return false;
    }
    
    return true;
  }

  /**
   * Luhn algorithm for card validation
   */
  private static luhnCheck(cardNumber: string): boolean {
    let sum = 0;
    let isEven = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  /**
   * Simulate test payment (for development)
   */
  private static async simulateTestPayment(
    orderNumber: string,
    amount: number
  ): Promise<SecurePayResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate different responses based on amount
    if (amount === 0) {
      return {
        success: true,
        transactionId: `TEST-TXN-${Date.now()}`,
        paymentReference: `TEST-REF-${Date.now()}`,
        receiptNumber: orderNumber
      };
    }
    
    // Simulate failure for amounts ending in 99
    if (amount % 100 === 99) {
      return {
        success: false,
        errorMessage: 'Test payment declined',
        errorCode: 'DECLINED'
      };
    }
    
    // Simulate success
    return {
      success: true,
      transactionId: `TEST-TXN-${Date.now()}`,
      paymentReference: `TEST-REF-${Date.now()}`,
      receiptNumber: orderNumber,
      cardType: 'Visa',
      cardLast4: '4242'
    };
  }

  /**
   * Simulate card payment (for development)
   */
  private static async simulateCardPayment(
    cardDetails: SecurePayCardDetails,
    amount: number,
    paymentReference: string
  ): Promise<SecurePayResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Get card type from number
    const cardType = this.getCardType(cardDetails.cardNumber);
    const last4 = cardDetails.cardNumber.slice(-4);
    
    // Test card numbers for different scenarios
    if (cardDetails.cardNumber.replace(/\s/g, '') === '4242424242424242') {
      // Success
      return {
        success: true,
        transactionId: `TEST-TXN-${Date.now()}`,
        paymentReference,
        receiptNumber: `REC-${Date.now()}`,
        cardType,
        cardLast4: last4
      };
    }
    
    if (cardDetails.cardNumber.replace(/\s/g, '') === '4000000000000002') {
      // Decline
      return {
        success: false,
        errorMessage: 'Card declined',
        errorCode: 'DECLINED'
      };
    }
    
    // Default success
    return {
      success: true,
      transactionId: `TEST-TXN-${Date.now()}`,
      paymentReference,
      receiptNumber: `REC-${Date.now()}`,
      cardType,
      cardLast4: last4
    };
  }

  /**
   * Get card type from card number
   */
  private static getCardType(cardNumber: string): string {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(cleanNumber)) return 'Visa';
    if (/^5[1-5]/.test(cleanNumber)) return 'Mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'Amex';
    if (/^6(?:011|5)/.test(cleanNumber)) return 'Discover';
    
    return 'Unknown';
  }
}