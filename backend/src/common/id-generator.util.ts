/**
 * Generates Employee Login ID in format: {PREFIX}{FN[0:2]}{LN[0:2]}{YEAR}{SERIAL:04d}
 * Example: OIJODO20250001
 */
export function generateLoginId(
  companyPrefix: string,
  firstName: string,
  lastName: string,
  joiningYear: number,
  sequence: number,
): string {
  const fn = firstName.toUpperCase().substring(0, 2).padEnd(2, 'X');
  const ln = lastName.toUpperCase().substring(0, 2).padEnd(2, 'X');
  const serial = sequence.toString().padStart(4, '0');
  return `${companyPrefix}${fn}${ln}${joiningYear}${serial}`;
}
