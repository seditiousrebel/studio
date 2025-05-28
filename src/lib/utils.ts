
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { BillStatus, PromiseStatus } from "@/types";
import { format, parseISO, isValid as isValidDate } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

export function calculateAge(dateOfBirthString?: string | null): number | undefined {
  if (!dateOfBirthString) {
    return undefined;
  }
  try {
    const birthDate = new Date(dateOfBirthString.includes('T') ? dateOfBirthString : `${dateOfBirthString}T00:00:00Z`);
    if (!isValidDate(birthDate)) return undefined;
    const today = new Date();
    let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
    const monthDifference = today.getUTCMonth() - birthDate.getUTCMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getUTCDate() < birthDate.getUTCDate())) {
      age--;
    }
    return age > 0 ? age : (age === 0 ? 0 : undefined);
  } catch (e) {
    console.error("Error calculating age for:", dateOfBirthString, e);
    return undefined;
  }
}


export const getBillStatusBadgeClass = (status: BillStatus): string => {
  switch (status) {
    case 'Enacted': return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300 border-green-300 dark:border-green-600';
    case 'Passed House': case 'Passed Senate': return 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300 border-blue-300 dark:border-blue-600';
    case 'In Committee': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-600';
    case 'Proposed': return 'bg-purple-100 text-purple-700 dark:bg-purple-700/30 dark:text-purple-400 border-purple-300 dark:border-purple-600';
    case 'Failed': case 'Withdrawn': return 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300 border-red-300 dark:border-red-600';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300 border-gray-300 dark:border-gray-600';
  }
};

export const getPromiseStatusBadgeClass = (status: PromiseStatus): string => {
  switch (status) {
    case 'Fulfilled': return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300 border-green-300 dark:border-green-600';
    case 'In Progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300 border-blue-300 dark:border-blue-600';
    case 'Pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-600';
    case 'Broken': return 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300 border-red-300 dark:border-red-600';
    case 'Overdue': return 'bg-orange-100 text-orange-700 dark:bg-orange-700/30 dark:text-orange-400 border-orange-300 dark:border-orange-600';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300 border-gray-300 dark:border-gray-600';
  }
};

/**
 * Formats a date string into 'MMM d, yyyy' (e.g., "Jan 1, 2023").
 * Returns 'N/A' or a custom fallback if the date is invalid or not provided.
 * @param dateString The date string to format (ISO 8601 or compatible).
 * @param fallback The string to return if formatting fails.
 * @returns The formatted date string or the fallback.
 */
export function formatDate(dateString?: string | null, fallback: string = 'N/A'): string {
  if (!dateString) return fallback;
  try {
    const date = parseISO(dateString);
    if (isValidDate(date)) {
      return format(date, 'PPP'); // 'PPP' is locale-aware, e.g., "Jan 1st, 2023"
    }
    return fallback;
  } catch (e) {
    console.warn(`Error formatting date: ${dateString}`, e);
    return fallback;
  }
}
