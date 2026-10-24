/** Shared look of text inputs and selects: 52 high, radius 14, thin border (ORBITA_SPEC §5). */
export const FIELD_BOX =
	'flex h-[52px] w-full items-center gap-2 rounded-field border bg-surface px-4 transition-colors focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10';

export function fieldBorder(error?: string | null): string {
	return error ? 'border-expense' : 'border-outline hover:border-chip-border';
}

export const FIELD_INPUT =
	'h-full w-full min-w-0 bg-transparent text-[15px] font-semibold text-ink outline-none placeholder:font-medium placeholder:text-muted-light';
