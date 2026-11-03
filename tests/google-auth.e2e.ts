import { expect, test, type BrowserContext } from '@playwright/test';

const user = {
	id: '01950000-0000-7000-8000-000000000001',
	email: 'ana@gmail.com',
	name: 'Ana Google',
	created_at: '2026-10-24T12:00:00Z'
};

async function mockGoogle(context: BrowserContext, options: { link?: boolean } = {}) {
	let exchanges = 0;
	let activeRefreshes = 0;
	let maxRefreshes = 0;
	let currentRefresh = '';
	let rotations = 0;
	const requests: Record<string, unknown>[] = [];
	const tokens = (access: string) => {
		currentRefresh = `refresh-${++rotations}`;
		return {
			access_token: access,
			refresh_token: currentRefresh,
			token_type: 'Bearer',
			expires_in: 900,
			refresh_expires_in: 2592000,
			session_mode: 'persistent'
		};
	};
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
	await context.route('https://auth.atmosferast.com/v1/**', async (route) => {
		const path = new URL(route.request().url()).pathname.replace('/v1', '');
		const json = (data: unknown, status = 200) => route.fulfill({ status, json: data });
		if (path === '/google/challenge') return json({ nonce: 'browser-nonce', expires_in: 300 });
		if (path === '/google') {
			exchanges++;
			const body = route.request().postDataJSON();
			requests.push(body);
			if (options.link && !body.password)
				return json({ error: { code: 'password_required_to_link', message: '' } }, 409);
			return json(tokens('orbita-access-token'), 200);
		}
		if (path === '/refresh') {
			const body = route.request().postDataJSON();
			if (!currentRefresh || body.refresh_token !== currentRefresh)
				return json({ error: { code: 'invalid_refresh_token', message: '' } }, 401);
			activeRefreshes++;
			maxRefreshes = Math.max(maxRefreshes, activeRefreshes);
			await new Promise((resolve) => setTimeout(resolve, 80));
			activeRefreshes--;
			return json(tokens('renewed-orbita-token'));
		}
		return json({ error: { code: 'not_found', message: '' } }, 404);
	});
	await context.route('**/api/v1/**', async (route) => {
		const path = new URL(route.request().url()).pathname.replace('/api/v1', '');
		const ok = (data: unknown) => route.fulfill({ json: { data } });
		if (path === '/me') return ok(user);
		if (path === '/loan-debtors')
			return route.fulfill({ json: { data: [], meta: { today: '2026-10-24' } } });
		if (path === '/services')
			return route.fulfill({ json: { data: [], meta: { today: '2026-10-24' } } });
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
		system: 'orbita',
		credential: 'signed-google-credential',
		nonce: 'browser-nonce'
	});
	// Only the refresh token is stored; the access token and the credential are not.
	expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['orbita:refresh-token']);
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
	expect(state.requests[1]).toMatchObject({
		password: 'correct-password',
		credential: 'signed-google-credential',
		nonce: 'browser-nonce'
	});
});

test('registration offers Google', async ({ page, context }) => {
	await mockGoogle(context);
	await page.goto('http://localhost:4173/register');
	await expect(
		page.getByRole('button', { name: 'Continuar con Google', exact: true })
	).toBeVisible();
	await expect(page.getByLabel('Nombre', { exact: true })).toBeVisible();
});
