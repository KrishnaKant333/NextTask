// client/src/utils/dateUtils.js
// Native date utilities for NextTask temporal views (zero heavy external libraries)

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Format a Date object into YYYY-MM-DD string in local timezone.
 */
export function formatDateISO(date) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a date matches today's local date.
 */
export function isToday(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * Formats a given year and month index into a human readable title.
 * e.g., formatMonthYear(2026, 8) => "September 2026"
 */
export function formatMonthYear(year, monthIndex) {
  return `${MONTH_NAMES[monthIndex]} ${year}`;
}

/**
 * Generates a complete 7x5 or 7x6 day matrix (35 or 42 cells) for a given month.
 * Includes leading days from previous month and trailing days from next month.
 *
 * @param {number} year - The full year (e.g. 2026)
 * @param {number} monthIndex - 0-indexed month (0 = Jan, 8 = Sep, 11 = Dec)
 * @returns {Array<Object>} Matrix of cell objects
 */
export function getMonthMatrix(year, monthIndex) {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon ...

  const daysInCurrentMonth = new Date(year, monthIndex + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, monthIndex, 0).getDate();

  const cells = [];

  // 1. Leading days from previous month
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevMonthDate = new Date(year, monthIndex - 1, dayNum);
    cells.push({
      date: prevMonthDate,
      dayNumber: dayNum,
      dateStr: formatDateISO(prevMonthDate),
      isCurrentMonth: false,
      isToday: isToday(prevMonthDate)
    });
  }

  // 2. Days in current month
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const currentDate = new Date(year, monthIndex, d);
    cells.push({
      date: currentDate,
      dayNumber: d,
      dateStr: formatDateISO(currentDate),
      isCurrentMonth: true,
      isToday: isToday(currentDate)
    });
  }

  // 3. Trailing days from next month to complete 35 or 42 grid cells
  const totalCellsNeeded = cells.length > 35 ? 42 : 35;
  const remainingCells = totalCellsNeeded - cells.length;

  for (let d = 1; d <= remainingCells; d++) {
    const nextMonthDate = new Date(year, monthIndex + 1, d);
    cells.push({
      date: nextMonthDate,
      dayNumber: d,
      dateStr: formatDateISO(nextMonthDate),
      isCurrentMonth: false,
      isToday: isToday(nextMonthDate)
    });
  }

  return cells;
}

/**
 * Formats an ISO date string (YYYY-MM-DD) or Date object into friendly format:
 * e.g., "Friday, September 18, 2026"
 */
export function formatFriendlyDate(dateInput) {
  if (!dateInput) return "";
  const [yearStr, monthStr, dayStr] =
    typeof dateInput === "string" && dateInput.includes("-")
      ? dateInput.split("-")
      : [null, null, null];

  let d;
  if (yearStr && monthStr && dayStr) {
    d = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));
  } else {
    d = new Date(dateInput);
  }
  if (isNaN(d.getTime())) return "";

  const dayName = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ][d.getDay()];
  const monthName = MONTH_NAMES[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();

  return `${dayName}, ${monthName} ${day}, ${year}`;
}

/**
 * Returns a concise relative label for an ISO date string:
 * "Today", "Tomorrow", "Yesterday", "In X days", or "X days overdue"
 */
export function getRelativeDateLabel(dateInput) {
  if (!dateInput) return "";
  const targetIso =
    typeof dateInput === "string" && dateInput.length === 10
      ? dateInput
      : formatDateISO(dateInput);
  if (!targetIso) return "";

  const now = new Date();
  const todayIso = formatDateISO(now);

  if (targetIso === todayIso) return "Today";

  const [y1, m1, d1] = todayIso.split("-").map(Number);
  const [y2, m2, d2] = targetIso.split("-").map(Number);

  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  const diffDays = Math.round((t2 - t1) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 1) return `In ${diffDays} days`;
  if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`;

  return "";
}

/**
 * Checks if a date is strictly before today's local date.
 */
export function isPastDate(dateInput) {
  if (!dateInput) return false;
  const targetIso =
    typeof dateInput === "string" && dateInput.length === 10
      ? dateInput
      : formatDateISO(dateInput);
  if (!targetIso) return false;

  const todayIso = formatDateISO(new Date());
  return targetIso < todayIso;
}

/**
 * Adds (or subtracts) a number of days to an ISO YYYY-MM-DD string,
 * returning a new ISO YYYY-MM-DD string.
 */
export function addDaysToDateISO(dateInput, days = 0) {
  if (!dateInput) return "";
  const iso =
    typeof dateInput === "string" && dateInput.length === 10
      ? dateInput
      : formatDateISO(dateInput);
  if (!iso) return "";

  const [y, m, d] = iso.split("-").map(Number);
  const targetDate = new Date(y, m - 1, d + days);
  return formatDateISO(targetDate);
}

export const TIMELINE_BUCKET_META = {
  overdue: {
    id: "overdue",
    label: "Overdue",
    description: "Past commitments requiring attention",
    badgeClass: "overdue"
  },
  today: {
    id: "today",
    label: "Today",
    description: "Commitments for today",
    badgeClass: "today"
  },
  tomorrow: {
    id: "tomorrow",
    label: "Tomorrow",
    description: "Commitments for tomorrow",
    badgeClass: "tomorrow"
  },
  this_week: {
    id: "this_week",
    label: "This Week",
    description: "Scheduled within the next 7 days",
    badgeClass: "this-week"
  },
  next_week: {
    id: "next_week",
    label: "Next Week",
    description: "Scheduled in 8 to 14 days",
    badgeClass: "next-week"
  },
  later: {
    id: "later",
    label: "Later",
    description: "Scheduled beyond 2 weeks",
    badgeClass: "later"
  },
  earlier: {
    id: "earlier",
    label: "Completed Earlier",
    description: "Past completed commitments",
    badgeClass: "earlier"
  }
};

export const TIMELINE_BUCKETS_ORDER = [
  "overdue",
  "today",
  "tomorrow",
  "this_week",
  "next_week",
  "later",
  "earlier"
];

/**
 * Classifies an ISO date string into a chronological timeline bucket.
 *
 * @param {string|Date} dateInput
 * @param {boolean} isCompleted
 * @returns {string} bucket id ('overdue' | 'today' | 'tomorrow' | 'this_week' | 'next_week' | 'later' | 'earlier')
 */
export function getTimelineBucket(dateInput, isCompleted = false) {
  if (!dateInput) return "later";
  const targetIso =
    typeof dateInput === "string" && dateInput.length === 10
      ? dateInput
      : formatDateISO(dateInput);
  if (!targetIso) return "later";

  const todayIso = formatDateISO(new Date());

  const [y1, m1, d1] = todayIso.split("-").map(Number);
  const [y2, m2, d2] = targetIso.split("-").map(Number);

  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  const diffDays = Math.round((t2 - t1) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return isCompleted ? "earlier" : "overdue";
  }
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays >= 2 && diffDays <= 7) return "this_week";
  if (diffDays >= 8 && diffDays <= 14) return "next_week";
  return "later";
}

