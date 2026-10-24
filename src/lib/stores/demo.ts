import { loans } from './loans.svelte';

/** Puts back the sample data of the modules that are still mockups (loans). */
export function resetDemoData(): void {
	loans.reset();
}
