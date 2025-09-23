export enum MessageType {
  TRANSACTION = 'transaction',
  SECURITY_ALERT = 'security_alert',
  TELECOM = 'telecom',
  PROMOTIONAL = 'promotional',
  OTP = 'otp',
  BALANCE_INQUIRY = 'balance_inquiry',
  OTHER = 'other'
}

export class MessageClassifier {
  
  static classifyMessage(messageBody: string): MessageType {
    const message = messageBody.toLowerCase();
    
    // Security alerts - highest priority
    if (this.isSecurityAlert(message)) {
      return MessageType.SECURITY_ALERT;
    }
    
    // OTP messages
    if (this.isOTP(message)) {
      return MessageType.OTP;
    }
    
    // Telecom messages
    if (this.isTelecom(message)) {
      return MessageType.TELECOM;
    }
    
    // Balance inquiry
    if (this.isBalanceInquiry(message)) {
      return MessageType.BALANCE_INQUIRY;
    }
    
    // Promotional messages
    if (this.isPromotional(message)) {
      return MessageType.PROMOTIONAL;
    }
    
    // Transaction messages
    if (this.isTransaction(message)) {
      return MessageType.TRANSACTION;
    }
    
    return MessageType.OTHER;
  }
  
  private static isSecurityAlert(message: string): boolean {
    const securityKeywords = [
      'never share', 'do not share', 'cooling period', 'security alert',
      'upi pin', 'cvv', 'fraud', 'suspicious', 'block', 'disable'
    ];
    return securityKeywords.some(keyword => message.includes(keyword));
  }
  
  private static isOTP(message: string): boolean {
    const otpKeywords = ['otp', 'verification code', 'verify', 'one time password'];
    const hasOtpKeyword = otpKeywords.some(keyword => message.includes(keyword));
    const hasNumbers = /\d{4,6}/.test(message); // 4-6 digit numbers
    return hasOtpKeyword && hasNumbers;
  }
  
  private static isTelecom(message: string): boolean {
    const telecomKeywords = [
      'data', 'gb', 'mb', 'plan', 'validity', 'recharge', 'balance',
      'jio', 'airtel', 'vi', 'bsnl', 'vodafone', 'talktime', 'sms'
    ];
    const telecomContext = ['usage', 'expires', 'validity', 'pack', 'unlimited'];
    
    const hasTelecomKeyword = telecomKeywords.some(keyword => message.includes(keyword));
    const hasTelecomContext = telecomContext.some(keyword => message.includes(keyword));
    
    return hasTelecomKeyword && hasTelecomContext;
  }
  
  private static isBalanceInquiry(message: string): boolean {
    const balanceKeywords = ['balance', 'available balance', 'current balance'];
    const inquiryKeywords = ['enquiry', 'inquiry', 'check', 'statement'];
    
    const hasBalance = balanceKeywords.some(keyword => message.includes(keyword));
    const hasInquiry = inquiryKeywords.some(keyword => message.includes(keyword));
    
    return hasBalance && hasInquiry;
  }
  
  private static isPromotional(message: string): boolean {
    const promoKeywords = [
      'offer', 'discount', 'sale', 'cashback', 'reward', 'gift',
      'limited time', 'hurry', 'click here', 'visit', 'download'
    ];
    return promoKeywords.some(keyword => message.includes(keyword));
  }
  
  private static isTransaction(message: string): boolean {
    // Must have transaction action
    const transactionActions = [
      'credited', 'debited', 'transferred', 'paid', 'withdrawn',
      'received', 'deposited', 'refund', 'purchase', 'sent'
    ];
    
    // Must have financial context
    const financialContext = [
      'account', 'upi', 'neft', 'rtgs', 'bank', 'atm', 'card'
    ];
    
    // Must have amount
    const hasAmount = /rs\.?\s*\d+|₹\s*\d+|inr\s*\d+/i.test(message);
    
    const hasAction = transactionActions.some(action => message.includes(action));
    const hasContext = financialContext.some(context => message.includes(context));
    
    return hasAction && hasContext && hasAmount;
  }
}