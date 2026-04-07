import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Custom URL validator that blocks private/internal IP addresses
 * to prevent SSRF (Server-Side Request Forgery) attacks.
 */
@ValidatorConstraint({ name: 'isSafeUrl', async: false })
export class IsSafeUrlConstraint implements ValidatorConstraintInterface {
  private readonly blockedPatterns = [
    /^https?:\/\/localhost/i,
    /^https?:\/\/127\./,
    /^https?:\/\/0\./,
    /^https?:\/\/10\./,
    /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./,
    /^https?:\/\/192\.168\./,
    /^https?:\/\/169\.254\./,           // AWS metadata
    /^https?:\/\/\[::1\]/,              // IPv6 localhost
    /^https?:\/\/\[fc/i,               // IPv6 private
    /^https?:\/\/\[fd/i,               // IPv6 private
    /^https?:\/\/\[fe80:/i,            // IPv6 link-local
    /^https?:\/\/metadata\./i,          // Cloud metadata
    /^https?:\/\/internal\./i,
  ];

  validate(url: string): boolean {
    if (!url || typeof url !== 'string') return false;

    // Must be http or https
    if (!/^https?:\/\//i.test(url)) return false;

    // Block private/internal URLs
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(url)) return false;
    }

    // Basic URL validity check
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'URL must be a valid public HTTP/HTTPS URL';
  }
}

export function IsSafeUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSafeUrlConstraint,
    });
  };
}
