// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { formatXml } from './files';

describe('formatXml', () => {
	it('indents the XML and collapses the digital signature', () => {
		const xml = readFileSync('src/lib/domain/fixtures/rhe-sample.xml', 'utf8').replace(
			'<ext:ExtensionContent/>',
			'<ext:ExtensionContent><ds:Signature xmlns:ds="x">MIIF...</ds:Signature></ext:ExtensionContent>'
		);
		const formatted = formatXml(xml);
		expect(formatted).toContain('  <cbc:ID>E001-58</cbc:ID>');
		expect(formatted).toContain('<ext:UBLExtensions>…firma digital de SUNAT…</ext:UBLExtensions>');
		expect(formatted).not.toContain('MIIF');
	});

	it('returns invalid XML untouched', () => {
		expect(formatXml('<a><b></a>')).toBe('<a><b></a>');
	});
});
