import CryptoJS from 'crypto-js';

export class EncryptionService {
  private key: string;

  constructor(encryptionKey: string) {
    this.key = encryptionKey;
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(text: string): string {
    if (!text) return '';
    
    try {
      const encrypted = CryptoJS.AES.encrypt(text, this.key).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) return '';
    
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedText, this.key);
      const originalText = decrypted.toString(CryptoJS.enc.Utf8);
      return originalText;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt object data
   */
  encryptObject<T>(obj: T): string {
    const jsonString = JSON.stringify(obj);
    return this.encrypt(jsonString);
  }

  /**
   * Decrypt object data
   */
  decryptObject<T>(encryptedData: string): T {
    const decryptedString = this.decrypt(encryptedData);
    return JSON.parse(decryptedString);
  }

  /**
   * Hash data for comparison (one-way)
   */
  hash(text: string): string {
    return CryptoJS.SHA256(text).toString();
  }

  /**
   * Generate a secure random string
   */
  generateSecureId(): string {
    return CryptoJS.lib.WordArray.random(16).toString();
  }
} 