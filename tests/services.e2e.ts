import { expect, test as base, type APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const origin = 'http://localhost:4173';
const test = base.extend<{ account: { token: string; password: string } }>({
	account: async ({ context }, use) => {
		const password = `services-${randomUUID()}`;
		const res = await context.request.post(`${origin}/api/v1/auth/register`, {
			headers: { 'X-Session-Transport': 'cookie' },
			data: {
				email: `services-ui-${randomUUID()}@e2e.orbita.test`,
				password,
				name: 'Services QA',
				timezone: 'America/Lima'
			}
		});
		expect(res.status()).toBe(201);
		const data = (await res.json()).data;
		const token = data.tokens.access_token as string;
		try {
			await use({ token, password });
		} finally {
			const removed = await context.request.delete(`${origin}/api/v1/me`, {
				headers: { Authorization: `Bearer ${token}` },
				data: { password }
			});
			expect(removed.status()).toBe(204);
		}
	}
});

async function chooseDate(
	page: import('@playwright/test').Page,
	label: string,
	year: string,
	month: string,
	day: string
) {
	await page.getByRole('button', { name: label, exact: true }).click();
	await page.getByLabel('Año del calendario').selectOption(year);
	await page.getByLabel('Mes del calendario').selectOption(month);
	await page
		.locator(
			`[data-calendar-day][data-value="${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}"]`
		)
		.click();
}

async function list(request: APIRequestContext, token: string) {
	const response = await request.get(`${origin}/api/v1/services`, {
		headers: { Authorization: `Bearer ${token}` }
	});
	expect(response.ok()).toBeTruthy();
	return (await response.json()).data;
}

test('services persist creation, manual shares, payments, editing and deletion', async ({
	page,
	context,
	account
}) => {
	await page.goto(`${origin}/services/new`);
	await expect(page.getByRole('heading', { name: 'Nuevo servicio', exact: true })).toBeVisible();
	await expect(page.getByLabel('Categoría', { exact: true })).toHaveCount(0);
	await page.getByLabel('Nombre', { exact: true }).fill('Servicio compartido QA');
	await page.getByRole('radio', { name: 'US$ Dólares', exact: true }).check();
	await page.getByLabel('Monto mensual', { exact: true }).fill('120');
	await page.getByRole('button', { name: 'Día de cobro', exact: true }).click();
	await page.getByRole('button', { name: 'Día 10', exact: true }).click();
	await chooseDate(page, 'Empecé a pagarlo el', '2026', '1', '1');
	await page.getByText('Lo comparto con otras personas', { exact: true }).click();
	await page.getByRole('button', { name: 'Agregar persona', exact: true }).click();
	await page.getByLabel('Nombre', { exact: true }).nth(1).fill('Ana QA');
	await page.getByLabel('Paga al mes', { exact: true }).fill('40');
	await page.getByLabel('Paga desde: mes').selectOption('1');
	await page.getByLabel('Paga desde: año').selectOption('2026');
	await expect(page.getByRole('button', { name: 'Repartir en partes iguales' })).toHaveCount(0);
	await page.getByLabel('Nota (opcional)').fill('Cada persona escribe su monto.');
	await page.screenshot({ path: '/private/tmp/orbita-services-form-desktop.png', fullPage: true });
	await page.getByRole('button', { name: 'Guardar servicio', exact: true }).click();
	await expect(page).toHaveURL(/\/services\/[0-9a-f-]+$/);
	await expect(
		page.getByRole('heading', { name: 'Servicio compartido QA', exact: true })
	).toBeVisible();
	const id = page.url().split('/').at(-1)!;
	await page.reload();
	await expect(page.getByText('Ana QA', { exact: true })).toBeVisible();
	const records = await list(context.request, account.token);
	expect(records).toHaveLength(1);
	expect(records[0]).toMatchObject({
		amount: '120.00',
		currency: 'USD',
		billing_day: 10,
		started_on: '2026-01-01'
	});
	expect(records[0].members[0].amount).toBe('40.00');
	await page.getByRole('button', { name: 'Registrar pago', exact: true }).click();
	const modal = page.getByRole('dialog', { name: 'Registrar pago de Ana QA', exact: true });
	await expect(modal).toBeVisible();
	await modal.getByText('Febrero 2026', { exact: true }).click();
	await modal.getByRole('button', { name: 'Fecha en que te pagó', exact: true }).click();
	await page.getByRole('button', { name: 'Hoy', exact: true }).click();
	await modal.getByRole('button', { name: /Guardar.*80\.00/ }).click();
	await expect(modal).not.toBeVisible();
	await expect(page.getByRole('button', { name: 'Enero 2026: Pagado', exact: true })).toBeVisible();
	await page.reload();
	await expect(
		page.getByRole('button', { name: 'Febrero 2026: Pagado', exact: true })
	).toBeVisible();
	await page.getByRole('link', { name: 'Editar', exact: true }).click();
	await expect(page.getByRole('radio', { name: 'S/ Soles', exact: true })).toBeDisabled();
	await expect(page.getByRole('radio', { name: 'US$ Dólares', exact: true })).toBeDisabled();
	await page.getByLabel('Nombre', { exact: true }).first().fill('Servicio editado QA');
	await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
	await expect(
		page.getByRole('heading', { name: 'Servicio editado QA', exact: true })
	).toBeVisible();
	await page.getByRole('button', { name: 'Enero 2026: Pagado', exact: true }).click();
	await page.getByRole('button', { name: 'Deshacer pago', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Enero 2026: Debe', exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Eliminar servicio', exact: true }).click();
	await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
	await expect(page).toHaveURL(/\/services$/);
	await page.reload();
	expect(await list(context.request, account.token)).toHaveLength(0);
	await expect(page.getByRole('heading', { name: 'Aún no tienes servicios aquí' })).toBeVisible();
	expect(id).toMatch(/^[0-9a-f-]+$/);
});

test('mobile pickers fit the screen and a failed save preserves form input', async ({
	page,
	context,
	account
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto(`${origin}/services/new`);
	await page.getByLabel('Nombre', { exact: true }).fill('Servicio móvil QA');
	await page.getByLabel('Monto mensual', { exact: true }).fill('25');
	await page.getByRole('radio', { name: 'US$ Dólares', exact: true }).check();
	await page.getByRole('radio', { name: 'S/ Soles', exact: true }).check();
	await page.getByRole('button', { name: 'Día de cobro', exact: true }).click();
	const dayPopover = page.getByRole('dialog', { name: 'Elegir día de cobro' });
	await expect(dayPopover).toBeVisible();
	await expect(dayPopover).toHaveCSS('opacity', '1');
	const rect = await dayPopover.boundingBox();
	expect(rect!.x).toBeGreaterThanOrEqual(0);
	expect(rect!.x + rect!.width).toBeLessThanOrEqual(390);
	await page.screenshot({ path: '/private/tmp/orbita-services-day-mobile.png', fullPage: true });
	await page.getByRole('button', { name: 'Día 31', exact: true }).click();
	await page.getByRole('button', { name: 'Empecé a pagarlo el', exact: true }).click();
	await expect(page.getByRole('dialog', { name: 'Empecé a pagarlo el', exact: true })).toHaveCSS(
		'opacity',
		'1'
	);
	await page.screenshot({
		path: '/private/tmp/orbita-services-calendar-mobile.png',
		fullPage: true
	});
	await page.keyboard.press('Escape');
	await expect(page.getByLabel('Mes del calendario')).not.toBeVisible();
	await page.route('**/api/v1/services', (route) =>
		route.request().method() === 'POST' ? route.abort('failed') : route.continue()
	);
	await page.getByRole('button', { name: 'Guardar servicio', exact: true }).click();
	await expect(
		page.getByText('Sin conexión. Revisa tu internet e inténtalo de nuevo.', { exact: true })
	).toBeVisible();
	await expect(page.getByLabel('Nombre', { exact: true })).toHaveValue('Servicio móvil QA');
	await expect(page.getByRole('button', { name: 'Guardar servicio', exact: true })).toBeEnabled();
	expect(await list(context.request, account.token)).toHaveLength(0);
});

test('a failed list request offers retry and recovers without demo services', async ({
	page,
	account
}) => {
	expect(account.token).toBeTruthy();
	let fail = true;
	await page.route('**/api/v1/services', (route) => {
		if (fail && route.request().method() === 'GET')
			return route.fulfill({ status: 503, json: { error: { code: 'DATABASE_UNAVAILABLE' } } });
		return route.continue();
	});
	await page.goto(`${origin}/services`);
	await expect(page.getByText('No pudimos cargar tus servicios', { exact: true })).toBeVisible();
	await expect(
		page.getByRole('heading', { name: 'Aún no tienes servicios aquí' })
	).not.toBeVisible();
	fail = false;
	await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
	await expect(page.getByRole('heading', { name: 'Aún no tienes servicios aquí' })).toBeVisible();
	await expect(
		page.getByText('No pudimos cargar tus servicios', { exact: true })
	).not.toBeVisible();
});
