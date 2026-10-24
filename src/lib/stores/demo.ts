import { loans } from './loans.svelte';
import { services } from './services.svelte';

/** Puts back the sample data of the modules that are still mockups (loans, services). */
export function resetDemoData(): void {
	loans.reset();
	services.reset();
}
