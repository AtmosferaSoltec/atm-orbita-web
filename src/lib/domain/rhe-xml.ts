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

/** Descendants by local name, whatever their namespace prefix (`cbc:ID`, `ID`…). */
function children(parent: Element | Document, name: string): Element[] {
	return Array.from(parent.querySelectorAll('*')).filter((el) => el.localName === name);
}

function first(parent: Element | Document | null | undefined, ...path: string[]): Element | null {
	let current: Element | Document | null | undefined = parent;
	for (const name of path) {
		if (!current) return null;
		current = children(current, name)[0] ?? null;
	}
	return (current as Element | null) ?? null;
}

/** Trimmed text with inner runs of spaces collapsed (SUNAT pads names with spaces). */
function clean(value: string | null | undefined): string {
	return value?.replace(/\s+/g, ' ').trim() ?? '';
}

function text(parent: Element | Document | null | undefined, ...path: string[]): string {
	return clean(first(parent, ...path)?.textContent);
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

/** A direct child of `parent` by local name (root fields also appear nested, e.g. in OrderReference). */
function child(parent: Element | null, name: string): Element | null {
	return parent ? (Array.from(parent.children).find((el) => el.localName === name) ?? null) : null;
}

/** Amounts of 0.00 count as missing: SUNAT fills unused totals with zeros. */
function positive(value: Cents | null): Cents | null {
	return value !== null && value > 0 ? value : null;
}

/** The TaxSubtotal of the 4th-category withholding (`TaxCategory/ID` = `RET 4TA`). */
function withholdingSubtotal(doc: Document): Element | null {
	return (
		children(doc, 'TaxSubtotal').find((subtotal) =>
			text(subtotal, 'TaxCategory', 'ID').toUpperCase().startsWith('RET')
		) ?? null
	);
}

/*
 * Shape of SUNAT's RHE XML (checked against a real receipt, Sep 2026):
 * - cbc:ID `E001-109` and cbc:IssueDate as direct children of Invoice.
 * - Customer: CustomerAssignedAccountID (number), AdditionalAccountID (6 = RUC), PartyName/Name.
 * - Gross: TaxTotal/TaxSubtotal/TaxableAmount (also InvoiceLine/Price/PriceAmount).
 * - Net: LegalMonetaryTotal/PayableAmount. LineExtensionAmount comes as 0.00, so it is ignored.
 * - Withholding: the InvoiceLine TaxSubtotal whose TaxCategory/ID is `RET 4TA` (8%).
 * - cbc:Note holds the amount in words, not a description.
 */
export function parseRheXml(xml: string): ParsedReceipt {
	const doc = new DOMParser().parseFromString(xml, 'application/xml');
	if (doc.getElementsByTagName('parsererror').length > 0) {
		throw new RheXmlError('El archivo no es un XML válido.');
	}

	const root = doc.documentElement;
	const id = clean(child(root, 'ID')?.textContent);
	if (!id && !first(doc, 'LegalMonetaryTotal')) {
		throw new RheXmlError('No parece un recibo por honorarios electrónico.');
	}
	const [series = '', number = ''] = id.split('-');

	const issueDateText = clean(child(root, 'IssueDate')?.textContent);
	const supplier = first(doc, 'AccountingSupplierParty');
	const customer = first(doc, 'AccountingCustomerParty');
	const customerDoc = partyDocument(customer);
	const supplierDoc = partyDocument(supplier);

	const totals = first(doc, 'LegalMonetaryTotal');
	const payable = positive(amount(first(totals, 'PayableAmount')));
	const retention = withholdingSubtotal(doc);
	const declaredWithholding = amount(first(retention, 'TaxAmount'));

	const gross =
		positive(amount(first(child(root, 'TaxTotal'), 'TaxSubtotal', 'TaxableAmount'))) ??
		positive(amount(first(doc, 'InvoiceLine', 'Price', 'PriceAmount'))) ??
		positive(amount(first(totals, 'TaxInclusiveAmount'))) ??
		positive(amount(first(totals, 'LineExtensionAmount'))) ??
		(payable !== null ? payable + (declaredWithholding ?? 0) : null);

	// The net actually payable is the most reliable figure: withholding = gross − net.
	let withholding: Cents | null = declaredWithholding;
	if (gross !== null && payable !== null && gross >= payable) withholding = gross - payable;
	if (withholding !== null && gross !== null && withholding >= gross)
		withholding = withholdingFor(gross);

	const currency =
		first(totals, 'PayableAmount')?.getAttribute('currencyID') ||
		clean(child(root, 'DocumentCurrencyCode')?.textContent) ||
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
		description: text(doc, 'InvoiceLine', 'Item', 'Description'),
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
