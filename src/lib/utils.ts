import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Display name of a note: its file name, or "Untitled" when blank */
export function cleanTitle(title: string | undefined): string {
  return title?.replace(/\u00A0/g, " ").trim() || "Untitled";
}
