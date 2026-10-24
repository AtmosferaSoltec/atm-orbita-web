import { describe, expect, it } from 'vitest';
import {
	formatFileSize,
	looksLikePdf,
	receiptDocumentKey,
	validateDocumentFile
} from './documents';

describe('validateDocumentFile', () => {
	it('accepts the right extension within the size limit', () => {
		expect(
			validateDocumentFile({ name: 'RHE10744555189E001109.XML', size: 9000 }, 'xml')
		).toBeNull();
		expect(validateDocumentFile({ name: 'recibo.pdf', size: 200_000 }, 'pdf')).toBeNull();
	});

	it('rejects other files, empty files and files that are too big', () => {
		expect(validateDocumentFile({ name: 'recibo.pdf', size: 10 }, 'xml')).toBe(
			'Elige el archivo .xml del recibo.'
		);
		expect(validateDocumentFile({ name: 'recibo.pdf', size: 0 }, 'pdf')).toBe(
			'El archivo está vacío.'
		);
		expect(validateDocumentFile({ name: 'recibo.pdf', size: 6_000_000 }, 'pdf')).toBe(
			'El archivo pesa más de 5.0 MB.'
		);
	});
});

describe('looksLikePdf', () => {
	it('checks the %PDF- signature, not the name', async () => {
		expect(await looksLikePdf(new Blob(['%PDF-1.7\n...']))).toBe(true);
		expect(await looksLikePdf(new Blob(['<?xml version="1.0"?>']))).toBe(false);
	});
});

describe('helpers', () => {
	it('lays out keys as in R2', () => {
		expect(receiptDocumentKey('r1', 'd1', 'pdf')).toBe('receipts/r1/d1.pdf');
	});

	it('formats sizes', () => {
		expect(formatFileSize(820)).toBe('820 B');
		expect(formatFileSize(12_345)).toBe('12 KB');
		expect(formatFileSize(1_430_000)).toBe('1.4 MB');
	});
});
