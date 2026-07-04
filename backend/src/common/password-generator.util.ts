import * as crypto from 'crypto';

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SPECIAL = '!@#$%^&*()_+-=';
const ALL = UPPERCASE + LOWERCASE + NUMBERS + SPECIAL;

/**
 * Generates a secure temporary password with at least:
 * - 10 characters
 * - 1 uppercase, 1 lowercase, 1 number, 1 special character
 */
export function generatePassword(length = 12): string {
  const password: string[] = [];

  // Ensure at least one of each required type
  password.push(UPPERCASE[crypto.randomInt(UPPERCASE.length)]);
  password.push(LOWERCASE[crypto.randomInt(LOWERCASE.length)]);
  password.push(NUMBERS[crypto.randomInt(NUMBERS.length)]);
  password.push(SPECIAL[crypto.randomInt(SPECIAL.length)]);

  // Fill remaining length
  for (let i = password.length; i < length; i++) {
    password.push(ALL[crypto.randomInt(ALL.length)]);
  }

  // Shuffle
  for (let i = password.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join('');
}
