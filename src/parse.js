import { expression as exp } from 'acorn-sontag';

/* 
	Parses a Sontag-flavored expression 
	and returns a function that can evaluate it
	when it has its `this` attached to a context.
*/
export const expression = str => new Function(`return ${exp(str)}`);
