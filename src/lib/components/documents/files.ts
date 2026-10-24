/** Saves a blob with the given name through a temporary link. */
export function downloadBlob(blob: Blob, fileName: string): void {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = fileName;
	link.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Indents an XML document for reading. SUNAT's digital signature (UBLExtensions) is collapsed:
 * it is several screens of base64 that nobody needs to read.
 */
export function formatXml(xml: string): string {
	const doc = new DOMParser().parseFromString(xml, 'application/xml');
	if (doc.getElementsByTagName('parsererror').length > 0) return xml;

	const lines: string[] = [];
	const walk = (element: Element, depth: number) => {
		const pad = '  '.repeat(depth);
		const tag = element.tagName;
		if (element.localName === 'UBLExtensions') {
			lines.push(`${pad}<${tag}>…firma digital de SUNAT…</${tag}>`);
			return;
		}
		const attrs = Array.from(element.attributes)
			.map((a) => ` ${a.name}="${a.value}"`)
			.join('');
		const kids = Array.from(element.childNodes).filter(
			(n) =>
				n.nodeType === Node.ELEMENT_NODE || (n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
		);
		if (kids.length === 0) {
			lines.push(`${pad}<${tag}${attrs}/>`);
		} else if (kids.length === 1 && kids[0].nodeType === Node.TEXT_NODE) {
			lines.push(`${pad}<${tag}${attrs}>${kids[0].textContent?.trim()}</${tag}>`);
		} else {
			lines.push(`${pad}<${tag}${attrs}>`);
			for (const kid of kids) {
				if (kid.nodeType === Node.ELEMENT_NODE) walk(kid as Element, depth + 1);
				else lines.push(`${pad}  ${kid.textContent?.trim()}`);
			}
			lines.push(`${pad}</${tag}>`);
		}
	};
	walk(doc.documentElement, 0);
	return lines.join('\n');
}
