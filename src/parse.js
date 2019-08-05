import { expression as exp } from 'acorn-sontag';

/*
	Parses a Sontag-flavored expression,
	splitting up the filters, etc.
 */
export const expression = str => new Function(`return ${exp(str)}`);

export const TAG = /^\s*([^\s]+)\s*([^]+)$/;
export const INCLUDE = /^([^]+?)(\s+ignore\s+missing)?(?:\s+with\s+([^]+?))?(\s+only)?$/;
export const SET = /^([^\s]+?)(?:\s*=[^=]*([^]+))?$/;
export const FOR = /^([^\,]+?)(?:\s*\,\s*([^\s]+?))?\s+in\s+([^]+)$/;

export const WITH = /^([^]+?)?(\s+only)?$/;
