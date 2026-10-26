<script lang="ts">
	import { resolve } from '$app/paths';
	import PublicPage from '#lib/components/layout/PublicPage.svelte';

	// The privacy policy of the web and of the Android app (Orbita). Written from what
	// the system really stores and uses; update it in the same change that changes that
	// (a new provider, new data, backups…).

	const CONTACT = 'atmosfera.soltec@gmail.com';
	const UPDATED = '26 de octubre de 2026';

	const SECTIONS = [
		{ id: 'quienes-somos', title: '1. Quiénes somos' },
		{ id: 'datos', title: '2. Qué datos guardamos' },
		{ id: 'uso', title: '3. Para qué los usamos' },
		{ id: 'terceros', title: '4. Con quién los compartimos' },
		{ id: 'conservacion', title: '5. Cuánto tiempo los conservamos' },
		{ id: 'seguridad', title: '6. Cómo los protegemos' },
		{ id: 'derechos', title: '7. Tus derechos' },
		{ id: 'eliminar-cuenta', title: '8. Eliminar tu cuenta y tus datos' },
		{ id: 'menores', title: '9. Menores de edad' },
		{ id: 'cambios', title: '10. Cambios y contacto' }
	];
</script>

<svelte:head>
	<title>Política de privacidad · Orbita</title>
	<meta
		name="description"
		content="Qué datos guarda Orbita, para qué los usa, con quién los comparte y cómo eliminar tu cuenta."
	/>
</svelte:head>

<PublicPage>
	<article class="mt-4">
		<h1 class="text-[26px] font-extrabold tracking-tight">Política de privacidad de Orbita</h1>
		<p class="mt-2 text-sm text-muted">Última actualización: {UPDATED}</p>
		<p class="mt-4 text-muted">
			Esta política explica qué datos guarda <strong class="text-ink">Orbita</strong> (la aplicación Android
			y el sitio web orbita.atmosferast.com), para qué los usa y qué puedes hacer con ellos. Orbita es
			un servicio de Atmosfera. Aplica a la app y a la web, porque comparten tu cuenta.
		</p>

		<nav class="mt-6 rounded-card border border-outline bg-surface p-4" aria-label="Contenido">
			<ul class="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
				{#each SECTIONS as section (section.id)}
					<li>
						<a href={`#${section.id}`} class="font-semibold text-primary hover:underline"
							>{section.title}</a
						>
					</li>
				{/each}
			</ul>
		</nav>

		<div class="policy mt-8 flex flex-col gap-9">
			<section id="quienes-somos" class="scroll-mt-6">
				<h2>1. Quiénes somos</h2>
				<p>
					Orbita es una herramienta para llevar tus finanzas personales: cuentas, ingresos y egresos
					en la app, y en la web tus recibos por honorarios, tus préstamos y tus servicios o
					suscripciones. Es responsable de tus datos Atmosfera. Puedes escribirnos a
					<a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
				</p>
			</section>

			<section id="datos" class="scroll-mt-6">
				<h2>2. Qué datos guardamos</h2>
				<p>
					Solo guardamos lo que tú escribes o subes, y lo necesario para que tu cuenta funcione:
				</p>
				<ul>
					<li>
						<strong>Tu cuenta:</strong> correo, nombre (opcional) y contraseña. La contraseña se guarda
						cifrada de forma irreversible; nunca la vemos ni la guardamos en claro. También guardamos
						tu moneda principal y tu zona horaria.
					</li>
					<li>
						<strong>Si entras con Google:</strong> el identificador de tu cuenta de Google, tu correo
						y tu nombre de perfil. No recibimos tu contraseña de Google ni acceso a tus otros datos de
						Google.
					</li>
					<li>
						<strong>Tus finanzas en la app:</strong> cuentas, saldos iniciales, categorías, movimientos,
						transferencias, tipo de cambio y tarjetas de crédito con sus compras.
					</li>
					<li>
						<strong>Recibos por honorarios (web):</strong> los datos de cada recibo, incluidos el nombre
						y el RUC o DNI de tu cliente, tu tope anual y los archivos XML y PDF que subas.
					</li>
					<li>
						<strong>Préstamos (web):</strong> el nombre de las personas a quienes prestas, los montos,
						los pagos y, si activas el enlace público de un préstamo, ese enlace.
					</li>
					<li>
						<strong>Servicios (web):</strong> tus suscripciones, las personas con quienes las compartes
						y sus pagos.
					</li>
					<li>
						<strong>Datos técnicos:</strong> por cada sesión abierta, el tipo de navegador o dispositivo
						y la fecha de uso; y en los registros del servidor, la dirección IP, la fecha y la ruta de
						cada visita.
					</li>
				</ul>
				<p>
					<strong>No pedimos</strong> tu ubicación, contactos, fotos, cámara ni micrófono. La app de Android
					solo usa el permiso de Internet.
				</p>
				<p>
					Los datos de otras personas que escribas (por ejemplo el nombre de quien te debe) los
					guardas tú bajo tu responsabilidad; solo los usamos para mostrártelos a ti.
				</p>
			</section>

			<section id="uso" class="scroll-mt-6">
				<h2>3. Para qué los usamos</h2>
				<ul>
					<li>Para que puedas entrar a tu cuenta y ver tus datos en la app y en la web.</li>
					<li>Para calcular saldos, reportes, el avance de tu tope anual y tus cuotas.</li>
					<li>Para enviarte el código con el que recuperas tu contraseña.</li>
					<li>Para proteger el servicio: limitar intentos de acceso y detectar abusos.</li>
				</ul>
				<p>
					<strong
						>No vendemos tus datos, no mostramos publicidad y no usamos herramientas de analítica ni
						de seguimiento.</strong
					> La web usa una sola cookie, necesaria para mantener tu sesión abierta (más una cookie temporal
					cuando eliges entrar con Google).
				</p>
			</section>

			<section id="terceros" class="scroll-mt-6">
				<h2>4. Con quién los compartimos</h2>
				<p>Solo con los proveedores que hacen posible el servicio, y solo lo necesario:</p>
				<ul>
					<li>
						<strong>Cloudflare:</strong> protege y entrega el sitio, y guarda de forma privada los archivos
						de tus recibos (XML y PDF). Se descargan con enlaces temporales que solo tú obtienes con tu
						sesión.
					</li>
					<li>
						<strong>Resend:</strong> envía los correos del servicio, como el código para recuperar tu
						contraseña. Recibe tu correo y ese mensaje.
					</li>
					<li>
						<strong>Google:</strong> solo si eliges entrar con Google, para verificar tu identidad. Al
						usar ese botón, tu navegador carga un componente de Google.
					</li>
				</ul>
				<p>
					Si activas el enlace público de un préstamo, cualquier persona que tenga ese enlace podrá
					ver ese préstamo (nunca el resto de tus datos). Puedes desactivarlo cuando quieras.
				</p>
				<p>Solo entregaremos tus datos a una autoridad si una ley o una orden válida nos obliga.</p>
			</section>

			<section id="conservacion" class="scroll-mt-6">
				<h2>5. Cuánto tiempo los conservamos</h2>
				<ul>
					<li>
						<strong>Tus datos:</strong> mientras tengas tu cuenta. Al eliminarla se borran de inmediato.
					</li>
					<li>
						<strong>Registros técnicos del servidor</strong> (IP, fecha y ruta de las visitas): se borran
						solos a los 14 días. No incluyen tu correo, tus montos ni tu contenido.
					</li>
					<li>
						<strong>Copias de seguridad:</strong> hoy no guardamos copias de seguridad de la base de datos.
						Si esto cambia, lo diremos aquí y los datos eliminados saldrán también de ellas.
					</li>
				</ul>
			</section>

			<section id="seguridad" class="scroll-mt-6">
				<h2>6. Cómo los protegemos</h2>
				<ul>
					<li>Todo viaja cifrado (HTTPS).</li>
					<li>Tu contraseña se guarda con un cifrado irreversible.</li>
					<li>
						En la web, tu sesión usa una cookie que el código de la página no puede leer, lo que
						reduce el riesgo de que te la roben.
					</li>
					<li>Cada persona solo puede ver sus propios datos.</li>
					<li>Limitamos los intentos de acceso para frenar adivinanzas de contraseña.</li>
				</ul>
				<p>
					Ningún sistema es infalible; si ocurriera un incidente que te afecte, te lo informaremos.
				</p>
			</section>

			<section id="derechos" class="scroll-mt-6">
				<h2>7. Tus derechos</h2>
				<p>
					Puedes ver tus datos en la app y en la web, corregirlos cuando quieras y eliminarlos. Si
					necesitas una copia de tus datos, o quieres ejercer cualquier otro derecho que te dé la
					ley de tu país (acceso, rectificación, eliminación u oposición), escríbenos a
					<a href={`mailto:${CONTACT}`}>{CONTACT}</a> desde el correo de tu cuenta.
				</p>
			</section>

			<section
				id="eliminar-cuenta"
				class="scroll-mt-6 rounded-card border border-outline bg-surface p-5"
			>
				<h2>8. Eliminar tu cuenta y tus datos</h2>
				<p>Puedes eliminar tu cuenta y todos tus datos cuando quieras, de tres maneras:</p>
				<ul>
					<li>
						<strong>En la web, sin abrir la app:</strong>
						<a href={resolve('/delete-account')}>orbita.atmosferast.com/delete-account</a>. Entras
						con tu correo y contraseña, o con Google, y confirmas.
					</li>
					<li><strong>En la app:</strong> Ajustes → Eliminar cuenta.</li>
					<li>
						<strong>Por correo:</strong> escríbenos a <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
						desde el correo de tu cuenta y la eliminamos tras verificar que es tuya.
					</li>
				</ul>
				<p>
					La eliminación es inmediata y no se puede deshacer. Se borran tu cuenta, tus cuentas y
					movimientos, tus recibos con sus archivos XML y PDF, tus préstamos y servicios, tus
					sesiones y la vinculación con Google. Lo único que queda son los registros técnicos del
					servidor, que se borran solos a los 14 días (ver el punto 5).
				</p>
			</section>

			<section id="menores" class="scroll-mt-6">
				<h2>9. Menores de edad</h2>
				<p>
					Orbita no está dirigida a menores de 13 años y no recogemos datos de ellos a propósito. Si
					crees que un menor creó una cuenta, escríbenos y la eliminaremos.
				</p>
			</section>

			<section id="cambios" class="scroll-mt-6">
				<h2>10. Cambios y contacto</h2>
				<p>
					Si cambiamos esta política, publicaremos la nueva versión aquí con su fecha. Si el cambio
					es importante, te avisaremos dentro de la app o por correo. Para cualquier duda sobre tu
					privacidad: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
				</p>
			</section>
		</div>
	</article>
</PublicPage>

<style>
	/* The text of a legal page: plain headings, lists and links, readable at any width. */
	.policy :global(h2) {
		font-size: 1.125rem;
		font-weight: 800;
		letter-spacing: -0.01em;
	}
	.policy :global(p),
	.policy :global(li) {
		color: var(--color-muted);
		line-height: 1.65;
	}
	.policy :global(p) {
		margin-top: 0.75rem;
	}
	.policy :global(ul) {
		margin-top: 0.75rem;
		padding-left: 1.25rem;
		list-style: disc;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.policy :global(strong) {
		color: var(--color-ink);
	}
	.policy :global(a) {
		color: var(--color-primary);
		font-weight: 700;
	}
	.policy :global(a:hover) {
		text-decoration: underline;
	}
</style>
