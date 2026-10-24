// The validation/notice bar of the Android app: one message at a time, a new one replaces it.

export type ToastTone = 'info' | 'success' | 'error';

interface Toast {
	id: number;
	message: string;
	tone: ToastTone;
}

const DURATION_MS = 3500;

class ToastStore {
	current = $state<Toast | null>(null);
	#timer: ReturnType<typeof setTimeout> | undefined;
	#nextId = 1;

	show(message: string, tone: ToastTone = 'info'): void {
		clearTimeout(this.#timer);
		this.current = { id: this.#nextId++, message, tone };
		this.#timer = setTimeout(() => this.dismiss(), DURATION_MS);
	}

	success(message: string): void {
		this.show(message, 'success');
	}

	error(message: string): void {
		this.show(message, 'error');
	}

	dismiss(): void {
		clearTimeout(this.#timer);
		this.current = null;
	}
}

export const toasts = new ToastStore();
