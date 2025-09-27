/* Bitwise OR */
export default function bitor(a, b) {
	return ~(~a & ~b);
}