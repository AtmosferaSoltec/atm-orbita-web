import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command:
			'PUBLIC_GOOGLE_CLIENT_ID=test.apps.googleusercontent.com npm run build && npm run preview',
		port: 4173
	},
	testMatch: '**/*.e2e.{ts,js}'
});
