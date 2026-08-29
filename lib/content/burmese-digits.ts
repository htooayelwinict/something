const digits = ["၀", "၁", "၂", "၃", "၄", "၅", "၆", "၇", "၈", "၉"];

/** Replace ASCII digits with Myanmar digits for Burmese-first display. */
export function toBurmeseDigits(value: number | string): string {
  return String(value).replace(/\d/g, (digit) => digits[Number(digit)]);
}
