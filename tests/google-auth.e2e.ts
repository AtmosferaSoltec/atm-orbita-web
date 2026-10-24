import { expect, test, type BrowserContext } from '@playwright/test';

const user = {
	id: '01950000-0000-7000-8000-000000000001',
	email: 'ana@gmail.com',
	name: 'Ana Google',
	created_at: '2026-10-24T12:00:00Z'
};

async function mockGoogle(
	context: BrowserContext,
	options: { link?: boolean; disabled?: boolean } = {}
) {
	let signedIn = false;
	let exchanges = 0;
	let activeRefreshes = 0;
	let maxRefreshes = 0;
	const requests: Record<string, unknown>[] = [];
	await context.route('https://accounts.google.com/gsi/client*', (route) =>
		route.fulfill({
			contentType: 'application/javascript',
			body: `window.google = { accounts: { id: {
 initialize(options) { this.options = options; },
 renderButton(element) {
  const button = document.createElement('button');
  button.textContent = 'Continuar con Google';
  button.onclick = () => this.options.callback({ credential: 'signed-google-credential' });
  element.appendChild(button);
 }, disableAutoSelect() {}
} } };`
		})
	);
	await context.route('**/api/v1/**', async (route) => {
		const path = new URL(route.request().url()).pathname.replace('/api/v1', '');
		const ok = (data: unknown) => route.fulfill({ json: { data } });
		if (path === '/auth/google/config')
			return ok({ client_id: options.disabled ? '' : 'test.apps.googleusercontent.com' });
		if (path === '/auth/google/challenge') return ok({ nonce: 'browser-nonce' });
		if (path === '/auth/google') {
			exchanges++;
			const body = route.request().postDataJSON();
			requests.push(body);
			if (options.link && !body.password)
				return route.fulfill({ status: 409, json: { error: { code: 'GOOGLE_LINK_REQUIRED' } } });
			signedIn = true;
			return ok({
				user,
				tokens: { access_token: 'orbita-access-token', access_token_expires_in: 900 }
			});
		}
		if (path === '/auth/refresh') {
			if (!signedIn)
				return route.fulfill({ status: 401, json: { error: { code: 'SESSION_EXPIRED' } } });
			activeRefreshes++;
			maxRefreshes = Math.max(maxRefreshes, activeRefreshes);
			await new Promise((resolve) => setTimeout(resolve, 80));
			activeRefreshes--;
			return ok({ tokens: { access_token: 'renewed-orbita-token' } });
		}
		if (path === '/me') return ok(user);
		if (path === '/currencies') return ok([{ code: 'PEN', symbol: 'S/', name: 'Soles' }]);
		if (path === '/receipts/years') return ok({ years: [], current_year: 2026 });
		if (path.startsWith('/receipt-limits/'))
			return ok({ year: 2026, amount: '50000.00', is_default: true });
		return ok([]);
	});
	return { requests, exchanges: () => exchanges, maxRefreshes: () => maxRefreshes };
}

test('Google opens an Orbita session, survives reload and serializes two tabs', async ({
	page,
	context
}) => {
	const state = await mockGoogle(context);
	await page.goto('http://localhost:4173/login');
	await page.getByRole('button', { name: 'Continuar con Google', exact: true }).click();
	await expect(page).toHaveURL(/\/dashboard$/);
	await expect(page.getByRole('heading', { name: /Ana/ })).toBeVisible();
	expect(state.requests[0]).toMatchObject({
		credential: 'signed-google-credential',
		main_currency: 'PEN'
	});
	expect(
		await page.evaluate(() =>
			Object.keys(localStorage).filter((key) => /token|credential/i.test(key))
		)
	).toEqual([]);
	const other = await context.newPage();
	await Promise.all([page.reload(), other.goto('http://localhost:4173/dashboard')]);
	await expect(page).toHaveURL(/\/dashboard$/);
	await expect(other.getByRole('heading', { name: /Ana/ })).toBeVisible();
	expect(state.maxRefreshes()).toBe(1);
	expect(state.exchanges()).toBe(1);
});

test('an existing account confirms its password before linking Google', async ({
	page,
	context
}) => {
	const state = await mockGoogle(context, { link: true });
	await page.goto('http://localhost:4173/login');
	await page.getByRole('button', { name: 'Continuar con Google', exact: true }).click();
	await expect(page.getByText(/Ya tienes una cuenta con este correo/)).toBeVisible();
	await page.getByLabel('Contraseña de Orbita', { exact: true }).fill('correct-password');
	await page.getByRole('button', { name: 'Vincular Google e ingresar' }).click();
	await expect(page).toHaveURL(/\/dashboard$/);
	expect(state.requests[1]).toMatchObject({ password: 'correct-password' });
});

test('registration offers Google and disabled providers preserve email login', async ({
	page,
	context
}) => {
	await mockGoogle(context);
	await page.goto('http://localhost:4173/register');
	await expect(
		page.getByRole('button', { name: 'Continuar con Google', exact: true })
	).toBeVisible();
	await context.unrouteAll({ behavior: 'wait' });
	await mockGoogle(context, { disabled: true });
	await page.goto('http://localhost:4173/login');
	await expect(page.getByRole('button', { name: 'Ingresar', exact: true })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Continuar con Google', exact: true })).toHaveCount(
		0
	);
});
