<script lang="ts">
	import { untrack } from 'svelte';
	import { asset } from '$app/paths';
	import { Building2, CalendarDays, FileDigit, Hash } from '@lucide/svelte';
	import {
		Button,
		Card,
		MoneyField,
		SegmentedControl,
		SelectField,
		SwitchRow,
		TextAreaField,
		TextField
	} from '#lib/components/ui/index.ts';
	import XmlDropzone from './XmlDropzone.svelte';
	import { formatMoney, parseAmount, toInputValue } from '#lib/domain/money.ts';
	import { todayIso } from '#lib/domain/dates.ts';
	import {
		netOf,
		validateReceipt,
		withholdingFor,
		type ClientDocType,
		type Receipt,
		type ReceiptDraft,
		type ReceiptSource
	} from '#lib/domain/receipts.ts';
	import type { ParsedReceipt } from '#lib/domain/rhe-xml.ts';
	import { receipts } from '#lib/stores/receipts.svelte.ts';
	import { toasts } from '#lib/stores/toasts.svelte.ts';

	interface Props {
		initial?: Receipt;
		submitLabel: string;
		onsubmit: (draft: ReceiptDraft) => void;
	}

	let { initial, submitLabel, onsubmit }: Props = $props();

	type Mode = 'xml' | 'manual';

	// Form state starts from the receipt being edited, if any (later prop changes are ignored).
	const start = untrack(() => initial);
	let mode = $state<Mode>(start ? 'manual' : 'xml');
	let source = $state<ReceiptSource>(start?.source ?? 'manual');
	let series = $state(start?.series ?? 'E001');
	let number = $state(start?.number ?? '');
	let issueDate = $state(start?.issueDate ?? todayIso());
	let clientName = $state(start?.client.name ?? '');
	let docType = $state<ClientDocType>(start?.client.docType ?? 'RUC');
	let docNumber = $state(start?.client.docNumber ?? '');
	let description = $state(start?.description ?? '');
	let grossText = $state(toInputValue(start?.gross));
	let hasWithholding = $state(start ? start.withholding > 0 : true);
	let withholdingText = $state(toInputValue(start?.withholding));
	let collected = $state(start ? start.collectedOn !== null : false);
	let collectedOn = $state(start?.collectedOn ?? todayIso());
	let xmlNotice = $state<string | null>(null);

	const gross = $derived(parseAmount(grossText) ?? 0);
	// The XML brings the exact withholding; typed receipts use 8%.
	const withholding = $derived(
		!hasWithholding
			? 0
			: withholdingText
				? (parseAmount(withholdingText) ?? 0)
				: withholdingFor(gross)
	);
	const showForm = $derived(mode === 'manual' || source === 'xml');

	function fillFromXml(parsed: ParsedReceipt) {
		source = 'xml';
		series = parsed.series || series;
		number = parsed.number;
		issueDate = parsed.issueDate || issueDate;
		clientName = parsed.clientName;
		docType = parsed.clientDocType;
		docNumber = parsed.clientDocNumber;
		description = parsed.description.slice(0, 500);
		grossText = toInputValue(parsed.gross);
		hasWithholding = (parsed.withholding ?? 0) > 0;
		withholdingText = toInputValue(parsed.withholding);
		const notes: string[] = [];
		if (parsed.currency !== 'PEN')
			notes.push(`El recibo está en ${parsed.currency}; revisa el monto en soles.`);
		if (parsed.missing.length)
			notes.push(`No encontramos: ${parsed.missing.join(', ')}. Complétalo abajo.`);
		xmlNotice = notes.join(' ') || null;
		toasts.success('Leímos el XML. Revisa los datos y guarda.');
	}

	function submit(event: SubmitEvent) {
		event.preventDefault();
		const draft: ReceiptDraft = {
			series: series.trim().toUpperCase(),
			number: number.trim().replace(/^0+(?=\d)/, ''),
			issueDate,
			client: { name: clientName.trim(), docType, docNumber: docNumber.trim() },
			description: description.trim(),
			gross: parseAmount(grossText) ?? 0,
			withholding,
			collectedOn: collected ? collectedOn : null,
			source
		};
		const error = validateReceipt(draft, receipts.items, initial?.id);
		if (error) {
			toasts.error(error);
			return;
		}
		onsubmit(draft);
	}
</script>

<form class="grid gap-6 lg:grid-cols-[1fr_320px]" onsubmit={submit} novalidate>
	<div class="flex flex-col gap-6">
		{#if !initial}
			<SegmentedControl
				label="Cómo registrar"
				bind:value={mode}
				block
				options={[
					{ value: 'xml', label: 'Subir XML' },
					{ value: 'manual', label: 'Escribir a mano' }
				]}
			/>
		{/if}

		{#if mode === 'xml' && !initial}
			<XmlDropzone onparsed={fillFromXml} onerror={(message) => toasts.error(message)} />
			{#if xmlNotice}
				<p class="rounded-2xl bg-orange-soft px-4 py-3 text-sm font-semibold text-orange-strong">
					{xmlNotice}
				</p>
			{/if}
			{#if !showForm}
				<p class="text-center text-[13px] text-muted">
					¿No tienes un XML a la mano?
					<a
						href={asset('examples/rhe-sample.xml')}
						download
						class="font-bold text-primary hover:underline">Descarga uno de ejemplo</a
					>
				</p>
			{/if}
		{/if}

		{#if showForm}
			<Card padding="lg">
				<h2 class="text-base font-extrabold">Recibo</h2>
				<div class="mt-4 grid gap-4 sm:grid-cols-[120px_1fr_1fr]">
					<TextField
						label="Serie"
						bind:value={series}
						icon={Hash}
						maxlength={4}
						placeholder="E001"
					/>
					<TextField
						label="Número"
						bind:value={number}
						icon={FileDigit}
						inputmode="numeric"
						placeholder="58"
					/>
					<TextField
						label="Fecha de emisión"
						type="date"
						bind:value={issueDate}
						icon={CalendarDays}
						max={todayIso()}
					/>
				</div>

				<h2 class="mt-7 text-base font-extrabold">Cliente</h2>
				<div class="mt-4 grid gap-4 sm:grid-cols-[1fr_140px_1fr]">
					<TextField
						label="Nombre o razón social"
						bind:value={clientName}
						icon={Building2}
						placeholder="Empresa S.A.C."
						class="sm:col-span-3"
					/>
					<SelectField
						label="Documento"
						bind:value={docType}
						options={[
							{ value: 'RUC', label: 'RUC' },
							{ value: 'DNI', label: 'DNI' },
							{ value: 'OTRO', label: 'Otro' }
						]}
					/>
					<TextField
						label="Número de documento"
						bind:value={docNumber}
						inputmode="numeric"
						placeholder={docType === 'RUC' ? '11 dígitos' : docType === 'DNI' ? '8 dígitos' : ''}
						class="sm:col-span-2"
					/>
				</div>

				<h2 class="mt-7 text-base font-extrabold">Montos</h2>
				<div class="mt-4 flex flex-col gap-4">
					<MoneyField label="Monto bruto (total por honorarios)" bind:value={grossText} />
					<SwitchRow
						bind:checked={hasWithholding}
						label="Con retención del 8 %"
						description="Cuando el cliente es agente de retención y el monto supera S/ 1,500."
					/>
					{#if hasWithholding}
						<MoneyField
							label="Retención"
							bind:value={withholdingText}
							placeholder={toInputValue(withholdingFor(gross)) || '0.00'}
							hint="Déjalo vacío para calcular el 8 % del bruto."
						/>
					{/if}
				</div>

				<h2 class="mt-7 text-base font-extrabold">Detalle</h2>
				<div class="mt-4 flex flex-col gap-4">
					<TextAreaField
						label="Descripción del servicio"
						bind:value={description}
						placeholder="Desarrollo web - octubre"
					/>
					<SwitchRow
						bind:checked={collected}
						label="Ya me pagaron"
						description="Marca cuándo el cliente te pagó el recibo."
					/>
					{#if collected}
						<TextField
							label="Fecha de cobro"
							type="date"
							bind:value={collectedOn}
							icon={CalendarDays}
							max={todayIso()}
						/>
					{/if}
				</div>
			</Card>
		{/if}
	</div>

	{#if showForm}
		<aside class="lg:sticky lg:top-10 lg:self-start">
			<Card padding="lg">
				<h2 class="text-sm font-bold text-muted">Resumen</h2>
				<dl class="tabular mt-4 flex flex-col gap-3 text-[15px]">
					<div class="flex justify-between gap-3">
						<dt class="text-muted">Bruto</dt>
						<dd class="font-bold">{formatMoney(gross)}</dd>
					</div>
					<div class="flex justify-between gap-3">
						<dt class="text-muted">Retención</dt>
						<dd class="font-bold text-expense-strong">{formatMoney(-withholding)}</dd>
					</div>
					<div class="flex justify-between gap-3 border-t border-divider pt-3">
						<dt class="font-bold">Neto a recibir</dt>
						<dd class="text-lg font-extrabold">{formatMoney(netOf({ gross, withholding }))}</dd>
					</div>
				</dl>
				<p class="mt-4 text-[13px] text-muted">Para el tope anual cuenta el monto bruto.</p>
				<Button type="submit" size="lg" block class="mt-6">{submitLabel}</Button>
			</Card>
		</aside>
	{/if}
</form>
