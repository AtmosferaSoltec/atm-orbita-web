import type { Component } from 'svelte';
import type { LucideProps } from '@lucide/svelte';

export type IconComponent = Component<LucideProps>;

/** Semantic colors of the design system, used by badges, icons and stats. */
export type Tone = 'primary' | 'income' | 'expense' | 'neutral' | 'transfer' | 'orange' | 'violet';

export const TONE_SOFT: Record<Tone, string> = {
	primary: 'bg-primary-soft text-primary',
	income: 'bg-income-soft text-income-strong',
	expense: 'bg-expense-soft text-expense-strong',
	neutral: 'bg-neutral-soft text-neutral',
	transfer: 'bg-transfer-soft text-transfer',
	orange: 'bg-orange-soft text-orange-strong',
	violet: 'bg-violet-soft text-violet'
};

export const TONE_TEXT: Record<Tone, string> = {
	primary: 'text-primary',
	income: 'text-income-strong',
	expense: 'text-expense-strong',
	neutral: 'text-neutral',
	transfer: 'text-transfer',
	orange: 'text-orange-strong',
	violet: 'text-violet'
};

export const TONE_FILL: Record<Tone, string> = {
	primary: 'bg-primary',
	income: 'bg-income',
	expense: 'bg-expense',
	neutral: 'bg-neutral',
	transfer: 'bg-transfer',
	orange: 'bg-orange',
	violet: 'bg-violet'
};
