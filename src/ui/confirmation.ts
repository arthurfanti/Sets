/** The typed word that enables the only irreversible actions. */
export const DELETE_WORD = "apagar";

/** Case and stray spaces are forgiven; the word itself is not. */
export function confirmsDeletion(typed: string): boolean {
  return typed.trim().toLowerCase() === DELETE_WORD;
}
