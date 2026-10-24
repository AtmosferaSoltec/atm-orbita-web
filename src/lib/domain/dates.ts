// Dates travel as plain strings: days as `YYYY-MM-DD` and months as `YYYY-MM`.
// They are compared as strings, which works because of the fixed-width format.

export type IsoDate = string;
export type MonthKey = string;

const MONTHS_SHORT = [
	'ene',
	'feb',
	'mar',
	'abr',
	'may',
	'jun',
	'jul',
	'ago',
	'sep',
	'oct',
	'nov',
	'dic'
];

const MONTHS_LONG = [
	'Enero',
	'Febrero',
	'Marzo',
	'Abril',
	'Mayo',
	'Junio',
	'Julio',
	'Agosto',
	'Septiembre',
	'Octubre',
	'Noviembre',
	'Diciembre'
];

export const MONTH_INITIALS = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

function pad(value: number): string {
	return String(value).padStart(2, '0');
}

export function toIsoDate(date: Date): IsoDate {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayIso(): IsoDate {
	return toIsoDate(new Date());
}

export function parts(iso: IsoDate): { year: number; month: number; day: number } {
	const [year, month, day] = iso.split('-').map(Number);
	return { year, month, day: day ?? 1 };
}

export function isIsoDate(value: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const { year, month, day } = parts(value);
	return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
}

export function toMonthKey(iso: IsoDate): MonthKey {
	return iso.slice(0, 7);
}

export function monthKey(year: number, month: number): MonthKey {
	return `${year}-${pad(month)}`;
}

export function daysInMonth(year: number, month: number): number {
	return new Date(year, month, 0).getDate();
}

export function addMonths(key: MonthKey, count: number): MonthKey {
	const { year, month } = parts(key);
	const index = year * 12 + (month - 1) + count;
	return monthKey(Math.floor(index / 12), (index % 12) + 1);
}

export function addDays(iso: IsoDate, count: number): IsoDate {
	const { year, month, day } = parts(iso);
	return toIsoDate(new Date(year, month - 1, day + count));
}

/** Every month from `from` to `to`, both included. Empty if `from` is after `to`. */
export function monthRange(from: MonthKey, to: MonthKey): MonthKey[] {
	const result: MonthKey[] = [];
	for (let key = from; key <= to; key = addMonths(key, 1)) result.push(key);
	return result;
}

/** The date of `day` inside a month; if the month is shorter, its last day. */
export function dateInMonth(key: MonthKey, day: number): IsoDate {
	const { year, month } = parts(key);
	return `${key}-${pad(Math.min(day, daysInMonth(year, month)))}`;
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
	const a = parts(from);
	const b = parts(to);
	const utcA = Date.UTC(a.year, a.month - 1, a.day);
	const utcB = Date.UTC(b.year, b.month - 1, b.day);
	return Math.round((utcB - utcA) / 86_400_000);
}

/** `2 oct 2026` */
export function formatDate(iso: IsoDate): string {
	const { year, month, day } = parts(iso);
	return `${day} ${MONTHS_SHORT[month - 1]} ${year}`;
}

/** `2 oct` */
export function formatShortDate(iso: IsoDate): string {
	const { month, day } = parts(iso);
	return `${day} ${MONTHS_SHORT[month - 1]}`;
}

/** `Septiembre 2026` */
export function formatMonth(key: MonthKey): string {
	const { year, month } = parts(key);
	return `${MONTHS_LONG[month - 1]} ${year}`;
}

/** `sep 2026` */
export function formatMonthShort(key: MonthKey): string {
	const { year, month } = parts(key);
	return `${MONTHS_SHORT[month - 1]} ${year}`;
}

export function monthName(month: number): string {
	return MONTHS_LONG[month - 1];
}

export function monthShortName(month: number): string {
	return MONTHS_SHORT[month - 1];
}

/** `hoy`, `mañana`, `en 5 días`, `hace 3 días`. */
export function relativeDays(iso: IsoDate, today: IsoDate): string {
	const days = daysBetween(today, iso);
	if (days === 0) return 'hoy';
	if (days === 1) return 'mañana';
	if (days === -1) return 'ayer';
	if (days > 0) return `en ${days} días`;
	return `hace ${-days} días`;
}
