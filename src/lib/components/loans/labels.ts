import type { InstallmentStatus, LoanStatus } from '#lib/domain/loans.ts';
import type { Tone } from '../ui/types';

export const LOAN_STATUS: Record<LoanStatus, { label: string; tone: Tone }> = {
	'not-started': { label: 'Aún no empieza', tone: 'neutral' },
	'on-track': { label: 'Al día', tone: 'income' },
	overdue: { label: 'Con atraso', tone: 'expense' },
	completed: { label: 'Pagado', tone: 'primary' }
};

export const INSTALLMENT_STATUS: Record<InstallmentStatus, { label: string; tone: Tone }> = {
	paid: { label: 'Pagada', tone: 'income' },
	partial: { label: 'Pago parcial', tone: 'transfer' },
	overdue: { label: 'Atrasada', tone: 'expense' },
	'due-soon': { label: 'Vence pronto', tone: 'orange' },
	upcoming: { label: 'Pendiente', tone: 'neutral' }
};
