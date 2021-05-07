const c = [
	() => import("..\\..\\..\\src\\routes\\$layout.svelte"),
	() => import("..\\components\\error.svelte"),
	() => import("..\\..\\..\\src\\routes\\about\\index.svelte")
];

const d = decodeURIComponent;

export const routes = [
	// src/routes/about/index.svelte
	[/^\/about\/?$/, [c[0], c[2]], [c[1]]]
];

export const fallback = [c[0](), c[1]()];