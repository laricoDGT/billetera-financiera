/**
 * Calculate the next due date based on frequency
 */
export function calculateNextDueDate(currentDueDate: Date, frequency: string): Date {
    const next = new Date(currentDueDate);

    switch (frequency) {
        case 'weekly':
            next.setDate(next.getDate() + 7);
            break;
        case 'monthly':
            // Handle month-end edge cases
            const currentDay = currentDueDate.getDate();
            next.setMonth(next.getMonth() + 1);

            // If the day changed (e.g., Jan 31 -> Feb 28), set to last day of month
            if (next.getDate() !== currentDay) {
                next.setDate(0); // Go to last day of previous month
            }
            break;
        case 'yearly':
            next.setFullYear(next.getFullYear() + 1);

            // Handle leap year edge case (Feb 29)
            if (currentDueDate.getMonth() === 1 && currentDueDate.getDate() === 29) {
                // If next year is not a leap year, set to Feb 28
                if (!isLeapYear(next.getFullYear())) {
                    next.setDate(28);
                }
            }
            break;
        default: // 'once'
            return currentDueDate;
    }

    return next;
}

/**
 * Check if a year is a leap year
 */
function isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Format date to YYYY-MM-DD for database storage
 */
export function formatDateForDB(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
