/**
 * Linking of collective bargaining agreement citations.
 *
 * NJASAP publishes the agreement one section per page, so any citation resolves
 * to its top-level section number: 19.4(H)(2)(a) and 19.9 both land on 19.
 */

const BASE = 'https://www.njasap.com/contract/?section=';

/** Public link for a citation such as `19.4(H)` or `8.5`. */
export const cbaUrl = (citation: string): string => {
	const m = /(\d+)/.exec(citation);
	return m === null ? BASE : BASE + m[1];
};

/**
 * Citations take three shapes in our copy:
 *
 *   - prefixed, e.g. "subsection 19.5(C)" or "§19.9"
 *   - dotted, e.g. "19.4(H)(2)(a)" or "8.5"
 *   - a bare section, e.g. "Section 8"
 *
 * A bare number is deliberately NOT matched. Messages are full of ordinary
 * numbers ("7 work days", "21 day minimum") and linking those would be noise.
 */
const CITATION =
	/((?:§\s*|\b[Ss]ubsections?\s+)\d+(?:\.\d+)?(?:\([A-Za-z0-9]+\))*|\b\d{1,2}\.\d{1,2}(?:\([A-Za-z0-9]+\))*|\b[Ss]ection\s+\d{1,2}\b)/g;

export interface CbaSegment {
	text: string;
	/** Set when this segment is a citation that should link out. */
	href?: string;
}

/** Split prose into plain runs and linkable citations. */
export const cbaSegments = (text: string): CbaSegment[] => {
	const out: CbaSegment[] = [];
	let last = 0;
	for (const match of text.matchAll(CITATION)) {
		const i = match.index ?? 0;
		if (i > last) out.push({ text: text.slice(last, i) });
		out.push({ text: match[0], href: cbaUrl(match[0]) });
		last = i + match[0].length;
	}
	if (last < text.length) out.push({ text: text.slice(last) });
	return out;
};
