import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function langMatch(lang1: string, lang2: string): boolean {
    if (!lang1 || !lang2) return false;
    const l1 = lang1.split('-')[0].toLowerCase();
    const l2 = lang2.split('-')[0].toLowerCase();
    return l1 === l2;
}
