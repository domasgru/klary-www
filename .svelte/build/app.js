import { ssr } from '@sveltejs/kit/ssr';
import root from './generated/root.svelte';
import { set_paths } from './runtime/paths.js';
import { set_prerendering } from './runtime/env.js';
import * as user_hooks from "./hooks.js";

const template = ({ head, body }) => "<!DOCTYPE html>\n<html lang=\"en\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<link rel=\"icon\" href=\"/favicon.ico\" />\n\t\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n\t\t" + head + "\n\t</head>\n\t<body>\n\t\t<div id=\"svelte\">" + body + "</div>\n\t</body>\n</html>\n";

set_paths({"base":"","assets":"/."});

// allow paths to be overridden in svelte-kit start
export function init({ paths, prerendering }) {
	set_paths(paths);
	set_prerendering(prerendering);
}

const d = decodeURIComponent;
const empty = () => ({});

const manifest = {
	assets: [{"file":"favicon.ico","size":1150,"type":"image/vnd.microsoft.icon"},{"file":"robots.txt","size":67,"type":"text/plain"}],
	layout: "src/routes/$layout.svelte",
	error: ".svelte/build/components/error.svelte",
	routes: [
		{
						type: 'page',
						pattern: /^\/about\/?$/,
						params: empty,
						a: ["src/routes/$layout.svelte", "src/routes/about/index.svelte"],
						b: [".svelte/build/components/error.svelte"]
					}
	]
};

// this looks redundant, but the indirection allows us to access
// named imports without triggering Rollup's missing import detection
const get_hooks = hooks => ({
	getContext: hooks.getContext || (() => ({})),
	getSession: hooks.getSession || (() => ({})),
	handle: hooks.handle || (({ request, render }) => render(request))
});

const hooks = get_hooks(user_hooks);

const module_lookup = {
	"src/routes/$layout.svelte": () => import("..\\..\\src\\routes\\$layout.svelte"),".svelte/build/components/error.svelte": () => import("./components\\error.svelte"),"src/routes/about/index.svelte": () => import("..\\..\\src\\routes\\about\\index.svelte")
};

const metadata_lookup = {"src/routes/$layout.svelte":{"entry":"/./_app/pages\\$layout.svelte-adc2be5e.js","css":["/./_app/assets/pages\\$layout.svelte-7dc66399.css"],"js":["/./_app/pages\\$layout.svelte-adc2be5e.js","/./_app/chunks/vendor-8eb5184c.js"],"styles":null},".svelte/build/components/error.svelte":{"entry":"/./_app/error.svelte-e83c958a.js","css":[],"js":["/./_app/error.svelte-e83c958a.js","/./_app/chunks/vendor-8eb5184c.js"],"styles":null},"src/routes/about/index.svelte":{"entry":"/./_app/pages\\about\\index.svelte-6a126f6b.js","css":["/./_app/assets/pages\\about\\index.svelte-b99eceb0.css"],"js":["/./_app/pages\\about\\index.svelte-6a126f6b.js","/./_app/chunks/vendor-8eb5184c.js"],"styles":null}};

async function load_component(file) {
	if (!module_lookup[file]) {
		console.log({ file });
	}
	return {
		module: await module_lookup[file](),
		...metadata_lookup[file]
	};
}

export function render(request, {
	paths = {"base":"","assets":"/."},
	local = false,
	dependencies,
	only_render_prerenderable_pages = false,
	get_static_file
} = {}) {
	return ssr({
		...request,
		host: request.headers["host"]
	}, {
		paths,
		local,
		template,
		manifest,
		load_component,
		target: "#svelte",
		entry: "/./_app/start-8b41a6ea.js",
		css: ["/./_app/assets/start-a8cd1609.css"],
		js: ["/./_app/start-8b41a6ea.js","/./_app/chunks/vendor-8eb5184c.js"],
		root,
		hooks,
		dev: false,
		amp: false,
		dependencies,
		only_render_prerenderable_pages,
		get_component_path: id => "/./_app/" + entry_lookup[id],
		get_stack: error => error.stack,
		get_static_file,
		ssr: true,
		router: true,
		hydrate: true
	});
}