const adapterStatic = require('@sveltejs/adapter-static');
const pkg = require('./package.json');
const path = require('path');

/** @type {import('@sveltejs/kit').Config} */
module.exports = {
	kit: {
		// By default, `npm run build` will create a standard Node app.
		// You can create optimized builds for different platforms by
		// specifying a different adapter
		adapter: adapterStatic(),

		// hydrate the <div id="svelte"> element in src/app.html
		target: '#svelte',

		vite: {
			resolve: {
				alias: {
					$: path.resolve('./src')
				}
			},
			ssr: {
				noExternal: Object.keys(pkg.dependencies || {})
			}
		}
	}
};
