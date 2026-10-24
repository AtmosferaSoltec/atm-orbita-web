import { loans } from './loans.svelte';
import { receipts } from './receipts.svelte';
import { services } from './services.svelte';

/** Puts back the sample data of the three modules. */
export function resetDemoData(): void {
	receipts.reset();
	loans.reset();
	services.reset();
}
