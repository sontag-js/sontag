import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const cache = new Map();

export default async function load(candidates, cwd) {
	
	if (!Array.isArray(candidates)) {
		candidates = [candidates];
	}

	for await(let template of candidates) {
		let content;
		if (cache.has(template)) {
			content = cache.get(template);
		} else {
			try {
				content = await readFile(join(cwd, template), 'utf8');
			} catch(err) {
				content = null;
			}
			cache.set(template, content);
		}
		if (content !== null) {
			return content;
		}
	}

	return null;
};