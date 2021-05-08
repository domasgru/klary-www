import {randomBytes, createHash} from "crypto";
import http from "http";
import https from "https";
import zlib from "zlib";
import Stream, {PassThrough, pipeline} from "stream";
import {types} from "util";
import {format, parse, resolve} from "url";
import {createClient} from "@supabase/supabase-js";
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
var unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped$1 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function noop() {
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
const subscriber_queue = [];
function writable(value, start = noop) {
  let stop;
  const subscribers = [];
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (let i = 0; i < subscribers.length; i += 1) {
          const s2 = subscribers[i];
          s2[1]();
          subscriber_queue.push(s2, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.push(subscriber);
    if (subscribers.length === 1) {
      stop = start(set) || noop;
    }
    run2(value);
    return () => {
      const index2 = subscribers.indexOf(subscriber);
      if (index2 !== -1) {
        subscribers.splice(index2, 1);
      }
      if (subscribers.length === 0) {
        stop();
        stop = null;
      }
    };
  }
  return {set, update, subscribe};
}
const s$1 = JSON.stringify;
async function render_response({
  options,
  $session,
  page_config,
  status,
  error: error2,
  branch,
  page
}) {
  const css2 = new Set(options.css);
  const js = new Set(options.js);
  const styles = new Set();
  const serialized_data = [];
  let rendered;
  let is_private = false;
  let maxage;
  if (branch) {
    branch.forEach(({node, loaded, fetched, uses_credentials}) => {
      if (node.css)
        node.css.forEach((url) => css2.add(url));
      if (node.js)
        node.js.forEach((url) => js.add(url));
      if (node.styles)
        node.styles.forEach((content) => styles.add(content));
      if (fetched && page_config.hydrate)
        serialized_data.push(...fetched);
      if (uses_credentials)
        is_private = true;
      maxage = loaded.maxage;
    });
    if (error2) {
      if (options.dev) {
        error2.stack = await options.get_stack(error2);
      } else {
        error2.stack = String(error2);
      }
    }
    const session = writable($session);
    const props = {
      stores: {
        page: writable(null),
        navigating: writable(null),
        session
      },
      page,
      components: branch.map(({node}) => node.module.default)
    };
    for (let i = 0; i < branch.length; i += 1) {
      props[`props_${i}`] = await branch[i].loaded.props;
    }
    let session_tracking_active = false;
    const unsubscribe = session.subscribe(() => {
      if (session_tracking_active)
        is_private = true;
    });
    session_tracking_active = true;
    try {
      rendered = options.root.render(props);
    } finally {
      unsubscribe();
    }
  } else {
    rendered = {head: "", html: "", css: ""};
  }
  const links = options.amp ? styles.size > 0 ? `<style amp-custom>${Array.from(styles).join("\n")}</style>` : "" : [
    ...Array.from(js).map((dep) => `<link rel="modulepreload" href="${dep}">`),
    ...Array.from(css2).map((dep) => `<link rel="stylesheet" href="${dep}">`)
  ].join("\n		");
  let init2 = "";
  if (options.amp) {
    init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"></script>`;
  } else if (page_config.router || page_config.hydrate) {
    init2 = `<script type="module">
			import { start } from ${s$1(options.entry)};
			start({
				target: ${options.target ? `document.querySelector(${s$1(options.target)})` : "document.body"},
				paths: ${s$1(options.paths)},
				session: ${try_serialize($session, (error3) => {
      throw new Error(`Failed to serialize session data: ${error3.message}`);
    })},
				host: ${page.host ? s$1(page.host) : "location.host"},
				route: ${!!page_config.router},
				spa: ${!page_config.ssr},
				hydrate: ${page_config.ssr && page_config.hydrate ? `{
					status: ${status},
					error: ${serialize_error(error2)},
					nodes: [
						${branch.map(({node}) => `import(${s$1(node.entry)})`).join(",\n						")}
					],
					page: {
						host: ${page.host ? s$1(page.host) : "location.host"}, // TODO this is redundant
						path: ${s$1(page.path)},
						query: new URLSearchParams(${s$1(page.query.toString())}),
						params: ${s$1(page.params)}
					}
				}` : "null"}
			});
		</script>`;
  }
  const head = [
    rendered.head,
    styles.size && !options.amp ? `<style data-svelte>${Array.from(styles).join("\n")}</style>` : "",
    links,
    init2
  ].join("\n\n		");
  const body = options.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({url, json}) => `<script type="svelte-data" url="${url}">${json}</script>`).join("\n\n			")}
		`.replace(/^\t{2}/gm, "");
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${is_private ? "private" : "public"}, max-age=${maxage}`;
  }
  return {
    status,
    headers,
    body: options.template({head, body})
  };
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(err);
    return null;
  }
}
function serialize_error(error2) {
  if (!error2)
    return null;
  let serialized = try_serialize(error2);
  if (!serialized) {
    const {name, message, stack} = error2;
    serialized = try_serialize({name, message, stack});
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, "");
  const firstComma = uri.indexOf(",");
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError("malformed data: URI");
  }
  const meta = uri.substring(5, firstComma).split(";");
  let charset = "";
  let base64 = false;
  const type = meta[0] || "text/plain";
  let typeFull = type;
  for (let i = 1; i < meta.length; i++) {
    if (meta[i] === "base64") {
      base64 = true;
    } else {
      typeFull += `;${meta[i]}`;
      if (meta[i].indexOf("charset=") === 0) {
        charset = meta[i].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ";charset=US-ASCII";
    charset = "US-ASCII";
  }
  const encoding = base64 ? "base64" : "ascii";
  const data = unescape(uri.substring(firstComma + 1));
  const buffer = Buffer.from(data, encoding);
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;
  return buffer;
}
var src = dataUriToBuffer;
const {Readable} = Stream;
const wm = new WeakMap();
async function* read(parts) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* part.stream();
    } else {
      yield part;
    }
  }
}
class Blob {
  constructor(blobParts = [], options = {type: ""}) {
    let size = 0;
    const parts = blobParts.map((element) => {
      let buffer;
      if (element instanceof Buffer) {
        buffer = element;
      } else if (ArrayBuffer.isView(element)) {
        buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
      } else if (element instanceof ArrayBuffer) {
        buffer = Buffer.from(element);
      } else if (element instanceof Blob) {
        buffer = element;
      } else {
        buffer = Buffer.from(typeof element === "string" ? element : String(element));
      }
      size += buffer.length || buffer.size || 0;
      return buffer;
    });
    const type = options.type === void 0 ? "" : String(options.type).toLowerCase();
    wm.set(this, {
      type: /[^\u0020-\u007E]/.test(type) ? "" : type,
      size,
      parts
    });
  }
  get size() {
    return wm.get(this).size;
  }
  get type() {
    return wm.get(this).type;
  }
  async text() {
    return Buffer.from(await this.arrayBuffer()).toString();
  }
  async arrayBuffer() {
    const data = new Uint8Array(this.size);
    let offset = 0;
    for await (const chunk of this.stream()) {
      data.set(chunk, offset);
      offset += chunk.length;
    }
    return data.buffer;
  }
  stream() {
    return Readable.from(read(wm.get(this).parts));
  }
  slice(start = 0, end = this.size, type = "") {
    const {size} = this;
    let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
    let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
    const span = Math.max(relativeEnd - relativeStart, 0);
    const parts = wm.get(this).parts.values();
    const blobParts = [];
    let added = 0;
    for (const part of parts) {
      const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
      if (relativeStart && size2 <= relativeStart) {
        relativeStart -= size2;
        relativeEnd -= size2;
      } else {
        const chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
        blobParts.push(chunk);
        added += ArrayBuffer.isView(chunk) ? chunk.byteLength : chunk.size;
        relativeStart = 0;
        if (added >= span) {
          break;
        }
      }
    }
    const blob = new Blob([], {type});
    Object.assign(wm.get(blob), {size: span, parts: blobParts});
    return blob;
  }
  get [Symbol.toStringTag]() {
    return "Blob";
  }
  static [Symbol.hasInstance](object) {
    return typeof object === "object" && typeof object.stream === "function" && object.stream.length === 0 && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
  }
}
Object.defineProperties(Blob.prototype, {
  size: {enumerable: true},
  type: {enumerable: true},
  slice: {enumerable: true}
});
var fetchBlob = Blob;
class FetchBaseError extends Error {
  constructor(message, type) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.type = type;
  }
  get name() {
    return this.constructor.name;
  }
  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }
}
class FetchError extends FetchBaseError {
  constructor(message, type, systemError) {
    super(message, type);
    if (systemError) {
      this.code = this.errno = systemError.code;
      this.erroredSysCall = systemError.syscall;
    }
  }
}
const NAME = Symbol.toStringTag;
const isURLSearchParameters = (object) => {
  return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
};
const isBlob = (object) => {
  return typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
};
function isFormData(object) {
  return typeof object === "object" && typeof object.append === "function" && typeof object.set === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.delete === "function" && typeof object.keys === "function" && typeof object.values === "function" && typeof object.entries === "function" && typeof object.constructor === "function" && object[NAME] === "FormData";
}
const isAbortSignal = (object) => {
  return typeof object === "object" && object[NAME] === "AbortSignal";
};
const carriage = "\r\n";
const dashes = "-".repeat(2);
const carriageLength = Buffer.byteLength(carriage);
const getFooter = (boundary) => `${dashes}${boundary}${dashes}${carriage.repeat(2)}`;
function getHeader(boundary, name, field) {
  let header = "";
  header += `${dashes}${boundary}${carriage}`;
  header += `Content-Disposition: form-data; name="${name}"`;
  if (isBlob(field)) {
    header += `; filename="${field.name}"${carriage}`;
    header += `Content-Type: ${field.type || "application/octet-stream"}`;
  }
  return `${header}${carriage.repeat(2)}`;
}
const getBoundary = () => randomBytes(8).toString("hex");
async function* formDataIterator(form, boundary) {
  for (const [name, value] of form) {
    yield getHeader(boundary, name, value);
    if (isBlob(value)) {
      yield* value.stream();
    } else {
      yield value;
    }
    yield carriage;
  }
  yield getFooter(boundary);
}
function getFormDataLength(form, boundary) {
  let length = 0;
  for (const [name, value] of form) {
    length += Buffer.byteLength(getHeader(boundary, name, value));
    if (isBlob(value)) {
      length += value.size;
    } else {
      length += Buffer.byteLength(String(value));
    }
    length += carriageLength;
  }
  length += Buffer.byteLength(getFooter(boundary));
  return length;
}
const INTERNALS$2 = Symbol("Body internals");
class Body {
  constructor(body, {
    size = 0
  } = {}) {
    let boundary = null;
    if (body === null) {
      body = null;
    } else if (isURLSearchParameters(body)) {
      body = Buffer.from(body.toString());
    } else if (isBlob(body))
      ;
    else if (Buffer.isBuffer(body))
      ;
    else if (types.isAnyArrayBuffer(body)) {
      body = Buffer.from(body);
    } else if (ArrayBuffer.isView(body)) {
      body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
    } else if (body instanceof Stream)
      ;
    else if (isFormData(body)) {
      boundary = `NodeFetchFormDataBoundary${getBoundary()}`;
      body = Stream.Readable.from(formDataIterator(body, boundary));
    } else {
      body = Buffer.from(String(body));
    }
    this[INTERNALS$2] = {
      body,
      boundary,
      disturbed: false,
      error: null
    };
    this.size = size;
    if (body instanceof Stream) {
      body.on("error", (err) => {
        const error2 = err instanceof FetchBaseError ? err : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${err.message}`, "system", err);
        this[INTERNALS$2].error = error2;
      });
    }
  }
  get body() {
    return this[INTERNALS$2].body;
  }
  get bodyUsed() {
    return this[INTERNALS$2].disturbed;
  }
  async arrayBuffer() {
    const {buffer, byteOffset, byteLength} = await consumeBody(this);
    return buffer.slice(byteOffset, byteOffset + byteLength);
  }
  async blob() {
    const ct = this.headers && this.headers.get("content-type") || this[INTERNALS$2].body && this[INTERNALS$2].body.type || "";
    const buf = await this.buffer();
    return new fetchBlob([buf], {
      type: ct
    });
  }
  async json() {
    const buffer = await consumeBody(this);
    return JSON.parse(buffer.toString());
  }
  async text() {
    const buffer = await consumeBody(this);
    return buffer.toString();
  }
  buffer() {
    return consumeBody(this);
  }
}
Object.defineProperties(Body.prototype, {
  body: {enumerable: true},
  bodyUsed: {enumerable: true},
  arrayBuffer: {enumerable: true},
  blob: {enumerable: true},
  json: {enumerable: true},
  text: {enumerable: true}
});
async function consumeBody(data) {
  if (data[INTERNALS$2].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`);
  }
  data[INTERNALS$2].disturbed = true;
  if (data[INTERNALS$2].error) {
    throw data[INTERNALS$2].error;
  }
  let {body} = data;
  if (body === null) {
    return Buffer.alloc(0);
  }
  if (isBlob(body)) {
    body = body.stream();
  }
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (!(body instanceof Stream)) {
    return Buffer.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const err = new FetchError(`content size at ${data.url} over limit: ${data.size}`, "max-size");
        body.destroy(err);
        throw err;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error2) {
    if (error2 instanceof FetchBaseError) {
      throw error2;
    } else {
      throw new FetchError(`Invalid response body while trying to fetch ${data.url}: ${error2.message}`, "system", error2);
    }
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === "string")) {
        return Buffer.from(accum.join(""));
      }
      return Buffer.concat(accum, accumBytes);
    } catch (error2) {
      throw new FetchError(`Could not create Buffer from response body for ${data.url}: ${error2.message}`, "system", error2);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
const clone = (instance, highWaterMark) => {
  let p1;
  let p2;
  let {body} = instance;
  if (instance.bodyUsed) {
    throw new Error("cannot clone body after it is used");
  }
  if (body instanceof Stream && typeof body.getBoundary !== "function") {
    p1 = new PassThrough({highWaterMark});
    p2 = new PassThrough({highWaterMark});
    body.pipe(p1);
    body.pipe(p2);
    instance[INTERNALS$2].body = p1;
    body = p2;
  }
  return body;
};
const extractContentType = (body, request) => {
  if (body === null) {
    return null;
  }
  if (typeof body === "string") {
    return "text/plain;charset=UTF-8";
  }
  if (isURLSearchParameters(body)) {
    return "application/x-www-form-urlencoded;charset=UTF-8";
  }
  if (isBlob(body)) {
    return body.type || null;
  }
  if (Buffer.isBuffer(body) || types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
    return null;
  }
  if (body && typeof body.getBoundary === "function") {
    return `multipart/form-data;boundary=${body.getBoundary()}`;
  }
  if (isFormData(body)) {
    return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`;
  }
  if (body instanceof Stream) {
    return null;
  }
  return "text/plain;charset=UTF-8";
};
const getTotalBytes = (request) => {
  const {body} = request;
  if (body === null) {
    return 0;
  }
  if (isBlob(body)) {
    return body.size;
  }
  if (Buffer.isBuffer(body)) {
    return body.length;
  }
  if (body && typeof body.getLengthSync === "function") {
    return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
  }
  if (isFormData(body)) {
    return getFormDataLength(request[INTERNALS$2].boundary);
  }
  return null;
};
const writeToStream = (dest, {body}) => {
  if (body === null) {
    dest.end();
  } else if (isBlob(body)) {
    body.stream().pipe(dest);
  } else if (Buffer.isBuffer(body)) {
    dest.write(body);
    dest.end();
  } else {
    body.pipe(dest);
  }
};
const validateHeaderName = typeof http.validateHeaderName === "function" ? http.validateHeaderName : (name) => {
  if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
    const err = new TypeError(`Header name must be a valid HTTP token [${name}]`);
    Object.defineProperty(err, "code", {value: "ERR_INVALID_HTTP_TOKEN"});
    throw err;
  }
};
const validateHeaderValue = typeof http.validateHeaderValue === "function" ? http.validateHeaderValue : (name, value) => {
  if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
    const err = new TypeError(`Invalid character in header content ["${name}"]`);
    Object.defineProperty(err, "code", {value: "ERR_INVALID_CHAR"});
    throw err;
  }
};
class Headers extends URLSearchParams {
  constructor(init2) {
    let result = [];
    if (init2 instanceof Headers) {
      const raw = init2.raw();
      for (const [name, values] of Object.entries(raw)) {
        result.push(...values.map((value) => [name, value]));
      }
    } else if (init2 == null)
      ;
    else if (typeof init2 === "object" && !types.isBoxedPrimitive(init2)) {
      const method = init2[Symbol.iterator];
      if (method == null) {
        result.push(...Object.entries(init2));
      } else {
        if (typeof method !== "function") {
          throw new TypeError("Header pairs must be iterable");
        }
        result = [...init2].map((pair) => {
          if (typeof pair !== "object" || types.isBoxedPrimitive(pair)) {
            throw new TypeError("Each header pair must be an iterable object");
          }
          return [...pair];
        }).map((pair) => {
          if (pair.length !== 2) {
            throw new TypeError("Each header pair must be a name/value tuple");
          }
          return [...pair];
        });
      }
    } else {
      throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
    }
    result = result.length > 0 ? result.map(([name, value]) => {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return [String(name).toLowerCase(), String(value)];
    }) : void 0;
    super(result);
    return new Proxy(this, {
      get(target, p, receiver) {
        switch (p) {
          case "append":
          case "set":
            return (name, value) => {
              validateHeaderName(name);
              validateHeaderValue(name, String(value));
              return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase(), String(value));
            };
          case "delete":
          case "has":
          case "getAll":
            return (name) => {
              validateHeaderName(name);
              return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase());
            };
          case "keys":
            return () => {
              target.sort();
              return new Set(URLSearchParams.prototype.keys.call(target)).keys();
            };
          default:
            return Reflect.get(target, p, receiver);
        }
      }
    });
  }
  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }
  toString() {
    return Object.prototype.toString.call(this);
  }
  get(name) {
    const values = this.getAll(name);
    if (values.length === 0) {
      return null;
    }
    let value = values.join(", ");
    if (/^content-encoding$/i.test(name)) {
      value = value.toLowerCase();
    }
    return value;
  }
  forEach(callback) {
    for (const name of this.keys()) {
      callback(this.get(name), name);
    }
  }
  *values() {
    for (const name of this.keys()) {
      yield this.get(name);
    }
  }
  *entries() {
    for (const name of this.keys()) {
      yield [name, this.get(name)];
    }
  }
  [Symbol.iterator]() {
    return this.entries();
  }
  raw() {
    return [...this.keys()].reduce((result, key) => {
      result[key] = this.getAll(key);
      return result;
    }, {});
  }
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return [...this.keys()].reduce((result, key) => {
      const values = this.getAll(key);
      if (key === "host") {
        result[key] = values[0];
      } else {
        result[key] = values.length > 1 ? values : values[0];
      }
      return result;
    }, {});
  }
}
Object.defineProperties(Headers.prototype, ["get", "entries", "forEach", "values"].reduce((result, property) => {
  result[property] = {enumerable: true};
  return result;
}, {}));
function fromRawHeaders(headers = []) {
  return new Headers(headers.reduce((result, value, index2, array) => {
    if (index2 % 2 === 0) {
      result.push(array.slice(index2, index2 + 2));
    }
    return result;
  }, []).filter(([name, value]) => {
    try {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return true;
    } catch (e) {
      return false;
    }
  }));
}
const redirectStatus = new Set([301, 302, 303, 307, 308]);
const isRedirect = (code) => {
  return redirectStatus.has(code);
};
const INTERNALS$1 = Symbol("Response internals");
class Response extends Body {
  constructor(body = null, options = {}) {
    super(body, options);
    const status = options.status || 200;
    const headers = new Headers(options.headers);
    if (body !== null && !headers.has("Content-Type")) {
      const contentType = extractContentType(body);
      if (contentType) {
        headers.append("Content-Type", contentType);
      }
    }
    this[INTERNALS$1] = {
      url: options.url,
      status,
      statusText: options.statusText || "",
      headers,
      counter: options.counter,
      highWaterMark: options.highWaterMark
    };
  }
  get url() {
    return this[INTERNALS$1].url || "";
  }
  get status() {
    return this[INTERNALS$1].status;
  }
  get ok() {
    return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
  }
  get redirected() {
    return this[INTERNALS$1].counter > 0;
  }
  get statusText() {
    return this[INTERNALS$1].statusText;
  }
  get headers() {
    return this[INTERNALS$1].headers;
  }
  get highWaterMark() {
    return this[INTERNALS$1].highWaterMark;
  }
  clone() {
    return new Response(clone(this, this.highWaterMark), {
      url: this.url,
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
      ok: this.ok,
      redirected: this.redirected,
      size: this.size
    });
  }
  static redirect(url, status = 302) {
    if (!isRedirect(status)) {
      throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
    }
    return new Response(null, {
      headers: {
        location: new URL(url).toString()
      },
      status
    });
  }
  get [Symbol.toStringTag]() {
    return "Response";
  }
}
Object.defineProperties(Response.prototype, {
  url: {enumerable: true},
  status: {enumerable: true},
  ok: {enumerable: true},
  redirected: {enumerable: true},
  statusText: {enumerable: true},
  headers: {enumerable: true},
  clone: {enumerable: true}
});
const getSearch = (parsedURL) => {
  if (parsedURL.search) {
    return parsedURL.search;
  }
  const lastOffset = parsedURL.href.length - 1;
  const hash = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
  return parsedURL.href[lastOffset - hash.length] === "?" ? "?" : "";
};
const INTERNALS = Symbol("Request internals");
const isRequest = (object) => {
  return typeof object === "object" && typeof object[INTERNALS] === "object";
};
class Request extends Body {
  constructor(input, init2 = {}) {
    let parsedURL;
    if (isRequest(input)) {
      parsedURL = new URL(input.url);
    } else {
      parsedURL = new URL(input);
      input = {};
    }
    let method = init2.method || input.method || "GET";
    method = method.toUpperCase();
    if ((init2.body != null || isRequest(input)) && input.body !== null && (method === "GET" || method === "HEAD")) {
      throw new TypeError("Request with GET/HEAD method cannot have body");
    }
    const inputBody = init2.body ? init2.body : isRequest(input) && input.body !== null ? clone(input) : null;
    super(inputBody, {
      size: init2.size || input.size || 0
    });
    const headers = new Headers(init2.headers || input.headers || {});
    if (inputBody !== null && !headers.has("Content-Type")) {
      const contentType = extractContentType(inputBody, this);
      if (contentType) {
        headers.append("Content-Type", contentType);
      }
    }
    let signal = isRequest(input) ? input.signal : null;
    if ("signal" in init2) {
      signal = init2.signal;
    }
    if (signal !== null && !isAbortSignal(signal)) {
      throw new TypeError("Expected signal to be an instanceof AbortSignal");
    }
    this[INTERNALS] = {
      method,
      redirect: init2.redirect || input.redirect || "follow",
      headers,
      parsedURL,
      signal
    };
    this.follow = init2.follow === void 0 ? input.follow === void 0 ? 20 : input.follow : init2.follow;
    this.compress = init2.compress === void 0 ? input.compress === void 0 ? true : input.compress : init2.compress;
    this.counter = init2.counter || input.counter || 0;
    this.agent = init2.agent || input.agent;
    this.highWaterMark = init2.highWaterMark || input.highWaterMark || 16384;
    this.insecureHTTPParser = init2.insecureHTTPParser || input.insecureHTTPParser || false;
  }
  get method() {
    return this[INTERNALS].method;
  }
  get url() {
    return format(this[INTERNALS].parsedURL);
  }
  get headers() {
    return this[INTERNALS].headers;
  }
  get redirect() {
    return this[INTERNALS].redirect;
  }
  get signal() {
    return this[INTERNALS].signal;
  }
  clone() {
    return new Request(this);
  }
  get [Symbol.toStringTag]() {
    return "Request";
  }
}
Object.defineProperties(Request.prototype, {
  method: {enumerable: true},
  url: {enumerable: true},
  headers: {enumerable: true},
  redirect: {enumerable: true},
  clone: {enumerable: true},
  signal: {enumerable: true}
});
const getNodeRequestOptions = (request) => {
  const {parsedURL} = request[INTERNALS];
  const headers = new Headers(request[INTERNALS].headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "*/*");
  }
  let contentLengthValue = null;
  if (request.body === null && /^(post|put)$/i.test(request.method)) {
    contentLengthValue = "0";
  }
  if (request.body !== null) {
    const totalBytes = getTotalBytes(request);
    if (typeof totalBytes === "number" && !Number.isNaN(totalBytes)) {
      contentLengthValue = String(totalBytes);
    }
  }
  if (contentLengthValue) {
    headers.set("Content-Length", contentLengthValue);
  }
  if (!headers.has("User-Agent")) {
    headers.set("User-Agent", "node-fetch");
  }
  if (request.compress && !headers.has("Accept-Encoding")) {
    headers.set("Accept-Encoding", "gzip,deflate,br");
  }
  let {agent} = request;
  if (typeof agent === "function") {
    agent = agent(parsedURL);
  }
  if (!headers.has("Connection") && !agent) {
    headers.set("Connection", "close");
  }
  const search = getSearch(parsedURL);
  const requestOptions = {
    path: parsedURL.pathname + search,
    pathname: parsedURL.pathname,
    hostname: parsedURL.hostname,
    protocol: parsedURL.protocol,
    port: parsedURL.port,
    hash: parsedURL.hash,
    search: parsedURL.search,
    query: parsedURL.query,
    href: parsedURL.href,
    method: request.method,
    headers: headers[Symbol.for("nodejs.util.inspect.custom")](),
    insecureHTTPParser: request.insecureHTTPParser,
    agent
  };
  return requestOptions;
};
class AbortError extends FetchBaseError {
  constructor(message, type = "aborted") {
    super(message, type);
  }
}
const supportedSchemas = new Set(["data:", "http:", "https:"]);
async function fetch(url, options_) {
  return new Promise((resolve2, reject) => {
    const request = new Request(url, options_);
    const options = getNodeRequestOptions(request);
    if (!supportedSchemas.has(options.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${options.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (options.protocol === "data:") {
      const data = src(request.url);
      const response2 = new Response(data, {headers: {"Content-Type": data.typeFull}});
      resolve2(response2);
      return;
    }
    const send = (options.protocol === "https:" ? https : http).request;
    const {signal} = request;
    let response = null;
    const abort = () => {
      const error2 = new AbortError("The operation was aborted.");
      reject(error2);
      if (request.body && request.body instanceof Stream.Readable) {
        request.body.destroy(error2);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error2);
    };
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const abortAndFinalize = () => {
      abort();
      finalize();
    };
    const request_ = send(options);
    if (signal) {
      signal.addEventListener("abort", abortAndFinalize);
    }
    const finalize = () => {
      request_.abort();
      if (signal) {
        signal.removeEventListener("abort", abortAndFinalize);
      }
    };
    request_.on("error", (err) => {
      reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, "system", err));
      finalize();
    });
    request_.on("response", (response_) => {
      request_.setTimeout(0);
      const headers = fromRawHeaders(response_.rawHeaders);
      if (isRedirect(response_.statusCode)) {
        const location = headers.get("Location");
        const locationURL = location === null ? null : new URL(location, request.url);
        switch (request.redirect) {
          case "error":
            reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
            finalize();
            return;
          case "manual":
            if (locationURL !== null) {
              try {
                headers.set("Location", locationURL);
              } catch (error2) {
                reject(error2);
              }
            }
            break;
          case "follow": {
            if (locationURL === null) {
              break;
            }
            if (request.counter >= request.follow) {
              reject(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
              finalize();
              return;
            }
            const requestOptions = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: request.body,
              signal: request.signal,
              size: request.size
            };
            if (response_.statusCode !== 303 && request.body && options_.body instanceof Stream.Readable) {
              reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
              finalize();
              return;
            }
            if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === "POST") {
              requestOptions.method = "GET";
              requestOptions.body = void 0;
              requestOptions.headers.delete("content-length");
            }
            resolve2(fetch(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
        }
      }
      response_.once("end", () => {
        if (signal) {
          signal.removeEventListener("abort", abortAndFinalize);
        }
      });
      let body = pipeline(response_, new PassThrough(), (error2) => {
        reject(error2);
      });
      if (process.version < "v12.10") {
        response_.on("aborted", abortAndFinalize);
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      };
      const codings = headers.get("Content-Encoding");
      if (!request.compress || request.method === "HEAD" || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      const zlibOptions = {
        flush: zlib.Z_SYNC_FLUSH,
        finishFlush: zlib.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body = pipeline(body, zlib.createGunzip(zlibOptions), (error2) => {
          reject(error2);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = pipeline(response_, new PassThrough(), (error2) => {
          reject(error2);
        });
        raw.once("data", (chunk) => {
          if ((chunk[0] & 15) === 8) {
            body = pipeline(body, zlib.createInflate(), (error2) => {
              reject(error2);
            });
          } else {
            body = pipeline(body, zlib.createInflateRaw(), (error2) => {
              reject(error2);
            });
          }
          response = new Response(body, responseOptions);
          resolve2(response);
        });
        return;
      }
      if (codings === "br") {
        body = pipeline(body, zlib.createBrotliDecompress(), (error2) => {
          reject(error2);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      response = new Response(body, responseOptions);
      resolve2(response);
    });
    writeToStream(request_, request);
  });
}
function normalize(loaded) {
  if (loaded.error) {
    const error2 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    const status = loaded.status;
    if (!(error2 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error2}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return {status: 500, error: error2};
    }
    return {status, error: error2};
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  return loaded;
}
const s = JSON.stringify;
async function load_node({
  request,
  options,
  route,
  page,
  node,
  $session,
  context,
  is_leaf,
  is_error,
  status,
  error: error2
}) {
  const {module} = node;
  let uses_credentials = false;
  const fetched = [];
  let loaded;
  if (module.load) {
    const load_input = {
      page,
      get session() {
        uses_credentials = true;
        return $session;
      },
      fetch: async (resource, opts = {}) => {
        let url;
        if (typeof resource === "string") {
          url = resource;
        } else {
          url = resource.url;
          opts = {
            method: resource.method,
            headers: resource.headers,
            body: resource.body,
            mode: resource.mode,
            credentials: resource.credentials,
            cache: resource.cache,
            redirect: resource.redirect,
            referrer: resource.referrer,
            integrity: resource.integrity,
            ...opts
          };
        }
        if (options.local && url.startsWith(options.paths.assets)) {
          url = url.replace(options.paths.assets, "");
        }
        const parsed = parse(url);
        let response;
        if (parsed.protocol) {
          response = await fetch(parsed.href, opts);
        } else {
          const resolved = resolve(request.path, parsed.pathname);
          const filename = resolved.slice(1);
          const filename_html = `${filename}/index.html`;
          const asset = options.manifest.assets.find((d) => d.file === filename || d.file === filename_html);
          if (asset) {
            if (options.get_static_file) {
              response = new Response(options.get_static_file(asset.file), {
                headers: {
                  "content-type": asset.type
                }
              });
            } else {
              response = await fetch(`http://${page.host}/${asset.file}`, opts);
            }
          }
          if (!response) {
            const headers = {...opts.headers};
            if (opts.credentials !== "omit") {
              uses_credentials = true;
              headers.cookie = request.headers.cookie;
              if (!headers.authorization) {
                headers.authorization = request.headers.authorization;
              }
            }
            const rendered = await ssr({
              host: request.host,
              method: opts.method || "GET",
              headers,
              path: resolved,
              body: opts.body,
              query: new URLSearchParams(parsed.query || "")
            }, {
              ...options,
              fetched: url,
              initiator: route
            });
            if (rendered) {
              if (options.dependencies) {
                options.dependencies.set(resolved, rendered);
              }
              response = new Response(rendered.body, {
                status: rendered.status,
                headers: rendered.headers
              });
            }
          }
        }
        if (response) {
          const proxy = new Proxy(response, {
            get(response2, key, receiver) {
              async function text() {
                const body = await response2.text();
                const headers = {};
                response2.headers.forEach((value, key2) => {
                  if (key2 !== "etag" && key2 !== "set-cookie")
                    headers[key2] = value;
                });
                fetched.push({
                  url,
                  json: `{"status":${response2.status},"statusText":${s(response2.statusText)},"headers":${s(headers)},"body":${escape$1(body)}}`
                });
                return body;
              }
              if (key === "text") {
                return text;
              }
              if (key === "json") {
                return async () => {
                  return JSON.parse(await text());
                };
              }
              return Reflect.get(response2, key, receiver);
            }
          });
          return proxy;
        }
        return response || new Response("Not found", {
          status: 404
        });
      },
      context: {...context}
    };
    if (is_error) {
      load_input.status = status;
      load_input.error = error2;
    }
    loaded = await module.load.call(null, load_input);
  } else {
    loaded = {};
  }
  if (!loaded && is_leaf && !is_error)
    return;
  return {
    node,
    loaded: normalize(loaded),
    context: loaded.context || context,
    fetched,
    uses_credentials
  };
}
const escaped$2 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
function escape$1(str) {
  let result = '"';
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charAt(i);
    const code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$2) {
      result += escaped$2[char];
    } else if (code >= 55296 && code <= 57343) {
      const next = str.charCodeAt(i + 1);
      if (code <= 56319 && next >= 56320 && next <= 57343) {
        result += char + str[++i];
      } else {
        result += `\\u${code.toString(16).toUpperCase()}`;
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
async function respond_with_error({request, options, $session, status, error: error2}) {
  const default_layout = await options.load_component(options.manifest.layout);
  const default_error = await options.load_component(options.manifest.error);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params: {}
  };
  const loaded = await load_node({
    request,
    options,
    route: null,
    page,
    node: default_layout,
    $session,
    context: {},
    is_leaf: false,
    is_error: false
  });
  const branch = [
    loaded,
    await load_node({
      request,
      options,
      route: null,
      page,
      node: default_error,
      $session,
      context: loaded.context,
      is_leaf: false,
      is_error: true,
      status,
      error: error2
    })
  ];
  try {
    return await render_response({
      request,
      options,
      $session,
      page_config: {
        hydrate: options.hydrate,
        router: options.router,
        ssr: options.ssr
      },
      status,
      error: error2,
      branch,
      page
    });
  } catch (error3) {
    return {
      status: 500,
      headers: {},
      body: options.dev ? error3.stack : error3.message
    };
  }
}
async function respond({request, options, $session, route}) {
  const match = route.pattern.exec(request.path);
  const params = route.params(match);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params
  };
  let nodes;
  try {
    nodes = await Promise.all(route.a.map((id) => id && options.load_component(id)));
  } catch (error3) {
    return await respond_with_error({
      request,
      options,
      $session,
      status: 500,
      error: error3
    });
  }
  const leaf = nodes[nodes.length - 1].module;
  const page_config = {
    ssr: "ssr" in leaf ? leaf.ssr : options.ssr,
    router: "router" in leaf ? leaf.router : options.router,
    hydrate: "hydrate" in leaf ? leaf.hydrate : options.hydrate
  };
  if (options.only_render_prerenderable_pages && !leaf.prerender) {
    return {
      status: 204,
      headers: {},
      body: null
    };
  }
  let branch;
  let status = 200;
  let error2;
  ssr:
    if (page_config.ssr) {
      let context = {};
      branch = [];
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        let loaded;
        if (node) {
          try {
            loaded = await load_node({
              request,
              options,
              route,
              page,
              node,
              $session,
              context,
              is_leaf: i === nodes.length - 1,
              is_error: false
            });
            if (!loaded)
              return;
            if (loaded.loaded.redirect) {
              return {
                status: loaded.loaded.status,
                headers: {
                  location: loaded.loaded.redirect
                }
              };
            }
            if (loaded.loaded.error) {
              ({status, error: error2} = loaded.loaded);
            }
          } catch (e) {
            status = 500;
            error2 = e;
          }
          if (error2) {
            while (i--) {
              if (route.b[i]) {
                const error_node = await options.load_component(route.b[i]);
                let error_loaded;
                let node_loaded;
                let j = i;
                while (!(node_loaded = branch[j])) {
                  j -= 1;
                }
                try {
                  error_loaded = await load_node({
                    request,
                    options,
                    route,
                    page,
                    node: error_node,
                    $session,
                    context: node_loaded.context,
                    is_leaf: false,
                    is_error: true,
                    status,
                    error: error2
                  });
                  if (error_loaded.loaded.error) {
                    continue;
                  }
                  branch = branch.slice(0, j + 1).concat(error_loaded);
                  break ssr;
                } catch (e) {
                  continue;
                }
              }
            }
            return await respond_with_error({
              request,
              options,
              $session,
              status,
              error: error2
            });
          }
        }
        branch.push(loaded);
        if (loaded && loaded.loaded.context) {
          context = {
            ...context,
            ...loaded.loaded.context
          };
        }
      }
    }
  try {
    return await render_response({
      request,
      options,
      $session,
      page_config,
      status,
      error: error2,
      branch: branch && branch.filter(Boolean),
      page
    });
  } catch (error3) {
    return await respond_with_error({
      request,
      options,
      $session,
      status: 500,
      error: error3
    });
  }
}
async function render_page(request, route, options) {
  if (options.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const $session = await options.hooks.getSession({context: request.context});
  if (route) {
    const response = await respond({
      request,
      options,
      $session,
      route
    });
    if (response) {
      return response;
    }
    if (options.fetched) {
      return {
        status: 500,
        headers: {},
        body: `Bad request in load function: failed to fetch ${options.fetched}`
      };
    }
  } else {
    return await respond_with_error({
      request,
      options,
      $session,
      status: 404,
      error: new Error(`Not found: ${request.path}`)
    });
  }
}
async function render_route(request, route) {
  const mod = await route.load();
  const handler = mod[request.method.toLowerCase().replace("delete", "del")];
  if (handler) {
    const match = route.pattern.exec(request.path);
    const params = route.params(match);
    const response = await handler({...request, params});
    if (response) {
      if (typeof response !== "object" || response.body == null) {
        return {
          status: 500,
          body: `Invalid response from route ${request.path}; ${response.body == null ? "body is missing" : `expected an object, got ${typeof response}`}`,
          headers: {}
        };
      }
      let {status = 200, body, headers = {}} = response;
      headers = lowercase_keys(headers);
      if (typeof body === "object" && !("content-type" in headers) || headers["content-type"] === "application/json") {
        headers = {...headers, "content-type": "application/json"};
        body = JSON.stringify(body);
      }
      return {status, body, headers};
    }
  }
}
function lowercase_keys(obj) {
  const clone2 = {};
  for (const key in obj) {
    clone2[key.toLowerCase()] = obj[key];
  }
  return clone2;
}
function md5(body) {
  return createHash("md5").update(body).digest("hex");
}
async function ssr(incoming, options) {
  if (incoming.path.endsWith("/") && incoming.path !== "/") {
    const q = incoming.query.toString();
    return {
      status: 301,
      headers: {
        location: incoming.path.slice(0, -1) + (q ? `?${q}` : "")
      }
    };
  }
  const context = await options.hooks.getContext(incoming) || {};
  try {
    return await options.hooks.handle({
      request: {
        ...incoming,
        params: null,
        context
      },
      render: async (request) => {
        for (const route of options.manifest.routes) {
          if (!route.pattern.test(request.path))
            continue;
          const response = route.type === "endpoint" ? await render_route(request, route) : await render_page(request, route, options);
          if (response) {
            if (response.status === 200) {
              if (!/(no-store|immutable)/.test(response.headers["cache-control"])) {
                const etag = `"${md5(response.body)}"`;
                if (request.headers["if-none-match"] === etag) {
                  return {
                    status: 304,
                    headers: {},
                    body: null
                  };
                }
                response.headers["etag"] = etag;
              }
            }
            return response;
          }
        }
        return await render_page(request, null, options);
      }
    });
  } catch (e) {
    if (e && e.stack) {
      e.stack = await options.get_stack(e);
    }
    console.error(e && e.stack || e);
    return {
      status: 500,
      headers: {},
      body: options.dev ? e.stack : e.message
    };
  }
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
let current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
function afterUpdate(fn) {
  get_current_component().$$.after_update.push(fn);
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
const escaped = {
  '"': "&quot;",
  "'": "&#39;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;"
};
function escape(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped[match]);
}
const missing_component = {
  $$render: () => ""
};
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
let on_destroy;
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(parent_component ? parent_component.$$.context : context || []),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({$$});
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, {$$slots = {}, context = new Map()} = {}) => {
      on_destroy = [];
      const result = {title: "", head: "", css: new Set()};
      const html = $$render(result, props, {}, $$slots, context);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css2) => css2.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape(value)) : `"${value}"`}`}`;
}
var root_svelte = "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}";
const css$2 = {
  code: "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}",
  map: `{"version":3,"file":"root.svelte","sources":["root.svelte"],"sourcesContent":["<!-- This file is generated by @sveltejs/kit \u2014 do not edit it! -->\\n<script>\\n\\timport { setContext, afterUpdate, onMount } from 'svelte';\\n\\n\\t// stores\\n\\texport let stores;\\n\\texport let page;\\n\\n\\texport let components;\\n\\texport let props_0 = null;\\n\\texport let props_1 = null;\\n\\texport let props_2 = null;\\n\\n\\tsetContext('__svelte__', stores);\\n\\n\\t$: stores.page.set(page);\\n\\tafterUpdate(stores.page.notify);\\n\\n\\tlet mounted = false;\\n\\tlet navigated = false;\\n\\tlet title = null;\\n\\n\\tonMount(() => {\\n\\t\\tconst unsubscribe = stores.page.subscribe(() => {\\n\\t\\t\\tif (mounted) {\\n\\t\\t\\t\\tnavigated = true;\\n\\t\\t\\t\\ttitle = document.title || 'untitled page';\\n\\t\\t\\t}\\n\\t\\t});\\n\\n\\t\\tmounted = true;\\n\\t\\treturn unsubscribe;\\n\\t});\\n</script>\\n\\n<svelte:component this={components[0]} {...(props_0 || {})}>\\n\\t{#if components[1]}\\n\\t\\t<svelte:component this={components[1]} {...(props_1 || {})}>\\n\\t\\t\\t{#if components[2]}\\n\\t\\t\\t\\t<svelte:component this={components[2]} {...(props_2 || {})}/>\\n\\t\\t\\t{/if}\\n\\t\\t</svelte:component>\\n\\t{/if}\\n</svelte:component>\\n\\n{#if mounted}\\n\\t<div id=\\"svelte-announcer\\" aria-live=\\"assertive\\" aria-atomic=\\"true\\">\\n\\t\\t{#if navigated}\\n\\t\\t\\tNavigated to {title}\\n\\t\\t{/if}\\n\\t</div>\\n{/if}\\n\\n<style>\\n\\t#svelte-announcer {\\n\\t\\tposition: absolute;\\n\\t\\tleft: 0;\\n\\t\\ttop: 0;\\n\\t\\tclip: rect(0 0 0 0);\\n\\t\\tclip-path: inset(50%);\\n\\t\\toverflow: hidden;\\n\\t\\twhite-space: nowrap;\\n\\t\\twidth: 1px;\\n\\t\\theight: 1px;\\n\\t}\\n</style>"],"names":[],"mappings":"AAsDC,iBAAiB,eAAC,CAAC,AAClB,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACnB,SAAS,CAAE,MAAM,GAAG,CAAC,CACrB,QAAQ,CAAE,MAAM,CAChB,WAAW,CAAE,MAAM,CACnB,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,AACZ,CAAC"}`
};
const Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {stores} = $$props;
  let {page} = $$props;
  let {components} = $$props;
  let {props_0 = null} = $$props;
  let {props_1 = null} = $$props;
  let {props_2 = null} = $$props;
  setContext("__svelte__", stores);
  afterUpdate(stores.page.notify);
  let mounted = false;
  let navigated = false;
  let title = null;
  onMount(() => {
    const unsubscribe = stores.page.subscribe(() => {
      if (mounted) {
        navigated = true;
        title = document.title || "untitled page";
      }
    });
    mounted = true;
    return unsubscribe;
  });
  if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
    $$bindings.stores(stores);
  if ($$props.page === void 0 && $$bindings.page && page !== void 0)
    $$bindings.page(page);
  if ($$props.components === void 0 && $$bindings.components && components !== void 0)
    $$bindings.components(components);
  if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
    $$bindings.props_0(props_0);
  if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
    $$bindings.props_1(props_1);
  if ($$props.props_2 === void 0 && $$bindings.props_2 && props_2 !== void 0)
    $$bindings.props_2(props_2);
  $$result.css.add(css$2);
  {
    stores.page.set(page);
  }
  return `


${validate_component(components[0] || missing_component, "svelte:component").$$render($$result, Object.assign(props_0 || {}), {}, {
    default: () => `${components[1] ? `${validate_component(components[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {
      default: () => `${components[2] ? `${validate_component(components[2] || missing_component, "svelte:component").$$render($$result, Object.assign(props_2 || {}), {}, {})}` : ``}`
    })}` : ``}`
  })}

${mounted ? `<div id="${"svelte-announcer"}" aria-live="${"assertive"}" aria-atomic="${"true"}" class="${"svelte-1j55zn5"}">${navigated ? `Navigated to ${escape(title)}` : ``}</div>` : ``}`;
});
var user_hooks = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module"
});
const template = ({head, body}) => '<!DOCTYPE html>\n<html lang="en">\n	<head>\n		<meta charset="utf-8" />\n		<link rel="icon" href="/favicon.ico" />\n		<meta name="viewport" content="width=device-width, initial-scale=1" />\n		' + head + '\n	</head>\n	<body>\n		<div id="svelte">' + body + "</div>\n	</body>\n</html>\n";
function init({paths, prerendering}) {
}
const empty = () => ({});
const manifest = {
  assets: [{file: "favicon.ico", size: 1150, type: "image/vnd.microsoft.icon"}, {file: "images/dashboard.png", size: 168873, type: "image/png"}, {file: "robots.txt", size: 67, type: "text/plain"}],
  layout: "src/routes/$layout.svelte",
  error: ".svelte/build/components/error.svelte",
  routes: [
    {
      type: "page",
      pattern: /^\/$/,
      params: empty,
      a: ["src/routes/$layout.svelte", "src/routes/index.svelte"],
      b: [".svelte/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/index\/Header\/?$/,
      params: empty,
      a: ["src/routes/$layout.svelte", "src/routes/index/Header.svelte"],
      b: [".svelte/build/components/error.svelte"]
    }
  ]
};
const get_hooks = (hooks2) => ({
  getContext: hooks2.getContext || (() => ({})),
  getSession: hooks2.getSession || (() => ({})),
  handle: hooks2.handle || (({request, render: render2}) => render2(request))
});
const hooks = get_hooks(user_hooks);
const module_lookup = {
  "src/routes/$layout.svelte": () => Promise.resolve().then(function() {
    return $layout$1;
  }),
  ".svelte/build/components/error.svelte": () => Promise.resolve().then(function() {
    return error;
  }),
  "src/routes/index.svelte": () => Promise.resolve().then(function() {
    return index;
  }),
  "src/routes/index/Header.svelte": () => Promise.resolve().then(function() {
    return Header$1;
  })
};
const metadata_lookup = {"src/routes/$layout.svelte": {entry: "/./_app/pages/$layout.svelte-b756b9a4.js", css: ["/./_app/assets/pages/$layout.svelte-ac45418a.css"], js: ["/./_app/pages/$layout.svelte-b756b9a4.js", "/./_app/chunks/vendor-c7844ae4.js"], styles: null}, ".svelte/build/components/error.svelte": {entry: "/./_app/error.svelte-3f66bfe3.js", css: [], js: ["/./_app/error.svelte-3f66bfe3.js", "/./_app/chunks/vendor-c7844ae4.js"], styles: null}, "src/routes/index.svelte": {entry: "/./_app/pages/index.svelte-b1cc4ff7.js", css: ["/./_app/assets/pages/index.svelte-4cb54d1f.css"], js: ["/./_app/pages/index.svelte-b1cc4ff7.js", "/./_app/chunks/vendor-c7844ae4.js", "/./_app/chunks/Logo-3233f12d.js"], styles: null}, "src/routes/index/Header.svelte": {entry: "/./_app/pages/index/Header.svelte-60d4699b.js", css: ["/./_app/assets/pages/index/Header.svelte-7f0c6dcf.css"], js: ["/./_app/pages/index/Header.svelte-60d4699b.js", "/./_app/chunks/vendor-c7844ae4.js", "/./_app/chunks/Logo-3233f12d.js"], styles: null}};
async function load_component(file) {
  if (!module_lookup[file]) {
    console.log({file});
  }
  return {
    module: await module_lookup[file](),
    ...metadata_lookup[file]
  };
}
function render(request, {
  paths = {base: "", assets: "/."},
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
    entry: "/./_app/start-ea8d9ccf.js",
    css: ["/./_app/assets/start-a8cd1609.css"],
    js: ["/./_app/start-ea8d9ccf.js", "/./_app/chunks/vendor-c7844ae4.js"],
    root: Root,
    hooks,
    dev: false,
    amp: false,
    dependencies,
    only_render_prerenderable_pages,
    get_component_path: (id) => "/./_app/" + entry_lookup[id],
    get_stack: (error2) => error2.stack,
    get_static_file,
    ssr: true,
    router: true,
    hydrate: true
  });
}
var app = ':root {\n	font-family: Inter, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell,\n		\'Open Sans\', \'Helvetica Neue\', sans-serif;\n}\n\nhtml, body, #svelte {\n	height: 100%;\n}\n\n* {\n	box-sizing: border-box;\n}\n\n/* http://meyerweb.com/eric/tools/css/reset/\n   v2.0-modified | 20110126\n   License: none (public domain)\n*/\n\nhtml, body, div, span, applet, object, iframe,\nh1, h2, h3, h4, h5, h6, p, blockquote, pre,\na, abbr, acronym, address, big, cite, code,\ndel, dfn, em, img, ins, kbd, q, s, samp,\nsmall, strike, strong, sub, sup, tt, var,\nb, u, i, center,\ndl, dt, dd, ol, ul, li,\nfieldset, form, label, legend,\ntable, caption, tbody, tfoot, thead, tr, th, td,\narticle, aside, canvas, details, embed,\nfigure, figcaption, footer, header, hgroup,\nmenu, nav, output, ruby, section, summary,\ntime, mark, audio, video {\n  margin: 0;\n	padding: 0;\n	border: 0;\n	font-size: 100%;\n	font: inherit;\n	vertical-align: baseline;\n}\n\n/* make sure to set some focus styles for accessibility */\n:focus {\n    outline: 0;\n}\n\n/* HTML5 display-role reset for older browsers */\narticle, aside, details, figcaption, figure,\nfooter, header, hgroup, menu, nav, section {\n	display: block;\n}\n\nbody {\n	line-height: 1;\n}\n\nol, ul {\n	list-style: none;\n}\n\nblockquote, q {\n	quotes: none;\n}\n\nblockquote:before, blockquote:after,\nq:before, q:after {\n	content: \'\';\n	content: none;\n}\n\ntable {\n	border-collapse: collapse;\n	border-spacing: 0;\n}\n\ninput[type=search]::-webkit-search-cancel-button,\ninput[type=search]::-webkit-search-decoration,\ninput[type=search]::-webkit-search-results-button,\ninput[type=search]::-webkit-search-results-decoration {\n    -webkit-appearance: none;\n    -moz-appearance: none;\n}\n\ninput[type=search] {\n    -webkit-appearance: none;\n    -moz-appearance: none;\n    -webkit-box-sizing: content-box;\n    -moz-box-sizing: content-box;\n    box-sizing: content-box;\n}\n\ntextarea {\n    overflow: auto;\n    vertical-align: top;\n    resize: vertical;\n}\n\n/**\n * Correct `inline-block` display not defined in IE 6/7/8/9 and Firefox 3.\n */\n\naudio,\ncanvas,\nvideo {\n    display: inline-block;\n    *display: inline;\n    *zoom: 1;\n    max-width: 100%;\n}\n\n/**\n * Prevent modern browsers from displaying `audio` without controls.\n * Remove excess height in iOS 5 devices.\n */\n\naudio:not([controls]) {\n    display: none;\n    height: 0;\n}\n\n/**\n * Address styling not present in IE 7/8/9, Firefox 3, and Safari 4.\n * Known issue: no IE 6 support.\n */\n\n[hidden] {\n    display: none;\n}\n\n/**\n * 1. Correct text resizing oddly in IE 6/7 when body `font-size` is set using\n *    `em` units.\n * 2. Prevent iOS text size adjust after orientation change, without disabling\n *    user zoom.\n */\n\nhtml {\n    font-size: 100%; /* 1 */\n    -webkit-text-size-adjust: 100%; /* 2 */\n    -ms-text-size-adjust: 100%; /* 2 */\n}\n\n/**\n * Address `outline` inconsistency between Chrome and other browsers.\n */\n\na:focus {\n    outline: thin dotted;\n}\n\n/**\n * Improve readability when focused and also mouse hovered in all browsers.\n */\n\na:active,\na:hover {\n    outline: 0;\n}\n\n/**\n * 1. Remove border when inside `a` element in IE 6/7/8/9 and Firefox 3.\n * 2. Improve image quality when scaled in IE 7.\n */\n\nimg {\n    border: 0; /* 1 */\n    -ms-interpolation-mode: bicubic; /* 2 */\n}\n\n/**\n * Address margin not present in IE 6/7/8/9, Safari 5, and Opera 11.\n */\n\nfigure {\n    margin: 0;\n}\n\n/**\n * Correct margin displayed oddly in IE 6/7.\n */\n\nform {\n    margin: 0;\n}\n\n/**\n * Define consistent border, margin, and padding.\n */\n\nfieldset {\n    border: 1px solid #c0c0c0;\n    margin: 0 2px;\n    padding: 0.35em 0.625em 0.75em;\n}\n\n/**\n * 1. Correct color not being inherited in IE 6/7/8/9.\n * 2. Correct text not wrapping in Firefox 3.\n * 3. Correct alignment displayed oddly in IE 6/7.\n */\n\nlegend {\n    border: 0; /* 1 */\n    padding: 0;\n    white-space: normal; /* 2 */\n    *margin-left: -7px; /* 3 */\n}\n\n/**\n * 1. Correct font size not being inherited in all browsers.\n * 2. Address margins set differently in IE 6/7, Firefox 3+, Safari 5,\n *    and Chrome.\n * 3. Improve appearance and consistency in all browsers.\n */\n\nbutton,\ninput,\nselect,\ntextarea {\n    font-size: 100%; /* 1 */\n    margin: 0; /* 2 */\n    vertical-align: baseline; /* 3 */\n    *vertical-align: middle; /* 3 */\n}\n\n/**\n * Address Firefox 3+ setting `line-height` on `input` using `!important` in\n * the UA stylesheet.\n */\n\nbutton,\ninput {\n    line-height: normal;\n}\n\n/**\n * Address inconsistent `text-transform` inheritance for `button` and `select`.\n * All other form control elements do not inherit `text-transform` values.\n * Correct `button` style inheritance in Chrome, Safari 5+, and IE 6+.\n * Correct `select` style inheritance in Firefox 4+ and Opera.\n */\n\nbutton,\nselect {\n    text-transform: none;\n}\n\n/**\n * 1. Avoid the WebKit bug in Android 4.0.* where (2) destroys native `audio`\n *    and `video` controls.\n * 2. Correct inability to style clickable `input` types in iOS.\n * 3. Improve usability and consistency of cursor style between image-type\n *    `input` and others.\n * 4. Remove inner spacing in IE 7 without affecting normal text inputs.\n *    Known issue: inner spacing remains in IE 6.\n */\n\nbutton,\nhtml input[type="button"], /* 1 */\ninput[type="reset"],\ninput[type="submit"] {\n    -webkit-appearance: button; /* 2 */\n    cursor: pointer; /* 3 */\n    *overflow: visible;  /* 4 */\n}\n\n/**\n * Re-set default cursor for disabled elements.\n */\n\nbutton[disabled],\nhtml input[disabled] {\n    cursor: default;\n}\n\n/**\n * 1. Address box sizing set to content-box in IE 8/9.\n * 2. Remove excess padding in IE 8/9.\n * 3. Remove excess padding in IE 7.\n *    Known issue: excess padding remains in IE 6.\n */\n\ninput[type="checkbox"],\ninput[type="radio"] {\n    box-sizing: border-box; /* 1 */\n    padding: 0; /* 2 */\n    *height: 13px; /* 3 */\n    *width: 13px; /* 3 */\n}\n\n/**\n * 1. Address `appearance` set to `searchfield` in Safari 5 and Chrome.\n * 2. Address `box-sizing` set to `border-box` in Safari 5 and Chrome\n *    (include `-moz` to future-proof).\n */\n\ninput[type="search"] {\n    -webkit-appearance: textfield; /* 1 */\n    -moz-box-sizing: content-box;\n    -webkit-box-sizing: content-box; /* 2 */\n    box-sizing: content-box;\n}\n\n/**\n * Remove inner padding and search cancel button in Safari 5 and Chrome\n * on OS X.\n */\n\ninput[type="search"]::-webkit-search-cancel-button,\ninput[type="search"]::-webkit-search-decoration {\n    -webkit-appearance: none;\n}\n\n/**\n * Remove inner padding and border in Firefox 3+.\n */\n\nbutton::-moz-focus-inner,\ninput::-moz-focus-inner {\n    border: 0;\n    padding: 0;\n}\n\n/**\n * 1. Remove default vertical scrollbar in IE 6/7/8/9.\n * 2. Improve readability and alignment in all browsers.\n */\n\ntextarea {\n    overflow: auto; /* 1 */\n    vertical-align: top; /* 2 */\n}\n\n/**\n * Remove most spacing between table cells.\n */\n\ntable {\n    border-collapse: collapse;\n    border-spacing: 0;\n}\n\nhtml,\nbutton,\ninput,\nselect,\ntextarea {\n    color: #222;\n}\n\n\n::-moz-selection {\n    background: #b3d4fc;\n    text-shadow: none;\n}\n\n::selection {\n    background: #b3d4fc;\n    text-shadow: none;\n}\n\nimg {\n    vertical-align: middle;\n}\n\nfieldset {\n    border: 0;\n    margin: 0;\n    padding: 0;\n}\n\ntextarea {\n    resize: vertical;\n}\n\n.chromeframe {\n    margin: 0.2em 0;\n    background: #ccc;\n    color: #000;\n    padding: 0.2em 0;\n}\n';
const $layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${slots.default ? slots.default({}) : ``}`;
});
var $layout$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: $layout
});
function load({error: error2, status}) {
  return {props: {error: error2, status}};
}
const Error$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let {status} = $$props;
  let {error: error2} = $$props;
  if ($$props.status === void 0 && $$bindings.status && status !== void 0)
    $$bindings.status(status);
  if ($$props.error === void 0 && $$bindings.error && error2 !== void 0)
    $$bindings.error(error2);
  return `<h1>${escape(status)}</h1>

<p>${escape(error2.message)}</p>


${error2.stack ? `<pre>${escape(error2.stack)}</pre>` : ``}`;
});
var error = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Error$1,
  load
});
const Logo = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<svg xmlns="${"http://www.w3.org/2000/svg"}" width="${"60"}" height="${"23"}" viewBox="${"0 0 60 23"}" fill="${"none"}"><path d="${"M6.04 10.968L3.376 13.704V18H0.256V1.2H3.376V9.816L11.68 1.2H15.184L8.128 8.712L15.616 18H11.968L6.04 10.968ZM16.9724 0.191999H19.9724V18H16.9724V0.191999ZM28.3259 5.04C30.2139 5.04 31.6539 5.496 32.6459 6.408C33.6539 7.304 34.1579 8.664 34.1579 10.488V18H31.3259V16.44C30.9579 17 30.4299 17.432 29.7419 17.736C29.0699 18.024 28.2539 18.168 27.2939 18.168C26.3339 18.168 25.4939 18.008 24.7739 17.688C24.0539 17.352 23.4939 16.896 23.0939 16.32C22.7099 15.728 22.5179 15.064 22.5179 14.328C22.5179 13.176 22.9419 12.256 23.7899 11.568C24.6539 10.864 26.0059 10.512 27.8459 10.512H31.1579V10.32C31.1579 9.424 30.8859 8.736 30.3419 8.256C29.8139 7.776 29.0219 7.536 27.9659 7.536C27.2459 7.536 26.5339 7.648 25.8299 7.872C25.1419 8.096 24.5579 8.408 24.0779 8.808L22.9019 6.624C23.5739 6.112 24.3819 5.72 25.3259 5.448C26.2699 5.176 27.2699 5.04 28.3259 5.04ZM27.9179 15.984C28.6699 15.984 29.3339 15.816 29.9099 15.48C30.5019 15.128 30.9179 14.632 31.1579 13.992V12.504H28.0619C26.3339 12.504 25.4699 13.072 25.4699 14.208C25.4699 14.752 25.6859 15.184 26.1179 15.504C26.5499 15.824 27.1499 15.984 27.9179 15.984ZM40.384 7.056C41.248 5.712 42.768 5.04 44.944 5.04V7.896C44.688 7.848 44.456 7.824 44.248 7.824C43.08 7.824 42.168 8.168 41.512 8.856C40.856 9.528 40.528 10.504 40.528 11.784V18H37.528V5.184H40.384V7.056ZM59.4777 5.184L53.4777 19.032C52.9177 20.424 52.2377 21.4 51.4377 21.96C50.6377 22.536 49.6697 22.824 48.5337 22.824C47.8937 22.824 47.2617 22.72 46.6377 22.512C46.0137 22.304 45.5017 22.016 45.1017 21.648L46.3017 19.44C46.5897 19.712 46.9257 19.928 47.3097 20.088C47.7097 20.248 48.1097 20.328 48.5097 20.328C49.0377 20.328 49.4697 20.192 49.8057 19.92C50.1577 19.648 50.4777 19.192 50.7657 18.552L50.9817 18.048L45.3897 5.184H48.5097L52.5417 14.664L56.5977 5.184H59.4777Z"}" fill="${"#17171A"}"></path></svg>`;
});
const LogoImage = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<svg xmlns="${"http://www.w3.org/2000/svg"}" width="${"40"}" height="${"40"}" viewBox="${"0 0 40 40"}" fill="${"none"}"${add_attribute("class", $$props.class, 0)}><g filter="${"url(#filter0_ii)"}"><path d="${"M0 9.16667C0 4.10405 4.10406 0 9.16667 0H30.8333C35.8959 0 40 4.10406 40 9.16667V30.8333C40 35.8959 35.8959 40 30.8333 40H9.16667C4.10405 40 0 35.8959 0 30.8333V9.16667Z"}" fill="${"#F8F5FF"}"></path></g><g filter="${"url(#filter1_d)"}"><g opacity="${"0.8"}" filter="${"url(#filter2_ii)"}"><path d="${"M11.668 27.4657C11.668 28.8654 12.7531 30 14.0918 30H25.9062C27.9573 30 29.0812 27.5022 27.7735 25.85L15.959 10.9235C14.5111 9.09419 11.668 10.1647 11.668 12.5393V27.4657Z"}" fill="${"#511FDC"}"></path></g><g opacity="${"0.8"}" filter="${"url(#filter3_ii)"}"><path d="${"M11.668 12.5343C11.668 11.1346 12.7531 10 14.0918 10H25.9062C27.9573 10 29.0812 12.4978 27.7735 14.15L15.959 29.0765C14.5111 30.9058 11.668 29.8353 11.668 27.4607V12.5343Z"}" fill="${"#511FDC"}"></path></g></g><defs><filter id="${"filter0_ii"}" x="${"-1.66667"}" y="${"-1.66667"}" width="${"43.3333"}" height="${"43.3333"}" filterUnits="${"userSpaceOnUse"}" color-interpolation-filters="${"sRGB"}"><feFlood flood-opacity="${"0"}" result="${"BackgroundImageFix"}"></feFlood><feBlend mode="${"normal"}" in="${"SourceGraphic"}" in2="${"BackgroundImageFix"}" result="${"shape"}"></feBlend><feColorMatrix in="${"SourceAlpha"}" type="${"matrix"}" values="${"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"}" result="${"hardAlpha"}"></feColorMatrix><feOffset dx="${"-1.66667"}" dy="${"-1.66667"}"></feOffset><feGaussianBlur stdDeviation="${"3.33333"}"></feGaussianBlur><feComposite in2="${"hardAlpha"}" operator="${"arithmetic"}" k2="${"-1"}" k3="${"1"}"></feComposite><feColorMatrix type="${"matrix"}" values="${"0 0 0 0 0.368381 0 0 0 0 0.22625 0 0 0 0 0.754167 0 0 0 0.2 0"}"></feColorMatrix><feBlend mode="${"normal"}" in2="${"shape"}" result="${"effect1_innerShadow"}"></feBlend><feColorMatrix in="${"SourceAlpha"}" type="${"matrix"}" values="${"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"}" result="${"hardAlpha"}"></feColorMatrix><feOffset dx="${"1.66667"}" dy="${"1.66667"}"></feOffset><feGaussianBlur stdDeviation="${"3.33333"}"></feGaussianBlur><feComposite in2="${"hardAlpha"}" operator="${"arithmetic"}" k2="${"-1"}" k3="${"1"}"></feComposite><feColorMatrix type="${"matrix"}" values="${"0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.55 0"}"></feColorMatrix><feBlend mode="${"normal"}" in2="${"effect1_innerShadow"}" result="${"effect2_innerShadow"}"></feBlend></filter><filter id="${"filter1_d"}" x="${"6.66797"}" y="${"5"}" width="${"26.6667"}" height="${"30"}" filterUnits="${"userSpaceOnUse"}" color-interpolation-filters="${"sRGB"}"><feFlood flood-opacity="${"0"}" result="${"BackgroundImageFix"}"></feFlood><feColorMatrix in="${"SourceAlpha"}" type="${"matrix"}" values="${"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"}"></feColorMatrix><feOffset></feOffset><feGaussianBlur stdDeviation="${"2.5"}"></feGaussianBlur><feColorMatrix type="${"matrix"}" values="${"0 0 0 0 0.368627 0 0 0 0 0.227451 0 0 0 0 0.752941 0 0 0 0.2 0"}"></feColorMatrix><feBlend mode="${"normal"}" in2="${"BackgroundImageFix"}" result="${"effect1_dropShadow"}"></feBlend><feBlend mode="${"normal"}" in="${"SourceGraphic"}" in2="${"effect1_dropShadow"}" result="${"shape"}"></feBlend></filter><filter id="${"filter2_ii"}" x="${"8.33464"}" y="${"8.33333"}" width="${"21.6667"}" height="${"23.3333"}" filterUnits="${"userSpaceOnUse"}" color-interpolation-filters="${"sRGB"}"><feFlood flood-opacity="${"0"}" result="${"BackgroundImageFix"}"></feFlood><feBlend mode="${"normal"}" in="${"SourceGraphic"}" in2="${"BackgroundImageFix"}" result="${"shape"}"></feBlend><feColorMatrix in="${"SourceAlpha"}" type="${"matrix"}" values="${"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"}" result="${"hardAlpha"}"></feColorMatrix><feOffset dx="${"-3.33333"}" dy="${"-1.66667"}"></feOffset><feGaussianBlur stdDeviation="${"1.66667"}"></feGaussianBlur><feComposite in2="${"hardAlpha"}" operator="${"arithmetic"}" k2="${"-1"}" k3="${"1"}"></feComposite><feColorMatrix type="${"matrix"}" values="${"0 0 0 0 0.0666667 0 0 0 0 0.0196078 0 0 0 0 0.2 0 0 0 0.2 0"}"></feColorMatrix><feBlend mode="${"normal"}" in2="${"shape"}" result="${"effect1_innerShadow"}"></feBlend><feColorMatrix in="${"SourceAlpha"}" type="${"matrix"}" values="${"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"}" result="${"hardAlpha"}"></feColorMatrix><feOffset dx="${"1.66667"}" dy="${"1.66667"}"></feOffset><feGaussianBlur stdDeviation="${"1.66667"}"></feGaussianBlur><feComposite in2="${"hardAlpha"}" operator="${"arithmetic"}" k2="${"-1"}" k3="${"1"}"></feComposite><feColorMatrix type="${"matrix"}" values="${"0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.15 0"}"></feColorMatrix><feBlend mode="${"normal"}" in2="${"effect1_innerShadow"}" result="${"effect2_innerShadow"}"></feBlend></filter><filter id="${"filter3_ii"}" x="${"10.0013"}" y="${"8.33333"}" width="${"20"}" height="${"23.3333"}" filterUnits="${"userSpaceOnUse"}" color-interpolation-filters="${"sRGB"}"><feFlood flood-opacity="${"0"}" result="${"BackgroundImageFix"}"></feFlood><feBlend mode="${"normal"}" in="${"SourceGraphic"}" in2="${"BackgroundImageFix"}" result="${"shape"}"></feBlend><feColorMatrix in="${"SourceAlpha"}" type="${"matrix"}" values="${"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"}" result="${"hardAlpha"}"></feColorMatrix><feOffset dx="${"-1.66667"}" dy="${"-1.66667"}"></feOffset><feGaussianBlur stdDeviation="${"1.66667"}"></feGaussianBlur><feComposite in2="${"hardAlpha"}" operator="${"arithmetic"}" k2="${"-1"}" k3="${"1"}"></feComposite><feColorMatrix type="${"matrix"}" values="${"0 0 0 0 0.0666667 0 0 0 0 0.0196078 0 0 0 0 0.2 0 0 0 0.2 0"}"></feColorMatrix><feBlend mode="${"normal"}" in2="${"shape"}" result="${"effect1_innerShadow"}"></feBlend><feColorMatrix in="${"SourceAlpha"}" type="${"matrix"}" values="${"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"}" result="${"hardAlpha"}"></feColorMatrix><feOffset dx="${"1.66667"}" dy="${"1.66667"}"></feOffset><feGaussianBlur stdDeviation="${"1.66667"}"></feGaussianBlur><feComposite in2="${"hardAlpha"}" operator="${"arithmetic"}" k2="${"-1"}" k3="${"1"}"></feComposite><feColorMatrix type="${"matrix"}" values="${"0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.15 0"}"></feColorMatrix><feBlend mode="${"normal"}" in2="${"effect1_innerShadow"}" result="${"effect2_innerShadow"}"></feBlend></filter></defs></svg>`;
});
const ArrowRight = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<svg xmlns="${"http://www.w3.org/2000/svg"}" width="${"20"}" height="${"20"}" viewBox="${"0 0 20 20"}" fill="${"none"}"><path d="${"M8 16L14 10L8 4"}" stroke="${"white"}" stroke-width="${"1.5"}" stroke-linecap="${"round"}" stroke-linejoin="${"round"}"></path></svg>`;
});
var index_svelte = ".main.svelte-hs2bcq{height:100%;padding:32px;background:#FBFAFF}.main__logo.svelte-hs2bcq{display:flex;justify-content:center;align-items:center;position:absolute;left:80px;top:64px}.main__logo-image{margin-right:10px}.main__content.svelte-hs2bcq{display:flex;height:100%;width:100%}.main__left.svelte-hs2bcq,.main__right.svelte-hs2bcq{flex:1;height:100%}.main__left.svelte-hs2bcq{display:flex;flex-direction:column;justify-content:center;padding:0 48px}.main__left-content.svelte-hs2bcq{display:flex;flex-direction:column;max-width:416px;width:100%}.main__title.svelte-hs2bcq{font-weight:bold;font-size:48px;line-height:56px;color:#17171A;margin-bottom:20px}.main__subtitle.svelte-hs2bcq{font-weight:normal;font-size:20px;line-height:28px;color:#787880;margin-bottom:32px}.email-input.svelte-hs2bcq{position:relative;display:flex;flex-direction:column;max-width:400px;width:100%}.email-input__input.svelte-hs2bcq{background:rgba(255, 255, 255, 0.8);border:1px solid #E1E1E6;padding:16px 64px 16px 16px;border-radius:10px;font-size:16px;line-height:24px;font-family:Inter}.email-input__input.svelte-hs2bcq::placeholder{color:#919199}.email-input__button.svelte-hs2bcq{border:0;position:absolute;top:8px;right:8px;background:#511FDC;padding:10px;border-radius:10px;display:flex;justify-content:center;align-items:center}.main__right.svelte-hs2bcq{border-radius:16px;background:linear-gradient(31.46deg, #ECE6FF 0%, #F9E6FF 98.96%);padding-left:64px;display:flex;flex-direction:column;justify-content:center}.main__dashboard-image.svelte-hs2bcq{width:100%}@media screen and (max-width: 420px){.main__content.svelte-hs2bcq{flex-direction:column}}";
const css$1 = {
  code: ".main.svelte-hs2bcq{height:100%;padding:32px;background:#FBFAFF}.main__logo.svelte-hs2bcq{display:flex;justify-content:center;align-items:center;position:absolute;left:80px;top:64px}.main__logo-image{margin-right:10px}.main__content.svelte-hs2bcq{display:flex;height:100%;width:100%}.main__left.svelte-hs2bcq,.main__right.svelte-hs2bcq{flex:1;height:100%}.main__left.svelte-hs2bcq{display:flex;flex-direction:column;justify-content:center;padding:0 48px}.main__left-content.svelte-hs2bcq{display:flex;flex-direction:column;max-width:416px;width:100%}.main__title.svelte-hs2bcq{font-weight:bold;font-size:48px;line-height:56px;color:#17171A;margin-bottom:20px}.main__subtitle.svelte-hs2bcq{font-weight:normal;font-size:20px;line-height:28px;color:#787880;margin-bottom:32px}.email-input.svelte-hs2bcq{position:relative;display:flex;flex-direction:column;max-width:400px;width:100%}.email-input__input.svelte-hs2bcq{background:rgba(255, 255, 255, 0.8);border:1px solid #E1E1E6;padding:16px 64px 16px 16px;border-radius:10px;font-size:16px;line-height:24px;font-family:Inter}.email-input__input.svelte-hs2bcq::placeholder{color:#919199}.email-input__button.svelte-hs2bcq{border:0;position:absolute;top:8px;right:8px;background:#511FDC;padding:10px;border-radius:10px;display:flex;justify-content:center;align-items:center}.main__right.svelte-hs2bcq{border-radius:16px;background:linear-gradient(31.46deg, #ECE6FF 0%, #F9E6FF 98.96%);padding-left:64px;display:flex;flex-direction:column;justify-content:center}.main__dashboard-image.svelte-hs2bcq{width:100%}@media screen and (max-width: 420px){.main__content.svelte-hs2bcq{flex-direction:column}}",
  map: `{"version":3,"file":"index.svelte","sources":["index.svelte"],"sourcesContent":["<script>\\n\\timport { createClient } from '@supabase/supabase-js'\\n\\timport Logo from '$/svg/Logo.svelte'\\n\\timport LogoImage from '$/svg/LogoImage.svelte'\\n\\timport ArrowRight from '$/svg/ArrowRight.svelte'\\n\\n\\tconst supabaseUrl = \\"https://iklqhrrxiyjfmaiskeym.supabase.co\\";\\n\\tconst supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNzMwMzA5MiwiZXhwIjoxOTMyODc5MDkyfQ.JSXPBUiRbISJjIHiKfJK-0gsPWdRlZyZhuyHD2ClHEU'\\n\\tconst supabase = createClient(supabaseUrl, supabaseKey)\\n\\t \\n\\tlet email = ''\\n\\tlet error = ''\\n\\tlet isEmailSent = false;\\n\\tconst insertEmail = async () => {\\n\\t\\tif(!email) {\\n\\t\\t\\treturn;\\n\\t\\t}\\n\\n\\t\\tawait supabase\\n\\t\\t\\t.from('emails')\\n\\t\\t\\t.insert([{ email }], {returning: 'minimal'})\\n\\t\\tisEmailSent = true;\\n\\t}\\n</script>\\n\\n<svelte:head>\\n\\t<title>Hello world!</title>\\n</svelte:head>\\n\\n<main class=\\"main\\">\\n\\t<div class=\\"main__logo\\">\\n\\t\\t<LogoImage class=\\"main__logo-image\\" />\\n\\t\\t<Logo />\\n\\t</div>\\n\\t<div class=\\"main__content\\">\\n\\t\\t<div class=\\"main__left\\">\\n\\t\\t\\t<div class=\\"main__left-content\\">\\n\\t\\t\\t\\t<h1 class=\\"main__title\\">\\n\\t\\t\\t\\t\\tThe new way of feedback sharing\\n\\t\\t\\t\\t</h1>\\n\\t\\t\\t\\t<p class=\\"main__subtitle\\">\\n\\t\\t\\t\\t\\tBe the first to know about our beta release by leaving your email.\\n\\t\\t\\t\\t</p>\\n\\t\\t\\t\\t<div class=\\"email-input\\">\\n\\t\\t\\t\\t\\t<input class=\\"email-input__input\\" type=\\"text\\" bind:value={email} placeholder=\\"Your email address\\" />\\n\\t\\t\\t\\t\\t<button class=\\"email-input__button\\" on:click={insertEmail} >\\n\\t\\t\\t\\t\\t\\t<ArrowRight />\\n\\t\\t\\t\\t\\t</button>\\n\\t\\t\\t\\t</div>\\n\\t\\t\\t</div>\\n\\t\\t</div>\\n\\t\\t<div class=\\"main__right\\">\\n\\t\\t\\t<img class=\\"main__dashboard-image\\" src={'images/dashboard.png'} alt=\\"Dashboard\\">\\n\\t\\t</div>\\n\\t</div>\\n</main>\\n\\n<style>\\n.main {\\n\\theight: 100%;\\n\\tpadding: 32px;\\n\\tbackground: #FBFAFF;\\n}\\n\\n.main__logo {\\n\\tdisplay: flex;\\n\\tjustify-content: center;\\n\\talign-items: center;\\n\\tposition: absolute;\\n\\tleft: 80px;\\n\\ttop: 64px;\\n}\\n\\n:global(.main__logo-image) {\\n\\tmargin-right: 10px;\\n}\\n\\n.main__content {\\n\\tdisplay: flex;\\n\\theight: 100%;\\n\\twidth: 100%;\\n}\\n\\n.main__left, .main__right {\\n\\tflex: 1;\\n\\theight: 100%;\\n}\\n\\n.main__left {\\n\\tdisplay: flex;\\n\\tflex-direction: column;\\n\\tjustify-content: center;\\n\\tpadding: 0 48px;\\n}\\n\\n.main__left-content {\\n\\tdisplay: flex;\\n\\tflex-direction: column;\\n\\tmax-width: 416px;\\n\\twidth: 100%;\\n}\\n\\n.main__title {\\n\\tfont-weight: bold;\\n\\tfont-size: 48px;\\n\\tline-height: 56px;\\n\\tcolor: #17171A;\\n\\tmargin-bottom: 20px;\\n}\\n\\n.main__subtitle {\\n\\tfont-weight: normal;\\n\\tfont-size: 20px;\\n\\tline-height: 28px;\\n\\tcolor: #787880;\\n\\tmargin-bottom: 32px;\\n}\\n\\n.email-input {\\n\\tposition: relative;\\n\\tdisplay: flex;\\n\\tflex-direction: column;\\n\\tmax-width: 400px;\\n\\twidth: 100%;\\n}\\n.email-input__input {\\n\\tbackground: rgba(255, 255, 255, 0.8);\\n\\tborder: 1px solid #E1E1E6;\\n\\tpadding: 16px 64px 16px 16px;\\n\\tborder-radius: 10px;\\n\\tfont-size: 16px;\\n\\tline-height: 24px;\\n\\tfont-family: Inter;\\n}\\n.email-input__input::placeholder {\\n\\tcolor: #919199;\\n}\\n.email-input__button {\\n\\tborder: 0;\\n\\tposition: absolute;\\n\\ttop: 8px;\\n\\tright: 8px;\\n\\tbackground: #511FDC;\\n\\tpadding: 10px;\\n\\tborder-radius: 10px;\\n\\tdisplay: flex;\\n\\tjustify-content: center;\\n\\talign-items: center;\\n}\\n\\n.main__right {\\n\\tborder-radius: 16px;\\n\\tbackground: linear-gradient(31.46deg, #ECE6FF 0%, #F9E6FF 98.96%);\\n\\tpadding-left: 64px;\\n\\tdisplay: flex;\\n\\tflex-direction: column;\\n\\tjustify-content: center;\\n}\\n\\n.main__dashboard-image {\\n\\twidth: 100%;\\n}\\n\\n@media screen and (max-width: 420px) {\\n\\t.main__content {\\n\\t\\tflex-direction: column;\\n\\t}\\n}\\n</style>\\n"],"names":[],"mappings":"AA0DA,KAAK,cAAC,CAAC,AACN,MAAM,CAAE,IAAI,CACZ,OAAO,CAAE,IAAI,CACb,UAAU,CAAE,OAAO,AACpB,CAAC,AAED,WAAW,cAAC,CAAC,AACZ,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,WAAW,CAAE,MAAM,CACnB,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,IAAI,CACV,GAAG,CAAE,IAAI,AACV,CAAC,AAEO,iBAAiB,AAAE,CAAC,AAC3B,YAAY,CAAE,IAAI,AACnB,CAAC,AAED,cAAc,cAAC,CAAC,AACf,OAAO,CAAE,IAAI,CACb,MAAM,CAAE,IAAI,CACZ,KAAK,CAAE,IAAI,AACZ,CAAC,AAED,yBAAW,CAAE,YAAY,cAAC,CAAC,AAC1B,IAAI,CAAE,CAAC,CACP,MAAM,CAAE,IAAI,AACb,CAAC,AAED,WAAW,cAAC,CAAC,AACZ,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,eAAe,CAAE,MAAM,CACvB,OAAO,CAAE,CAAC,CAAC,IAAI,AAChB,CAAC,AAED,mBAAmB,cAAC,CAAC,AACpB,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,SAAS,CAAE,KAAK,CAChB,KAAK,CAAE,IAAI,AACZ,CAAC,AAED,YAAY,cAAC,CAAC,AACb,WAAW,CAAE,IAAI,CACjB,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,IAAI,CACjB,KAAK,CAAE,OAAO,CACd,aAAa,CAAE,IAAI,AACpB,CAAC,AAED,eAAe,cAAC,CAAC,AAChB,WAAW,CAAE,MAAM,CACnB,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,IAAI,CACjB,KAAK,CAAE,OAAO,CACd,aAAa,CAAE,IAAI,AACpB,CAAC,AAED,YAAY,cAAC,CAAC,AACb,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,SAAS,CAAE,KAAK,CAChB,KAAK,CAAE,IAAI,AACZ,CAAC,AACD,mBAAmB,cAAC,CAAC,AACpB,UAAU,CAAE,KAAK,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,CAAC,CAAC,GAAG,CAAC,CACpC,MAAM,CAAE,GAAG,CAAC,KAAK,CAAC,OAAO,CACzB,OAAO,CAAE,IAAI,CAAC,IAAI,CAAC,IAAI,CAAC,IAAI,CAC5B,aAAa,CAAE,IAAI,CACnB,SAAS,CAAE,IAAI,CACf,WAAW,CAAE,IAAI,CACjB,WAAW,CAAE,KAAK,AACnB,CAAC,AACD,iCAAmB,aAAa,AAAC,CAAC,AACjC,KAAK,CAAE,OAAO,AACf,CAAC,AACD,oBAAoB,cAAC,CAAC,AACrB,MAAM,CAAE,CAAC,CACT,QAAQ,CAAE,QAAQ,CAClB,GAAG,CAAE,GAAG,CACR,KAAK,CAAE,GAAG,CACV,UAAU,CAAE,OAAO,CACnB,OAAO,CAAE,IAAI,CACb,aAAa,CAAE,IAAI,CACnB,OAAO,CAAE,IAAI,CACb,eAAe,CAAE,MAAM,CACvB,WAAW,CAAE,MAAM,AACpB,CAAC,AAED,YAAY,cAAC,CAAC,AACb,aAAa,CAAE,IAAI,CACnB,UAAU,CAAE,gBAAgB,QAAQ,CAAC,CAAC,OAAO,CAAC,EAAE,CAAC,CAAC,OAAO,CAAC,MAAM,CAAC,CACjE,YAAY,CAAE,IAAI,CAClB,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,MAAM,CACtB,eAAe,CAAE,MAAM,AACxB,CAAC,AAED,sBAAsB,cAAC,CAAC,AACvB,KAAK,CAAE,IAAI,AACZ,CAAC,AAED,OAAO,MAAM,CAAC,GAAG,CAAC,YAAY,KAAK,CAAC,AAAC,CAAC,AACrC,cAAc,cAAC,CAAC,AACf,cAAc,CAAE,MAAM,AACvB,CAAC,AACF,CAAC"}`
};
const supabaseUrl = "https://iklqhrrxiyjfmaiskeym.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNzMwMzA5MiwiZXhwIjoxOTMyODc5MDkyfQ.JSXPBUiRbISJjIHiKfJK-0gsPWdRlZyZhuyHD2ClHEU";
const Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  createClient(supabaseUrl, supabaseKey);
  let email = "";
  $$result.css.add(css$1);
  return `${$$result.head += `${$$result.title = `<title>Hello world!</title>`, ""}`, ""}

<main class="${"main svelte-hs2bcq"}"><div class="${"main__logo svelte-hs2bcq"}">${validate_component(LogoImage, "LogoImage").$$render($$result, {class: "main__logo-image"}, {}, {})}
		${validate_component(Logo, "Logo").$$render($$result, {}, {}, {})}</div>
	<div class="${"main__content svelte-hs2bcq"}"><div class="${"main__left svelte-hs2bcq"}"><div class="${"main__left-content svelte-hs2bcq"}"><h1 class="${"main__title svelte-hs2bcq"}">The new way of feedback sharing
				</h1>
				<p class="${"main__subtitle svelte-hs2bcq"}">Be the first to know about our beta release by leaving your email.
				</p>
				<div class="${"email-input svelte-hs2bcq"}"><input class="${"email-input__input svelte-hs2bcq"}" type="${"text"}" placeholder="${"Your email address"}"${add_attribute("value", email, 1)}>
					<button class="${"email-input__button svelte-hs2bcq"}">${validate_component(ArrowRight, "ArrowRight").$$render($$result, {}, {}, {})}</button></div></div></div>
		<div class="${"main__right svelte-hs2bcq"}"><img class="${"main__dashboard-image svelte-hs2bcq"}"${add_attribute("src", "images/dashboard.png", 0)} alt="${"Dashboard"}"></div></div>
</main>`;
});
var index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Routes
});
var Header_svelte = ".header.svelte-1gzyakg{width:100%;display:flex;padding:32px 112px}";
const css = {
  code: ".header.svelte-1gzyakg{width:100%;display:flex;padding:32px 112px}",
  map: `{"version":3,"file":"Header.svelte","sources":["Header.svelte"],"sourcesContent":["<script>\\nimport Logo from '$/svg/Logo.svelte'\\n</script>\\n\\n<div class=\\"header\\">\\n    <Logo />\\n</div>\\n\\n<style>\\n.header {\\n    width: 100%;\\n    display: flex;\\n    padding: 32px 112px;\\n}\\n</style>"],"names":[],"mappings":"AASA,OAAO,eAAC,CAAC,AACL,KAAK,CAAE,IAAI,CACX,OAAO,CAAE,IAAI,CACb,OAAO,CAAE,IAAI,CAAC,KAAK,AACvB,CAAC"}`
};
const Header = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `<div class="${"header svelte-1gzyakg"}">${validate_component(Logo, "Logo").$$render($$result, {}, {}, {})}
</div>`;
});
var Header$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  default: Header
});
export {init, render};
