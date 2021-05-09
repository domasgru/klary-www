import { ssr } from '@sveltejs/kit/ssr';
import root from './generated/root.svelte';
import { set_paths } from './runtime/paths.js';
import { set_prerendering } from './runtime/env.js';
import * as user_hooks from "./hooks.js";

const template = ({ head, body }) => "<!DOCTYPE html>\n<html lang=\"en\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<link rel=\"icon\" href=\"/favicon.ico\" />\n\t\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n\t\t" + head + "\n\t</head>\n\t<body>\n\t\t<div id=\"svelte\">" + body + "</div>\n\t\t<script src=\"https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js\"></script>\n        <script src=\"https://cdn.spline.design/lib/anime.min.js\"></script>\n\t\t<script src=\"js/spline.runtime.min.js\"></script>\n        <script src=\"js/main.js\"></script>\n\t</body>\n</html>\n";

set_paths({"base":"","assets":"/."});

// allow paths to be overridden in svelte-kit start
export function init({ paths, prerendering }) {
	set_paths(paths);
	set_prerendering(prerendering);
}

const d = decodeURIComponent;
const empty = () => ({});

const manifest = {
	assets: [{"file":"favicon.ico","size":1150,"type":"image/vnd.microsoft.icon"},{"file":"images/dashboard.png","size":168873,"type":"image/png"},{"file":"js/main.js","size":84,"type":"application/javascript"},{"file":"js/spline.runtime.min.js","size":496346,"type":"application/javascript"},{"file":"robots.txt","size":67,"type":"text/plain"}],
	layout: "src/routes/$layout.svelte",
	error: ".svelte/build/components/error.svelte",
	routes: [
		{
						type: 'page',
						pattern: /^\/$/,
						params: empty,
						a: ["src/routes/$layout.svelte", "src/routes/index.svelte"],
						b: [".svelte/build/components/error.svelte"]
					},
		{
						type: 'page',
						pattern: /^\/index\/Header\/?$/,
						params: empty,
						a: ["src/routes/$layout.svelte", "src/routes/index/Header.svelte"],
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
	"src/routes/$layout.svelte": () => import("..\\..\\src\\routes\\$layout.svelte"),".svelte/build/components/error.svelte": () => import("./components\\error.svelte"),"src/routes/index.svelte": () => import("..\\..\\src\\routes\\index.svelte"),"src/routes/index/Header.svelte": () => import("..\\..\\src\\routes\\index\\Header.svelte")
};

const metadata_lookup = {"src/routes/$layout.svelte":{"entry":"/./_app/pages\\$layout.svelte-2871177c.js","css":["/./_app/assets/pages\\$layout.svelte-45c542c1.css"],"js":["/./_app/pages\\$layout.svelte-2871177c.js","/./_app/chunks/vendor-c7844ae4.js"],"styles":null},".svelte/build/components/error.svelte":{"entry":"/./_app/error.svelte-b1b4f0aa.js","css":[],"js":["/./_app/error.svelte-b1b4f0aa.js","/./_app/chunks/vendor-c7844ae4.js"],"styles":null},"src/routes/index.svelte":{"entry":"/./_app/pages\\index.svelte-e8a24356.js","css":["/./_app/assets/pages\\index.svelte-408be84f.css"],"js":["/./_app/pages\\index.svelte-e8a24356.js","/./_app/chunks/vendor-c7844ae4.js","/./_app/chunks/Logo-154cb472.js"],"styles":null},"src/routes/index/Header.svelte":{"entry":"/./_app/pages\\index\\Header.svelte-05c2755d.js","css":["/./_app/assets/pages\\index\\Header.svelte-d9a290d7.css"],"js":["/./_app/pages\\index\\Header.svelte-05c2755d.js","/./_app/chunks/vendor-c7844ae4.js","/./_app/chunks/Logo-154cb472.js"],"styles":null}};

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
		entry: "/./_app/start-8e85e1df.js",
		css: ["/./_app/assets/start-a8cd1609.css"],
		js: ["/./_app/start-8e85e1df.js","/./_app/chunks/vendor-c7844ae4.js"],
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