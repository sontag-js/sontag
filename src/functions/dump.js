export default function dump(...args) {
	return args.map(item => JSON.stringify(item, null, 2)).join('\n');
}