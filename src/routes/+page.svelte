<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		ArrowRight,
		BellRing,
		FileCode,
		HandCoins,
		Link2,
		ReceiptText,
		Repeat,
		ShieldCheck,
		Users
	} from '@lucide/svelte';
	import { Button, IconBadge, Logo, ProgressBar } from '#lib/components/ui/index.ts';
	import type { IconComponent, Tone } from '#lib/components/ui/index.ts';
	import { session } from '#lib/stores/session.svelte.ts';

	interface Feature {
		icon: IconComponent;
		tone: Tone;
		title: string;
		text: string;
		points: string[];
	}

	const FEATURES: Feature[] = [
		{
			icon: ReceiptText,
			tone: 'primary',
			title: 'Recibos por honorarios',
			text: 'Sube el XML de cada recibo y Orbita llena el registro por ti.',
			points: [
				'Tope anual con alertas al 80 %',
				'Bruto, retención del 8 % y neto',
				'Totales por cliente y por mes'
			]
		},
		{
			icon: HandCoins,
			tone: 'income',
			title: 'Préstamos',
			text: 'Organiza lo que prestas por persona y registra abonos de cualquier monto.',
			points: [
				'Total prestado, devuelto y pendiente',
				'Pagos de cualquier monto',
				'Vista previa de su estado de cuenta'
			]
		},
		{
			icon: Repeat,
			tone: 'orange',
			title: 'Servicios',
			text: 'Todas tus suscripciones en un lugar, con su próximo cobro.',
			points: [
				'Desde cuándo pagas cada una',
				'Servicios compartidos',
				'Quién te debe y desde qué mes'
			]
		}
	];

	const STEPS: { icon: IconComponent; title: string; text: string }[] = [
		{
			icon: FileCode,
			title: 'Sube el XML',
			text: 'Arrastra el XML del recibo que emitiste en SUNAT. Lee serie, fecha, cliente y montos.'
		},
		{
			icon: BellRing,
			title: 'Revisa tus alertas',
			text: 'El inicio te dice cuánto te queda del tope, qué pago esperas y qué cobro se acerca.'
		},
		{
			icon: Link2,
			title: 'Consulta cada cuenta',
			text: 'Previsualiza el saldo y los movimientos de cada persona en una vista de solo lectura.'
		}
	];
</script>

<svelte:head>
	<title>Orbita · Recibos, préstamos y servicios bajo control</title>
	<meta
		name="description"
		content="Controla tu tope anual de recibos por honorarios, tus préstamos a otras personas y tus servicios compartidos."
	/>
</svelte:head>

<div class="min-h-dvh bg-canvas">
	<header class="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
		<Logo />
		<nav class="flex items-center gap-2">
			{#if session.isSignedIn}
				<Button href={resolve('/(app)/dashboard')} icon={ArrowRight}>Ir a mi panel</Button>
			{:else}
				<Button href={resolve('/(auth)/login')} variant="ghost" class="hidden sm:inline-flex">
					Iniciar sesión
				</Button>
				<Button href={resolve('/(auth)/register')}>Crear cuenta</Button>
			{/if}
		</nav>
	</header>

	<!-- Hero -->
	<section
		class="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-8 pb-20 sm:px-6 lg:grid-cols-2 lg:pt-16"
	>
		<div>
			<p
				class="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary"
			>
				<ShieldCheck size={14} aria-hidden="true" /> Hecho para independientes en Perú
			</p>
			<h1 class="mt-5 text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl">
				Que no se te escape ni un sol de lo que
				<span
					class="bg-gradient-to-r from-[#2563EB] via-[#0EA5E9] to-[#0E90B8] bg-clip-text text-transparent"
				>
					emites, prestas o compartes.
				</span>
			</h1>
			<p class="mt-5 max-w-lg text-lg text-muted">
				Orbita lleva la cuenta de tus recibos por honorarios frente a tu tope anual, de lo que te
				deben tus préstamos y de cada servicio que pagas cada mes.
			</p>
			<div class="mt-8 flex flex-wrap gap-3">
				<Button
					href={resolve(session.isSignedIn ? '/(app)/dashboard' : '/(auth)/register')}
					size="lg"
					icon={ArrowRight}
				>
					{session.isSignedIn ? 'Ir a mi panel' : 'Empieza gratis'}
				</Button>
				{#if !session.isSignedIn}
					<Button href={resolve('/(auth)/login')} size="lg" variant="secondary"
						>Ya tengo cuenta</Button
					>
				{/if}
			</div>
		</div>

		<!-- Product preview built from the same pieces as the dashboard -->
		<div class="relative mx-auto w-full max-w-md" aria-hidden="true">
			<div
				class="hero-savings relative overflow-hidden rounded-hero p-6 text-white shadow-2xl shadow-primary/30"
			>
				<div class="hero-veil absolute inset-0"></div>
				<div class="relative">
					<p class="text-sm font-semibold text-white/85">Recibos por honorarios · 2026</p>
					<p class="tabular mt-2 text-4xl font-extrabold">S/ 41,800.00</p>
					<p class="mt-1 text-sm text-white/85">de S/ 50,000.00 · te quedan S/ 8,200.00</p>
					<div class="mt-5"><ProgressBar value={83.6} label="Tope usado" onDark /></div>
					<div
						class="mt-5 flex items-center justify-between rounded-2xl bg-white/14 px-4 py-3 text-sm"
					>
						<span class="font-semibold">83.6 % del tope usado</span>
						<span class="rounded-full bg-[#FBBF24] px-2.5 py-0.5 text-xs font-extrabold text-ink"
							>Cerca del tope</span
						>
					</div>
				</div>
			</div>
			<div
				class="relative -mt-6 ml-8 rounded-card border border-outline bg-surface p-4 shadow-pop sm:-mr-10"
			>
				<div class="flex items-center gap-3">
					<IconBadge icon={Users} tone="expense" size="sm" />
					<div class="min-w-0 flex-1">
						<p class="text-sm font-bold">Netflix · Luis te debe</p>
						<p class="text-xs text-muted">jul, ago, sep, oct</p>
					</div>
					<p class="tabular font-extrabold text-expense-strong">S/ 60.00</p>
				</div>
			</div>
			<div
				class="relative mt-3 mr-10 -ml-4 rounded-card border border-outline bg-surface p-4 shadow-pop"
			>
				<div class="flex items-center gap-3">
					<IconBadge icon={HandCoins} tone="income" size="sm" />
					<div class="min-w-0 flex-1">
						<p class="text-sm font-bold">Diego hizo un abono de US$ 200</p>
						<p class="text-xs text-muted">Préstamo · 25 sep</p>
					</div>
					<p class="tabular font-extrabold text-income-strong">+US$ 200.00</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Modules -->
	<section class="border-t border-outline bg-surface py-20">
		<div class="mx-auto max-w-6xl px-4 sm:px-6">
			<h2 class="max-w-xl text-3xl font-extrabold tracking-tight">
				Tres módulos, cada uno a lo suyo
			</h2>
			<p class="mt-3 max-w-xl text-muted">
				Independientes entre sí. Úsalos todos o solo el que necesitas.
			</p>
			<div class="mt-10 grid gap-5 md:grid-cols-3">
				{#each FEATURES as feature (feature.title)}
					<article class="rounded-card border border-outline bg-canvas/60 p-6">
						<IconBadge icon={feature.icon} tone={feature.tone} size="lg" />
						<h3 class="mt-5 text-lg font-extrabold">{feature.title}</h3>
						<p class="mt-2 text-sm text-muted">{feature.text}</p>
						<ul class="mt-5 flex flex-col gap-2.5">
							{#each feature.points as point (point)}
								<li class="flex items-center gap-2.5 text-sm font-semibold">
									<span class="size-1.5 shrink-0 rounded-full bg-primary"></span>{point}
								</li>
							{/each}
						</ul>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<!-- How it works -->
	<section class="py-20">
		<div class="mx-auto max-w-6xl px-4 sm:px-6">
			<h2 class="text-3xl font-extrabold tracking-tight">Así de rápido</h2>
			<ol class="mt-10 grid gap-8 md:grid-cols-3">
				{#each STEPS as step, i (step.title)}
					<li>
						<div class="flex items-center gap-3">
							<span
								class="inline-flex size-9 items-center justify-center rounded-full bg-ink text-sm font-extrabold text-white"
								>{i + 1}</span
							>
							<step.icon size={22} class="text-primary" aria-hidden="true" />
						</div>
						<h3 class="mt-4 text-lg font-extrabold">{step.title}</h3>
						<p class="mt-1.5 text-sm text-muted">{step.text}</p>
					</li>
				{/each}
			</ol>
		</div>
	</section>

	<!-- CTA -->
	<section class="px-4 pb-20 sm:px-6">
		<div
			class="hero-savings relative mx-auto max-w-6xl overflow-hidden rounded-hero px-6 py-14 text-center text-white sm:px-12"
		>
			<div class="hero-veil absolute inset-0 opacity-60"></div>
			<div class="relative">
				<h2 class="text-3xl font-extrabold tracking-tight">Empieza hoy con tus datos reales</h2>
				<p class="mx-auto mt-3 max-w-lg text-white/85">
					Sube tu primer XML y mira cuánto te queda del tope del año.
				</p>
				<div class="mt-8 flex justify-center">
					<a
						href={resolve(session.isSignedIn ? '/(app)/dashboard' : '/(auth)/register')}
						class="inline-flex h-14 items-center gap-2 rounded-button bg-white px-7 font-extrabold text-ink shadow-lg transition hover:bg-white/90"
					>
						{session.isSignedIn ? 'Ir a mi panel' : 'Crear mi cuenta'}
						<ArrowRight size={18} aria-hidden="true" />
					</a>
				</div>
			</div>
		</div>
	</section>

	<footer class="border-t border-outline py-8">
		<div
			class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 text-sm text-muted sm:px-6"
		>
			<Logo size="sm" />
			<nav class="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Información legal">
				<a href={resolve('/privacy')} class="font-semibold hover:text-ink hover:underline"
					>Política de privacidad</a
				>
				<a href={resolve('/delete-account')} class="font-semibold hover:text-ink hover:underline"
					>Eliminar mi cuenta</a
				>
				<span>© 2026 Atmosfera · Orbita</span>
			</nav>
		</div>
	</footer>
</div>
