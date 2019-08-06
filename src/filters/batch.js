/*
	The `batch` filter from Twig
	https://twig.symfony.com/doc/2.x/filters/batch.html
 */
export default function batch(count, arr) {
	if (!count || count < 1) return arr;
	let res = [];
	let current = [];
	for (let i = 0; i < arr.length; i++) {
		if (current.length < count) {
			current.push(arr[i]);
			if (current.length === count) {
				res.push(current);
				current = [];
			}
		}
	}
	if (current.length) {
		res.push(current);
	}
	return res;
}