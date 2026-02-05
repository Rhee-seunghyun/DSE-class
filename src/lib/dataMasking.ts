 /**
  * Data masking utilities for protecting sensitive personal information
  * Used in dashboard views to prevent bulk data harvesting
  */
 
 /**
  * Masks an email address, showing only first 2 characters and domain
  * @example "user@example.com" -> "us****@example.com"
  */
 export function maskEmail(email: string | null | undefined): string {
   if (!email) return '';
   
   const parts = email.split('@');
   if (parts.length !== 2) return '****';
   
   const localPart = parts[0];
   const domainPart = parts[1];
   
   if (localPart.length <= 2) {
     return `****@${domainPart}`;
   }
   
   return `${localPart.substring(0, 2)}****@${domainPart}`;
 }
 
 /**
  * Masks a license number, showing only last 4 characters
  * @example "12345678" -> "****5678"
  */
 export function maskLicenseNumber(license: string | null | undefined): string {
   if (!license) return '';
   
   if (license.length <= 4) {
     return '****';
   }
   
   return `****${license.slice(-4)}`;
 }
 
 /**
  * Masks a phone number, showing only last 4 digits
  * @example "010-1234-5678" -> "****-****-5678"
  */
 export function maskPhoneNumber(phone: string | null | undefined): string {
   if (!phone) return '';
   
   // Remove all non-digit characters to get the last 4 digits
   const digitsOnly = phone.replace(/\D/g, '');
   
   if (digitsOnly.length <= 4) {
     return '****';
   }
   
   const lastFour = digitsOnly.slice(-4);
   return `****-****-${lastFour}`;
 }
 
 /**
  * Masks a name, showing only first character and asterisks
  * @example "홍길동" -> "홍**"
  */
 export function maskName(name: string | null | undefined): string {
   if (!name) return '';
   
   if (name.length <= 1) {
     return name;
   }
   
   return name.charAt(0) + '*'.repeat(name.length - 1);
 }