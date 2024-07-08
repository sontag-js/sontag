import { readFile, exists } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

const read = promisify(readFile);
const check = promisify(exists);

const __cache__ = new Map();

export default async (candidates, cwd) => {
	
	if (!Array.isArray(candidates)) {
		candidates = [ candidates ];
	}

	let it = candidates[Symbol.iterator]();
	let is = it.next();
	while (!is.done) {
		let template = is.value;
		is = it.next();
		if (__cache__.has(template)) {
			let content = __cache__.get(template);
			if (content === null) continue;
			return content;
		}
		let path = join(cwd, template);
		if (await check(path)) {
			let content = read(path, 'utf8');
			__cache__.set(template, content);
			return content;
		} else {
			__cache__.set(template, null);
			continue;
		}
	}

	throw new Error(`Can't find anything for ${candidates.join(', ')}`);
};