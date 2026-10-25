import { expect, test as base, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const origin = 'http://localhost:4173';

const test = base.extend<{ account: { token: string; password: string } }>({
	account: [
		async ({ context }, use) => {
			const password = `loans-${randomUUID()}`;
			const response = await context.request.post(`${origin}/api/v1/auth/register`, {
				headers: { 'X-Session-Transport': 'cookie' },
				data: {
					email: `loans-ui-${randomUUID()}@e2e.orbita.test`,
					password,
					name: 'Loans QA',
					timezone: 'America/Lima'
				}
			});
			expect(response.status()).toBe(201);
			const token = (await response.json()).data.tokens.access_token as string;
			try {
				await use({ token, password });
			} finally {
				const removed = await context.request.delete(`${origin}/api/v1/me`, {
					headers: { Authorization: `Bearer ${token}` },
					data: { password }
				});
				expect(removed.status()).toBe(204);
			}
		},
		{ auto: true }
	]
});

async function createPerson(page: Page, name: string, currency: 'PEN' | 'USD' = 'PEN') {
	await page.goto(`${origin}/loans/new`);
	await expect(page.getByLabel('Celular')).toHaveCount(0);
	await expect(page.getByRole('textbox')).toHaveCount(1);
	await page.getByLabel('Nombre', { exact: true }).fill(name);
	await expect(page.getByRole('radio', { name: 'S/ Soles', exact: true })).toBeChecked();
	if (currency === 'USD')
		await page.getByRole('radio', { name: 'US$ Dólares', exact: true }).check();
	await page.getByRole('button', { name: 'Crear deudor', exact: true }).click();
	await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
}

async function movement(page: Page, kind: 'loan' | 'payment', amount: string, note = '') {
	await page
		.getByRole('button', {
			name: kind === 'loan' ? 'Añadir préstamo' : 'Registrar abono',
			exact: true
		})
		.click();
	const modal = page.getByRole('dialog', {
		name: kind === 'loan' ? 'Añadir préstamo' : 'Registrar abono',
		exact: true
	});
	await expect(modal.getByRole('radio')).toHaveCount(0);
	await modal
		.getByLabel(kind === 'loan' ? 'Monto prestado' : 'Monto del abono', { exact: true })
		.fill(amount);
	if (note) await modal.getByLabel('Nota (opcional)').fill(note);
	await modal
		.getByRole('button', {
			name: kind === 'loan' ? 'Guardar préstamo' : 'Guardar abono',
			exact: true
		})
		.click();
	await expect(modal).not.toBeVisible();
}

async function expectBalance(page: Page, value: string) {
	await expect(
		page
			.locator('section')
			.filter({ has: page.getByText('Te falta cobrar', { exact: true }) })
			.getByText(value, { exact: true })
	).toBeVisible();
}

test('one debtor holds multiple advances, flexible repayments with persistence and a fixed currency', async ({
	page
}) => {
	await createPerson(page, 'Gerson prueba');
	await expect(page.getByText('La ficha está lista', { exact: true })).toBeVisible();
	await movement(page, 'loan', '3000', 'Cosa A');
	await movement(page, 'loan', '2000', 'Cosa B');
	await movement(page, 'loan', '1000', 'Cosa C');
	await expectBalance(page, 'S/ 6,000.00');
	await movement(page, 'payment', '500', 'Quincena');
	await movement(page, 'payment', '500', 'Fin de mes');
	await movement(page, 'payment', '1000', 'Abono extra');
	await expectBalance(page, 'S/ 4,000.00');
	await movement(page, 'payment', '100');
	await expectBalance(page, 'S/ 3,900.00');
	// An arbitrary repayment is valid, but it cannot exceed the outstanding balance.
	await page.getByRole('button', { name: 'Registrar abono', exact: true }).click();
	let modal = page.getByRole('dialog', { name: 'Registrar abono', exact: true });
	await modal.getByLabel('Monto del abono', { exact: true }).fill('4000');
	await modal.getByRole('button', { name: 'Guardar abono', exact: true }).click();
	await expect(modal.getByRole('alert')).toContainText('no pueden superar');
	await modal.getByRole('button', { name: 'Cancelar', exact: true }).click();
	// Correct and delete a payment; totals recompute without changing its reference.
	await page.getByRole('radio', { name: 'Abonos', exact: true }).click();
	await page.getByRole('button', { name: 'Editar movimiento', exact: true }).first().click();
	modal = page.getByRole('dialog', { name: 'Editar abono', exact: true });
	await modal.getByLabel('Monto del abono', { exact: true }).fill('150');
	await modal.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
	await expectBalance(page, 'S/ 3,850.00');
	await page.getByRole('button', { name: 'Eliminar movimiento', exact: true }).first().click();
	await page
		.getByRole('dialog', { name: '¿Eliminar movimiento?', exact: true })
		.getByRole('button', { name: 'Eliminar', exact: true })
		.click();
	await expectBalance(page, 'S/ 4,000.00');
	const solesUrl = page.url();
	await createPerson(page, 'Gerson prueba', 'USD');
	await movement(page, 'loan', '250');
	await movement(page, 'payment', '50');
	await expectBalance(page, 'US$ 200.00');
	await expect(page.getByRole('radio', { name: 'S/ Soles', exact: true })).toHaveCount(0);
	await page.getByRole('link', { name: 'Editar nombre', exact: true }).click();
	await expect(page.getByRole('radio')).toHaveCount(0);
	await expect(page.getByText('Moneda: Dólares (US$)', { exact: true })).toBeVisible();
	await page.goto(solesUrl);
	await page.reload();
	await expectBalance(page, 'S/ 4,000.00');
	await page.getByRole('button', { name: 'Crear enlace compartido', exact: true }).click();
	await page.getByRole('link', { name: 'Ver estado', exact: true }).click();
	await expect(
		page.getByRole('heading', { name: 'Estado de préstamos de Gerson prueba' })
	).toBeVisible();
	await expect(page.getByText('Te falta pagar', { exact: true })).toHaveCount(1);
	await expect(page.getByRole('button', { name: 'Editar movimiento', exact: true })).toHaveCount(0);
});

test('mobile creation, calendar and debtor management remain usable', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });

	await createPerson(page, 'Deudor móvil');
	await page.getByRole('button', { name: 'Añadir préstamo', exact: true }).click();
	const modal = page.getByRole('dialog', { name: 'Añadir préstamo', exact: true });
	await modal.getByLabel('Monto prestado', { exact: true }).fill('600');
	await modal.getByRole('button', { name: 'Fecha del préstamo', exact: true }).click();
	const calendar = modal.getByRole('dialog', { name: 'Fecha del préstamo', exact: true });
	await expect(calendar).toBeVisible();
	const box = await calendar.boundingBox();
	expect(box!.x).toBeGreaterThanOrEqual(0);
	expect(box!.x + box!.width).toBeLessThanOrEqual(390);
	await calendar.getByRole('button', { name: 'Hoy', exact: true }).click();
	await modal.getByRole('button', { name: 'Guardar préstamo', exact: true }).click();
	await movement(page, 'payment', '600');
	await expectBalance(page, 'S/ 0.00');
	await expect(page.getByRole('button', { name: 'Registrar abono', exact: true })).toBeDisabled();
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
	await page.screenshot({ path: '/private/tmp/orbita-loans-mobile.png', fullPage: true });
	await page.getByRole('link', { name: 'Editar nombre', exact: true }).click();
	await page.getByLabel('Nombre', { exact: true }).fill('Deudor renombrado');
	await page.getByRole('button', { name: 'Guardar nombre', exact: true }).click();
	await expect(page.getByRole('heading', { name: 'Deudor renombrado', exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Eliminar deudor', exact: true }).click();
	await page
		.getByRole('dialog', { name: '¿Eliminar deudor?', exact: true })
		.getByRole('button', { name: 'Eliminar', exact: true })
		.click();
	await expect(page).toHaveURL(/\/loans$/);
	await expect(page.getByText('¿A quién le vas a prestar?', { exact: true })).toBeVisible();
});

test('money inputs reject letters, scientific notation and invalid paste while accepting decimal amounts', async ({
	page,
	context
}) => {
	await createPerson(page, 'Monto numérico');
	await page.getByRole('button', { name: 'Añadir préstamo', exact: true }).click();
	const modal = page.getByRole('dialog', { name: 'Añadir préstamo', exact: true });
	const amount = modal.getByLabel('Monto prestado', { exact: true });
	await amount.fill('1e3');
	await expect(amount).toHaveValue('');
	await amount.pressSequentially('1a2e3+-');
	await expect(amount).toHaveValue('123');
	await amount.press('ControlOrMeta+A');
	await amount.pressSequentially('xyz');
	await expect(amount).toHaveValue('123');
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.evaluate(() => navigator.clipboard.writeText('999texto'));
	await amount.press('ControlOrMeta+V');
	await expect(amount).toHaveValue('123');
	await page.evaluate(() => navigator.clipboard.writeText('1.245,80'));
	await amount.press('ControlOrMeta+A');
	await amount.press('ControlOrMeta+V');
	await expect(amount).toHaveValue('1.245,80');
	await modal.getByRole('button', { name: 'Guardar préstamo', exact: true }).click();
	await expectBalance(page, 'S/ 1,245.80');
});

async function planPurchase(page: Page, concept: string, monthAmounts: [string, string][]) {
	await page.getByRole('button', { name: `Repartir ${concept} por meses`, exact: true }).click();
	const modal = page.getByRole('dialog', { name: 'Repartir por meses', exact: true });
	for (let i = 0; i < monthAmounts.length; i++) {
		if (i) await modal.getByRole('button', { name: 'Añadir mes', exact: true }).click();
		const [month, amount] = monthAmounts[i];
		await modal.getByLabel(`Mes ${i + 1}: año`, { exact: true }).selectOption(month.slice(0, 4));
		await modal
			.getByLabel(`Mes ${i + 1}: mes`, { exact: true })
			.selectOption(String(Number(month.slice(5, 7))));
		await modal.getByLabel(`Monto del mes ${i + 1}`, { exact: true }).fill(amount);
	}
	await modal.getByRole('button', { name: 'Guardar reparto', exact: true }).click();
	await expect(modal).not.toBeVisible();
}

test('monthly table totals each purchase and applies flexible payments only to the selected month', async ({
	page
}) => {
	await createPerson(page, 'Tabla mensual');
	await movement(page, 'loan', '1719', 'iPhone');
	await movement(page, 'loan', '120', 'Audífonos');
	const current = await page.evaluate(() => {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
	});
	const next = await page.evaluate(() => {
		const d = new Date();
		d.setMonth(d.getMonth() + 1);
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
	});
	await planPurchase(page, 'iPhone', [
		[current, '350'],
		[next, '270']
	]);
	await planPurchase(page, 'Audífonos', [
		[current, '60'],
		[next, '30']
	]);
	const table = page.getByRole('table');
	await expect(table.locator(`[data-month="${current}"][data-total="expected"]`)).toHaveText(
		'S/ 410.00'
	);
	await movement(page, 'payment', '300');
	await expect(table.locator(`[data-month="${current}"][data-total="remaining"]`)).toHaveText(
		'S/ 110.00'
	);
	await page.getByRole('button', { name: 'Registrar abono', exact: true }).click();
	const modal = page.getByRole('dialog', { name: 'Registrar abono', exact: true });
	await modal.getByLabel('Monto del abono', { exact: true }).fill('500');
	await modal
		.getByLabel('Mes al que corresponde: año', { exact: true })
		.selectOption(next.slice(0, 4));
	await modal
		.getByLabel('Mes al que corresponde: mes', { exact: true })
		.selectOption(String(Number(next.slice(5, 7))));
	await modal.getByRole('button', { name: 'Guardar abono', exact: true }).click();
	await expect(table.locator(`[data-month="${next}"][data-total="paid"]`)).toHaveText('S/ 500.00');
	await expect(table.locator(`[data-month="${next}"][data-total="surplus"]`)).toHaveText(
		'S/ 200.00'
	);
	await expect(table.locator(`[data-month="${current}"][data-total="remaining"]`)).toHaveText(
		'S/ 110.00'
	);
	await expectBalance(page, 'S/ 1,039.00');
	await page.reload();
	await expect(table.locator(`[data-month="${next}"][data-total="surplus"]`)).toHaveText(
		'S/ 200.00'
	);
	await page.setViewportSize({ width: 390, height: 844 });
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
	await expect(
		page
			.getByRole('region', { name: 'Detalle mensual', exact: true })
			.locator('[data-mobile-total="remaining"]')
	).toHaveText('S/ 110.00');
	await page.screenshot({ path: '/private/tmp/orbita-monthly-mobile.png', fullPage: true });
	await page
		.getByLabel('Mes a consultar: mes', { exact: true })
		.selectOption(String(Number(next.slice(5, 7))));
	await page.getByLabel('Mes a consultar: año', { exact: true }).selectOption(next.slice(0, 4));
	await expect(
		page
			.getByRole('region', { name: 'Detalle mensual', exact: true })
			.getByText('S/ 200.00', { exact: true })
	).toBeVisible();
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.getByRole('button', { name: 'Crear enlace compartido', exact: true }).click();
	await page.getByRole('link', { name: 'Ver estado', exact: true }).click();
	await expect(
		page.getByRole('table').locator(`[data-month="${current}"][data-total="remaining"]`)
	).toHaveText('S/ 110.00');
	await expect(page.getByRole('button', { name: /^Repartir .+ por meses$/ })).toHaveCount(0);
});

test('a visitor in another browser can read an enabled share and loses access after revocation', async ({
	page,
	browser
}) => {
	await createPerson(page, 'Compartido real');
	await movement(page, 'loan', '900', 'Viaje');
	await page.getByRole('button', { name: 'Crear enlace compartido', exact: true }).click();
	const href = await page
		.getByRole('link', { name: 'Ver estado', exact: true })
		.getAttribute('href');
	expect(href).toMatch(/^\/share\/loans\//);
	const visitor = await browser.newContext();
	try {
		const other = await visitor.newPage();
		await other.goto(`${origin}${href}`);
		await expect(
			other.getByRole('heading', { name: 'Estado de préstamos de Compartido real', exact: true })
		).toBeVisible();
		await expect(other.getByText('Te falta pagar', { exact: true })).toBeVisible();
		await expect(other.getByRole('button', { name: 'Editar movimiento', exact: true })).toHaveCount(
			0
		);
		await page.getByRole('button', { name: 'Desactivar enlace', exact: true }).click();
		await page
			.getByRole('dialog', { name: '¿Desactivar enlace?', exact: true })
			.getByRole('button', { name: 'Desactivar enlace', exact: true })
			.click();
		await expect(
			page.getByRole('button', { name: 'Crear enlace compartido', exact: true })
		).toBeVisible();
		await other.reload();
		await expect(
			other.getByRole('heading', { name: 'Estado no disponible', exact: true })
		).toBeVisible();
	} finally {
		await visitor.close();
	}
});

test('a failed save preserves input and retry uses the same movement id', async ({ page }) => {
	await createPerson(page, 'Reintento real');
	const ids: string[] = [];
	let attempts = 0;
	await page.route('**/api/v1/loan-debtors/*/movements', async (route) => {
		if (route.request().method() !== 'POST') return route.continue();
		ids.push(route.request().postDataJSON().id);
		if (attempts++ === 0)
			return route.fulfill({ status: 503, json: { error: { code: 'DATABASE_UNAVAILABLE' } } });
		return route.continue();
	});
	await page.getByRole('button', { name: 'Añadir préstamo', exact: true }).click();
	const modal = page.getByRole('dialog', { name: 'Añadir préstamo', exact: true });
	await modal.getByLabel('Monto prestado', { exact: true }).fill('123.45');
	await modal.getByRole('button', { name: 'Guardar préstamo', exact: true }).click();
	await expect(modal.getByRole('alert')).toBeVisible();
	await expect(modal.getByLabel('Monto prestado', { exact: true })).toHaveValue('123.45');
	await modal.getByRole('button', { name: 'Guardar préstamo', exact: true }).click();
	await expectBalance(page, 'S/ 123.45');
	expect(ids).toHaveLength(2);
	expect(ids[0]).toBe(ids[1]);
	await page.reload();
	await expectBalance(page, 'S/ 123.45');
});
