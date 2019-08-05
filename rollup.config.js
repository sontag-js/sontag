import babel from 'rollup-plugin-babel';
import pkg from './package.json';

let opts = {
	exclude: 'node_modules/**',
	plugins: [
		'@babel/plugin-proposal-class-properties'
	]
};

export default [

	// UMD, minified
	{
		input: "src/index.js",
		output: {
			file: pkg.main,
			format: 'cjs',
			name: 'sontag',
		},
		plugins: [ babel(opts) ],
		external: ['fs', 'util', 'path', ...Object.keys(pkg.dependencies)]
	},

	// ES6 modules
	{
		input: 'src/index.js',
		output: {
			file: pkg.module,
			format: 'es'
		},
		plugins: [babel(opts) ],
		external:  ['fs', 'util', 'path', ...Object.keys(pkg.dependencies)]
	}
];