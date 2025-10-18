import { DateRangeFilter } from "../types/search-params";

/**
 * Get date range based on preset or custom dates
 */
export function getDateRange(filter: DateRangeFilter): {
  startDate: Date | null;
  endDate: Date | null;
} {
  const now = new Date();

  switch (filter.preset) {
    case "all":
      return { startDate: null, endDate: null };

    case "lastWeek": {
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      return { startDate, endDate: now };
    }

    case "lastMonth": {
      const startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
      return { startDate, endDate: now };
    }

    case "custom": {
      const startDate = filter.startDate ? new Date(filter.startDate) : null;
      const endDate = filter.endDate ? new Date(filter.endDate) : null;

      if (startDate) {
        startDate.setHours(0, 0, 0, 0);
      }
      if (endDate) {
        endDate.setHours(23, 59, 59, 999);
      }

      return { startDate, endDate };
    }

    default:
      return { startDate: null, endDate: null };
  }
}
