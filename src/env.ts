import { defineEnvVars } from '@sveltejs/kit/env';

// Public settings, baked into the static build (see .env.example).
export const variables = defineEnvVars({
	PUBLIC_AUTH_API_URL: {
		public: true,
		static: true,
		description: 'Base URL of atm-auth-api',
		schema: (value) => value || 'https://auth.atmosferast.com/v1'
	},
	PUBLIC_GOOGLE_CLIENT_ID: {
		public: true,
		static: true,
		description: 'Google OAuth web client ID; empty hides Google sign-in',
		schema: (value) => value ?? ''
	}
});
