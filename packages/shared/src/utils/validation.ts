const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function isValidPassword(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}

export function getPasswordValidationErrors(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[a-z]/.test(password)) errors.push('Password must contain a lowercase letter');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain an uppercase letter');
  if (!/\d/.test(password)) errors.push('Password must contain a number');
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password))
    errors.push('Password must contain a special character');
  return errors;
}

export function isValidFileType(
  filename: string,
  allowedExtensions: string[],
): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return allowedExtensions.includes(ext);
}

export function isValidFileSize(sizeBytes: number, maxSizeMB: number): boolean {
  return sizeBytes <= maxSizeMB * 1024 * 1024;
}
