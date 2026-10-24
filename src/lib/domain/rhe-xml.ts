// Reads the XML of a recibo por honorarios electrónico (SUNAT, UBL) to prefill the receipt form.
// It looks up elements by local name so it does not depend on namespace prefixes, and it tolerates
// missing fields: whatever it cannot find stays empty for the person to complete.

import { parseAmount, type Cents } from './money';
import { isIsoDate, type IsoDate } from './dates';
import { withholdingFor, type ClientDocType } from './receipts';

export interface ParsedReceipt {
	series: string;
	number: string;
	issueDate: IsoDate | '';
	issuerName: string;
	issuerRuc: string;
	clientName: string;
	clientDocType: ClientDocType;
	clientDocNumber: string;
	description: string;
	currency: string;
	gross: Cents | null;
	withholding: Cents | null;
	/** Fields that could not be read, in Spanish, to tell the person what to check. */
	missing: string[];
}

export class RheXmlError extends Error {}

function children(parent: Element | Document, name: string): Element[] {
	return Array.from(parent.getElementsByTagNameNS('*', name));
}

function first(parent: Element | Document | null | undefined, ...path: string[]): Element | null {
	let current: Element | Document | null | undefined = parent;
	for (const name of path) {
		if (!current) return null;
		current = children(current, name)[0] ?? null;
	}
	return (current as Element | null) ?? null;
}

function text(parent: Element | Document | null | undefined, ...path: string[]): string {
	return first(parent, ...path)?.textContent?.trim() ?? '';
}

function amount(element: Element | null): Cents | null {
	const value = element?.textContent?.trim();
	return value ? parseAmount(value) : null;
}

/** SUNAT identity document codes: 6 = RUC, 1 = DNI. */
function docTypeFrom(code: string, number: string): ClientDocType {
	if (code === '6' || /^\d{11}$/.test(number)) return 'RUC';
	if (code === '1' || /^\d{8}$/.test(number)) return 'DNI';
	return 'OTRO';
}

function partyDocument(party: Element | null): { code: string; number: string } {
	const idElement = first(party, 'PartyIdentification', 'ID');
	const number = idElement?.textContent?.trim() || text(party, 'CustomerAssignedAccountID') || '';
	const code = idElement?.getAttribute('schemeID') ?? text(party, 'AdditionalAccountID');
	return { code, number };
}

function partyName(party: Element | null): string {
	return text(party, 'RegistrationName') || text(party, 'PartyName', 'Name') || text(party, 'Name');
}

export function parseRheXml(xml: string): ParsedReceipt {
	const doc = new DOMParser().parseFromString(xml, 'application/xml');
	if (doc.getElementsByTagName('parsererror').length > 0) {
		throw new RheXmlError('El archivo no es un XML válido.');
	}

	const root = doc.documentElement;
	const id =
		children(root, 'ID')
			.find((el) => el.parentElement === root)
			?.textContent?.trim() ?? '';
	if (!id && !first(doc, 'LegalMonetaryTotal')) {
		throw new RheXmlError('No parece un recibo por honorarios electrónico.');
	}
	const [series = '', number = ''] = id.split('-');

	const issueDateText = text(root, 'IssueDate');
	const supplier = first(doc, 'AccountingSupplierParty');
	const customer = first(doc, 'AccountingCustomerParty');
	const customerDoc = partyDocument(customer);
	const supplierDoc = partyDocument(supplier);

	const totals = first(doc, 'LegalMonetaryTotal');
	const payable = amount(first(totals, 'PayableAmount'));
	const lineExtension =
		amount(first(totals, 'LineExtensionAmount')) ??
		amount(first(doc, 'InvoiceLine', 'LineExtensionAmount'));
	const taxInclusive = amount(first(totals, 'TaxInclusiveAmount'));
	const taxAmount = amount(first(doc, 'TaxTotal', 'TaxAmount'));

	// Gross = amount before the 8% withholding. Prefer explicit totals; derive it otherwise.
	let gross = lineExtension ?? taxInclusive;
	if (gross === null && payable !== null) gross = payable + (taxAmount ?? 0);
	let withholding = taxAmount;
	if (withholding === null && gross !== null && payable !== null) withholding = gross - payable;
	if (withholding !== null && gross !== null && withholding >= gross)
		withholding = withholdingFor(gross);

	const currency =
		first(totals, 'PayableAmount')?.getAttribute('currencyID') ||
		text(root, 'DocumentCurrencyCode') ||
		'PEN';

	const parsed: ParsedReceipt = {
		series,
		number,
		issueDate: isIsoDate(issueDateText) ? issueDateText : '',
		issuerName: partyName(supplier),
		issuerRuc: supplierDoc.number,
		clientName: partyName(customer),
		clientDocType: docTypeFrom(customerDoc.code, customerDoc.number),
		clientDocNumber: customerDoc.number,
		description: text(doc, 'InvoiceLine', 'Item', 'Description') || text(root, 'Note'),
		currency,
		gross,
		withholding,
		missing: []
	};

	if (!parsed.series || !parsed.number) parsed.missing.push('serie y número');
	if (!parsed.issueDate) parsed.missing.push('fecha de emisión');
	if (!parsed.clientName) parsed.missing.push('cliente');
	if (parsed.gross === null) parsed.missing.push('monto');
	return parsed;
}
