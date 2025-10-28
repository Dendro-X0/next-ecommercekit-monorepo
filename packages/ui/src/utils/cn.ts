import clsx from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge conditional className inputs with Tailwind-aware join.
 */
export function cn(...inputs: ReadonlyArray<string | false | null | undefined>): string {
  return twMerge(clsx(inputs))
}
