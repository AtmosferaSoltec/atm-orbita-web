import { HandCoins, LayoutDashboard, ReceiptText, Repeat } from '@lucide/svelte';
import type { IconComponent } from '../ui/types';

export interface NavItem {
	route: '/(app)/dashboard' | '/(app)/receipts' | '/(app)/loans' | '/(app)/services';
	/** URL prefix that marks the item as active. */
	path: string;
	label: string;
	icon: IconComponent;
}

export const NAV_ITEMS: NavItem[] = [
	{ route: '/(app)/dashboard', path: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
	{ route: '/(app)/receipts', path: '/receipts', label: 'Recibos', icon: ReceiptText },
	{ route: '/(app)/loans', path: '/loans', label: 'Préstamos', icon: HandCoins },
	{ route: '/(app)/services', path: '/services', label: 'Servicios', icon: Repeat }
];

export function isActive(pathname: string, path: string): boolean {
	return pathname === path || pathname.startsWith(`${path}/`);
}
