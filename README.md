```js

let feuille = require('feuille');

let env = new feuille('dir', {
	// options
});

let {
	render,
	renderSync,
	renderString,
	renderStringSync
}

let html = await render('my-template.html', {
	// data
});


```