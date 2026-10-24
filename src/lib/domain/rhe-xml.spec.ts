// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseRheXml, RheXmlError } from './rhe-xml';

// Same shape as a real SUNAT RHE, with fictional data and an 8% withholding.
const withWithholding = readFileSync('static/examples/rhe-sample.xml', 'utf8');

// A real receipt without withholding: TaxAmount and the RET 4TA subtotal are 0.00.
const withoutWithholding = withWithholding
	.replaceAll('280.00', '0.00')
	.replaceAll('3220.00', '2000.00')
	.replaceAll('3500.00', '2000.00');

describe('parseRheXml', () => {
	it('reads the fields of a SUNAT receipt', () => {
		expect(parseRheXml(withWithholding)).toEqual({
			series: 'E001',
			number: '58',
			issueDate: '2026-10-20',
			issuerName: 'PEREZ QUISPE JUAN CARLOS',
			issuerRuc: '10456789012',
			clientName: 'ANDES DIGITAL S.A.C.',
			clientDocType: 'RUC',
			clientDocNumber: '20601234567',
			description: 'DESARROLLO DE APLICACION WEB - OCTUBRE 2026',
			currency: 'PEN',
			gross: 350000,
			withholding: 28000,
			missing: []
		});
	});

	it('ignores the 0.00 LineExtensionAmount and reads a receipt without withholding', () => {
		const parsed = parseRheXml(withoutWithholding);
		expect(parsed.gross).toBe(200000);
		expect(parsed.withholding).toBe(0);
	});

	it('does not take the amount in words (Note) as the description', () => {
		const parsed = parseRheXml(withWithholding.replace(/<cac:Item>[\s\S]*?<\/cac:Item>/, ''));
		expect(parsed.description).toBe('');
	});

	it('reports what it could not find', () => {
		const parsed = parseRheXml(
			'<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"><LegalMonetaryTotal/></Invoice>'
		);
		expect(parsed.missing).toEqual(['serie y número', 'fecha de emisión', 'cliente', 'monto']);
	});

	it('rejects files that are not XML', () => {
		expect(() => parseRheXml('%PDF-1.7')).toThrow(RheXmlError);
	});
});
