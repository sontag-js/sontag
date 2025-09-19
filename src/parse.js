import { parseExpression, parseExpressions, parseFunctionSignature } from 'acorn-sontag';

/* 
	Parses a Sontag-flavored expression 
	and returns a function that can evaluate it
	when it has its `this` attached to a context.
*/

// The AsyncFunction constructor is not a global object,
// so we need to pick it off an anonymous async function.
let AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

/*
	Parses the string `str` into an async function.
	The function then needs to be call()-ed with a certain scope.
 */
export function expression(str) {
	return wrapAwait(parseExpression(str, { async: true }));
}

export function wrapAwait(str) {
	return new AsyncFunction(
		`return ${ str }`
	);
}

export function func(str) {
	return parseFunctionSignature(str, { async: true });
};

export function expressions(str) {
	return parseExpressions(str, { async: true });
}

/*
	Regular expression from: 
	https://github.com/tc39/proposal-regexp-unicode-property-escapes
*/

const IDENTIFIER_REGEX = /[$_\p{ID_Start}][$\u200C\u200D\p{ID_Continue}]*/u;

export function identifier(str) {
	return str?.trim().match(IDENTIFIER_REGEX)?.[0] ?? null;
}