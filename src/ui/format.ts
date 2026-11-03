/** Numbers the Lifter reads: pt-BR decimal comma, no trailing zeroes. */
export function formatNumber(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return String(rounded).replace(".", ",");
}

export function formatKg(value: number): string {
  return `${formatNumber(value)} kg`;
}
