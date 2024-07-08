import { _default } from '../../src/filters';
import tape from 'tape';

tape('default', t => {
	let fb = 10;
	t.equal(_default(fb, false), fb);
	t.equal(_default(fb, null), fb);
	t.equal(_default(fb, undefined), fb);
	let empty_array = [];
	let empty_obj = {};
	t.equal(_default(fb, empty_array), empty_array);
	t.equal(_default(fb, empty_obj), empty_obj);
	t.equal(_default(fb, true), true);
	
	t.end();
})