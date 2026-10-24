import type { MonthStatus, ServiceStatus } from '#lib/domain/services.ts';
import type { Tone } from '../ui/types';

export const SERVICE_STATUS: Record<ServiceStatus, { label: string; tone: Tone }> = {
	active: { label: 'Activo', tone: 'income' },
	paused: { label: 'Pausado', tone: 'orange' },
	cancelled: { label: 'Cancelado', tone: 'neutral' }
};

export const MONTH_STATUS: Record<MonthStatus, { label: string; class: string }> = {
	paid: { label: 'Pagado', class: 'bg-income-soft text-income-strong border-transparent' },
	owed: { label: 'Debe', class: 'bg-expense-soft text-expense-strong border-transparent' },
	upcoming: { label: 'Aún no vence', class: 'bg-surface text-muted border-outline border-dashed' }
};
