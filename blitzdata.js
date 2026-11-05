var Dr = Object.defineProperty;
var Sr = (n, t, e) => t in n ? Dr(n, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : n[t] = e;
var m = (n, t, e) => (Sr(n, typeof t != "symbol" ? t + "" : t, e), e);
const O = class O {
  constructor() {
    /**
     * Request method.
     */
    m(this, "_method");
    /**
     * Request URL.
     */
    m(this, "_url");
    /**
     * Request headers.
     */
    m(this, "_headers", {});
    /**
     * Whether this request already retried after a 401, to avoid loops.
     */
    m(this, "_retriedAfterUnauthorized", !1);
    /**
     * Request body.
     */
    m(this, "_body");
    /**
     * Abort signal.
     */
    m(this, "_signal");
  }
  /**
   * Create a new request.
   */
  static create() {
    const t = new O();
    return O._globalHeaders && t.headers(O._globalHeaders), t;
  }
  /**
   * Set the global request headers.
   *
   * @param headers Global request headers.
   */
  static globalHeaders(t) {
    O._globalHeaders = t, O._notifyGlobalHeadersChange();
  }
  /**
   * Merge headers into the global request headers.
   * A null value removes the header.
   *
   * @param headers Headers to merge.
   */
  static updateGlobalHeaders(t) {
    for (const e in t) {
      const r = t[e];
      r === null ? delete O._globalHeaders[e] : O._globalHeaders[e] = r;
    }
    O._notifyGlobalHeadersChange();
  }
  /**
   * Set the headers applied only to requests targeting the given origin.
   * Passing empty headers removes the scope (e.g. on logout).
   *
   * @param origin Exact request origin, e.g. 'https://alpha.blitzdata.com'.
   * @param headers Headers to attach for that origin.
   */
  static setScopedHeaders(t, e) {
    O._scopedHeaders = O._scopedHeaders.filter((r) => r.origin !== t), Object.keys(e).length > 0 && O._scopedHeaders.push({ origin: t, headers: e }), O._notifyGlobalHeadersChange();
  }
  /**
   * Register a handler to recover from a 401 (typically an OAuth refresh).
   * The request is retried once if the handler resolves true.
   */
  static onUnauthorized(t) {
    O._unauthorizedHandler = t;
  }
  /**
   * Register a listener called whenever the global or scoped headers change.
   *
   * @param listener Change listener.
   */
  static onGlobalHeadersChange(t) {
    O._globalHeadersListeners.push(t);
  }
  static _notifyGlobalHeadersChange() {
    for (const t of O._globalHeadersListeners)
      t(O._globalHeaders);
  }
  /**
   * Resolve the scoped headers that apply to a request URL.
   */
  static _scopedHeadersFor(t) {
    if (!t)
      return {};
    let e;
    try {
      e = new URL(t).origin;
    } catch {
      return {};
    }
    return O._scopedHeaders.filter((r) => r.origin === e).reduce((r, s) => Object.assign(r, s.headers), {});
  }
  /**
   * Set the request method.
   *
   * @param method Request method.
   */
  method(t) {
    return this._method = t, this;
  }
  /**
   * Set the request URL.
   *
   * @param url Request URL.
   */
  url(t) {
    return this._url = t, this;
  }
  /**
   * Set a single request header.
   *
   * @param name Header name.
   * @param value Header value.
   */
  header(t, e) {
    return this._headers[t] = e, this;
  }
  /**
   * Set multiple request headers.
   *
   * @param headers Request headers.
   */
  headers(t) {
    for (const e in t)
      this.header(e, t[e]);
    return this;
  }
  /**
   * Set the request body.
   *
   * @param body Request body.
   */
  body(t) {
    return this._body = t, this;
  }
  /**
   * Sets the abort signal.
   * @param signal
   */
  signal(t) {
    return this._signal = t, this;
  }
  /**
   * Send the request.
   */
  async send(t = !1) {
    const e = await fetch(this._url, {
      method: this._method,
      headers: { ...this._headers, ...O._scopedHeadersFor(this._url) },
      body: this._body ? this._body instanceof FormData ? this._body : JSON.stringify(this._body) : void 0,
      signal: this._signal ? this._signal : void 0
    });
    return e.status === 401 && !this._retriedAfterUnauthorized && O._unauthorizedHandler && this._url && (this._retriedAfterUnauthorized = !0, await O._unauthorizedHandler(this._url)) ? await this.send(t) : t ? e : await e.json();
  }
  /**
   * Send request with GET method.
   */
  async get() {
    return await this.method("GET").send();
  }
  /**
   * Send request with POST method.
   */
  async post() {
    return await this.method("POST").send();
  }
};
/**
 * Global request headers.
 * This is used primarily for development purposes.
 */
m(O, "_globalHeaders", {}), /**
 * Headers applied only to requests whose URL matches a given origin.
 * Used to keep a Bearer token scoped to the host that issued it,
 * so it never leaks to a second cluster on another host.
 */
m(O, "_scopedHeaders", []), /**
 * Handler invoked once on a 401 to try to recover (e.g. refresh the token).
 * Returning true retries the request with refreshed headers.
 */
m(O, "_unauthorizedHandler", null), /**
 * Listeners notified whenever the global headers change,
 * used to propagate them to the queue's shared worker.
 */
m(O, "_globalHeadersListeners", []);
let z = O;
class Mr {
  /**
   * Create a new cluster.
   *
   * @param name Name of the cluster.
   * @param options Options for the cluster.
   */
  constructor(t, e) {
    /**
     * Name of the cluster (e.g. `default`).
     *
     * It is defined in the initial configuration.
     */
    m(this, "name");
    /**
     * Options for the cluster.
     */
    m(this, "options");
    /**
     * Cursors for the balanced url selection.
     */
    m(this, "cursors", {
      readURL: 0
    });
    this.name = t, this.options = e;
  }
  /**
   * Get the next read URL.
   *
   * @returns Next read URL.
   */
  getNextReadURL() {
    this.cursors.readURL >= this.options.readURL.length && (this.cursors.readURL = 0);
    const t = this.options.readURL[this.cursors.readURL];
    return this.cursors.readURL++, t;
  }
}
class $e {
  constructor() {
    /**
     * cluster instances.
     */
    m(this, "clusters", {});
  }
  /**
   * Register a new cluster.
   *
   * @param name Name of the cluster.
   * @param options Options for the cluster.
   */
  register(t, e) {
    this.clusters[t] = new Mr(t, e);
  }
  /**
   * Get clusters by name(s).
   *
   * @param name Name(s) of the cluster(s) to get.
   */
  get(t) {
    if (!Array.isArray(t)) {
      if (this.clusters[t] === void 0)
        throw new Error(`cluster "${t}" not found.`);
      return this.clusters[t];
    }
    const e = {};
    for (const r of t)
      e[r] = this.get(r);
    return e;
  }
  /**
   * Get names of all registered clusters.
   */
  names() {
    return Object.keys(this.clusters);
  }
  /**
   * Get all registered clusters.
   */
  all() {
    return this.clusters;
  }
  /**
   * Get all registered clusters as an array of cluster instances.
   */
  toArray() {
    return Object.values(this.clusters);
  }
  /**
   * Get random cluster.
   */
  random() {
    const t = this.names(), e = t[Math.floor(Math.random() * t.length)];
    return this.get(e);
  }
}
const kr = (n, t) => t.some((e) => n instanceof e);
let me, ge;
function Ir() {
  return me || (me = [
    IDBDatabase,
    IDBObjectStore,
    IDBIndex,
    IDBCursor,
    IDBTransaction
  ]);
}
function Tr() {
  return ge || (ge = [
    IDBCursor.prototype.advance,
    IDBCursor.prototype.continue,
    IDBCursor.prototype.continuePrimaryKey
  ]);
}
const He = /* @__PURE__ */ new WeakMap(), Gt = /* @__PURE__ */ new WeakMap(), Be = /* @__PURE__ */ new WeakMap(), Jt = /* @__PURE__ */ new WeakMap(), ie = /* @__PURE__ */ new WeakMap();
function Or(n) {
  const t = new Promise((e, r) => {
    const s = () => {
      n.removeEventListener("success", a), n.removeEventListener("error", i);
    }, a = () => {
      e(G(n.result)), s();
    }, i = () => {
      r(n.error), s();
    };
    n.addEventListener("success", a), n.addEventListener("error", i);
  });
  return t.then((e) => {
    e instanceof IDBCursor && He.set(e, n);
  }).catch(() => {
  }), ie.set(t, n), t;
}
function Ar(n) {
  if (Gt.has(n))
    return;
  const t = new Promise((e, r) => {
    const s = () => {
      n.removeEventListener("complete", a), n.removeEventListener("error", i), n.removeEventListener("abort", i);
    }, a = () => {
      e(), s();
    }, i = () => {
      r(n.error || new DOMException("AbortError", "AbortError")), s();
    };
    n.addEventListener("complete", a), n.addEventListener("error", i), n.addEventListener("abort", i);
  });
  Gt.set(n, t);
}
let Zt = {
  get(n, t, e) {
    if (n instanceof IDBTransaction) {
      if (t === "done")
        return Gt.get(n);
      if (t === "objectStoreNames")
        return n.objectStoreNames || Be.get(n);
      if (t === "store")
        return e.objectStoreNames[1] ? void 0 : e.objectStore(e.objectStoreNames[0]);
    }
    return G(n[t]);
  },
  set(n, t, e) {
    return n[t] = e, !0;
  },
  has(n, t) {
    return n instanceof IDBTransaction && (t === "done" || t === "store") ? !0 : t in n;
  }
};
function zr(n) {
  Zt = n(Zt);
}
function Pr(n) {
  return n === IDBDatabase.prototype.transaction && !("objectStoreNames" in IDBTransaction.prototype) ? function(t, ...e) {
    const r = n.call($t(this), t, ...e);
    return Be.set(r, t.sort ? t.sort() : [t]), G(r);
  } : Tr().includes(n) ? function(...t) {
    return n.apply($t(this), t), G(He.get(this));
  } : function(...t) {
    return G(n.apply($t(this), t));
  };
}
function Er(n) {
  return typeof n == "function" ? Pr(n) : (n instanceof IDBTransaction && Ar(n), kr(n, Ir()) ? new Proxy(n, Zt) : n);
}
function G(n) {
  if (n instanceof IDBRequest)
    return Or(n);
  if (Jt.has(n))
    return Jt.get(n);
  const t = Er(n);
  return t !== n && (Jt.set(n, t), ie.set(t, n)), t;
}
const $t = (n) => ie.get(n);
function ht(n, t, { blocked: e, upgrade: r, blocking: s, terminated: a } = {}) {
  const i = indexedDB.open(n, t), o = G(i);
  return r && i.addEventListener("upgradeneeded", (l) => {
    r(G(i.result), l.oldVersion, l.newVersion, G(i.transaction), l);
  }), e && i.addEventListener("blocked", (l) => e(
    // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
    l.oldVersion,
    l.newVersion,
    l
  )), o.then((l) => {
    a && l.addEventListener("close", () => a()), s && l.addEventListener("versionchange", (c) => s(c.oldVersion, c.newVersion, c));
  }).catch(() => {
  }), o;
}
function oe(n, { blocked: t } = {}) {
  const e = indexedDB.deleteDatabase(n);
  return t && e.addEventListener("blocked", (r) => t(
    // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
    r.oldVersion,
    r
  )), G(e).then(() => {
  });
}
const xr = ["get", "getKey", "getAll", "getAllKeys", "count"], Cr = ["put", "add", "delete", "clear"], Ht = /* @__PURE__ */ new Map();
function we(n, t) {
  if (!(n instanceof IDBDatabase && !(t in n) && typeof t == "string"))
    return;
  if (Ht.get(t))
    return Ht.get(t);
  const e = t.replace(/FromIndex$/, ""), r = t !== e, s = Cr.includes(e);
  if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(e in (r ? IDBIndex : IDBObjectStore).prototype) || !(s || xr.includes(e))
  )
    return;
  const a = async function(i, ...o) {
    const l = this.transaction(i, s ? "readwrite" : "readonly");
    let c = l.store;
    return r && (c = c.index(o.shift())), (await Promise.all([
      c[e](...o),
      s && l.done
    ]))[0];
  };
  return Ht.set(t, a), a;
}
zr((n) => ({
  ...n,
  get: (t, e, r) => we(t, e) || n.get(t, e, r),
  has: (t, e) => !!we(t, e) || n.has(t, e)
}));
const D = {
  name: "bd-queue",
  store: "jobs",
  timeIndex: "time",
  objectIndex: "object"
};
var p = /* @__PURE__ */ ((n) => (n.Pending = "pending", n.Completed = "completed", n.Failed = "failed", n.Conflict = "conflict", n))(p || {}), L = /* @__PURE__ */ ((n) => (n.Success = "success", n.Exception = "exception", n.Failed = "failed", n.Conflict = "conflict", n))(L || {}), M = /* @__PURE__ */ ((n) => (n.Add = "add", n.Edit = "edit", n.Delete = "delete", n))(M || {}), Y = "SharedWorker" in globalThis, Ur = class {
  constructor(n) {
    /**
     * The actual worker that is used, depending on browser support it can be either a `SharedWorker` or a normal `Worker`.
     */
    m(this, "ActualWorker");
    this.ActualWorker = n;
  }
  /**
   * An EventListener called when MessageEvent of type message is fired on the port—that is, when the port receives a message.
   */
  get onmessage() {
    var n;
    return Y ? (n = this.ActualWorker) == null ? void 0 : n.port.onmessage : this.ActualWorker.onmessage;
  }
  set onmessage(n) {
    Y ? this.ActualWorker.port.onmessage = n : this.ActualWorker.onmessage = n;
  }
  /**
   * An EventListener called when a MessageEvent of type MessageError is fired—that is, when it receives a message that cannot be deserialized.
   */
  get onmessageerror() {
    var n;
    return Y ? (n = this.ActualWorker) == null ? void 0 : n.port.onmessageerror : this.ActualWorker.onmessageerror;
  }
  set onmessageerror(n) {
    Y ? this.ActualWorker.port.onmessageerror = n : this.ActualWorker.onmessageerror = n;
  }
  /**
   * Starts the sending of messages queued on the port (only needed when using EventTarget.addEventListener; it is implied when using MessagePort.onmessage.)
   */
  start() {
    var n;
    if (Y)
      return (n = this.ActualWorker) == null ? void 0 : n.port.start();
  }
  /**
   * Clones message and transmits it to worker's global environment. transfer can be passed as a list of objects that are to be transferred rather than cloned.
   */
  postMessage(n, t) {
    var e;
    return Y ? (e = this.ActualWorker) == null ? void 0 : e.port.postMessage(n, t) : this.ActualWorker.postMessage(n, t);
  }
  /**
   * Immediately terminates the worker. This does not let worker finish its operations; it is halted at once. ServiceWorker instances do not support this method.
   */
  terminate() {
    var n;
    return Y ? (n = this.ActualWorker) == null ? void 0 : n.port.close() : this.ActualWorker.terminate();
  }
  /**
   * Disconnects the port, so it is no longer active.
   */
  close() {
    return this.terminate();
  }
  /**
   * Returns a MessagePort object used to communicate with and control the shared worker.
   */
  get port() {
    return Y ? this.ActualWorker.port : this.ActualWorker;
  }
  /**
   * Is an EventListener that is called whenever an ErrorEvent of type error event occurs.
   */
  get onerror() {
    return this.ActualWorker.onerror;
  }
  set onerror(n) {
    this.ActualWorker.onerror = n;
  }
  addEventListener(n, t, e) {
    var r;
    return Y && n !== "error" ? (r = this.ActualWorker) == null ? void 0 : r.port.addEventListener(n, t, e) : this.ActualWorker.addEventListener(n, t, e);
  }
  removeEventListener(n, t, e) {
    var r;
    return Y && n !== "error" ? (r = this.ActualWorker) == null ? void 0 : r.port.removeEventListener(n, t, e) : this.ActualWorker.removeEventListener(n, t, e);
  }
  /**
   * Dispatches an event to this EventTarget.
   */
  dispatchEvent(n) {
    return this.ActualWorker.dispatchEvent(n);
  }
}, Lr = class extends Ur {
  constructor(n, t) {
    let e;
    Y ? e = new SharedWorker(n, t) : e = new Worker(n, t), super(e);
  }
};
function Nr(n) {
  return n && n.__esModule && Object.prototype.hasOwnProperty.call(n, "default") ? n.default : n;
}
var qe = {};
/*! crc32.js (C) 2014-present SheetJS -- http://sheetjs.com */
(function(n) {
  (function(t) {
    t(typeof DO_NOT_EXPORT_CRC > "u" ? n : {});
  })(function(t) {
    t.version = "1.2.2";
    function e() {
      for (var w = 0, $ = new Array(256), b = 0; b != 256; ++b)
        w = b, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, $[b] = w;
      return typeof Int32Array < "u" ? new Int32Array($) : $;
    }
    var r = e();
    function s(w) {
      var $ = 0, b = 0, k = 0, T = typeof Int32Array < "u" ? new Int32Array(4096) : new Array(4096);
      for (k = 0; k != 256; ++k)
        T[k] = w[k];
      for (k = 0; k != 256; ++k)
        for (b = w[k], $ = 256 + k; $ < 4096; $ += 256)
          b = T[$] = b >>> 8 ^ w[b & 255];
      var j = [];
      for (k = 1; k != 16; ++k)
        j[k - 1] = typeof Int32Array < "u" ? T.subarray(k * 256, k * 256 + 256) : T.slice(k * 256, k * 256 + 256);
      return j;
    }
    var a = s(r), i = a[0], o = a[1], l = a[2], c = a[3], u = a[4], d = a[5], h = a[6], f = a[7], g = a[8], _ = a[9], v = a[10], E = a[11], N = a[12], C = a[13], Q = a[14];
    function Wt(w, $) {
      for (var b = $ ^ -1, k = 0, T = w.length; k < T; )
        b = b >>> 8 ^ r[(b ^ w.charCodeAt(k++)) & 255];
      return ~b;
    }
    function _r(w, $) {
      for (var b = $ ^ -1, k = w.length - 15, T = 0; T < k; )
        b = Q[w[T++] ^ b & 255] ^ C[w[T++] ^ b >> 8 & 255] ^ N[w[T++] ^ b >> 16 & 255] ^ E[w[T++] ^ b >>> 24] ^ v[w[T++]] ^ _[w[T++]] ^ g[w[T++]] ^ f[w[T++]] ^ h[w[T++]] ^ d[w[T++]] ^ u[w[T++]] ^ c[w[T++]] ^ l[w[T++]] ^ o[w[T++]] ^ i[w[T++]] ^ r[w[T++]];
      for (k += 15; T < k; )
        b = b >>> 8 ^ r[(b ^ w[T++]) & 255];
      return ~b;
    }
    function vr(w, $) {
      for (var b = $ ^ -1, k = 0, T = w.length, j = 0, Rt = 0; k < T; )
        j = w.charCodeAt(k++), j < 128 ? b = b >>> 8 ^ r[(b ^ j) & 255] : j < 2048 ? (b = b >>> 8 ^ r[(b ^ (192 | j >> 6 & 31)) & 255], b = b >>> 8 ^ r[(b ^ (128 | j & 63)) & 255]) : j >= 55296 && j < 57344 ? (j = (j & 1023) + 64, Rt = w.charCodeAt(k++) & 1023, b = b >>> 8 ^ r[(b ^ (240 | j >> 8 & 7)) & 255], b = b >>> 8 ^ r[(b ^ (128 | j >> 2 & 63)) & 255], b = b >>> 8 ^ r[(b ^ (128 | Rt >> 6 & 15 | (j & 3) << 4)) & 255], b = b >>> 8 ^ r[(b ^ (128 | Rt & 63)) & 255]) : (b = b >>> 8 ^ r[(b ^ (224 | j >> 12 & 15)) & 255], b = b >>> 8 ^ r[(b ^ (128 | j >> 6 & 63)) & 255], b = b >>> 8 ^ r[(b ^ (128 | j & 63)) & 255]);
      return ~b;
    }
    t.table = r, t.bstr = Wt, t.buf = _r, t.str = vr;
  });
})(qe);
function ot() {
  return jr(/* @__PURE__ */ new Date());
}
function jr(n) {
  return Math.floor((n.getTime() - (/* @__PURE__ */ new Date("2021-01-01T00:00:00Z")).getTime()) / 1e3);
}
function ci(n) {
  return new Date(n * 1e3 + (/* @__PURE__ */ new Date("2021-01-01T00:00:00Z")).getTime());
}
function ct(n) {
  return ot().toString(36) + "-" + qe.str(JSON.stringify(n)).toString(36);
}
function Ye(n) {
  return new Promise((t) => {
    setTimeout(t, n);
  });
}
class P {
  /**
   * Create a list endpoint.
   *
   * @param baseUrl Base URL.
   * @param modelName Model name.
   * @param query Query parameters to be appended to the endpoint.
   */
  static createListEndpoint(t, e, r) {
    var i;
    const s = `${P.sanitizeBaseUrl(t)}api/list/${e}.json`, a = new URLSearchParams();
    return new URL(t).origin !== window.location.origin && a.append("enableCors", "1"), a.append("fkOptions", JSON.stringify({ _userID: "blitzID" })), (i = r.conditions) != null && i.length && a.append("conditions", JSON.stringify(r.conditions)), r.limit && a.append("limit", r.limit.toString()), r.customSort && a.append("customSort", r.customSort), r.customSortDirection && a.append("customSortDirection", r.customSortDirection), r.pagination && a.append("pagination", r.pagination.toString()), r.var && r.var.length > 0 && a.append("var", JSON.stringify(r.var)), r.manyToMany && a.append("manyToMany", r.manyToMany), `${s}?${a.toString()}`;
  }
  /**
   * Create a get endpoint.
   *
   * @param baseUrl Base URL.
   * @param modelName Model name.
   * @param blitzID Id of the object.
   * @param query Query parameters to be appended to endpoint.
   */
  static createGetEndpoint(t, e, r, s) {
    const a = `${P.sanitizeBaseUrl(t)}api/list/${e}/_blitzID/${r}.json`, i = new URLSearchParams();
    return new URL(t).origin !== window.location.origin && i.append("enableCors", "1"), i.append("fkOptions", JSON.stringify({ _userID: "blitzID" })), s.var && s.var.length > 0 && i.append("var", JSON.stringify(s.var)), s.manyToMany && i.append("manyToMany", s.manyToMany), `${a}?${i.toString()}`;
  }
  /**
   * Create a get history endpoint.
   *
   * @param baseUrl Base URL.
   * @param modelName Model name.
   * @param blitzID Id of the object.
   */
  static createGetHistoryEndpoint(t, e, r) {
    const s = `${P.sanitizeBaseUrl(t)}api/getHistory/${e}/${r}.json`;
    return new URL(t).origin !== window.location.origin ? `${s}?enableCors=1` : s;
  }
  /**
   * Create a post endpoint.
   *
   * @param baseUrl Base URL.
   */
  static createPostEndpoint(t) {
    return `${P.sanitizeBaseUrl(t)}api/post.json`;
  }
  /**
   * Create a ping endpoint.
   *
   * @param baseUrl Base URL.
   */
  static createPingEndpoint(t) {
    return `${P.sanitizeBaseUrl(t)}api/ping.json`;
  }
  /**
   * Create a list logs endpoint.
   *
   * @param baseUrl Base URL.
   * @param model
   * @param query
   */
  static createListLogsEndpoint(t) {
    var a, i, o, l;
    const e = t.type === "delete" ? "listDeletedLogs" : "listLogs", r = t.model ? `${P.sanitizeBaseUrl(t.baseUrl)}api/${e}/${t.model}.json` : `${P.sanitizeBaseUrl(t.baseUrl)}api/${e}.json`, s = new URLSearchParams();
    return ((a = t.query) == null ? void 0 : a.from) !== void 0 && s.append("from", t.query.from.toString()), ((i = t.query) == null ? void 0 : i.afterLog) !== void 0 && t.model && s.append("afterLog", t.query.afterLog.toString()), ((o = t.query) == null ? void 0 : o.peek) === !0 && t.model && s.append("peek", "1"), (l = t.query) != null && l.models && !t.model && s.append("models", JSON.stringify(t.query.models)), `${r}?${s.toString()}`;
  }
  /**
   * Create an uploader endpoint.
   *
   * @param baseUrl Base URL.
   */
  static createUploaderEndpoint(t) {
    const e = new URL(t).origin !== window.location.origin ? "?enableCors=1" : "";
    return `${P.sanitizeBaseUrl(t)}uploader/index` + e;
  }
  /**
   * Create a video uploader endpoint.
   *
   * @param baseUrl Base URL.
   */
  static createVideoUploaderEndpoint(t, e) {
    const r = new URL(t).origin !== window.location.origin ? "?enableCors=1" : "", s = (r ? r + "&" : "?") + `filename=${e}`;
    return `${P.sanitizeBaseUrl(t)}uploadervideo/index` + s;
  }
  /**
   * Create a file uploader endpoint.
   *
   * @param baseUrl Base URL.
   */
  static createFileUploaderEndpoint(t) {
    const e = new URL(t).origin !== window.location.origin ? "?enableCors=1" : "";
    return `${P.sanitizeBaseUrl(t)}uploaderfile/index` + e;
  }
  /**
   * Sanitize the base URL. The result always ends with a slash, so relative
   * paths such as `api/list/...` resolve inside a folder deployment
   * (`https://host/cp/` -> `https://host/cp/api/list/...`) as well as at the root.
   *
   * @param baseUrl Base URL.
   */
  static sanitizeBaseUrl(t) {
    const e = new URL(t);
    if (!e.origin || !e.pathname || !e.protocol.match(/^https?:$/))
      throw new Error(`Supplied base URL is invalid: ${t}`);
    return e.pathname.endsWith("/") || (e.pathname += "/"), e.search = "", e.hash = "", e.toString();
  }
}
class Tt {
  //Send the job's transaction to its designated server
  static async send(t, e) {
    try {
      const r = new URL(t.url).origin !== self.location.origin ? "?enableCors=1" : "", s = await globalThis.fetch(
        P.createPostEndpoint(t.url) + r,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...e ?? {} },
          body: JSON.stringify([t.transaction])
        }
      );
      if (!s.ok)
        throw new Error(`HTTP request failed with status ${s.status}` + (s.statusText ? `: ${s.statusText}` : ""));
      const a = await s.json();
      if (!a || !a.results)
        throw new Error("No response returned!");
      const i = a.results[t.transaction.hash];
      if (!i)
        throw new Error("No result returned for this job!");
      if (i.s || i.s0 || i.s1 || i.n)
        return {
          status: L.Success
        };
      if (i.conflict) {
        const o = Object.keys(t.transaction.data)[0], l = i.conflict[o];
        if (l === void 0)
          throw new Error("No previous value found in conflict result!");
        return {
          status: L.Conflict,
          message: l
        };
      } else if (i.e)
        return {
          status: L.Failed,
          message: i.e
        };
      return {
        status: L.Exception,
        message: a.error ?? (Array.isArray(a.errors) ? a.errors.map((o) => (o == null ? void 0 : o.message) ?? o).join(" | ") : "Unknown error!")
      };
    } catch (r) {
      return {
        status: L.Exception,
        message: r.message
      };
    }
  }
}
class X {
  /**
   * Pings the database, ensuring it's correctly set up.
   */
  async ping() {
    const t = await this.openConnection(), e = ["sync_transactions", "evaluated_transactions"];
    for (const r of e)
      if (!t.objectStoreNames.contains(r))
        return t.close(), console.log(`There's missing stores, recreating the database. Available stores: ${t.objectStoreNames}`), await oe("db_master"), await this.ping();
    t.close();
  }
  /**
   * Records a rewritten transaction in the evaluated ledger, replacing the
   * transactions it was merged from. Sync skips evaluated hashes, so the
   * hash on record must be the one actually sent to the server — the echo
   * of an unrecorded rewritten hash would be applied as a foreign change
   * and rewind the local value.
   *
   * @param transaction Rewritten transaction as it will be sent.
   * @param replacedHashes Hashes of the transactions it replaces.
   */
  async recordRewrittenTransaction(t, e) {
    const r = await this.openConnection(), s = r.transaction("evaluated_transactions", "readwrite");
    for (const a of e)
      s.store.delete(a);
    s.store.put(t), await s.done, r.close();
  }
  /**
   * Opens a connection to the database.
   *
   * @returns instance of the database connection
   */
  async openConnection() {
    return await ht("db_master", 1, {
      upgrade: (t, e, r, s, a) => {
        r === 1 && (t.createObjectStore("sync_transactions", {
          autoIncrement: !1,
          keyPath: "hash"
        }), t.createObjectStore("evaluated_transactions", {
          autoIncrement: !1,
          keyPath: "hash"
        }));
      }
    });
  }
}
function te(n, t) {
  if (typeof n != "string" || t === null || typeof t != "object")
    return n;
  try {
    return JSON.parse(n);
  } catch {
    return n;
  }
}
function Ot(n, t) {
  if (n === t)
    return !0;
  if (n === null || t === null || typeof n != "object" || typeof t != "object" || Array.isArray(n) !== Array.isArray(t))
    return !1;
  const e = Object.keys(n);
  return e.length !== Object.keys(t).length ? !1 : e.every((r) => Object.hasOwn(t, r) && Ot(n[r], t[r]));
}
function be(n, t) {
  return Ot(te(n, t), t);
}
var kt = [], Ve, ce = [];
function ye(n, t) {
  const e = { ...t ?? Ve ?? {} };
  let r;
  try {
    r = new URL(n).origin;
  } catch {
    return e;
  }
  for (const s of ce)
    s.origin === r && Object.assign(e, s.headers);
  return e;
}
class Qe {
  constructor(t, e, r) {
    //Properties
    m(this, "_db", null);
    m(this, "_currentTimestamp", null);
    m(this, "_localHeaders");
    m(this, "_postMessage");
    this._postMessage = t, this._localHeaders = e, r && (ce = r);
  }
  //Update job
  async _updateJob(t) {
    var e;
    return await ((e = this._db) == null ? void 0 : e.put(D.store, t)), t;
  }
  //Delete job
  async _deleteJob(t) {
    var e;
    await ((e = this._db) == null ? void 0 : e.delete(D.store, t.id));
  }
  //Send job to clients
  _sendJobEvent(t) {
    if (typeof this._postMessage == "function")
      this._postMessage({ data: { job: t } });
    else
      for (const e of kt)
        e == null || e.postMessage({ job: t });
  }
  //Get next job
  async _getNextJob() {
    var a;
    let t = null;
    const e = (a = this._db) == null ? void 0 : a.transaction(D.store, "readonly").store, r = this._currentTimestamp ? IDBKeyRange.lowerBound(this._currentTimestamp, !0) : null;
    let s = await (e == null ? void 0 : e.index(D.timeIndex).openCursor(r, "next"));
    for (; s; ) {
      if (s.value.status === p.Pending) {
        t = s.value;
        break;
      }
      s = await s.continue();
    }
    return this._currentTimestamp = (t == null ? void 0 : t.createdAt) ?? null, t;
  }
  //Handle priority check
  async _checkPriority(t) {
    let e = !1;
    return t.attempts && t.priority && t.priority > 1 && (e = t.attempts % t.priority !== 0, e && await this._updateJob({
      ...t,
      attempts: t.attempts + 1
    })), e;
  }
  //Get preceding unresolved jobs
  async _getPrecedingUnresolvedJobs(t) {
    var o;
    const e = [], r = t.transaction.action === M.Edit ? Object.keys(t.transaction.data)[0] : null, s = (o = this._db) == null ? void 0 : o.transaction(D.store, "readonly").store, a = IDBKeyRange.upperBound(t.createdAt, !0);
    let i = await (s == null ? void 0 : s.index(D.timeIndex).openCursor(a, "next"));
    for (; i; )
      //Only unresolved jobs
      i.value.status !== p.Completed && //Same destination
      i.value.url === t.url && //Only same object jobs
      i.value.transaction.blitzID === t.transaction.blitzID && //Only same attribute jobs if both passed job and current job have an edit action
      (i.value.transaction.action !== M.Edit || t.transaction.action !== M.Edit || Object.keys(i.value.transaction.data)[0] === r) && e.push(i.value), i = await i.continue();
    return e;
  }
  //Handle preceding unresolved add job check
  async _checkPrecedingUnresolvedAddJob(t, e) {
    let r = !1;
    if (e.length > 0 && e[0].transaction.action === M.Add && (r = !0, t.transaction.action === M.Delete))
      for (const s of [t, ...e])
        await this._deleteJob(s);
    return r;
  }
  //Handle preceding conflict edit jobs check
  async _checkPrecedingConflictEditJobs(t, e) {
    let r = !1;
    if (e.find((a) => a.transaction.action === M.Edit && a.status === p.Conflict)) {
      r = !0;
      const a = await this._updateJob({
        ...t,
        status: p.Conflict
      });
      this._sendJobEvent(a);
    }
    return r;
  }
  //Handle preceding failed edit jobs check
  async _checkPrecedingFailedEditJobs(t, e) {
    var o, l;
    let r = !1;
    const s = e.filter((c) => c.transaction.action === M.Edit && (c.status === p.Pending || c.status === p.Failed)), a = Object.keys(t.transaction.data)[0], i = ((o = t.transaction.data) == null ? void 0 : o[a].new) !== void 0 && ((l = t.transaction.data) == null ? void 0 : l[a].prev) !== void 0;
    return s.length > 0 && i && (r = !0, t.attempts || await this._editAttemptHandler(t, s)), r;
  }
  //Handle merging with future edit jobs
  async _mergeWithFutureEditJobs(t) {
    var l, c, u;
    const e = [], r = Object.keys(t.transaction.data)[0], s = (l = this._db) == null ? void 0 : l.transaction(D.store, "readonly").store, a = IDBKeyRange.lowerBound(t.createdAt, !0);
    let i = await (s == null ? void 0 : s.index(D.timeIndex).openCursor(a, "next"));
    for (; i; )
      //Only unresolved jobs
      (i.value.status === p.Pending || i.value.status === p.Failed) && //Same destination
      i.value.url === t.url && //Only edit jobs
      i.value.transaction.action === M.Edit && //Only same object jobs
      i.value.transaction.blitzID === t.transaction.blitzID && //Only same attribute jobs
      Object.keys(i.value.transaction.data)[0] === r && e.push(i.value), i = await i.continue();
    var o = t;
    if (e.length > 0) {
      const d = e[e.length - 1];
      if (d && ((c = d.transaction.data) == null ? void 0 : c[r].new) !== void 0 && ((u = t.transaction.data) == null ? void 0 : u[r].prev) !== void 0) {
        const h = {
          [r]: {
            prev: t.transaction.data[r].prev,
            new: d.transaction.data[r].new
          }
        }, f = (/* @__PURE__ */ new Date()).getTime();
        o = await this._updateJob({
          ...t,
          transaction: {
            ...t.transaction,
            data: h,
            blitzstamp: ot(),
            hash: ct({ ...h, blitzID: t.transaction.blitzID, timestamp: f })
          },
          dataHistory: [...t.dataHistory ?? [], { timestamp: f, type: "worker-succeeding", data: t.transaction.data }]
        }), await new X().recordRewrittenTransaction(
          o.transaction,
          [t.transaction.hash, ...e.map((g) => g.transaction.hash)]
        );
        for (const g of e)
          await this._deleteJob(g);
      }
    }
    return o;
  }
  //Handle job's status response
  async _statusHandler(t, e) {
    var r, s, a;
    if (e.status === L.Success) {
      const i = await this._updateJob({
        ...t,
        status: p.Completed
      });
      this._sendJobEvent(i);
    } else if (e.status === L.Exception)
      await this._updateJob({
        ...t,
        status: p.Pending,
        attempts: t.attempts + 1,
        priority: t.priority < 5 ? t.priority + 1 : t.priority,
        message: e.message
      });
    else if (e.status === L.Failed)
      if (t.attempts > 0) {
        const i = await this._updateJob({
          ...t,
          status: p.Failed,
          message: e.message
        });
        this._sendJobEvent(i);
      } else
        await this._updateJob({
          ...t,
          status: p.Pending,
          attempts: t.attempts + 1,
          message: e.message
        });
    else if (e.status === L.Conflict) {
      const i = Object.keys(t.transaction.data)[0];
      if (Ot((r = t.transaction.data) == null ? void 0 : r[i].prev, (s = t.transaction.data) == null ? void 0 : s[i].new) || be(e.message, (a = t.transaction.data) == null ? void 0 : a[i].new)) {
        const o = await this._updateJob({
          ...t,
          status: p.Completed
        });
        this._sendJobEvent(o);
      } else {
        const o = await this._updateJob({
          ...t,
          status: p.Conflict,
          message: e.message
        });
        this._sendJobEvent(o);
      }
    }
  }
  //Handle edit job attempt
  async _editAttemptHandler(t, e) {
    var c, u, d, h, f;
    const r = Object.keys(t.transaction.data)[0], s = e[0];
    if (((c = s.transaction.data) == null ? void 0 : c[r].prev) === void 0)
      return;
    const a = {
      [r]: {
        prev: s.transaction.data[r].prev,
        new: (u = t.transaction.data) == null ? void 0 : u[r].new
      }
    }, i = (/* @__PURE__ */ new Date()).getTime();
    var o = {
      ...t,
      transaction: {
        ...t.transaction,
        data: a,
        blitzstamp: ot(),
        hash: ct({ ...a, blitzID: t.transaction.blitzID, timestamp: i })
      },
      dataHistory: [...t.dataHistory ?? [], { timestamp: i, type: "worker-attempt", data: t.transaction.data }]
    };
    await new X().recordRewrittenTransaction(o.transaction, []);
    let l;
    if (a[r].prev === a[r].new ? l = { status: L.Success } : l = await Tt.send(o, ye(o.url, this._localHeaders)), l.status === L.Success) {
      o = await this._updateJob({
        ...o,
        status: p.Completed
      });
      for (const g of e)
        await this._updateJob({
          ...g,
          status: p.Completed
        });
      this._sendJobEvent(o);
    } else if (l.status === L.Exception || l.status === L.Failed)
      await this._updateJob({
        ...t,
        status: s.status,
        attempts: t.attempts + 1,
        message: l.message
      });
    else if (l.status === L.Conflict)
      if (Ot((d = o.transaction.data) == null ? void 0 : d[r].prev, (h = o.transaction.data) == null ? void 0 : h[r].new) || be(l.message, (f = o.transaction.data) == null ? void 0 : f[r].new)) {
        o = await this._updateJob({
          ...o,
          status: p.Completed
        });
        for (const g of e)
          await this._updateJob({
            ...g,
            status: p.Completed
          });
        this._sendJobEvent(o);
      } else {
        o = await this._updateJob({
          ...o,
          status: p.Conflict,
          message: l.message
        });
        for (const g of e)
          await this._deleteJob(g);
        this._sendJobEvent(o);
      }
    (l.status === L.Success || l.status === L.Conflict) && await new X().recordRewrittenTransaction(
      o.transaction,
      [t.transaction.hash, ...e.map((g) => g.transaction.hash)]
    );
  }
  //Start processing queue
  async start() {
    var r, s;
    for (this._db = await ht(D.name, 1); ; ) {
      try {
        var t = await this._getNextJob();
        if (!t)
          throw new Error("SKIP");
        if (await this._checkPriority(t))
          throw new Error("SKIP");
        var e = [];
        if ((t.transaction.action === M.Edit || t.transaction.action === M.Delete) && (e = await this._getPrecedingUnresolvedJobs(t), await this._checkPrecedingUnresolvedAddJob(t, e)))
          throw new Error("SKIP");
        if (t.transaction.action === M.Edit) {
          if (await this._checkPrecedingConflictEditJobs(t, e))
            throw new Error("SKIP");
          if (await this._checkPrecedingFailedEditJobs(t, e))
            throw new Error("SKIP");
          t = await this._mergeWithFutureEditJobs(t);
          const c = Object.keys(t.transaction.data)[0];
          if (((r = t.transaction.data) == null ? void 0 : r[c].prev) !== void 0 && ((s = t.transaction.data) == null ? void 0 : s[c].new) !== void 0 && t.transaction.data[c].prev === t.transaction.data[c].new) {
            const u = { status: L.Success };
            throw await this._statusHandler(t, u), new Error("SKIP");
          }
        }
        const i = await Tt.send(t, ye(t.url, this._localHeaders));
        await this._statusHandler(t, i);
      } catch (a) {
        if (a.message !== "SKIP") {
          console.error(a.stack);
          break;
        }
      }
      await new Promise((a) => setTimeout(a, 1e3));
    }
    this._db && this._db.close(), this.start();
  }
}
function pe(n) {
  kt.push(n), n.onmessage = function(t) {
    t.data.type === "close" ? kt = kt.filter((e) => e !== n) : t.data.type === "headers" ? t.data.data && (Ve = t.data.data) : t.data.type === "scopedHeaders" && t.data.data && (ce = t.data.data);
  };
}
("SharedWorkerGlobalScope" in self || "WorkerGlobalScope" in self) && ("SharedWorkerGlobalScope" in self ? self.onconnect = (n) => pe(n.ports[0]) : pe(self), new Qe().start());
class W {
  /**
   * Constructor.
   *
   * @param options Options to construct a transaction.
   */
  constructor(t) {
    /**
     * Action of the transaction.
     */
    m(this, "action");
    /**
     * BlitzData epoch, which is seconds since 2021-01-01.
     */
    m(this, "blitzstamp");
    /**
     * Hash of the transaction.
     */
    m(this, "hash");
    /**
     * Hash algorithm of the transaction.
     */
    m(this, "hashAlgo");
    /**
     * Hash ID of the transaction.
     */
    m(this, "blitzID");
    /**
     * Hash ID of the user.
     */
    m(this, "userhash");
    /**
     * Table name of the model.
     */
    m(this, "model");
    /**
     * Data of the transaction.
     */
    m(this, "data");
    var e;
    this.action = t.action, this.blitzstamp = t.blitzstamp ?? ot(), this.hash = t.hash ?? ct(t.data === void 0 ? { blitzID: t.blitzID, milliseconds: (/* @__PURE__ */ new Date()).getTime(), rand: Math.random() } : { ...t.data, blitzID: t.blitzID, milliseconds: (/* @__PURE__ */ new Date()).getTime(), rand: Math.random() }), this.hashAlgo = t.hashAlgo ?? "b-crc32", this.blitzID = t.blitzID ?? ((e = t.data) == null ? void 0 : e._blitzID) ?? this.hash, this.model = t.model, this.data = t.data ?? {}, this.userhash = t.userhash;
  }
  /**
   * Converts the transaction to an object.
   */
  toObject() {
    return {
      action: this.action,
      blitzstamp: this.blitzstamp,
      hash: this.hash,
      hashAlgo: this.hashAlgo,
      blitzID: this.blitzID,
      model: this.model,
      data: this.data,
      userhash: this.userhash
    };
  }
  /**
   * Creates new transaction object same data as this object.
   */
  clone() {
    return new W({
      action: this.action,
      model: this.model,
      blitzID: this.blitzID,
      blitzstamp: this.blitzstamp,
      data: this.data,
      hash: this.hash,
      hashAlgo: this.hashAlgo,
      userhash: this.userhash
    });
  }
  /**
   * Converts an object to a transaction.
   *
   * @param object Object to convert.
   */
  static fromObject(t) {
    var e;
    return new W({
      action: t.action,
      blitzstamp: t.blitzstamp,
      hash: t.hash,
      hashAlgo: t.hashAlgo,
      blitzID: t.blitzID ?? ((e = t.data) == null ? void 0 : e._blitzID) ?? t.blitzID,
      model: t.model,
      data: t.data,
      userhash: t.userhash
    });
  }
}
var x = /* @__PURE__ */ ((n) => (n.Success = "success", n.Notice = "notice", n.Error = "error", n.Exception = "exception", n))(x || {});
class B {
  /**
   * Constructor.
   *
   * @param hash Hash of the transaction.
   * @param status Status of the transaction result.
   * @param message Message of the transaction.
   * @param conflict Whether it is a conflicting transaction or not.
   */
  constructor(t, e, r, s = null, a) {
    /**
     * Hash ID of the transaction.
     */
    m(this, "blitzID");
    /**
     * Hash of the transaction.
     */
    m(this, "hash");
    /**
     * Message of the transaction.
     */
    m(this, "message");
    /**
     * Whether it is a conflicting transaction or not.
     */
    m(this, "conflict");
    /**
     * Cluster replica URL.
     */
    m(this, "replicaUrl", null);
    /**
     * Status of the result.
     */
    m(this, "status");
    this.blitzID = t, this.hash = e, this.status = r, this.message = s, this.conflict = a;
  }
  /**
   * Sets the replica url.
   *
   * @param url Replica url.
   */
  setReplicaUrl(t) {
    this.replicaUrl = t;
  }
  /**
   * Whether the transaction was conflicting or not.
   *
   * @return True if it was a conflicting transaction, false otherwise.
   */
  isConflict() {
    return typeof this.conflict < "u" && this.conflict !== null;
  }
}
class At extends Array {
  /**
   * Returns the transaction result with given hash.
   *
   * @param hash Hash of the transaction.
   */
  get(t) {
    return this.find((e) => e.hash === t);
  }
  /**
   * Checks whether given hash is in the collection.
   *
   * @param hash Hash of the transaction.
   */
  has(t) {
    return this.some((e) => e.hash === t);
  }
  /**
   * Checks whether all transaction results are successful, or given hash is successful.
   *
   * @param hash [Optional] Hash ID of the transaction to be checked.
   */
  isSuccessful(t) {
    var e;
    if (t) {
      const r = (e = this.get(t)) == null ? void 0 : e.status;
      return r ? r === "success" || r === "notice" : !1;
    }
    return this.every((r) => r.status);
  }
  /**
   * Checks whether all transaction results are failed, or given hash is failed.
   *
   * @param hash [Optional] Hash ID of the transaction to be checked.
   */
  isFailed(t) {
    var e;
    if (t) {
      const r = (e = this.get(t)) == null ? void 0 : e.status;
      return r ? r === "error" : !0;
    }
    return this.every((r) => !r.status);
  }
  /**
   * Returns new transaction result collection that only contains successful transaction results.
   */
  successful() {
    return new At(...this.filter((t) => t.status));
  }
  /**
   * Returns new transaction result collection that only contains failed transaction results.
   */
  failed() {
    return new At(...this.filter((t) => !t.status));
  }
}
let Xe;
function Fr(n) {
  Xe = n;
}
function K() {
  return Xe;
}
class jt {
  constructor() {
    /**
     * Master indexed db client.
     */
    m(this, "client", new X());
  }
  /**
   * Creates a new instance of the SyncTransactionRepository class.
   */
  static create() {
    return new jt();
  }
  /**
   * Returns all waited transactions from the indexed db.
   */
  async all() {
    const t = await this.client.openConnection(), e = await t.getAll("sync_transactions");
    return t.close(), e;
  }
  /**
   * Adds a new transaction to the indexed db.
   */
  async put(t) {
    const e = await this.client.openConnection();
    await e.put("sync_transactions", t), e.close();
  }
  /**
   * Adds multiple transactions to the indexeddb.
   */
  async putMultiple(t) {
    if (t.length === 0)
      return;
    const e = await this.client.openConnection(), r = e.transaction("sync_transactions", "readwrite");
    for (const s of t)
      r.store.put(s);
    await r.done, e.close();
  }
  /**
   * Deletes the transaction from indexed db by its hash.
   */
  async delete(t) {
    const e = await this.client.openConnection();
    await e.delete("sync_transactions", t), e.close();
  }
}
function Ke(n, t, e) {
  const r = Array.isArray(n) ? [...n] : [];
  if (Object.hasOwn(t, "add")) {
    const a = t.add;
    return e ? [...r, {
      _blitzID: typeof a == "string" ? a : a._blitzID,
      _mtmSort: typeof a == "string" ? r.length ? Math.max(...r.map((i) => i._mtmSort)) + 15 : 15 : a._mtmSort
    }] : [...r, a];
  }
  const s = r.findIndex((a) => e ? a._blitzID === t.remove : a === t.remove);
  return s >= 0 && r.splice(s, 1), r;
}
class q {
  /**
   * Creates new transaction evaluator.
   */
  static create() {
    return new q();
  }
  /**
   * Runs the transaction evaluator with supplied transactions.
   *
   * @param transactions Transactions to be processed.
   */
  async run(t) {
    const e = new At(), r = jt.create(), s = { add: 1, edit: 2, delete: 3 }, a = await new X().openConnection();
    t = t.sort((i, o) => s[i.action] - s[o.action]);
    for (const i of t) {
      let o;
      i.model === "@Model" ? i.model = "_Model" : i.model === "@Project" && (i.model = "_Project");
      try {
        if (i.action === "add")
          o = await this.processAddTransaction(i);
        else if (i.action === "edit")
          o = await this.processEditTransaction(i, a);
        else if (i.action === "delete")
          o = await this.processDeleteTransaction(i);
        else
          throw new Error(`Unknown action "${i.action}" on transaction ${i.hash}`);
        o.status === x.Success && await a.put("evaluated_transactions", i.toObject());
      } catch (l) {
        o = new B(
          i.blitzID,
          i.hash,
          x.Error,
          l.message
        );
      }
      e.push(o), await r.delete(i.hash);
    }
    return a.close(), e;
  }
  /**
   * Processes the `add` transaction.
   *
   * @param transaction Transaction to be processed.
   */
  async processAddTransaction(t) {
    var i;
    const e = await K().get(t.model), r = e.idbClient();
    if (await r.find(t.hash))
      return new B(
        t.hash,
        t.hash,
        x.Error,
        `Object with ${t.hash} already exists on ${t.model} model.`
      );
    const s = e.getClusterManager(), a = {
      _blitzID: t.hash,
      _blitzstamp: t.blitzstamp.toString(),
      _sort: t.blitzstamp.toString(),
      _clusters: s.names(),
      _editURLs: s.toArray().map((o) => o.options.addURL).flat(),
      ...(() => {
        const o = {};
        for (const [l, c] of Object.entries(t.data)) {
          const u = e.getAttributeDetails(l);
          if (u && Array.isArray(u.type) && c !== void 0) {
            const d = typeof c == "string" ? JSON.parse(c) : c;
            l.endsWith("_mtm") ? o[l] = d.map((f, g) => ({
              _blitzID: typeof f == "string" ? f : f._blitzID,
              _mtmSort: typeof f == "string" ? (d.length - g) * 15 : f._mtmSort
            })) : o[l] = d;
          } else
            o[l] = c;
        }
        return o;
      })()
    };
    if (["1", !0].includes((i = e.haspublishingdate) == null ? void 0 : i.value) && typeof t.data._publishingdate > "u" && typeof t.blitzstamp == "number") {
      const o = /* @__PURE__ */ new Date();
      o.setTime(t.blitzstamp * 1e3 + (/* @__PURE__ */ new Date("2021-01-01T00:00:00Z")).getTime()), o.setMinutes(o.getMinutes() - o.getTimezoneOffset()), a._publishingdate = o.toISOString().slice(0, 19).replace("T", " ");
    }
    return !a._userID && t.userhash && (a._userID = t.userhash), t.data = a, await r.create(a), new B(t.hash, t.hash, x.Success);
  }
  /**
   * Processes the `edit` transaction.
   *
   * @param transaction Transaction to be processed.
   */
  async processEditTransaction(t, e) {
    var c;
    const r = await K().get(t.model), s = r.idbClient(), a = Object.keys(t.data);
    if (a.length !== 1)
      return new B(
        t.blitzID,
        t.hash,
        x.Error,
        a.length > 1 ? "Can not edit more than one attribute at once." : "Attribute not provided to perform edit."
      );
    if (await e.get("evaluated_transactions", t.hash))
      return new B(
        t.blitzID,
        t.hash,
        x.Notice,
        `Transaction ${t.hash} already processed.`
      );
    const i = await s.find(t.blitzID);
    if (!i)
      return new B(t.blitzID, t.hash, x.Notice, `Object with ${t.blitzID} does not exists.`);
    if (i._savetimestamp && i._savetimestamp > t.blitzstamp)
      return new B(t.blitzID, t.hash, x.Notice, "Old transaction.");
    const o = a.shift(), l = (c = r.getAttributeDetails(o)) == null ? void 0 : c.type;
    if (Array.isArray(l)) {
      const u = t.data[o];
      if (Object.hasOwn(u, "add") || Object.hasOwn(u, "remove") && Array.isArray(i[o]))
        i[o] = Ke(i[o], u, o.endsWith("_mtm"));
      else
        return new B(t.blitzID, t.hash, x.Error, `Invalid operation for array attribute ${o}.`);
    } else {
      const u = t.data[o];
      if (i[o] === u.new)
        return new B(t.blitzID, t.hash, x.Notice, "Conflict");
      i[o] = u.new;
    }
    return await s.update(i), new B(t.blitzID, t.hash, x.Success);
  }
  /**
   * Processes the `delete` transaction.
   *
   * @param transaction Transaction to be processed.
   */
  async processDeleteTransaction(t) {
    const r = (await K().get(t.model)).idbClient();
    return await r.find(t.blitzID) ? (await r.delete(t.blitzID), new B(t.blitzID, t.hash, x.Success)) : new B(t.blitzID, t.hash, x.Error, `Object with ${t.blitzID} does not exists.`);
  }
}
class Wr {
  //Constructor
  constructor(t) {
    //Properties
    m(this, "_db");
    this._db = t;
  }
  //Update job
  async _updateJob(t) {
    var e;
    return await ((e = this._db) == null ? void 0 : e.put(D.store, t)), t;
  }
  //Delete job
  async _deleteJob(t) {
    var e;
    await ((e = this._db) == null ? void 0 : e.delete(D.store, t.id));
  }
  //Get completed replicated jobs
  async _getCompletedReplicatedJobs(t) {
    var a;
    const e = [], r = (a = this._db) == null ? void 0 : a.transaction(D.store, "readonly").store;
    let s = await (r == null ? void 0 : r.openCursor(null, "next"));
    for (; s; )
      //Only completed jobs
      s.value.status === p.Completed && //Not the same destination
      s.value.url !== t.url && //Only edit jobs
      s.value.transaction.action === M.Edit && //Only same object jobs
      s.value.transaction.blitzID === t.transaction.blitzID && //Only same hash
      s.value.transaction.hash === t.transaction.hash && e.push(s.value), s = await s.continue();
    return e;
  }
  //Get future jobs
  async _getFutureJobs(t, e) {
    var o;
    const r = [], s = (o = this._db) == null ? void 0 : o.transaction(D.store, "readonly").store, a = IDBKeyRange.lowerBound(t.createdAt, !0);
    let i = await (s == null ? void 0 : s.index(D.timeIndex).openCursor(a, "next"));
    for (; i; )
      //Only conflict jobs
      i.value.status === p.Conflict && //Same destination
      i.value.url === t.url && //Only edit jobs
      i.value.transaction.action === M.Edit && //Only same object jobs
      i.value.transaction.blitzID === t.transaction.blitzID && //Only same attribute jobs
      Object.keys(i.value.transaction.data)[0] === e && r.push(i.value), i = await i.continue();
    return r;
  }
  //Merge with future jobs
  async _mergeWithFutureEditJobs(t, e) {
    var a, i;
    const r = await this._getFutureJobs(t, e);
    let s = t;
    if (r.length > 0) {
      const o = r[r.length - 1];
      if (o && ((a = o.transaction.data) == null ? void 0 : a[e].new) !== void 0 && ((i = t.transaction.data) == null ? void 0 : i[e].prev) !== void 0) {
        const l = {
          [e]: {
            prev: t.transaction.data[e].prev,
            new: o.transaction.data[e].new
          }
        }, c = (/* @__PURE__ */ new Date()).getTime();
        s = await this._updateJob({
          ...t,
          transaction: {
            ...t.transaction,
            data: l,
            blitzstamp: ot(),
            hash: ct({ ...l, blitzID: t.transaction.blitzID, timestamp: c })
          },
          dataHistory: [...t.dataHistory ?? [], { timestamp: c, type: "conflict-succeeding", data: t.transaction.data }]
        }), await new X().recordRewrittenTransaction(
          s.transaction,
          [t.transaction.hash, ...r.map((u) => u.transaction.hash)]
        );
        for (const u of r)
          await this._deleteJob(u);
      }
    }
    return s;
  }
  //Validate a conflict job and merge it with its future edits (shared by prompt/resolve)
  async _prepare(t) {
    if (t.message === void 0)
      return null;
    const e = Object.keys(t.transaction.data)[0];
    return { newJob: await this._mergeWithFutureEditJobs(t, e), attribute: e };
  }
  //Prompt the user to force or revert the job
  async prompt(t) {
    var i;
    const e = await this._prepare(t);
    if (!e)
      return;
    const { newJob: r, attribute: s } = e, a = `There was a conflict.
The data got changed to "${r.message}".
Do you still want to perform your change to "${(i = r.transaction.data) == null ? void 0 : i[s].new}"?`;
    await this._apply(r, confirm(a));
  }
  //Resolve a conflict without prompting: execute the local change (force) or take the server value (revert)
  async resolve(t, e) {
    const r = await this._prepare(t);
    r && await this._apply(r.newJob, e);
  }
  //Apply a resolution to an already-merged conflict job
  async _apply(t, e) {
    let r = t;
    e ? (r = await this.force(r), await y.queue.updateSyncStatus(r, p.Pending)) : (await this.revert(r), await y.queue.updateSyncStatus(r, p.Completed)), y.dispatchEvent("queue:conflict-resolved", r), y.queue.notifier.resolved(r.id);
  }
  //Force the job
  async force(t) {
    var o, l;
    const e = Object.keys(t.transaction.data)[0], r = await this._getFutureJobs(t, e), s = {
      [e]: {
        prev: te(t.message, (o = t.transaction.data) == null ? void 0 : o[e].new),
        new: (l = t.transaction.data) == null ? void 0 : l[e].new
      }
    }, a = (/* @__PURE__ */ new Date()).getTime(), i = await this._updateJob({
      ...t,
      status: p.Pending,
      transaction: {
        ...t.transaction,
        data: s,
        blitzstamp: ot(),
        hash: ct({ ...s, blitzID: t.transaction.blitzID, timestamp: a })
      },
      dataHistory: [...t.dataHistory ?? [], { timestamp: a, type: "conflict-force", data: t.transaction.data }]
    });
    await q.create().run([
      new W({
        action: "edit",
        model: i.transaction.model,
        blitzID: i.transaction.blitzID,
        blitzstamp: i.transaction.blitzstamp,
        hash: i.transaction.hash,
        data: i.transaction.data
      })
    ]), await new X().recordRewrittenTransaction(i.transaction, [t.transaction.hash]);
    for (const c of r)
      await this._updateJob({
        ...c,
        status: p.Pending
      });
    return i;
  }
  //Revert the job
  async revert(t) {
    var i, o;
    const e = Object.keys(t.transaction.data)[0], r = new W({
      action: "edit",
      model: t.transaction.model,
      blitzID: t.transaction.blitzID,
      data: {
        [e]: {
          prev: (i = t.transaction.data) == null ? void 0 : i[e].new,
          new: te(t.message, (o = t.transaction.data) == null ? void 0 : o[e].new)
        }
      }
    });
    await q.create().run([r]);
    const s = await this._getFutureJobs(t, e), a = await this._getCompletedReplicatedJobs(t);
    for (const l of [t, ...s])
      await this._deleteJob(l);
    if (a.length > 0) {
      const l = a.map((c) => c.url).filter((c, u, d) => d.findIndex((h) => h === c) === u);
      for (const c of l)
        await y.queue.addJob(c, r.toObject());
    }
  }
}
const gt = {
  a: ["à", "á", "â", "ä"],
  c: ["ç"],
  e: ["è", "é", "ê"],
  o: ["ö", "ó", "ò", "ô", "õ"],
  oe: ["œ"],
  ss: ["ß"],
  u: ["ü"]
};
class Dt {
  constructor() {
    m(this, "children");
    m(this, "isEndOfWord");
    m(this, "items");
    this.children = {}, this.isEndOfWord = !1, this.items = [];
  }
}
class Rr {
  /**
   * Constructor for the Trie.
   *
   * @param model The model to build the Trie for.
   * @param data The data to build the Trie from.
   */
  constructor(t, e) {
    m(this, "root");
    if (this.root = new Dt(), !e)
      return;
    const r = this.getWordFrequency(t, e);
    for (const s in r)
      this.insert(s, r[s].items);
  }
  /**
   * Loads the Trie data structure from a JSON object.
   *
   * @param json The JSON object containing the data to load.
   * @param nod The TrieNode to load the data into.
   */
  _loadFromJson(t, e) {
    Object.keys(t).forEach((r) => {
      typeof t[r] == "string" || typeof t[r] == "boolean" || (e.children[r] || (e.children[r] = new Dt()), t[r].hasOwnProperty("isEndOfWord") && t[r].isEndOfWord && (e.children[r].isEndOfWord = !0, e.children[r].items = t[r].items), this._loadFromJson(t[r], e.children[r]));
    });
  }
  /**
   * Loads the Trie data structure from a JSON object.
   *
   * @param json - The JSON object representing the Trie data structure.
   *
   * @returns The Trie instance.
   */
  loadFromJson(t) {
    return this.root = new Dt(), this._loadFromJson(t, this.root), this;
  }
  toJson() {
    const t = (e) => {
      let r = {};
      for (const s in e.children)
        r[s] = t(e.children[s]);
      return e.isEndOfWord && (r.isEndOfWord = !0, r.items = e.items), r;
    };
    return t(this.root);
  }
  getWordFrequency(t, e) {
    const r = {}, s = t.getAttributes();
    return e.forEach((a) => {
      s == null || s.forEach((i) => {
        if (!a[i])
          return;
        a[i].toString().toLowerCase().split(" ").forEach((l) => {
          l !== "" && (r[l] ? r[l].items.push(a._blitzID) : r[l] = {
            items: [a._blitzID]
          });
        });
      });
    }), r;
  }
  getVariants(t) {
    const e = gt[t], r = [t];
    return e && r.push(...e), r;
  }
  generateAllPermutations(t, e, r, s, a) {
    if (e === r.length) {
      a.push(t);
      return;
    }
    const i = r[e], o = e !== r.length - 1 ? i + r[e + 1] : void 0;
    if (!gt[i] && !(o && gt[o])) {
      this.generateAllPermutations(
        t + i,
        e + 1,
        r,
        s,
        a
      );
      return;
    }
    if (gt[i]) {
      const l = s[i];
      for (const c of l)
        this.generateAllPermutations(
          t + c,
          e + 1,
          r,
          s,
          a
        );
    }
    if (o && gt[o]) {
      const l = s[o];
      for (const c of l)
        this.generateAllPermutations(
          t + c,
          e + 2,
          r,
          s,
          a
        );
    }
  }
  normalizeQuery(t) {
    const e = /u|e|a|o|c|ss|oe/g, r = t.toLowerCase().match(e);
    if (!r)
      return [t.toLowerCase()];
    const s = {};
    r.forEach((i) => {
      s[i] = this.getVariants(i);
    });
    const a = [];
    return this.generateAllPermutations("", 0, t, s, a), a;
  }
  insert(t, e) {
    let r = this.root;
    for (const s of t)
      r.children[s] || (r.children[s] = new Dt()), r = r.children[s];
    r.isEndOfWord = !0, r.items = e;
  }
  addToSet(t, e) {
    const r = this.normalizeQuery(t);
    for (const s of r)
      this._search(s).forEach((i) => {
        e.add(i);
      });
  }
  search(t) {
    const e = t == null ? void 0 : t.toLowerCase().split(" ");
    let r = /* @__PURE__ */ new Set();
    return this.addToSet(e[0], r), e.slice(1).forEach((s) => {
      const a = /* @__PURE__ */ new Set();
      this.addToSet(s, a);
      for (const i of r)
        a.has(i) || r.delete(i);
    }), Array.from(r);
  }
  _search(t) {
    let e = this.root;
    for (const s of t) {
      if (!e.children[s])
        return [];
      e = e.children[s];
    }
    const r = [];
    return t === "" ? this.collectWords(e, "", r) : this.collectWords(e, t, r), r;
  }
  collectWords(t, e, r) {
    t.isEndOfWord && r.push(...t.items);
    for (const s in t.children) {
      const a = t.children[s], i = e + s;
      this.collectWords(a, i, r);
    }
  }
}
class S {
  /**
   * Generates a new local storage key by provided key.
   *
   * @param key
   */
  static getKey(t) {
    return `BlitzData.${t}`;
  }
  /**
   * Returns a value from local storage for BlitzData.
   * @param key
   */
  static get(t) {
    return localStorage.getItem(this.getKey(t));
  }
  /**
   * Sets a new value in local storage for BlitzData.
   *
   * @param key
   * @param value
   */
  static set(t, e) {
    localStorage.setItem(this.getKey(t), e);
  }
  /**
   * Checks whether a key exists or not for BlitzData.
   *
   * @param key
   */
  static has(t) {
    return Object.hasOwn(localStorage, this.getKey(t));
  }
  /**
   * Removes an item from local storage for BlitzData.
   *
   * @param key
   */
  static remove(t) {
    localStorage.removeItem(this.getKey(t));
  }
  /**
   * Clears all the local storage items for BlitzData.
   */
  static clear() {
    const t = Object.keys(localStorage);
    for (const e of t)
      e.startsWith("BlitzData.") && localStorage.removeItem(e);
  }
  /**
   * Returns a stream's sync cursor: the composite (timestamp, logID)
   * position of the last applied change-log row for one
   * (model, cluster, stream) feed. logID is null when the server predates
   * the composite protocol.
   */
  static getSyncCursor(t, e, r) {
    const s = this.get(`sync.${t}.${e}.${r}.cursor`);
    if (!s)
      return null;
    try {
      const a = JSON.parse(s);
      if (typeof a == "number")
        return { timestamp: a, logID: null };
      if (a && typeof a.timestamp == "number")
        return { timestamp: a.timestamp, logID: typeof a.logID == "number" ? a.logID : null };
    } catch {
    }
    return null;
  }
  /**
   * Sets a stream's sync cursor.
   */
  static setSyncCursor(t, e, r, s) {
    this.set(`sync.${t}.${e}.${r}.cursor`, JSON.stringify(s));
  }
  /**
   * Whether the model has any sync cursor — i.e. it has been bootstrapped
   * and its local database is the source of truth.
   */
  static hasSyncCursors(t) {
    const e = this.getKey(`sync.${t}.`);
    return Object.keys(localStorage).some((r) => r.startsWith(e));
  }
  /**
   * Returns the wall-clock time (unix seconds) a model was last synced.
   */
  static getLastSyncRunAt(t) {
    const e = this.get(`sync.${t}.lastRunAt`);
    return e ? parseInt(e) : null;
  }
  /**
   * Sets the wall-clock time (unix seconds) a model was last synced.
   */
  static setLastSyncRunAt(t, e) {
    this.set(`sync.${e}.lastRunAt`, t.toString());
  }
  /**
   * Gets the current user.
   */
  static getCurrentUser() {
    const t = this.get("currentUser");
    return t ? JSON.parse(t) : null;
  }
  /**
   * Sets the current user.
   */
  static setCurrentUser(t) {
    t ? this.set("currentUser", JSON.stringify(t)) : this.remove("currentUser");
  }
  /**
   * Gets a project's users.
   */
  static getProjectUsers(t) {
    const e = this.get("projectUsers." + t);
    return e ? JSON.parse(e) : null;
  }
  /**
   * Sets a project's users.
   */
  static setProjectUsers(t, e) {
    const r = "projectUsers." + t;
    e ? this.set(r, JSON.stringify(e)) : this.remove(r);
  }
  /**
   * Returns the saved databases.
   */
  static getDatabases() {
    return JSON.parse(this.get("databases") ?? "[]");
  }
  /**
   * Sets the databases.
   *
   * @param databases
   */
  static setDatabases(t) {
    this.set("databases", JSON.stringify(t));
  }
  /**
   * @param hash
   */
  static getListCallLastTimeStamp(t) {
    const e = this.get(`cache.listCall.${t}.lastTimeStamp`);
    return e ? Number(e) : null;
  }
  /**
   * @param hash
   * @param timestamp
   */
  static setListCallLastTimeStamp(t, e) {
    this.set(`cache.listCall.${t}.lastTimeStamp`, String(e));
  }
}
const Ge = {
  _blitzID: { type: "anonymous", label: "ID" },
  _userID: { type: "user", label: "User" },
  // a BlitzData epoch (seconds since 2021-01-01 UTC, see helpers.blitzstamp)
  // — its own type so UIs can present it as the creation date it is,
  // not the bare integer it is stored as
  _blitzstamp: { type: "blitzstamp", label: "Created" },
  _modified: { type: "datetime", label: "Modified" },
  _publishingdate: { type: "datetime", label: "Publishing date" },
  _expiration: { type: "datetime", label: "Expiration" }
}, Jr = "@me", _e = (n) => {
  var t;
  return n === Jr ? ((t = S.getCurrentUser()) == null ? void 0 : t.id) ?? n : n;
}, ve = (n) => {
  if (Array.isArray(n))
    return n;
  if (typeof n != "string" || !n.startsWith("["))
    return [];
  try {
    const t = JSON.parse(n);
    return Array.isArray(t) ? t : [];
  } catch {
    return [];
  }
}, Bt = (n) => n === !0 || n === 1 || n === "1" ? 1 : n === !1 || n === 0 || n === "0" ? 0 : n, zt = (n) => `${n ?? ""}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(), qt = (n, t) => typeof n == "string" && typeof t == "string" ? zt(n) === zt(t) : n === t, $r = (n) => {
  const t = (r) => r.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let e = "";
  for (let r = 0; r < n.length; r++) {
    const s = n[r];
    e += s === "\\" && r + 1 < n.length ? t(n[++r]) : s === "%" ? "[\\s\\S]*" : s === "_" ? "[\\s\\S]" : t(s);
  }
  return new RegExp(`^${e}$`);
};
function Ze(n, t, e) {
  var s;
  let r = !0;
  for (const a of t) {
    if (!r)
      return !1;
    const [i, o, l] = a, c = (s = e == null ? void 0 : e[i]) == null ? void 0 : s.type;
    let u = n[i], d = l;
    const h = typeof o == "string" ? o.toUpperCase() : "";
    if (h === "IS NULL" || h === "IS NOT NULL") {
      const f = u == null;
      r = h === "IS NULL" ? f : !f;
      continue;
    }
    if (i.endsWith("_mtm") && !i.startsWith("user.")) {
      d !== "" && d !== null && d !== void 0 && (r = ve(u).some((f) => ((f == null ? void 0 : f._blitzID) ?? f) === d));
      continue;
    }
    if (u == null) {
      r = !1;
      continue;
    }
    switch (c === "boolean" && (u = Bt(u), d = Array.isArray(d) ? d.map(Bt) : Bt(d)), i === "_userID" && (d = Array.isArray(d) ? d.map(_e) : _e(d)), typeof u == "string" && (c === "datetime" || c === "date" || i === "_publishingdate") && (u = new Date(u).getTime()), typeof d == "string" && (c === "datetime" || c === "date" || i === "_publishingdate") && (d = new Date(d).getTime()), o) {
      case "LIKE":
        r = $r(zt(d)).test(zt(u));
        break;
      case "CONTAINS":
        r = ve(u).includes(d);
        break;
      case "IN":
        r = (Array.isArray(d) ? d : [d]).some((f) => qt(u, f));
        break;
      case "=":
        r = qt(u, d);
        break;
      case "!=":
        r = !qt(u, d);
        break;
      case ">":
        r = u > d;
        break;
      case "<":
        r = u < d;
        break;
      case ">=":
        r = u >= d;
        break;
      case "<=":
        r = u <= d;
        break;
      default:
        r = !0;
        break;
    }
  }
  return r;
}
class Hr {
  /**
   * Constructor for the BDModelClient.
   */
  constructor(t) {
    /**
     * model that the client is connected to.
     */
    m(this, "model");
    this.model = t, this.ping();
  }
  /**
   * Initializes the database structure if not already created.
   */
  async ping() {
    (await this.connect()).close();
  }
  /**
   * This method fetches items based on the given model and conditions.
   *
   * @param query an array of conditions to filter the items
   * @param blitzIds Array of blitz id's to scope results to.
   *
   * @return a promise that resolves to an array of filtered items
   */
  async query(t, e) {
    const r = await this.connect(), s = r.transaction("objects", "readonly").store, a = Array.from(s.indexNames), i = t.customSort && a.includes(t.customSort) ? t.customSort : a.includes("_projectsort") && (t.conditions ?? []).find((f) => f[0] === "project_fk" && f[1] === "=") ? "_projectsort" : a.includes("_sort") ? "_sort" : "_blitzstamp", o = t.customSortDirection === "ASC" ? "next" : "prev", l = t.pagination !== void 0 ? o === "next" ? IDBKeyRange.lowerBound(t.pagination.toString(), !0) : IDBKeyRange.upperBound(t.pagination.toString(), !0) : null;
    let c = await s.index(i).openCursor(l, o);
    const u = this.model.getAttributesDetails() ?? void 0;
    let d = [];
    for (; c; ) {
      if (e && !e.includes(c.value.blitzID)) {
        c = await c.continue();
        continue;
      }
      if (Ze(c.value, t.conditions ?? [], u) && (d.push(c.value), t.limit && d.length >= t.limit))
        break;
      c = await c.continue();
    }
    if (r.close(), t.var && t.var.length > 0) {
      const f = ["_blitzID", "_localID", "@permissions", "_sort", "_clusters", "_editURLs", "_savetimestamp", ...t.var];
      for (const g of d)
        for (const _ in g)
          f.includes(_) || delete g[_];
    }
    return d;
  }
  /**
   * A function that searches for a given query in a specified model.
   *
   * @param query the query string to search for
   * @param conditions filter conditions to be applied
   *
   * @return an array of blitzIDs that match the query
   */
  async search(t, e) {
    const r = await this.connect(), s = new Rr(this.model).loadFromJson(r.get("tree", this.model.getName()));
    r.close();
    const a = s.search(t);
    return t !== "" && a.length === 0 ? [] : this.query({ conditions: e }, a);
  }
  /**
   * Generates a tree by supplied data, then saves each item in the data to the database.
   *
   * @param objects list of native data in order to create the tree
   */
  async save(t, e = !1) {
    const r = await this.connect();
    for (const s of t) {
      let a = { ...s };
      const i = await r.get("objects", a._blitzID);
      if (i)
        a = { ...i, ...a };
      else if (e)
        continue;
      a._savetimestamp = ot(), await r.put("objects", a);
    }
    r.close();
  }
  /**
   * Connects to the database
   *
   * @returns instance of the database connection
   */
  async connect() {
    var a, i;
    const t = this.model.getAttributesDetails(), e = ["1", !0].includes((a = this.model._attributes.hassort) == null ? void 0 : a.value), r = e && ["1", !0].includes((i = this.model._attributes.hasprojects) == null ? void 0 : i.value);
    return await ht(this.model.getName(), 1, {
      upgrade: (o, l, c, u, d) => {
        const h = S.getDatabases();
        if (h.includes(o.name) || (h.push(o.name), S.setDatabases(h)), c !== 1)
          return;
        o.createObjectStore("tree", { keyPath: "name" });
        const f = o.createObjectStore("objects", { keyPath: "_blitzID" });
        if (t)
          for (const g in t)
            (t[g].type === "date" || g.includes("_fk")) && f.createIndex(g, g, { unique: !1 });
        f.createIndex("_blitzstamp", "_blitzstamp"), e && f.createIndex("_sort", "_sort"), r && f.createIndex("_projectsort", "_projectsort");
      }
    });
  }
  /**
   * Returns a single item from the database by supplied blitzID.
   */
  async find(t) {
    const e = await this.connect(), r = e.get("objects", t);
    return e.close(), r;
  }
  /**
   * Create new object in the database.
   *
   * @param object Object to be created.
   */
  async create(t) {
    const e = await this.connect();
    await e.put("objects", t), e.close();
  }
  /**
   * Update object in the database.
   *
   * @param attributes Object attributes to be updated.
   */
  async update(t) {
    const e = await this.connect();
    await e.put("objects", t), e.close();
  }
  /**
   * Removes every object of the model from the local database.
   */
  async clear() {
    const t = await this.connect();
    await t.clear("objects"), t.close();
  }
  /**
   * Delete object from the database.
   *
   * @param blitzID Blitz ID of the object to be deleted.
   */
  async delete(t) {
    const e = await this.connect();
    await e.delete("objects", t), e.close();
  }
  /**
   * Update Trie tree, this is needed when there is a change
   * that happened to the indexed db objects. Trie tree should
   * always be up to date with the indexed db items.
   */
  /*private async updateTree(): Promise<void> {
          // Connect to the database
          const database = await this.connect();
  
          // Get all items
          const items: Array<BDObjectRaw> = await database.getAll('objects');
  
          // Save tree to the database
          await database.put('tree', {
              name: this.model.getName(),
              tree: (new Trie(this.model, items)).toJson()
          });
  
          // Close connection
          database.close();
      }*/
}
class le {
  /**
   * Set up the subject.
   */
  constructor() {
    /**
     * List of subscribers.
     */
    m(this, "_subscribers");
    /**
     * Clean up function
     */
    m(this, "_cleanUp", () => {
    });
    this._subscribers = /* @__PURE__ */ new Set();
  }
  /**
   * Emit a value to all subscribers.
   */
  emit(t) {
    for (const e of this._subscribers)
      e(t);
  }
  /**
   * Subscribe to value emissions.
   */
  subscribe(t) {
    if (typeof t != "function")
      throw new Error("Subscriber must be a function");
    return this._subscribers.add(t), () => {
      this._subscribers.delete(t), this._cleanUp();
    };
  }
  /**
   * Pipe with a filter function.
   * @returns New Subject that only emits values passing the filter.
   */
  filterPipe(t) {
    const e = new le();
    return e._cleanUp = this.subscribe((r) => {
      t(r) && e.emit(r);
    }), e;
  }
}
const Lt = class Lt {
  /**
   * Constructor.
   */
  constructor(t) {
    /**
     * Model that the client is connected to.
     */
    m(this, "model");
    this.model = t, y.objects.has(this.model.getName()) || y.objects.set(this.model.getName(), /* @__PURE__ */ new Map());
  }
  /**
   * Get model objects.
   */
  getAll() {
    return y.objects.get(this.model.getName());
  }
  /**
   * Get object by blitzID.
   */
  get(t) {
    return this.getAll().get(t);
  }
  /**
   * Update object in memory.
   *
   * @param object Object to update.
   * @returns Final object in memory
   */
  update(t) {
    var i;
    const e = this.getAll();
    if (!e.has(t._blitzID.value))
      return e.set(t._blitzID.value, t), t;
    const r = e.get(t._blitzID.value), s = Object.keys(this.model.getAttributesDetails() ?? {}), a = y.options.sync.live === !0;
    for (const o of s) {
      const l = (i = t[o]) == null ? void 0 : i._value;
      if (l !== void 0) {
        const c = r[o];
        c && (c._value = l, c._valueSignal.set(l, a));
      }
    }
    return r;
  }
  /**
   * Delete object from memory.
   *
   * @param blitzID blitzID of object to be deleted.
   */
  delete(t) {
    const e = this.getAll();
    e.has(t) && e.delete(t);
  }
  /**
   * Emit transaction to channel.
   *
   * @param transaction Transaction to be emitted.
   */
  emit(t) {
    Lt.channel.emit(t);
  }
  /**
   * Apply a sync-evaluated transaction to memory and notify live subscribers.
   *
   * The local database already holds the evaluated result, so edited values
   * are read back from it — one canonical write path, no duplicated
   * evaluation logic. Objects not in memory only emit to the channel.
   *
   * @param transaction Transaction already applied to the local database.
   * @param emitToChannel Emit to the list channel | The caller dedupes per object.
   */
  async applyTransaction(t, e = !0) {
    if (t.action === "delete") {
      const r = this.get(t.blitzID);
      this.delete(t.blitzID), r == null || r.dispatchEvent("delete", null);
    } else if (t.action === "edit") {
      const r = this.get(t.blitzID);
      if (r) {
        const s = await this.model.idbClient().find(t.blitzID);
        for (const a of Object.keys(t.data))
          s && r[a] && (r[a].value = s[a]);
        r.dispatchEvent("remoteChange", t.data);
      }
    }
    e && this.emit(t);
  }
  /**
   * Returns raw objects for the current model filtered by the given conditions and parameters.
   *
   * @param query Query parameters including array of conditions to filter the objects.
   * @return Promise with array of filtered raw objects.
   */
  async query(t = {}) {
    var d, h;
    const e = [], r = Array.from(this.getAll().values()).map((f) => f.toObject()), s = this.model.getAttributesDetails() ?? void 0, a = Object.keys(s ?? {}), i = ["1", !0].includes((d = this.model._attributes.hassort) == null ? void 0 : d.value), o = i && ["1", !0].includes((h = this.model._attributes.hasprojects) == null ? void 0 : h.value), l = t.customSort && a.includes(t.customSort) ? t.customSort : o && (t.conditions ?? []).find((f) => f[0] === "project_fk" && f[1] === "=") ? "_projectsort" : i ? "_sort" : "_blitzstamp", c = t.customSortDirection ?? "DESC";
    r.sort((f, g) => {
      try {
        const _ = parseInt(f[l]), v = parseInt(g[l]);
        if (_ < v)
          return c === "ASC" ? -1 : 1;
        if (_ > v)
          return c === "ASC" ? 1 : -1;
      } catch {
      }
      return 0;
    });
    for (const f of r) {
      if (t.pagination !== void 0)
        try {
          const g = parseInt(f[l]);
          if (typeof g != "number" || (c === "ASC" ? t.pagination >= g : t.pagination <= g))
            continue;
        } catch {
        }
      if (Ze(f, t.conditions ?? [], s) && (e.push(f), t.limit && e.length >= t.limit))
        break;
    }
    if (t.var && t.var.length > 0) {
      const f = ["_blitzID", "_localID", "@permissions", "_sort", "_clusters", "_editURLs", "_savetimestamp", ...t.var];
      for (const g of e)
        for (const _ in g)
          f.includes(_) || delete g[_];
    }
    return e;
  }
};
/**
 * Channel subject for updates.
 */
m(Lt, "channel", new le());
let Pt = Lt;
const at = "user.";
let tr;
function Br(n) {
  tr = n;
}
function rt() {
  return tr;
}
function yt(n, t) {
  const e = n.filter((o) => {
    var l;
    return o.transaction.action === M.Edit && (t === void 0 || ((l = o.transaction.data) == null ? void 0 : l[t]) !== void 0);
  });
  let r = p.Pending, s;
  const a = e.find((o) => o.status === p.Failed), i = e.find((o) => o.status === p.Conflict && o.message !== void 0) ?? e.find((o) => o.status === p.Conflict);
  return a ? (r = p.Failed, s = a) : i ? (r = p.Conflict, s = i) : e.every((o) => o.status === p.Completed) && (r = p.Completed), { status: r, job: s };
}
class ft {
  /**
   * Set up the signal.
   */
  constructor(t) {
    /**
     * Stored signal value.
     */
    m(this, "_value");
    /**
     * List of subscribers.
     */
    m(this, "_subscribers");
    this._value = t, this._subscribers = /* @__PURE__ */ new Set();
  }
  /**
   * Get value.
   */
  get() {
    return this._value;
  }
  /**
   * Set new value.
   */
  set(t, e = !0) {
    this._value !== t && (this._value = t, e && this.emit());
  }
  /**
   * Emit the value to all subscribers.
   */
  emit() {
    for (const t of this._subscribers)
      t(this._value);
  }
  /**
   * Subscribe to value changes.
   */
  subscribe(t, e = !0) {
    if (typeof t != "function")
      throw new Error("Subscriber must be a function");
    return this._subscribers.add(t), e && t(this._value), () => this._subscribers.delete(t);
  }
}
class U {
  /**
   * Constructs type with provided value.
   *
   * @param name Attribute name.
   * @param type Attribute type.
   * @param value Value to be used.
   */
  constructor(t, e, r) {
    /**
     * Belonging object.
     */
    m(this, "_object");
    /**
     * Name of the attribute
     */
    m(this, "_name");
    /**
     * Type of the attribute.
     */
    m(this, "_type");
    /**
     * Stored value of the type.
     */
    m(this, "_value");
    /**
     * Signal for the value.
     */
    m(this, "_valueSignal");
    /**
     * Signal for the sync status.
     */
    m(this, "_syncSignal");
    this._name = t, this._type = e, this._value = this.unserialize(r), this._valueSignal = new ft(this._value), this._syncSignal = new ft(null);
  }
  /**
   * Returns value of the type.
   */
  get value() {
    return this._value;
  }
  /**
   * Sets value of the type.
   *
   * @param value Value to be set.
   */
  set value(t) {
    this._value = this.unserialize(t), this._valueSignal.set(this._value);
  }
  /**
   * Sets the value of the data type.
   */
  withValue(t) {
    return this.value = t, this;
  }
  /**
   * Sets the object of the data type.
   */
  withObject(t) {
    return this._object = t, this;
  }
  /**
   * Edits the attribute.
   */
  async edit(t, e) {
    if (!this._object)
      throw new Error("Can not edit attribute, object is not set.");
    return this._object.edit(this._name, t, e);
  }
  /**
   * Subscribe to changes in the value.
   *
   * @param fn Subscribe callback.
   * @returns Unsubscribe function.
   */
  subscribe(t, e = !0) {
    var s, a;
    const r = this._valueSignal.subscribe(t, e);
    return this._value === void 0 && ((a = (s = this._object) == null ? void 0 : s.model) == null || a.get({ blitzID: this._object._blitzID.value, forceHttp: !0 }).then((i) => {
      (i == null ? void 0 : i[this._name]._value) !== void 0 && this._valueSignal.emit();
    })), r;
  }
  /**
   * Subscribe to changes in the sync status.
   *
   * @param fn Subscribe callback.
   * @returns Unsubscribe function.
   */
  syncStatus(t) {
    var s;
    const e = this._syncSignal.get() !== null, r = this._syncSignal.subscribe(t, e);
    return e || rt().getJobsForObject((s = this._object) == null ? void 0 : s._blitzID.value).then((a) => {
      this._syncSignal.set(yt(a, this._name), !1), t(this._syncSignal.get());
    }), r;
  }
  /**
   * Get attribute details from model.
   */
  getDetails() {
    var t, e;
    return ((e = (t = this._object) == null ? void 0 : t.model) == null ? void 0 : e.getAttributeDetails(this._name)) || null;
  }
}
class wt extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    return t;
  }
  /**
   * Serializes the value to be stored.
   */
  serialize() {
    return this._value;
  }
}
class er extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (typeof t == "boolean")
      return t;
    if (typeof t == "string" && ["0", "1"].includes(t))
      return t === "1";
    if (typeof t == "number" && [0, 1].includes(t))
      return t === 1;
    if (t !== void 0)
      return null;
  }
  /**
   * Serializes the value to be stored.
   */
  serialize() {
    return typeof this._value == "boolean" ? this._value ? "1" : "0" : this._value;
  }
}
const rr = 6048e5, qr = 864e5, St = 43200, De = 1440, Se = Symbol.for("constructDateFrom");
function tt(n, t) {
  return typeof n == "function" ? n(t) : n && typeof n == "object" && Se in n ? n[Se](t) : n instanceof Date ? new n.constructor(t) : new Date(t);
}
function F(n, t) {
  return tt(t || n, n);
}
let Yr = {};
function vt() {
  return Yr;
}
function pt(n, t) {
  var o, l, c, u;
  const e = vt(), r = (t == null ? void 0 : t.weekStartsOn) ?? ((l = (o = t == null ? void 0 : t.locale) == null ? void 0 : o.options) == null ? void 0 : l.weekStartsOn) ?? e.weekStartsOn ?? ((u = (c = e.locale) == null ? void 0 : c.options) == null ? void 0 : u.weekStartsOn) ?? 0, s = F(n, t == null ? void 0 : t.in), a = s.getDay(), i = (a < r ? 7 : 0) + a - r;
  return s.setDate(s.getDate() - i), s.setHours(0, 0, 0, 0), s;
}
function Et(n, t) {
  return pt(n, { ...t, weekStartsOn: 1 });
}
function sr(n, t) {
  const e = F(n, t == null ? void 0 : t.in), r = e.getFullYear(), s = tt(e, 0);
  s.setFullYear(r + 1, 0, 4), s.setHours(0, 0, 0, 0);
  const a = Et(s), i = tt(e, 0);
  i.setFullYear(r, 0, 4), i.setHours(0, 0, 0, 0);
  const o = Et(i);
  return e.getTime() >= a.getTime() ? r + 1 : e.getTime() >= o.getTime() ? r : r - 1;
}
function xt(n) {
  const t = F(n), e = new Date(
    Date.UTC(
      t.getFullYear(),
      t.getMonth(),
      t.getDate(),
      t.getHours(),
      t.getMinutes(),
      t.getSeconds(),
      t.getMilliseconds()
    )
  );
  return e.setUTCFullYear(t.getFullYear()), +n - +e;
}
function Ft(n, ...t) {
  const e = tt.bind(
    null,
    n || t.find((r) => typeof r == "object")
  );
  return t.map(e);
}
function Me(n, t) {
  const e = F(n, t == null ? void 0 : t.in);
  return e.setHours(0, 0, 0, 0), e;
}
function Vr(n, t, e) {
  const [r, s] = Ft(
    e == null ? void 0 : e.in,
    n,
    t
  ), a = Me(r), i = Me(s), o = +a - xt(a), l = +i - xt(i);
  return Math.round((o - l) / qr);
}
function Qr(n, t) {
  const e = sr(n, t), r = tt((t == null ? void 0 : t.in) || n, 0);
  return r.setFullYear(e, 0, 4), r.setHours(0, 0, 0, 0), Et(r);
}
function It(n, t) {
  const e = +F(n) - +F(t);
  return e < 0 ? -1 : e > 0 ? 1 : e;
}
function Xr(n) {
  return tt(n, Date.now());
}
function Kr(n) {
  return n instanceof Date || typeof n == "object" && Object.prototype.toString.call(n) === "[object Date]";
}
function Gr(n) {
  return !(!Kr(n) && typeof n != "number" || isNaN(+F(n)));
}
function Zr(n, t, e) {
  const [r, s] = Ft(
    e == null ? void 0 : e.in,
    n,
    t
  ), a = r.getFullYear() - s.getFullYear(), i = r.getMonth() - s.getMonth();
  return a * 12 + i;
}
function ts(n) {
  return (t) => {
    const r = (n ? Math[n] : Math.trunc)(t);
    return r === 0 ? 0 : r;
  };
}
function es(n, t) {
  return +F(n) - +F(t);
}
function rs(n, t) {
  const e = F(n, t == null ? void 0 : t.in);
  return e.setHours(23, 59, 59, 999), e;
}
function ss(n, t) {
  const e = F(n, t == null ? void 0 : t.in), r = e.getMonth();
  return e.setFullYear(e.getFullYear(), r + 1, 0), e.setHours(23, 59, 59, 999), e;
}
function ns(n, t) {
  const e = F(n, t == null ? void 0 : t.in);
  return +rs(e, t) == +ss(e, t);
}
function as(n, t, e) {
  const [r, s, a] = Ft(
    e == null ? void 0 : e.in,
    n,
    n,
    t
  ), i = It(s, a), o = Math.abs(
    Zr(s, a)
  );
  if (o < 1)
    return 0;
  s.getMonth() === 1 && s.getDate() > 27 && s.setDate(30), s.setMonth(s.getMonth() - i * o);
  let l = It(s, a) === -i;
  ns(r) && o === 1 && It(r, a) === 1 && (l = !1);
  const c = i * (o - +l);
  return c === 0 ? 0 : c;
}
function is(n, t, e) {
  const r = es(n, t) / 1e3;
  return ts(e == null ? void 0 : e.roundingMethod)(r);
}
function os(n, t) {
  const e = F(n, t == null ? void 0 : t.in);
  return e.setFullYear(e.getFullYear(), 0, 1), e.setHours(0, 0, 0, 0), e;
}
const cs = {
  lessThanXSeconds: {
    one: "less than a second",
    other: "less than {{count}} seconds"
  },
  xSeconds: {
    one: "1 second",
    other: "{{count}} seconds"
  },
  halfAMinute: "half a minute",
  lessThanXMinutes: {
    one: "less than a minute",
    other: "less than {{count}} minutes"
  },
  xMinutes: {
    one: "1 minute",
    other: "{{count}} minutes"
  },
  aboutXHours: {
    one: "about 1 hour",
    other: "about {{count}} hours"
  },
  xHours: {
    one: "1 hour",
    other: "{{count}} hours"
  },
  xDays: {
    one: "1 day",
    other: "{{count}} days"
  },
  aboutXWeeks: {
    one: "about 1 week",
    other: "about {{count}} weeks"
  },
  xWeeks: {
    one: "1 week",
    other: "{{count}} weeks"
  },
  aboutXMonths: {
    one: "about 1 month",
    other: "about {{count}} months"
  },
  xMonths: {
    one: "1 month",
    other: "{{count}} months"
  },
  aboutXYears: {
    one: "about 1 year",
    other: "about {{count}} years"
  },
  xYears: {
    one: "1 year",
    other: "{{count}} years"
  },
  overXYears: {
    one: "over 1 year",
    other: "over {{count}} years"
  },
  almostXYears: {
    one: "almost 1 year",
    other: "almost {{count}} years"
  }
}, ls = (n, t, e) => {
  let r;
  const s = cs[n];
  return typeof s == "string" ? r = s : t === 1 ? r = s.one : r = s.other.replace("{{count}}", t.toString()), e != null && e.addSuffix ? e.comparison && e.comparison > 0 ? "in " + r : r + " ago" : r;
};
function Z(n) {
  return (t = {}) => {
    const e = t.width ? String(t.width) : n.defaultWidth;
    return n.formats[e] || n.formats[n.defaultWidth];
  };
}
const us = {
  full: "EEEE, MMMM do, y",
  long: "MMMM do, y",
  medium: "MMM d, y",
  short: "MM/dd/yyyy"
}, ds = {
  full: "h:mm:ss a zzzz",
  long: "h:mm:ss a z",
  medium: "h:mm:ss a",
  short: "h:mm a"
}, hs = {
  full: "{{date}} 'at' {{time}}",
  long: "{{date}} 'at' {{time}}",
  medium: "{{date}}, {{time}}",
  short: "{{date}}, {{time}}"
}, fs = {
  date: Z({
    formats: us,
    defaultWidth: "full"
  }),
  time: Z({
    formats: ds,
    defaultWidth: "full"
  }),
  dateTime: Z({
    formats: hs,
    defaultWidth: "full"
  })
}, ms = {
  lastWeek: "'last' eeee 'at' p",
  yesterday: "'yesterday at' p",
  today: "'today at' p",
  tomorrow: "'tomorrow at' p",
  nextWeek: "eeee 'at' p",
  other: "P"
}, gs = (n, t, e, r) => ms[n];
function R(n) {
  return (t, e) => {
    const r = e != null && e.context ? String(e.context) : "standalone";
    let s;
    if (r === "formatting" && n.formattingValues) {
      const i = n.defaultFormattingWidth || n.defaultWidth, o = e != null && e.width ? String(e.width) : i;
      s = n.formattingValues[o] || n.formattingValues[i];
    } else {
      const i = n.defaultWidth, o = e != null && e.width ? String(e.width) : n.defaultWidth;
      s = n.values[o] || n.values[i];
    }
    const a = n.argumentCallback ? n.argumentCallback(t) : t;
    return s[a];
  };
}
const ws = {
  narrow: ["B", "A"],
  abbreviated: ["BC", "AD"],
  wide: ["Before Christ", "Anno Domini"]
}, bs = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["Q1", "Q2", "Q3", "Q4"],
  wide: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"]
}, ys = {
  narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
  abbreviated: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ],
  wide: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ]
}, ps = {
  narrow: ["S", "M", "T", "W", "T", "F", "S"],
  short: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  abbreviated: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  wide: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ]
}, _s = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "morning",
    afternoon: "afternoon",
    evening: "evening",
    night: "night"
  }
}, vs = {
  narrow: {
    am: "a",
    pm: "p",
    midnight: "mi",
    noon: "n",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  },
  wide: {
    am: "a.m.",
    pm: "p.m.",
    midnight: "midnight",
    noon: "noon",
    morning: "in the morning",
    afternoon: "in the afternoon",
    evening: "in the evening",
    night: "at night"
  }
}, Ds = (n, t) => {
  const e = Number(n), r = e % 100;
  if (r > 20 || r < 10)
    switch (r % 10) {
      case 1:
        return e + "st";
      case 2:
        return e + "nd";
      case 3:
        return e + "rd";
    }
  return e + "th";
}, Ss = {
  ordinalNumber: Ds,
  era: R({
    values: ws,
    defaultWidth: "wide"
  }),
  quarter: R({
    values: bs,
    defaultWidth: "wide",
    argumentCallback: (n) => n - 1
  }),
  month: R({
    values: ys,
    defaultWidth: "wide"
  }),
  day: R({
    values: ps,
    defaultWidth: "wide"
  }),
  dayPeriod: R({
    values: _s,
    defaultWidth: "wide",
    formattingValues: vs,
    defaultFormattingWidth: "wide"
  })
};
function J(n) {
  return (t, e = {}) => {
    const r = e.width, s = r && n.matchPatterns[r] || n.matchPatterns[n.defaultMatchWidth], a = t.match(s);
    if (!a)
      return null;
    const i = a[0], o = r && n.parsePatterns[r] || n.parsePatterns[n.defaultParseWidth], l = Array.isArray(o) ? ks(o, (d) => d.test(i)) : (
      // [TODO] -- I challenge you to fix the type
      Ms(o, (d) => d.test(i))
    );
    let c;
    c = n.valueCallback ? n.valueCallback(l) : l, c = e.valueCallback ? (
      // [TODO] -- I challenge you to fix the type
      e.valueCallback(c)
    ) : c;
    const u = t.slice(i.length);
    return { value: c, rest: u };
  };
}
function Ms(n, t) {
  for (const e in n)
    if (Object.prototype.hasOwnProperty.call(n, e) && t(n[e]))
      return e;
}
function ks(n, t) {
  for (let e = 0; e < n.length; e++)
    if (t(n[e]))
      return e;
}
function ue(n) {
  return (t, e = {}) => {
    const r = t.match(n.matchPattern);
    if (!r)
      return null;
    const s = r[0], a = t.match(n.parsePattern);
    if (!a)
      return null;
    let i = n.valueCallback ? n.valueCallback(a[0]) : a[0];
    i = e.valueCallback ? e.valueCallback(i) : i;
    const o = t.slice(s.length);
    return { value: i, rest: o };
  };
}
const Is = /^(\d+)(th|st|nd|rd)?/i, Ts = /\d+/i, Os = {
  narrow: /^(b|a)/i,
  abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
  wide: /^(before christ|before common era|anno domini|common era)/i
}, As = {
  any: [/^b/i, /^(a|c)/i]
}, zs = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](th|st|nd|rd)? quarter/i
}, Ps = {
  any: [/1/i, /2/i, /3/i, /4/i]
}, Es = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
  wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i
}, xs = {
  narrow: [
    /^j/i,
    /^f/i,
    /^m/i,
    /^a/i,
    /^m/i,
    /^j/i,
    /^j/i,
    /^a/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ],
  any: [
    /^ja/i,
    /^f/i,
    /^mar/i,
    /^ap/i,
    /^may/i,
    /^jun/i,
    /^jul/i,
    /^au/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ]
}, Cs = {
  narrow: /^[smtwf]/i,
  short: /^(su|mo|tu|we|th|fr|sa)/i,
  abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
  wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
}, Us = {
  narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
  any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
}, Ls = {
  narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
  any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
}, Ns = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^mi/i,
    noon: /^no/i,
    morning: /morning/i,
    afternoon: /afternoon/i,
    evening: /evening/i,
    night: /night/i
  }
}, js = {
  ordinalNumber: ue({
    matchPattern: Is,
    parsePattern: Ts,
    valueCallback: (n) => parseInt(n, 10)
  }),
  era: J({
    matchPatterns: Os,
    defaultMatchWidth: "wide",
    parsePatterns: As,
    defaultParseWidth: "any"
  }),
  quarter: J({
    matchPatterns: zs,
    defaultMatchWidth: "wide",
    parsePatterns: Ps,
    defaultParseWidth: "any",
    valueCallback: (n) => n + 1
  }),
  month: J({
    matchPatterns: Es,
    defaultMatchWidth: "wide",
    parsePatterns: xs,
    defaultParseWidth: "any"
  }),
  day: J({
    matchPatterns: Cs,
    defaultMatchWidth: "wide",
    parsePatterns: Us,
    defaultParseWidth: "any"
  }),
  dayPeriod: J({
    matchPatterns: Ls,
    defaultMatchWidth: "any",
    parsePatterns: Ns,
    defaultParseWidth: "any"
  })
}, mt = {
  code: "en-US",
  formatDistance: ls,
  formatLong: fs,
  formatRelative: gs,
  localize: Ss,
  match: js,
  options: {
    weekStartsOn: 0,
    firstWeekContainsDate: 1
  }
};
function Fs(n, t) {
  const e = F(n, t == null ? void 0 : t.in);
  return Vr(e, os(e)) + 1;
}
function Ws(n, t) {
  const e = F(n, t == null ? void 0 : t.in), r = +Et(e) - +Qr(e);
  return Math.round(r / rr) + 1;
}
function nr(n, t) {
  var u, d, h, f;
  const e = F(n, t == null ? void 0 : t.in), r = e.getFullYear(), s = vt(), a = (t == null ? void 0 : t.firstWeekContainsDate) ?? ((d = (u = t == null ? void 0 : t.locale) == null ? void 0 : u.options) == null ? void 0 : d.firstWeekContainsDate) ?? s.firstWeekContainsDate ?? ((f = (h = s.locale) == null ? void 0 : h.options) == null ? void 0 : f.firstWeekContainsDate) ?? 1, i = tt((t == null ? void 0 : t.in) || n, 0);
  i.setFullYear(r + 1, 0, a), i.setHours(0, 0, 0, 0);
  const o = pt(i, t), l = tt((t == null ? void 0 : t.in) || n, 0);
  l.setFullYear(r, 0, a), l.setHours(0, 0, 0, 0);
  const c = pt(l, t);
  return +e >= +o ? r + 1 : +e >= +c ? r : r - 1;
}
function Rs(n, t) {
  var o, l, c, u;
  const e = vt(), r = (t == null ? void 0 : t.firstWeekContainsDate) ?? ((l = (o = t == null ? void 0 : t.locale) == null ? void 0 : o.options) == null ? void 0 : l.firstWeekContainsDate) ?? e.firstWeekContainsDate ?? ((u = (c = e.locale) == null ? void 0 : c.options) == null ? void 0 : u.firstWeekContainsDate) ?? 1, s = nr(n, t), a = tt((t == null ? void 0 : t.in) || n, 0);
  return a.setFullYear(s, 0, r), a.setHours(0, 0, 0, 0), pt(a, t);
}
function Js(n, t) {
  const e = F(n, t == null ? void 0 : t.in), r = +pt(e, t) - +Rs(e, t);
  return Math.round(r / rr) + 1;
}
function I(n, t) {
  const e = n < 0 ? "-" : "", r = Math.abs(n).toString().padStart(t, "0");
  return e + r;
}
const et = {
  // Year
  y(n, t) {
    const e = n.getFullYear(), r = e > 0 ? e : 1 - e;
    return I(t === "yy" ? r % 100 : r, t.length);
  },
  // Month
  M(n, t) {
    const e = n.getMonth();
    return t === "M" ? String(e + 1) : I(e + 1, 2);
  },
  // Day of the month
  d(n, t) {
    return I(n.getDate(), t.length);
  },
  // AM or PM
  a(n, t) {
    const e = n.getHours() / 12 >= 1 ? "pm" : "am";
    switch (t) {
      case "a":
      case "aa":
        return e.toUpperCase();
      case "aaa":
        return e;
      case "aaaaa":
        return e[0];
      case "aaaa":
      default:
        return e === "am" ? "a.m." : "p.m.";
    }
  },
  // Hour [1-12]
  h(n, t) {
    return I(n.getHours() % 12 || 12, t.length);
  },
  // Hour [0-23]
  H(n, t) {
    return I(n.getHours(), t.length);
  },
  // Minute
  m(n, t) {
    return I(n.getMinutes(), t.length);
  },
  // Second
  s(n, t) {
    return I(n.getSeconds(), t.length);
  },
  // Fraction of second
  S(n, t) {
    const e = t.length, r = n.getMilliseconds(), s = Math.trunc(
      r * Math.pow(10, e - 3)
    );
    return I(s, t.length);
  }
}, lt = {
  am: "am",
  pm: "pm",
  midnight: "midnight",
  noon: "noon",
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
  night: "night"
}, ke = {
  // Era
  G: function(n, t, e) {
    const r = n.getFullYear() > 0 ? 1 : 0;
    switch (t) {
      case "G":
      case "GG":
      case "GGG":
        return e.era(r, { width: "abbreviated" });
      case "GGGGG":
        return e.era(r, { width: "narrow" });
      case "GGGG":
      default:
        return e.era(r, { width: "wide" });
    }
  },
  // Year
  y: function(n, t, e) {
    if (t === "yo") {
      const r = n.getFullYear(), s = r > 0 ? r : 1 - r;
      return e.ordinalNumber(s, { unit: "year" });
    }
    return et.y(n, t);
  },
  // Local week-numbering year
  Y: function(n, t, e, r) {
    const s = nr(n, r), a = s > 0 ? s : 1 - s;
    if (t === "YY") {
      const i = a % 100;
      return I(i, 2);
    }
    return t === "Yo" ? e.ordinalNumber(a, { unit: "year" }) : I(a, t.length);
  },
  // ISO week-numbering year
  R: function(n, t) {
    const e = sr(n);
    return I(e, t.length);
  },
  // Extended year. This is a single number designating the year of this calendar system.
  // The main difference between `y` and `u` localizers are B.C. years:
  // | Year | `y` | `u` |
  // |------|-----|-----|
  // | AC 1 |   1 |   1 |
  // | BC 1 |   1 |   0 |
  // | BC 2 |   2 |  -1 |
  // Also `yy` always returns the last two digits of a year,
  // while `uu` pads single digit years to 2 characters and returns other years unchanged.
  u: function(n, t) {
    const e = n.getFullYear();
    return I(e, t.length);
  },
  // Quarter
  Q: function(n, t, e) {
    const r = Math.ceil((n.getMonth() + 1) / 3);
    switch (t) {
      case "Q":
        return String(r);
      case "QQ":
        return I(r, 2);
      case "Qo":
        return e.ordinalNumber(r, { unit: "quarter" });
      case "QQQ":
        return e.quarter(r, {
          width: "abbreviated",
          context: "formatting"
        });
      case "QQQQQ":
        return e.quarter(r, {
          width: "narrow",
          context: "formatting"
        });
      case "QQQQ":
      default:
        return e.quarter(r, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Stand-alone quarter
  q: function(n, t, e) {
    const r = Math.ceil((n.getMonth() + 1) / 3);
    switch (t) {
      case "q":
        return String(r);
      case "qq":
        return I(r, 2);
      case "qo":
        return e.ordinalNumber(r, { unit: "quarter" });
      case "qqq":
        return e.quarter(r, {
          width: "abbreviated",
          context: "standalone"
        });
      case "qqqqq":
        return e.quarter(r, {
          width: "narrow",
          context: "standalone"
        });
      case "qqqq":
      default:
        return e.quarter(r, {
          width: "wide",
          context: "standalone"
        });
    }
  },
  // Month
  M: function(n, t, e) {
    const r = n.getMonth();
    switch (t) {
      case "M":
      case "MM":
        return et.M(n, t);
      case "Mo":
        return e.ordinalNumber(r + 1, { unit: "month" });
      case "MMM":
        return e.month(r, {
          width: "abbreviated",
          context: "formatting"
        });
      case "MMMMM":
        return e.month(r, {
          width: "narrow",
          context: "formatting"
        });
      case "MMMM":
      default:
        return e.month(r, { width: "wide", context: "formatting" });
    }
  },
  // Stand-alone month
  L: function(n, t, e) {
    const r = n.getMonth();
    switch (t) {
      case "L":
        return String(r + 1);
      case "LL":
        return I(r + 1, 2);
      case "Lo":
        return e.ordinalNumber(r + 1, { unit: "month" });
      case "LLL":
        return e.month(r, {
          width: "abbreviated",
          context: "standalone"
        });
      case "LLLLL":
        return e.month(r, {
          width: "narrow",
          context: "standalone"
        });
      case "LLLL":
      default:
        return e.month(r, { width: "wide", context: "standalone" });
    }
  },
  // Local week of year
  w: function(n, t, e, r) {
    const s = Js(n, r);
    return t === "wo" ? e.ordinalNumber(s, { unit: "week" }) : I(s, t.length);
  },
  // ISO week of year
  I: function(n, t, e) {
    const r = Ws(n);
    return t === "Io" ? e.ordinalNumber(r, { unit: "week" }) : I(r, t.length);
  },
  // Day of the month
  d: function(n, t, e) {
    return t === "do" ? e.ordinalNumber(n.getDate(), { unit: "date" }) : et.d(n, t);
  },
  // Day of year
  D: function(n, t, e) {
    const r = Fs(n);
    return t === "Do" ? e.ordinalNumber(r, { unit: "dayOfYear" }) : I(r, t.length);
  },
  // Day of week
  E: function(n, t, e) {
    const r = n.getDay();
    switch (t) {
      case "E":
      case "EE":
      case "EEE":
        return e.day(r, {
          width: "abbreviated",
          context: "formatting"
        });
      case "EEEEE":
        return e.day(r, {
          width: "narrow",
          context: "formatting"
        });
      case "EEEEEE":
        return e.day(r, {
          width: "short",
          context: "formatting"
        });
      case "EEEE":
      default:
        return e.day(r, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Local day of week
  e: function(n, t, e, r) {
    const s = n.getDay(), a = (s - r.weekStartsOn + 8) % 7 || 7;
    switch (t) {
      case "e":
        return String(a);
      case "ee":
        return I(a, 2);
      case "eo":
        return e.ordinalNumber(a, { unit: "day" });
      case "eee":
        return e.day(s, {
          width: "abbreviated",
          context: "formatting"
        });
      case "eeeee":
        return e.day(s, {
          width: "narrow",
          context: "formatting"
        });
      case "eeeeee":
        return e.day(s, {
          width: "short",
          context: "formatting"
        });
      case "eeee":
      default:
        return e.day(s, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Stand-alone local day of week
  c: function(n, t, e, r) {
    const s = n.getDay(), a = (s - r.weekStartsOn + 8) % 7 || 7;
    switch (t) {
      case "c":
        return String(a);
      case "cc":
        return I(a, t.length);
      case "co":
        return e.ordinalNumber(a, { unit: "day" });
      case "ccc":
        return e.day(s, {
          width: "abbreviated",
          context: "standalone"
        });
      case "ccccc":
        return e.day(s, {
          width: "narrow",
          context: "standalone"
        });
      case "cccccc":
        return e.day(s, {
          width: "short",
          context: "standalone"
        });
      case "cccc":
      default:
        return e.day(s, {
          width: "wide",
          context: "standalone"
        });
    }
  },
  // ISO day of week
  i: function(n, t, e) {
    const r = n.getDay(), s = r === 0 ? 7 : r;
    switch (t) {
      case "i":
        return String(s);
      case "ii":
        return I(s, t.length);
      case "io":
        return e.ordinalNumber(s, { unit: "day" });
      case "iii":
        return e.day(r, {
          width: "abbreviated",
          context: "formatting"
        });
      case "iiiii":
        return e.day(r, {
          width: "narrow",
          context: "formatting"
        });
      case "iiiiii":
        return e.day(r, {
          width: "short",
          context: "formatting"
        });
      case "iiii":
      default:
        return e.day(r, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // AM or PM
  a: function(n, t, e) {
    const s = n.getHours() / 12 >= 1 ? "pm" : "am";
    switch (t) {
      case "a":
      case "aa":
        return e.dayPeriod(s, {
          width: "abbreviated",
          context: "formatting"
        });
      case "aaa":
        return e.dayPeriod(s, {
          width: "abbreviated",
          context: "formatting"
        }).toLowerCase();
      case "aaaaa":
        return e.dayPeriod(s, {
          width: "narrow",
          context: "formatting"
        });
      case "aaaa":
      default:
        return e.dayPeriod(s, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // AM, PM, midnight, noon
  b: function(n, t, e) {
    const r = n.getHours();
    let s;
    switch (r === 12 ? s = lt.noon : r === 0 ? s = lt.midnight : s = r / 12 >= 1 ? "pm" : "am", t) {
      case "b":
      case "bb":
        return e.dayPeriod(s, {
          width: "abbreviated",
          context: "formatting"
        });
      case "bbb":
        return e.dayPeriod(s, {
          width: "abbreviated",
          context: "formatting"
        }).toLowerCase();
      case "bbbbb":
        return e.dayPeriod(s, {
          width: "narrow",
          context: "formatting"
        });
      case "bbbb":
      default:
        return e.dayPeriod(s, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // in the morning, in the afternoon, in the evening, at night
  B: function(n, t, e) {
    const r = n.getHours();
    let s;
    switch (r >= 17 ? s = lt.evening : r >= 12 ? s = lt.afternoon : r >= 4 ? s = lt.morning : s = lt.night, t) {
      case "B":
      case "BB":
      case "BBB":
        return e.dayPeriod(s, {
          width: "abbreviated",
          context: "formatting"
        });
      case "BBBBB":
        return e.dayPeriod(s, {
          width: "narrow",
          context: "formatting"
        });
      case "BBBB":
      default:
        return e.dayPeriod(s, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Hour [1-12]
  h: function(n, t, e) {
    if (t === "ho") {
      let r = n.getHours() % 12;
      return r === 0 && (r = 12), e.ordinalNumber(r, { unit: "hour" });
    }
    return et.h(n, t);
  },
  // Hour [0-23]
  H: function(n, t, e) {
    return t === "Ho" ? e.ordinalNumber(n.getHours(), { unit: "hour" }) : et.H(n, t);
  },
  // Hour [0-11]
  K: function(n, t, e) {
    const r = n.getHours() % 12;
    return t === "Ko" ? e.ordinalNumber(r, { unit: "hour" }) : I(r, t.length);
  },
  // Hour [1-24]
  k: function(n, t, e) {
    let r = n.getHours();
    return r === 0 && (r = 24), t === "ko" ? e.ordinalNumber(r, { unit: "hour" }) : I(r, t.length);
  },
  // Minute
  m: function(n, t, e) {
    return t === "mo" ? e.ordinalNumber(n.getMinutes(), { unit: "minute" }) : et.m(n, t);
  },
  // Second
  s: function(n, t, e) {
    return t === "so" ? e.ordinalNumber(n.getSeconds(), { unit: "second" }) : et.s(n, t);
  },
  // Fraction of second
  S: function(n, t) {
    return et.S(n, t);
  },
  // Timezone (ISO-8601. If offset is 0, output is always `'Z'`)
  X: function(n, t, e) {
    const r = n.getTimezoneOffset();
    if (r === 0)
      return "Z";
    switch (t) {
      case "X":
        return Te(r);
      case "XXXX":
      case "XX":
        return nt(r);
      case "XXXXX":
      case "XXX":
      default:
        return nt(r, ":");
    }
  },
  // Timezone (ISO-8601. If offset is 0, output is `'+00:00'` or equivalent)
  x: function(n, t, e) {
    const r = n.getTimezoneOffset();
    switch (t) {
      case "x":
        return Te(r);
      case "xxxx":
      case "xx":
        return nt(r);
      case "xxxxx":
      case "xxx":
      default:
        return nt(r, ":");
    }
  },
  // Timezone (GMT)
  O: function(n, t, e) {
    const r = n.getTimezoneOffset();
    switch (t) {
      case "O":
      case "OO":
      case "OOO":
        return "GMT" + Ie(r, ":");
      case "OOOO":
      default:
        return "GMT" + nt(r, ":");
    }
  },
  // Timezone (specific non-location)
  z: function(n, t, e) {
    const r = n.getTimezoneOffset();
    switch (t) {
      case "z":
      case "zz":
      case "zzz":
        return "GMT" + Ie(r, ":");
      case "zzzz":
      default:
        return "GMT" + nt(r, ":");
    }
  },
  // Seconds timestamp
  t: function(n, t, e) {
    const r = Math.trunc(+n / 1e3);
    return I(r, t.length);
  },
  // Milliseconds timestamp
  T: function(n, t, e) {
    return I(+n, t.length);
  }
};
function Ie(n, t = "") {
  const e = n > 0 ? "-" : "+", r = Math.abs(n), s = Math.trunc(r / 60), a = r % 60;
  return a === 0 ? e + String(s) : e + String(s) + t + I(a, 2);
}
function Te(n, t) {
  return n % 60 === 0 ? (n > 0 ? "-" : "+") + I(Math.abs(n) / 60, 2) : nt(n, t);
}
function nt(n, t = "") {
  const e = n > 0 ? "-" : "+", r = Math.abs(n), s = I(Math.trunc(r / 60), 2), a = I(r % 60, 2);
  return e + s + t + a;
}
const Oe = (n, t) => {
  switch (n) {
    case "P":
      return t.date({ width: "short" });
    case "PP":
      return t.date({ width: "medium" });
    case "PPP":
      return t.date({ width: "long" });
    case "PPPP":
    default:
      return t.date({ width: "full" });
  }
}, ar = (n, t) => {
  switch (n) {
    case "p":
      return t.time({ width: "short" });
    case "pp":
      return t.time({ width: "medium" });
    case "ppp":
      return t.time({ width: "long" });
    case "pppp":
    default:
      return t.time({ width: "full" });
  }
}, $s = (n, t) => {
  const e = n.match(/(P+)(p+)?/) || [], r = e[1], s = e[2];
  if (!s)
    return Oe(n, t);
  let a;
  switch (r) {
    case "P":
      a = t.dateTime({ width: "short" });
      break;
    case "PP":
      a = t.dateTime({ width: "medium" });
      break;
    case "PPP":
      a = t.dateTime({ width: "long" });
      break;
    case "PPPP":
    default:
      a = t.dateTime({ width: "full" });
      break;
  }
  return a.replace("{{date}}", Oe(r, t)).replace("{{time}}", ar(s, t));
}, Hs = {
  p: ar,
  P: $s
}, Bs = /^D+$/, qs = /^Y+$/, Ys = ["D", "DD", "YY", "YYYY"];
function Vs(n) {
  return Bs.test(n);
}
function Qs(n) {
  return qs.test(n);
}
function Xs(n, t, e) {
  const r = Ks(n, t, e);
  if (console.warn(r), Ys.includes(n))
    throw new RangeError(r);
}
function Ks(n, t, e) {
  const r = n[0] === "Y" ? "years" : "days of the month";
  return `Use \`${n.toLowerCase()}\` instead of \`${n}\` (in \`${t}\`) for formatting ${r} to the input \`${e}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`;
}
const Gs = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g, Zs = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g, tn = /^'([^]*?)'?$/, en = /''/g, rn = /[a-zA-Z]/;
function ir(n, t, e) {
  var u, d, h, f, g, _, v, E;
  const r = vt(), s = (e == null ? void 0 : e.locale) ?? r.locale ?? mt, a = (e == null ? void 0 : e.firstWeekContainsDate) ?? ((d = (u = e == null ? void 0 : e.locale) == null ? void 0 : u.options) == null ? void 0 : d.firstWeekContainsDate) ?? r.firstWeekContainsDate ?? ((f = (h = r.locale) == null ? void 0 : h.options) == null ? void 0 : f.firstWeekContainsDate) ?? 1, i = (e == null ? void 0 : e.weekStartsOn) ?? ((_ = (g = e == null ? void 0 : e.locale) == null ? void 0 : g.options) == null ? void 0 : _.weekStartsOn) ?? r.weekStartsOn ?? ((E = (v = r.locale) == null ? void 0 : v.options) == null ? void 0 : E.weekStartsOn) ?? 0, o = F(n, e == null ? void 0 : e.in);
  if (!Gr(o))
    throw new RangeError("Invalid time value");
  let l = t.match(Zs).map((N) => {
    const C = N[0];
    if (C === "p" || C === "P") {
      const Q = Hs[C];
      return Q(N, s.formatLong);
    }
    return N;
  }).join("").match(Gs).map((N) => {
    if (N === "''")
      return { isToken: !1, value: "'" };
    const C = N[0];
    if (C === "'")
      return { isToken: !1, value: sn(N) };
    if (ke[C])
      return { isToken: !0, value: N };
    if (C.match(rn))
      throw new RangeError(
        "Format string contains an unescaped latin alphabet character `" + C + "`"
      );
    return { isToken: !1, value: N };
  });
  s.localize.preprocessor && (l = s.localize.preprocessor(o, l));
  const c = {
    firstWeekContainsDate: a,
    weekStartsOn: i,
    locale: s
  };
  return l.map((N) => {
    if (!N.isToken)
      return N.value;
    const C = N.value;
    (!(e != null && e.useAdditionalWeekYearTokens) && Qs(C) || !(e != null && e.useAdditionalDayOfYearTokens) && Vs(C)) && Xs(C, t, String(n));
    const Q = ke[C[0]];
    return Q(o, C, s.localize, c);
  }).join("");
}
function sn(n) {
  const t = n.match(tn);
  return t ? t[1].replace(en, "'") : n;
}
function nn(n, t, e) {
  const r = vt(), s = (e == null ? void 0 : e.locale) ?? r.locale ?? mt, a = 2520, i = It(n, t);
  if (isNaN(i))
    throw new RangeError("Invalid time value");
  const o = Object.assign({}, e, {
    addSuffix: e == null ? void 0 : e.addSuffix,
    comparison: i
  }), [l, c] = Ft(
    e == null ? void 0 : e.in,
    ...i > 0 ? [t, n] : [n, t]
  ), u = is(c, l), d = (xt(c) - xt(l)) / 1e3, h = Math.round((u - d) / 60);
  let f;
  if (h < 2)
    return e != null && e.includeSeconds ? u < 5 ? s.formatDistance("lessThanXSeconds", 5, o) : u < 10 ? s.formatDistance("lessThanXSeconds", 10, o) : u < 20 ? s.formatDistance("lessThanXSeconds", 20, o) : u < 40 ? s.formatDistance("halfAMinute", 0, o) : u < 60 ? s.formatDistance("lessThanXMinutes", 1, o) : s.formatDistance("xMinutes", 1, o) : h === 0 ? s.formatDistance("lessThanXMinutes", 1, o) : s.formatDistance("xMinutes", h, o);
  if (h < 45)
    return s.formatDistance("xMinutes", h, o);
  if (h < 90)
    return s.formatDistance("aboutXHours", 1, o);
  if (h < De) {
    const g = Math.round(h / 60);
    return s.formatDistance("aboutXHours", g, o);
  } else {
    if (h < a)
      return s.formatDistance("xDays", 1, o);
    if (h < St) {
      const g = Math.round(h / De);
      return s.formatDistance("xDays", g, o);
    } else if (h < St * 2)
      return f = Math.round(h / St), s.formatDistance("aboutXMonths", f, o);
  }
  if (f = as(c, l), f < 12) {
    const g = Math.round(h / St);
    return s.formatDistance("xMonths", g, o);
  } else {
    const g = f % 12, _ = Math.trunc(f / 12);
    return g < 3 ? s.formatDistance("aboutXYears", _, o) : g < 9 ? s.formatDistance("overXYears", _, o) : s.formatDistance("almostXYears", _ + 1, o);
  }
}
function or(n, t) {
  return nn(n, Xr(n), t);
}
const Ae = {
  lessThanXSeconds: {
    standalone: {
      one: "weniger als 1 Sekunde",
      other: "weniger als {{count}} Sekunden"
    },
    withPreposition: {
      one: "weniger als 1 Sekunde",
      other: "weniger als {{count}} Sekunden"
    }
  },
  xSeconds: {
    standalone: {
      one: "1 Sekunde",
      other: "{{count}} Sekunden"
    },
    withPreposition: {
      one: "1 Sekunde",
      other: "{{count}} Sekunden"
    }
  },
  halfAMinute: {
    standalone: "eine halbe Minute",
    withPreposition: "einer halben Minute"
  },
  lessThanXMinutes: {
    standalone: {
      one: "weniger als 1 Minute",
      other: "weniger als {{count}} Minuten"
    },
    withPreposition: {
      one: "weniger als 1 Minute",
      other: "weniger als {{count}} Minuten"
    }
  },
  xMinutes: {
    standalone: {
      one: "1 Minute",
      other: "{{count}} Minuten"
    },
    withPreposition: {
      one: "1 Minute",
      other: "{{count}} Minuten"
    }
  },
  aboutXHours: {
    standalone: {
      one: "etwa 1 Stunde",
      other: "etwa {{count}} Stunden"
    },
    withPreposition: {
      one: "etwa 1 Stunde",
      other: "etwa {{count}} Stunden"
    }
  },
  xHours: {
    standalone: {
      one: "1 Stunde",
      other: "{{count}} Stunden"
    },
    withPreposition: {
      one: "1 Stunde",
      other: "{{count}} Stunden"
    }
  },
  xDays: {
    standalone: {
      one: "1 Tag",
      other: "{{count}} Tage"
    },
    withPreposition: {
      one: "1 Tag",
      other: "{{count}} Tagen"
    }
  },
  aboutXWeeks: {
    standalone: {
      one: "etwa 1 Woche",
      other: "etwa {{count}} Wochen"
    },
    withPreposition: {
      one: "etwa 1 Woche",
      other: "etwa {{count}} Wochen"
    }
  },
  xWeeks: {
    standalone: {
      one: "1 Woche",
      other: "{{count}} Wochen"
    },
    withPreposition: {
      one: "1 Woche",
      other: "{{count}} Wochen"
    }
  },
  aboutXMonths: {
    standalone: {
      one: "etwa 1 Monat",
      other: "etwa {{count}} Monate"
    },
    withPreposition: {
      one: "etwa 1 Monat",
      other: "etwa {{count}} Monaten"
    }
  },
  xMonths: {
    standalone: {
      one: "1 Monat",
      other: "{{count}} Monate"
    },
    withPreposition: {
      one: "1 Monat",
      other: "{{count}} Monaten"
    }
  },
  aboutXYears: {
    standalone: {
      one: "etwa 1 Jahr",
      other: "etwa {{count}} Jahre"
    },
    withPreposition: {
      one: "etwa 1 Jahr",
      other: "etwa {{count}} Jahren"
    }
  },
  xYears: {
    standalone: {
      one: "1 Jahr",
      other: "{{count}} Jahre"
    },
    withPreposition: {
      one: "1 Jahr",
      other: "{{count}} Jahren"
    }
  },
  overXYears: {
    standalone: {
      one: "mehr als 1 Jahr",
      other: "mehr als {{count}} Jahre"
    },
    withPreposition: {
      one: "mehr als 1 Jahr",
      other: "mehr als {{count}} Jahren"
    }
  },
  almostXYears: {
    standalone: {
      one: "fast 1 Jahr",
      other: "fast {{count}} Jahre"
    },
    withPreposition: {
      one: "fast 1 Jahr",
      other: "fast {{count}} Jahren"
    }
  }
}, an = (n, t, e) => {
  let r;
  const s = e != null && e.addSuffix ? Ae[n].withPreposition : Ae[n].standalone;
  return typeof s == "string" ? r = s : t === 1 ? r = s.one : r = s.other.replace("{{count}}", String(t)), e != null && e.addSuffix ? e.comparison && e.comparison > 0 ? "in " + r : "vor " + r : r;
}, on = {
  full: "EEEE, do MMMM y",
  // Montag, 7. Januar 2018
  long: "do MMMM y",
  // 7. Januar 2018
  medium: "do MMM y",
  // 7. Jan. 2018
  short: "dd.MM.y"
  // 07.01.2018
}, cn = {
  full: "HH:mm:ss zzzz",
  long: "HH:mm:ss z",
  medium: "HH:mm:ss",
  short: "HH:mm"
}, ln = {
  full: "{{date}} 'um' {{time}}",
  long: "{{date}} 'um' {{time}}",
  medium: "{{date}} {{time}}",
  short: "{{date}} {{time}}"
}, un = {
  date: Z({
    formats: on,
    defaultWidth: "full"
  }),
  time: Z({
    formats: cn,
    defaultWidth: "full"
  }),
  dateTime: Z({
    formats: ln,
    defaultWidth: "full"
  })
}, dn = {
  lastWeek: "'letzten' eeee 'um' p",
  yesterday: "'gestern um' p",
  today: "'heute um' p",
  tomorrow: "'morgen um' p",
  nextWeek: "eeee 'um' p",
  other: "P"
}, hn = (n, t, e, r) => dn[n], fn = {
  narrow: ["v.Chr.", "n.Chr."],
  abbreviated: ["v.Chr.", "n.Chr."],
  wide: ["vor Christus", "nach Christus"]
}, mn = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["Q1", "Q2", "Q3", "Q4"],
  wide: ["1. Quartal", "2. Quartal", "3. Quartal", "4. Quartal"]
}, ee = {
  narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
  abbreviated: [
    "Jan",
    "Feb",
    "Mär",
    "Apr",
    "Mai",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Okt",
    "Nov",
    "Dez"
  ],
  wide: [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember"
  ]
}, gn = {
  narrow: ee.narrow,
  abbreviated: [
    "Jan.",
    "Feb.",
    "März",
    "Apr.",
    "Mai",
    "Juni",
    "Juli",
    "Aug.",
    "Sep.",
    "Okt.",
    "Nov.",
    "Dez."
  ],
  wide: ee.wide
}, wn = {
  narrow: ["S", "M", "D", "M", "D", "F", "S"],
  short: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
  abbreviated: ["So.", "Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa."],
  wide: [
    "Sonntag",
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag"
  ]
}, bn = {
  narrow: {
    am: "vm.",
    pm: "nm.",
    midnight: "Mitternacht",
    noon: "Mittag",
    morning: "Morgen",
    afternoon: "Nachm.",
    evening: "Abend",
    night: "Nacht"
  },
  abbreviated: {
    am: "vorm.",
    pm: "nachm.",
    midnight: "Mitternacht",
    noon: "Mittag",
    morning: "Morgen",
    afternoon: "Nachmittag",
    evening: "Abend",
    night: "Nacht"
  },
  wide: {
    am: "vormittags",
    pm: "nachmittags",
    midnight: "Mitternacht",
    noon: "Mittag",
    morning: "Morgen",
    afternoon: "Nachmittag",
    evening: "Abend",
    night: "Nacht"
  }
}, yn = {
  narrow: {
    am: "vm.",
    pm: "nm.",
    midnight: "Mitternacht",
    noon: "Mittag",
    morning: "morgens",
    afternoon: "nachm.",
    evening: "abends",
    night: "nachts"
  },
  abbreviated: {
    am: "vorm.",
    pm: "nachm.",
    midnight: "Mitternacht",
    noon: "Mittag",
    morning: "morgens",
    afternoon: "nachmittags",
    evening: "abends",
    night: "nachts"
  },
  wide: {
    am: "vormittags",
    pm: "nachmittags",
    midnight: "Mitternacht",
    noon: "Mittag",
    morning: "morgens",
    afternoon: "nachmittags",
    evening: "abends",
    night: "nachts"
  }
}, pn = (n) => Number(n) + ".", _n = {
  ordinalNumber: pn,
  era: R({
    values: fn,
    defaultWidth: "wide"
  }),
  quarter: R({
    values: mn,
    defaultWidth: "wide",
    argumentCallback: (n) => n - 1
  }),
  month: R({
    values: ee,
    formattingValues: gn,
    defaultWidth: "wide"
  }),
  day: R({
    values: wn,
    defaultWidth: "wide"
  }),
  dayPeriod: R({
    values: bn,
    defaultWidth: "wide",
    formattingValues: yn,
    defaultFormattingWidth: "wide"
  })
}, vn = /^(\d+)(\.)?/i, Dn = /\d+/i, Sn = {
  narrow: /^(v\.? ?Chr\.?|n\.? ?Chr\.?)/i,
  abbreviated: /^(v\.? ?Chr\.?|n\.? ?Chr\.?)/i,
  wide: /^(vor Christus|vor unserer Zeitrechnung|nach Christus|unserer Zeitrechnung)/i
}, Mn = {
  any: [/^v/i, /^n/i]
}, kn = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](\.)? Quartal/i
}, In = {
  any: [/1/i, /2/i, /3/i, /4/i]
}, Tn = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(j[aä]n|feb|mär[z]?|apr|mai|jun[i]?|jul[i]?|aug|sep|okt|nov|dez)\.?/i,
  wide: /^(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)/i
}, On = {
  narrow: [
    /^j/i,
    /^f/i,
    /^m/i,
    /^a/i,
    /^m/i,
    /^j/i,
    /^j/i,
    /^a/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ],
  any: [
    /^j[aä]/i,
    /^f/i,
    /^mär/i,
    /^ap/i,
    /^mai/i,
    /^jun/i,
    /^jul/i,
    /^au/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ]
}, An = {
  narrow: /^[smdmf]/i,
  short: /^(so|mo|di|mi|do|fr|sa)/i,
  abbreviated: /^(son?|mon?|die?|mit?|don?|fre?|sam?)\.?/i,
  wide: /^(sonntag|montag|dienstag|mittwoch|donnerstag|freitag|samstag)/i
}, zn = {
  any: [/^so/i, /^mo/i, /^di/i, /^mi/i, /^do/i, /^f/i, /^sa/i]
}, Pn = {
  narrow: /^(vm\.?|nm\.?|Mitternacht|Mittag|morgens|nachm\.?|abends|nachts)/i,
  abbreviated: /^(vorm\.?|nachm\.?|Mitternacht|Mittag|morgens|nachm\.?|abends|nachts)/i,
  wide: /^(vormittags|nachmittags|Mitternacht|Mittag|morgens|nachmittags|abends|nachts)/i
}, En = {
  any: {
    am: /^v/i,
    pm: /^n/i,
    midnight: /^Mitte/i,
    noon: /^Mitta/i,
    morning: /morgens/i,
    afternoon: /nachmittags/i,
    // will never be matched. Afternoon is matched by `pm`
    evening: /abends/i,
    night: /nachts/i
    // will never be matched. Night is matched by `pm`
  }
}, xn = {
  ordinalNumber: ue({
    matchPattern: vn,
    parsePattern: Dn,
    valueCallback: (n) => parseInt(n)
  }),
  era: J({
    matchPatterns: Sn,
    defaultMatchWidth: "wide",
    parsePatterns: Mn,
    defaultParseWidth: "any"
  }),
  quarter: J({
    matchPatterns: kn,
    defaultMatchWidth: "wide",
    parsePatterns: In,
    defaultParseWidth: "any",
    valueCallback: (n) => n + 1
  }),
  month: J({
    matchPatterns: Tn,
    defaultMatchWidth: "wide",
    parsePatterns: On,
    defaultParseWidth: "any"
  }),
  day: J({
    matchPatterns: An,
    defaultMatchWidth: "wide",
    parsePatterns: zn,
    defaultParseWidth: "any"
  }),
  dayPeriod: J({
    matchPatterns: Pn,
    defaultMatchWidth: "wide",
    parsePatterns: En,
    defaultParseWidth: "any"
  })
}, Ct = {
  code: "de",
  formatDistance: an,
  formatLong: un,
  formatRelative: hn,
  localize: _n,
  match: xn,
  options: {
    weekStartsOn: 1,
    firstWeekContainsDate: 4
  }
}, Cn = {
  lessThanXSeconds: {
    one: "moins d’une seconde",
    other: "moins de {{count}} secondes"
  },
  xSeconds: {
    one: "1 seconde",
    other: "{{count}} secondes"
  },
  halfAMinute: "30 secondes",
  lessThanXMinutes: {
    one: "moins d’une minute",
    other: "moins de {{count}} minutes"
  },
  xMinutes: {
    one: "1 minute",
    other: "{{count}} minutes"
  },
  aboutXHours: {
    one: "environ 1 heure",
    other: "environ {{count}} heures"
  },
  xHours: {
    one: "1 heure",
    other: "{{count}} heures"
  },
  xDays: {
    one: "1 jour",
    other: "{{count}} jours"
  },
  aboutXWeeks: {
    one: "environ 1 semaine",
    other: "environ {{count}} semaines"
  },
  xWeeks: {
    one: "1 semaine",
    other: "{{count}} semaines"
  },
  aboutXMonths: {
    one: "environ 1 mois",
    other: "environ {{count}} mois"
  },
  xMonths: {
    one: "1 mois",
    other: "{{count}} mois"
  },
  aboutXYears: {
    one: "environ 1 an",
    other: "environ {{count}} ans"
  },
  xYears: {
    one: "1 an",
    other: "{{count}} ans"
  },
  overXYears: {
    one: "plus d’un an",
    other: "plus de {{count}} ans"
  },
  almostXYears: {
    one: "presqu’un an",
    other: "presque {{count}} ans"
  }
}, Un = (n, t, e) => {
  let r;
  const s = Cn[n];
  return typeof s == "string" ? r = s : t === 1 ? r = s.one : r = s.other.replace("{{count}}", String(t)), e != null && e.addSuffix ? e.comparison && e.comparison > 0 ? "dans " + r : "il y a " + r : r;
}, Ln = {
  full: "EEEE d MMMM y",
  long: "d MMMM y",
  medium: "d MMM y",
  short: "dd/MM/y"
}, Nn = {
  full: "HH:mm:ss zzzz",
  long: "HH:mm:ss z",
  medium: "HH:mm:ss",
  short: "HH:mm"
}, jn = {
  full: "{{date}} 'à' {{time}}",
  long: "{{date}} 'à' {{time}}",
  medium: "{{date}}, {{time}}",
  short: "{{date}}, {{time}}"
}, Fn = {
  date: Z({
    formats: Ln,
    defaultWidth: "full"
  }),
  time: Z({
    formats: Nn,
    defaultWidth: "full"
  }),
  dateTime: Z({
    formats: jn,
    defaultWidth: "full"
  })
}, Wn = {
  lastWeek: "eeee 'dernier à' p",
  yesterday: "'hier à' p",
  today: "'aujourd’hui à' p",
  tomorrow: "'demain à' p'",
  nextWeek: "eeee 'prochain à' p",
  other: "P"
}, Rn = (n, t, e, r) => Wn[n], Jn = {
  narrow: ["av. J.-C", "ap. J.-C"],
  abbreviated: ["av. J.-C", "ap. J.-C"],
  wide: ["avant Jésus-Christ", "après Jésus-Christ"]
}, $n = {
  narrow: ["T1", "T2", "T3", "T4"],
  abbreviated: ["1er trim.", "2ème trim.", "3ème trim.", "4ème trim."],
  wide: ["1er trimestre", "2ème trimestre", "3ème trimestre", "4ème trimestre"]
}, Hn = {
  narrow: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
  abbreviated: [
    "janv.",
    "févr.",
    "mars",
    "avr.",
    "mai",
    "juin",
    "juil.",
    "août",
    "sept.",
    "oct.",
    "nov.",
    "déc."
  ],
  wide: [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre"
  ]
}, Bn = {
  narrow: ["D", "L", "M", "M", "J", "V", "S"],
  short: ["di", "lu", "ma", "me", "je", "ve", "sa"],
  abbreviated: ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
  wide: [
    "dimanche",
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi"
  ]
}, qn = {
  narrow: {
    am: "AM",
    pm: "PM",
    midnight: "minuit",
    noon: "midi",
    morning: "mat.",
    afternoon: "ap.m.",
    evening: "soir",
    night: "mat."
  },
  abbreviated: {
    am: "AM",
    pm: "PM",
    midnight: "minuit",
    noon: "midi",
    morning: "matin",
    afternoon: "après-midi",
    evening: "soir",
    night: "matin"
  },
  wide: {
    am: "AM",
    pm: "PM",
    midnight: "minuit",
    noon: "midi",
    morning: "du matin",
    afternoon: "de l’après-midi",
    evening: "du soir",
    night: "du matin"
  }
}, Yn = (n, t) => {
  const e = Number(n), r = t == null ? void 0 : t.unit;
  if (e === 0)
    return "0";
  const s = ["year", "week", "hour", "minute", "second"];
  let a;
  return e === 1 ? a = r && s.includes(r) ? "ère" : "er" : a = "ème", e + a;
}, Vn = ["MMM", "MMMM"], Qn = {
  preprocessor: (n, t) => n.getDate() === 1 || !t.some(
    (r) => r.isToken && Vn.includes(r.value)
  ) ? t : t.map(
    (r) => r.isToken && r.value === "do" ? { isToken: !0, value: "d" } : r
  ),
  ordinalNumber: Yn,
  era: R({
    values: Jn,
    defaultWidth: "wide"
  }),
  quarter: R({
    values: $n,
    defaultWidth: "wide",
    argumentCallback: (n) => n - 1
  }),
  month: R({
    values: Hn,
    defaultWidth: "wide"
  }),
  day: R({
    values: Bn,
    defaultWidth: "wide"
  }),
  dayPeriod: R({
    values: qn,
    defaultWidth: "wide"
  })
}, Xn = /^(\d+)(ième|ère|ème|er|e)?/i, Kn = /\d+/i, Gn = {
  narrow: /^(av\.J\.C|ap\.J\.C|ap\.J\.-C)/i,
  abbreviated: /^(av\.J\.-C|av\.J-C|apr\.J\.-C|apr\.J-C|ap\.J-C)/i,
  wide: /^(avant Jésus-Christ|après Jésus-Christ)/i
}, Zn = {
  any: [/^av/i, /^ap/i]
}, ta = {
  narrow: /^T?[1234]/i,
  abbreviated: /^[1234](er|ème|e)? trim\.?/i,
  wide: /^[1234](er|ème|e)? trimestre/i
}, ea = {
  any: [/1/i, /2/i, /3/i, /4/i]
}, ra = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(janv|févr|mars|avr|mai|juin|juill|juil|août|sept|oct|nov|déc)\.?/i,
  wide: /^(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i
}, sa = {
  narrow: [
    /^j/i,
    /^f/i,
    /^m/i,
    /^a/i,
    /^m/i,
    /^j/i,
    /^j/i,
    /^a/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ],
  any: [
    /^ja/i,
    /^f/i,
    /^mar/i,
    /^av/i,
    /^ma/i,
    /^juin/i,
    /^juil/i,
    /^ao/i,
    /^s/i,
    /^o/i,
    /^n/i,
    /^d/i
  ]
}, na = {
  narrow: /^[lmjvsd]/i,
  short: /^(di|lu|ma|me|je|ve|sa)/i,
  abbreviated: /^(dim|lun|mar|mer|jeu|ven|sam)\.?/i,
  wide: /^(dimanche|lundi|mardi|mercredi|jeudi|vendredi|samedi)/i
}, aa = {
  narrow: [/^d/i, /^l/i, /^m/i, /^m/i, /^j/i, /^v/i, /^s/i],
  any: [/^di/i, /^lu/i, /^ma/i, /^me/i, /^je/i, /^ve/i, /^sa/i]
}, ia = {
  narrow: /^(a|p|minuit|midi|mat\.?|ap\.?m\.?|soir|nuit)/i,
  any: /^([ap]\.?\s?m\.?|du matin|de l'après[-\s]midi|du soir|de la nuit)/i
}, oa = {
  any: {
    am: /^a/i,
    pm: /^p/i,
    midnight: /^min/i,
    noon: /^mid/i,
    morning: /mat/i,
    afternoon: /ap/i,
    evening: /soir/i,
    night: /nuit/i
  }
}, ca = {
  ordinalNumber: ue({
    matchPattern: Xn,
    parsePattern: Kn,
    valueCallback: (n) => parseInt(n)
  }),
  era: J({
    matchPatterns: Gn,
    defaultMatchWidth: "wide",
    parsePatterns: Zn,
    defaultParseWidth: "any"
  }),
  quarter: J({
    matchPatterns: ta,
    defaultMatchWidth: "wide",
    parsePatterns: ea,
    defaultParseWidth: "any",
    valueCallback: (n) => n + 1
  }),
  month: J({
    matchPatterns: ra,
    defaultMatchWidth: "wide",
    parsePatterns: sa,
    defaultParseWidth: "any"
  }),
  day: J({
    matchPatterns: na,
    defaultMatchWidth: "wide",
    parsePatterns: aa,
    defaultParseWidth: "any"
  }),
  dayPeriod: J({
    matchPatterns: ia,
    defaultMatchWidth: "any",
    parsePatterns: oa,
    defaultParseWidth: "any"
  })
}, Ut = {
  code: "fr",
  formatDistance: Un,
  formatLong: Fn,
  formatRelative: Rn,
  localize: Qn,
  match: ca,
  options: {
    weekStartsOn: 1,
    firstWeekContainsDate: 4
  }
}, la = /^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$/;
class ua extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (t === "0000-00-00")
      return null;
    const e = t instanceof Date ? this.toDateString(t) : t;
    if (e != null && la.test(e))
      return e;
    if (t !== void 0)
      return null;
  }
  /**
   * Serializes the value to be stored.
   */
  serialize() {
    return this._value === null ? "0000-00-00" : this._value;
  }
  /**
   * Convert date object to blitzdata date.
   */
  toDateString(t) {
    return !t || !(t instanceof Date) ? null : t.toISOString().substring(0, 10);
  }
  /**
   * Convert value to native date object.
   */
  toDateObject() {
    return this._value ? new Date(this._value) : null;
  }
  /**
   * Convert value to formatted time.
   */
  toFormatted(t = "en", e = !1) {
    if (!this._value)
      return null;
    const r = t === "fr" ? Ut : t === "de" ? Ct : mt;
    let s = t === "de" ? "dd. MMMM yyyy" : "dd MMMM yyyy";
    return e && (s = "EEEE, " + s), ir(
      new Date(this._value),
      s,
      { locale: r }
    );
  }
  /**
   * Convert value to relative time.
   */
  toRelative(t = "en") {
    if (!this._value)
      return null;
    const e = t === "fr" ? Ut : t === "de" ? Ct : mt;
    return or(
      new Date(this._value),
      {
        addSuffix: !0,
        locale: e
      }
    );
  }
}
class cr extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    return t;
  }
  /**
   * Serializes the value to be stored.
   */
  serialize() {
    return this._value;
  }
}
class da extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    return t;
  }
  /**
   * Serializes the value to be stored.
   */
  serialize() {
    return this._value;
  }
}
class re extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (typeof t == "number")
      return t;
    if (typeof t == "string")
      return parseInt(t, 10);
    if (t !== void 0)
      return null;
  }
  /**
   * Serializes the value to be stored.
   */
  serialize() {
    return typeof this._value == "number" ? this._value.toString() : this._value;
  }
}
class ha extends cr {
  // ...
}
const fa = /^[0-9]{4}\-[0-9]{2}\-[0-9]{2}\s[0-9]{2}\:[0-9]{2}\:[0-9]{2}$/;
class ma extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (t === "0000-00-00 00:00:00")
      return null;
    const e = t instanceof Date ? this.toDateString(t) : t;
    if (e != null && fa.test(e))
      return e;
    if (t !== void 0)
      return null;
  }
  /**
   * Serializes the value to be stored.
   */
  serialize() {
    return this._value === null ? "0000-00-00 00:00:00" : this._value;
  }
  /**
   * Convert date object to blitzdata date.
   */
  toDateString(t) {
    if (!t || !(t instanceof Date))
      return null;
    const e = new Date(t);
    e.setMinutes(e.getMinutes() - e.getTimezoneOffset());
    const r = e.toISOString();
    return r.substring(0, 10) + " " + r.substring(11, 19);
  }
  /**
   * Convert value to native date object.
   */
  toDateObject() {
    return this._value ? new Date(this._value) : null;
  }
  /**
   * Convert value to formatted time.
   */
  toFormatted(t = "en", e = !1) {
    if (!this._value)
      return null;
    const r = t === "fr" ? Ut : t === "de" ? Ct : mt;
    let s = t === "de" ? "dd. MMMM yyyy" : "dd MMMM yyyy";
    return e && (s = "EEEE, " + s), ir(
      new Date(this._value),
      s,
      { locale: r }
    );
  }
  /**
   * Convert value to relative time.
   */
  toRelative(t = "en") {
    if (!this._value)
      return null;
    const e = t === "fr" ? Ut : t === "de" ? Ct : mt;
    return or(
      new Date(this._value),
      {
        addSuffix: !0,
        locale: e
      }
    );
  }
  /**
   * Get the unix timestamp.
   */
  getTimeStamp() {
    return this._value ? new Date(this._value).getTime() : null;
  }
  /**
   * Get the blitzdata timestamp.
   */
  getBlitzStamp() {
    return this._value ? Math.floor((new Date(this._value).getTime() - (/* @__PURE__ */ new Date("2021-01-01T00:00:00Z")).getTime()) / 1e3) : null;
  }
}
class ga extends U {
  /**
   * Retrieves the linked object.
   * Task: https://alpha.blitzdata.com/blitzpm/log/blitzsifeddine/2025-08-25/Fk%2FMtm%20getObject()/2fbxs4--bt1lfz?proj=1s4dec-3ibnqe
   * 
   * @param options
   */
  async getObject(t) {
    const e = this.serialize();
    if (!e)
      return null;
    const r = await K().get(this._type), s = r == null ? void 0 : r.memoryClient().get(e);
    return s || (await (r == null ? void 0 : r.get({ skipCacheUpdateIfFound: !0, ...t, raw: !1, blitzID: e })) ?? null);
  }
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    return t != null && typeof t != "string" ? null : t;
  }
  /**
   * Serializes the value to be stored.
   */
  serialize() {
    return this._value;
  }
}
class wa extends U {
  /**
   * Retrieves the linked user.
   * Task: https://alpha.blitzdata.com/blitzpm/log/blitzsifeddine/2025-09-03/User%20type/2fra4l--t1g94e?proj=1s4dec-3ibnqe
   * 
   */
  async toUser() {
    const t = this.serialize();
    if (!t)
      return null;
    const e = await K().get("0BAUsers"), r = await (e == null ? void 0 : e.get({ blitzID: t, skipCacheUpdateIfFound: !0 }));
    return r ? {
      id: t,
      username: r.username.value
    } : null;
  }
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    return t;
  }
  /**
   * Serializes the value to be stored.
   */
  serialize() {
    return this._value;
  }
}
class lr {
  /**
   * Constructs a new many instance with given value.
   *
   * @param name Name of the attribute.
   * @param type Type of the attribute.
   * @param value The value to be stored in many instance.
   */
  constructor(t, e, r) {
    /**
     * Belonging object.
     */
    m(this, "_object");
    /**
     * Name of the attribute
     */
    m(this, "_name");
    /**
     * Type of the attribute.
     */
    m(this, "_type");
    /**
     * Underlying value of many type.
     */
    m(this, "_value");
    /**
     * Signal for the value.
     */
    m(this, "_valueSignal");
    /**
     * Signal for the sync status.
     */
    m(this, "_syncSignal");
    this._name = t, this._type = e, this._value = this.unserialize(r), this._valueSignal = new ft(this._value), this._syncSignal = new ft(null);
  }
  /**
   * The value of the many type.
   */
  get value() {
    return this._value;
  }
  /**
   * Sets value of the many type.
   *
   * @param value Value to be set.
   */
  set value(t) {
    this._value = this.unserialize(t), this._valueSignal.set(this._value);
  }
  /**
   * Returns the unserialized value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    let e;
    try {
      e = typeof t == "string" ? JSON.parse(t) : t instanceof Array ? t : t === void 0 ? void 0 : [], e !== void 0 && !Array.isArray(e) && (e = []);
    } catch {
      e = [];
    }
    return e && (e = e.map((r) => H.createType(this._name, this._type, r)).filter((r) => r.value != null), e.forEach((r) => r.withObject(this._object))), e;
  }
  /**
   * Serializes the value to be stored.
   */
  serialize() {
    if (this._value !== void 0)
      return this._value.map((t) => t.serialize());
  }
  /**
   * Performs and array operation.
   */
  async performAction(t) {
    var s, a, i, o, l, c, u, d, h, f, g, _;
    const e = new W({
      action: "edit",
      data: {
        [this._name]: {
          [t.action]: t.value
        }
      },
      model: (a = (s = this._object) == null ? void 0 : s.model) == null ? void 0 : a.getName(),
      blitzID: (i = this._object) == null ? void 0 : i._blitzID.value
    }), r = await q.create().run([e]);
    if (r[0].status !== x.Success && r[0].status !== x.Notice)
      throw new Error(r[0].message ?? "Unknown Error! Please try again.");
    for (const v of ((l = (o = this._object) == null ? void 0 : o._editURLs) == null ? void 0 : l.value) ?? [])
      await rt().addJob(v, e.toObject());
    if (this._value !== void 0)
      this.value = Ke(this.serialize(), e.data[this._name], this._name.endsWith("_mtm"));
    else {
      const v = await ((u = (c = this._object) == null ? void 0 : c.model) == null ? void 0 : u.get({ blitzID: this._object._blitzID.value, forceLocal: !0, raw: !0 }));
      v && Array.isArray(v[this._name]) && (this.value = v[this._name]);
    }
    (h = (d = this._object) == null ? void 0 : d.model) == null || h.memoryClient().emit(e), (f = this._object) == null || f.dispatchEvent("edit", e.data), (_ = (g = this._object) == null ? void 0 : g.model) == null || _.setLastTransactionHash(e.hash);
  }
  /**
   * Adds new item.
   *
   * @param value The value to be added in many instance.
   */
  async add(t) {
    await this.performAction({
      action: "add",
      value: H.createType(this._name, this._type, t).serialize()
    });
  }
  /**
   * Removes item at the given index.
   *
   * @param index The index to be removed from many instance.
   */
  async remove(t) {
    await this.performAction({
      action: "remove",
      value: H.createType(this._name, this._type, t).serialize()
    });
  }
  /**
   * Sets the object of the data type.
   *
   * @param object The object to set.
   */
  withObject(t) {
    this._object = t, this._value !== void 0 && this._value.forEach((e) => e.withObject(t));
  }
  /**
   * Subscribe to changes in the value.
   *
   * @param fn Subscribe callback.
   * @returns Unsubscribe function.
   */
  subscribe(t, e = !0) {
    var s, a;
    const r = this._valueSignal.subscribe(t, e);
    return this._value === void 0 && ((a = (s = this._object) == null ? void 0 : s.model) == null || a.get({ blitzID: this._object._blitzID.value, forceHttp: !0, query: { manyToMany: "object" } }).then((i) => {
      (i == null ? void 0 : i[this._name]._value) !== void 0 && this._valueSignal.emit();
    })), r;
  }
  /**
   * Subscribe to changes in the sync status.
   *
   * @param fn Subscribe callback.
   * @returns Unsubscribe function.
   */
  syncStatus(t) {
    var s;
    const e = this._syncSignal.get() !== null, r = this._syncSignal.subscribe(t, e);
    return e || rt().getJobsForObject((s = this._object) == null ? void 0 : s._blitzID.value).then((a) => {
      this._syncSignal.set(yt(a, this._name), !1), t(this._syncSignal.get());
    }), r;
  }
  /**
   * Get attribute details from model.
   */
  getDetails() {
    var t, e;
    return ((e = (t = this._object) == null ? void 0 : t.model) == null ? void 0 : e.getAttributeDetails(this._name)) || null;
  }
}
class ba extends lr {
  /**
   * Returns the unserialized value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    let e;
    try {
      e = typeof t == "string" ? JSON.parse(t) : t instanceof Array ? t : t === null ? [] : void 0, e !== void 0 && !Array.isArray(e) && (e = []);
    } catch {
    }
    return e;
  }
  /**
   * Serializes the value to be stored.
   */
  serialize() {
    return this._value;
  }
  /**
   * Adds new item.
   *
   * @param value The value to be added in mtm attribute.
   */
  async add(t) {
    await this.performAction({
      action: "add",
      value: t
    });
  }
  /**
   * Removes item.
   *
   * @param value The value to be removed in mtm attribute.
   */
  async remove(t) {
    await this.performAction({
      action: "remove",
      value: t
    });
  }
  /**
   * Sets the object of the data type.
   *
   * @param object The object to set.
   */
  withObject(t) {
    this._object = t;
  }
  /**
   * Retrieves the linked objects.
   * Task: https://alpha.blitzdata.com/blitzpm/log/blitzsifeddine/2025-08-25/Fk%2FMtm%20getObject()/2fbxs4--bt1lfz?proj=1s4dec-3ibnqe
   * 
   * @param options
   */
  async getObjects(t) {
    const e = this.serialize();
    if (!Array.isArray(e))
      return [];
    const r = await K().get(this._type), s = r == null ? void 0 : r.memoryClient(), a = [];
    for (const i of e) {
      if (!i._blitzID)
        continue;
      const o = s == null ? void 0 : s.get(i._blitzID);
      if (o) {
        a.push(o);
        continue;
      }
      const l = await (r == null ? void 0 : r.get({ skipCacheUpdateIfFound: !0, ...t, raw: !1, blitzID: i._blitzID }));
      l && a.push(l);
    }
    return a;
  }
}
function ya(n) {
  return n && n.constructor && typeof n.constructor.isBuffer == "function" && n.constructor.isBuffer(n);
}
function pa(n) {
  return n;
}
function _a(n, t) {
  t = t || {};
  const e = t.delimiter || ".", r = t.maxDepth, s = t.transformKey || pa, a = {};
  function i(o, l, c) {
    c = c || 1, Object.keys(o).forEach(function(u) {
      const d = o[u], h = t.safe && Array.isArray(d), f = Object.prototype.toString.call(d), g = ya(d), _ = f === "[object Object]" || f === "[object Array]", v = l ? l + e + s(u) : s(u);
      if (!h && !g && _ && Object.keys(d).length && (!t.maxDepth || c < r))
        return i(d, v, c + 1);
      a[v] = d;
    });
  }
  return i(n), a;
}
class va extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (t !== null && typeof t == "object")
      return t;
    if (t !== void 0)
      return null;
  }
  /**
   * Serializes the value to be stored.
   */
  serialize() {
    return this._value;
  }
  /**
   * Validates a JSON string.
   */
  validate(t) {
    let e = !0;
    try {
      JSON.parse(t);
    } catch {
      e = !1;
    }
    return e;
  }
  /**
   * Returns the object keys.
   */
  keys() {
    return Object.keys(this._value ?? {});
  }
  /**
   * Flattens the object.
   */
  flat() {
    return _a(this._value ?? {});
  }
  /**
   * Groups the object by the result of the given function.
   */
  groupBy(t) {
    if (typeof t != "function")
      throw new Error("Callback function is not a function!");
    return Object.groupBy(this._value ?? {}, t);
  }
}
class Da extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (typeof t == "string")
      return {
        content: t,
        language: null
      };
    if (t !== null && typeof t == "object" && t.content)
      return {
        content: t.content,
        language: t.language ?? null
      };
    if (t !== void 0)
      return null;
  }
  /**
   * Serializes the value to be stored.
   */
  serialize() {
    return this._value;
  }
  /**
   * Return the language of the code.
   */
  getLanguage() {
    var t;
    return ((t = this._value) == null ? void 0 : t.language) || null;
  }
  /**
   * Return the content of the code.
   */
  getContent() {
    var t;
    return ((t = this._value) == null ? void 0 : t.content) || null;
  }
}
class Sa extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    return t;
  }
  /**
   * Serializes the value to be stored.
   */
  serialize() {
    return this._value;
  }
  /**
   * Get the enum options.
   */
  getOptions() {
    var t, e, r;
    return ((r = (e = (t = this._object) == null ? void 0 : t.model) == null ? void 0 : e.getAttributeDetails(this._name)) == null ? void 0 : r.options) ?? [];
  }
  /**
   * Validate an enum value.
   */
  validate(t) {
    return this.getOptions().includes(t);
  }
}
class de extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (typeof t == "number")
      return t;
    if (typeof t == "string")
      return parseFloat(t);
    if (t !== void 0)
      return null;
  }
  /**
   * Serializes the value to be stored.
   */
  serialize() {
    return typeof this._value == "number" ? this._value.toString() : this._value;
  }
}
class Ma extends re {
  // ...
}
class ka extends de {
  // ...
}
class Ia extends de {
  /**
   * Returns the precentage value.
   */
  toPercentage() {
    return this._value != null ? (this._value * 100).toString() + "%" : null;
  }
}
const ze = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
class Ta extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (t != null && ze.test(t))
      return t;
    if (t !== void 0)
      return null;
  }
  /**
   * Serializes the value to be stored.
   */
  serialize() {
    return this._value;
  }
  /**
   * Validate an email value.
   */
  validate(t) {
    return ze.test(t);
  }
}
const Pe = /^\+[1-9]{1,3}\-[0-9]{7,14}$/;
class Oa extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (t != null && Pe.test(t))
      return t;
    if (t !== void 0)
      return null;
  }
  /**
   * Serializes the value to be stored.
   */
  serialize() {
    return this._value;
  }
  /**
   * Validate a URL value.
   */
  validate(t) {
    return Pe.test(t);
  }
  /**
   * Get the calling code.
   */
  getCallingCode() {
    if (!this._value)
      return null;
    const t = this._value.split("-");
    return t.length < 2 ? null : t[0].substring(1);
  }
  /**
   * Get the phone number.
   */
  getPhoneNumber() {
    if (!this._value)
      return null;
    const t = this._value.split("-");
    return t.length < 2 ? null : t[1];
  }
}
const Ee = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;
class Aa extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (t != null && Ee.test(t))
      return t;
    if (t !== void 0)
      return null;
  }
  /**
   * Serializes the value to be stored.
   */
  serialize() {
    return this._value;
  }
  /**
   * Validate a URL value.
   */
  validate(t) {
    return Ee.test(t);
  }
  /**
   * Get the native URL object.
   */
  getUrlObject() {
    return this._value ? new URL(this._value) : null;
  }
  /**
   * Get the origin.
   */
  getOrigin() {
    return this._value ? new URL(this._value).origin : null;
  }
  /**
   * Get the protocol.
   */
  getProtocol() {
    return this._value ? new URL(this._value).protocol : null;
  }
  /**
   * Get the path name.
   */
  getPathname() {
    return this._value ? new URL(this._value).pathname : null;
  }
  /**
   * Get the host name.
   */
  getHostname() {
    return this._value ? new URL(this._value).hostname : null;
  }
  /**
   * Get the search string.
   */
  getSearch() {
    return this._value ? new URL(this._value).search : null;
  }
}
class za extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    const e = t instanceof Array ? t[0] : t;
    if (e !== null && typeof e == "object" && e.base != null && e.version != null)
      return t;
    if (e !== void 0)
      return null;
  }
  /**
   * Serializes the value to be stored.
   */
  serialize() {
    return this._value;
  }
  /**
   * Get the image URL.
   * @param resolution Resolution of the image to be returned.
   */
  getUrl(t) {
    const e = this._value instanceof Array ? this._value[0] : this._value;
    return e !== null && typeof e == "object" && e.base != null && e[t] != null ? e.base + e[t].substring(1) : null;
  }
}
class Pa extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (t !== null && typeof t == "object" && t.url != null)
      return t;
    if (t !== void 0)
      return null;
  }
  /**
   * Serializes the value to be stored.
   */
  serialize() {
    return this._value;
  }
  /**
   * Get the video URL.
   */
  getUrl() {
    var t;
    return ((t = this._value) == null ? void 0 : t.url) ?? null;
  }
}
class Ea extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (t !== null && typeof t == "object" && t.url != null)
      return t;
    if (t !== void 0)
      return null;
  }
  /**
   * Serializes the value to be stored.
   */
  serialize() {
    return this._value;
  }
  /**
   * Get the file URL.
   */
  getUrl() {
    var t;
    return ((t = this._value) == null ? void 0 : t.url) ?? null;
  }
}
const xe = /^https?:\/\/[^\s]+$/i;
class xa extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (typeof t == "string" && xe.test(t))
      return t;
    if (t !== void 0)
      return null;
  }
  /**
   * Serializes the value to be stored.
   */
  serialize() {
    return this._value;
  }
  /**
   * Get the PDF URL.
   */
  getUrl() {
    return this._value ?? null;
  }
  /**
   * Validate a PDF URL value.
   */
  validate(t) {
    return xe.test(t);
  }
  /**
   * Get the conventional first-page thumbnail URL
   * (`/f/12/report.pdf` -> `/f/12/report.thumbnail.jpg`).
   *
   * The `.pdf` suffix is matched on the path only, so signed or cache-busted
   * URLs (`report.pdf?token=…`, `…#page=2`) still resolve correctly.
   */
  getThumbnailUrl() {
    const t = this.getUrl();
    if (!t)
      return null;
    const e = t.search(/[?#]/), r = e === -1 ? t : t.slice(0, e), s = e === -1 ? "" : t.slice(e);
    return /\.pdf$/i.test(r) ? r.replace(/\.pdf$/i, ".thumbnail.jpg") + s : null;
  }
}
class Ca extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (t !== null && typeof t == "object")
      return t;
    if (t !== void 0)
      return null;
  }
  /**
   * Serializes the value to be stored.
   */
  serialize() {
    return this._value;
  }
  /**
   * Validates if the provided value is a valid location
   */
  validate(t) {
    if (typeof t != "object" || t === null)
      return !1;
    const e = t;
    if (!e.lat || !e.lng)
      return !1;
    const r = parseFloat(e.lat);
    if (isNaN(r) || r < -90 || r > 90)
      return !1;
    const s = parseFloat(e.lng);
    return !(isNaN(s) || s < -180 || s > 180);
  }
  /**
   * Gets a formatted address string from the location data
   */
  getFormattedAddress() {
    if (!this._value)
      return "";
    const t = [];
    this._value.street && t.push(this._value.street), this._value.street_number && t.push(this._value.street_number);
    const e = [];
    return this._value.postal_code && e.push(this._value.postal_code), this._value.city && e.push(this._value.city), e.length > 0 && t.push(e.join(" ")), this._value.country && t.push(this._value.country), t.join(", ");
  }
  /**
   * Geocode an address to get coordinates
   * @param address The address to geocode
   * @param apiKey Google Maps API key
   * @returns Promise with lat/long coordinates or null if geocoding failed
   */
  async geocodeAddress(t, e) {
    if (!t)
      throw new Error("Address is required for geocoding.");
    if (!e)
      throw new Error("Google Maps API key is required for geocoding.");
    try {
      const s = await (await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(t)}&key=${e}`)).json();
      if (s.status === "OK" && s.results && s.results.length > 0) {
        const a = s.results[0].geometry.location;
        return {
          lat: a.lat.toString(),
          lng: a.lng.toString()
        };
      }
      return null;
    } catch (r) {
      return console.error("Geocoding error:", r.message), null;
    }
  }
}
class H {
  /**
   * Creates appropriate type from given attribute type string and value.
   *
   * @param name
   * @param type
   * @param value
   */
  static createType(t, e, r) {
    var a;
    if (t.endsWith("_fk"))
      return new ga(t, e, r);
    const s = (a = Ge[t]) == null ? void 0 : a.type;
    return typeof s == "string" && (e = s), e === "user" ? new wa(t, e, r) : e === "int" ? new re(t, "int", r) : e === "blitzstamp" ? new re(t, e, r) : e === "tinyint" ? new Ma(t, e, r) : e === "double" ? new ka(t, e, r) : e === "float" ? new de(t, e, r) : e === "percentage" ? new Ia(t, e, r) : e === "varchar" ? new ha(t, e, r) : e === "text" ? new cr(t, e, r) : e === "htmlText" ? new da(t, e, r) : e === "enum" ? new Sa(t, e, r) : e === "json" ? new va(t, e, r) : e === "boolean" ? new er(t, e, r) : e === "datetime" ? new ma(t, "datetime", r) : e === "date" ? new ua(t, e, r) : e === "code" ? new Da(t, e, r) : e === "email" ? new Ta(t, e, r) : e === "phone" ? new Oa(t, e, r) : e === "url" ? new Aa(t, e, r) : e === "image" ? new za(t, e, r) : e === "video" ? new Pa(t, e, r) : e === "file" ? new Ea(t, e, r) : e === "pdf" ? new xa(t, e, r) : e === "location" ? new Ca(t, e, r) : new wt(t, e, r);
  }
  /**
   * Initializes a new instance of DataType or ManyType with the specified name and type.
   *
   * @param name
   * @param type
   * @param value
   * @returns
   */
  static createFrom(t, e, r) {
    return Array.isArray(e) ? this.createMany(t, e[0], r) : this.createType(t, e, r);
  }
  /**
   * Unserializes array attribute.
   *
   * @param name
   * @param type
   * @param values
   */
  static createMany(t, e, r) {
    return t.endsWith("_mtm") ? new ba(t, e, r) : new lr(t, e, r);
  }
  /**
   * Unserializes given data to be used within library.
   *
   * @param attributes
   * @param data
   */
  static unserialize(t, e) {
    var a, i, o;
    const r = {}, s = [...Object.keys(t), ...Object.keys(e)].filter((l, c, u) => u.indexOf(l) === c);
    for (const l of s)
      Array.isArray((a = t[l]) == null ? void 0 : a.type) ? r[l] = H.createMany(l, ((i = t[l]) == null ? void 0 : i.type[0]) ?? "anonymous", e[l]) : r[l] = H.createType(
        l,
        ((o = t[l]) == null ? void 0 : o.type) ?? "anonymous",
        e[l]
      );
    return r;
  }
  /**
   * Serializes data for transport.
   *
   * @param data
   */
  static serialize(t) {
    const e = {};
    for (const r in t)
      e[r] = t[r].serialize();
    return e;
  }
}
class ur extends Error {
  constructor(t) {
    super(t), this.name = "DefinitiveHistoryError";
  }
}
class st {
  /**
   * Performs a list call to the server by given base URL, model name and query parameters.
   */
  static async list(t, e) {
    if (!t.endpoint && !t.fullUrl)
      throw new Error("Either baseUrl or fullUrl must be provided.");
    const r = await z.create().url(
      // We got 2 urls, because it is possible to have a full url.
      // See `BlitzData.list()` and `BlitzData.listRaw()` methods.
      t.fullUrl ? t.fullUrl : P.createListEndpoint(t.endpoint.baseUrl, t.endpoint.modelName, t.endpoint.query)
    ).signal(e).get();
    if (!Array.isArray(r.items) && Array.isArray(r.errors))
      throw new Error(r.errors.map((s) => (s == null ? void 0 : s.message) ?? s).join(" | "));
    return r;
  }
  /**
   * Performs a get call to the server by provided options.
   */
  static async get(t, e) {
    const r = await z.create().url(
      P.createGetEndpoint(t.baseUrl, t.modelName, t.blitzID, t.query)
    ).signal(e).get();
    if (!Array.isArray(r.items) && Array.isArray(r.errors))
      throw new Error(r.errors.map((s) => (s == null ? void 0 : s.message) ?? s).join(" | "));
    return r.items ?? [];
  }
  /**
   * Performs a post call to the server by given base URL and transactions.
   *
   * @param options Post options.
   */
  static async post(t) {
    const e = await z.create().url(P.createPostEndpoint(t.baseUrl)).body(t.transactions).post();
    if ((typeof e.error == "string" || e.errors instanceof Array) && !(e.results instanceof Object))
      throw new Error(e.error ?? e.errors.join(" | "));
    return e;
  }
  /**
   * Performs a list logs call to the server by given base URL and transactions.
   *
   * @param options List logs option.
   */
  static async listLogs(t) {
    const e = await z.create().url(P.createListLogsEndpoint(t)).get();
    if (!(e.transactions instanceof Array) && (typeof e.error == "string" || e.errors instanceof Array))
      throw new Error(e.error ?? e.errors.map((r) => (r == null ? void 0 : r.message) ?? r).join(" | "));
    return {
      transactions: e.transactions,
      userID: e.userID,
      userhash: e.userhash,
      lastTimestamp: e.lastTimestamp,
      lastLogID: e.lastLogID
    };
  }
  /**
   * Performs a get history call to the server for one record.
   *
   * @param options Get history options.
   */
  static async getHistory(t, e) {
    var s;
    const r = await z.create().url(P.createGetHistoryEndpoint(t.baseUrl, t.modelName, t.blitzID)).signal(e).get();
    if (!Array.isArray(r.data)) {
      if ((s = r.errors) != null && s.length)
        throw new Error(r.errors.map((i) => (i == null ? void 0 : i.message) ?? i).join(" | "));
      const a = `History of "${t.modelName}/${t.blitzID}" is not readable: the record may not exist or you may lack permission.`;
      throw !r.error && r.userID !== void 0 ? new ur(a) : new Error(r.error ?? a);
    }
    return r.data.map((a) => ({
      ...a,
      data: typeof a.data == "object" && a.data !== null ? JSON.stringify(a.data) : a.data,
      newValue: typeof a.newValue == "object" && a.newValue !== null ? JSON.stringify(a.newValue) : a.newValue
    }));
  }
  /**
   * Performs an image upload call to the server by given base URL and image file.
   *
   * @param options Upload options.
   */
  static async upload(t) {
    const e = new FormData();
    e.append("image", t.image);
    const r = z.create().url(P.createUploaderEndpoint(t.baseUrl)).body(e).header("Accept", "application/json");
    t.modelName && r.header("Bb-Target-Model", t.modelName), t.attributeName && r.header("Bb-Target-Attribute", t.attributeName);
    const s = await r.post(), a = {};
    for (const [i, o] of Object.entries(s ?? {}))
      [
        "base",
        "version",
        "hd",
        "hd_wp",
        "oq",
        "oq_wp",
        "md",
        "md_wp",
        "sd",
        "sd_wp",
        "w320",
        "w320_wp",
        "180x180",
        "180x180_wp",
        "370x370",
        "370x370_wp"
      ].includes(i) && (a[i] = o);
    return a;
  }
  /**
   * Performs a video upload call to the server by given base URL and video file.
   *
   * @param options Upload options.
   */
  static async uploadVideo(t) {
    const e = new FormData();
    e.append("fileToUpload", t.video);
    const r = t.video.name.split("."), s = r.length > 1 ? "." + r.pop() : "", a = crypto.randomUUID() + s, i = z.create().url(P.createVideoUploaderEndpoint(t.baseUrl, a)).body(e).header("Accept", "application/json");
    t.modelName && i.header("Bb-Target-Model", t.modelName), t.attributeName && i.header("Bb-Target-Attribute", t.attributeName);
    const o = await i.post();
    if (!o || !o.s)
      throw new Error("Video upload failed: " + ((o == null ? void 0 : o.error) ?? "Unknown error!"));
    return {
      url: o.url.video,
      thumbnail: o.url.thumb,
      "tn-oq": o.url.tnoq
    };
  }
  /**
   * Performs a file upload call to the server by given base URL and file.
   *
   * @param options Upload options.
   */
  static async uploadFile(t) {
    const e = new FormData();
    e.append("files[]", t.file);
    const r = z.create().url(P.createFileUploaderEndpoint(t.baseUrl)).body(e).header("Accept", "application/json");
    t.modelName && r.header("Bb-Target-Model", t.modelName), t.attributeName && r.header("Bb-Target-Attribute", t.attributeName);
    const s = await r.post();
    if (!s || !s.s)
      throw new Error("File upload failed: " + ((s == null ? void 0 : s.error) ?? "Unknown error!"));
    return {
      url: s.files.url
    };
  }
  /**
   * Performs a ping call to the server by provided base URL.
   */
  static async ping({ baseUrl: t }) {
    return await z.create().url(P.createPingEndpoint(t)).get();
  }
}
class ut {
  /**
   * Constructor.
   */
  constructor({ model: t, attributes: e }) {
    /**
     * The model instance that object belongs to.
     */
    m(this, "_model");
    /**
     * Data of the object.
     */
    m(this, "_attributes");
    /**
     * Even listeners of the object.
     */
    m(this, "listeners", /* @__PURE__ */ new Map());
    /**
     * Signal for the object-level sync status (worst-of over the object's edit jobs).
     */
    m(this, "_syncSignal", new ft(null));
    /**
     * Edit queue of the object to process edit calls sequentially.
     */
    m(this, "editQueue", Promise.resolve());
    this._model = t, this._attributes = e;
  }
  /**
   * Model instance that object belongs to.
   */
  get model() {
    return this._model;
  }
  /**
   * Returns attribute value by given attribute name.
   *
   * @param name Attribute name.
   */
  getAttribute(t) {
    return this._attributes[t];
  }
  /**
   * Returns whether the object has given attribute or not.
   *
   * @param name Attribute name.
   */
  hasAttribute(t) {
    return this._attributes.hasOwnProperty(t);
  }
  /**
   * Edits given attribute name with value.
   *
   * @param attributeName Name of the attribute.
   * @param value New value of the attribute.
   */
  edit(t, e, r) {
    return this.enqueueEditOperation(async () => {
      var c, u, d, h;
      const s = (u = (c = this.model) == null ? void 0 : c.getAttributeDetails(t)) == null ? void 0 : u.type, a = H.createType(t, s, e).serialize(), i = r ? H.createType(t, s, r).serialize() : this.getAttribute(t).serialize(), o = new W({
        action: "edit",
        data: {
          [t]: {
            prev: i,
            new: a
          }
        },
        model: this.model.getName(),
        blitzID: this.getAttribute("_blitzID").value
      }), l = await q.create().run([o]);
      if (l[0].status !== x.Success && l[0].status !== x.Notice)
        throw new Error(l[0].message ?? "Unknown Error! Please try again.");
      this._attributes[t].value = a;
      for (const f of this.getAttribute("_editURLs").value)
        await rt().addJob(f, o.toObject());
      (d = this.model) == null || d.memoryClient().emit(o), this.dispatchEvent("edit", o.data), (h = this.model) == null || h.setLastTransactionHash(o.hash);
    });
  }
  /**
   * Deletes of object.
   */
  async delete() {
    var s, a;
    const t = new W({
      action: "delete",
      model: this.model.getName(),
      blitzID: this.getAttribute("_blitzID").value
    }), e = await q.create().run([t]);
    if (e[0].status !== x.Success)
      throw new Error(e[0].message ?? "Unknown Error! Please try again.");
    const r = (s = this.model) == null ? void 0 : s.memoryClient();
    r == null || r.delete(this.getAttribute("_blitzID").value);
    for (const i of this.getAttribute("_editURLs").value)
      await rt().addJob(i, t.toObject());
    r == null || r.emit(t), this.dispatchEvent("delete", null), (a = this.model) == null || a.setLastTransactionHash(t.hash);
  }
  syncStatus(t) {
    if (!t)
      return rt().getJobsForObject(this.getAttribute("_blitzID").value).then((s) => s.every((a) => a.status === p.Completed));
    const e = this._syncSignal.get() !== null, r = this._syncSignal.subscribe(t, e);
    return e || rt().getJobsForObject(this.getAttribute("_blitzID").value).then((s) => {
      this._syncSignal.set(yt(s), !1), t(this._syncSignal.get());
    }), r;
  }
  /**
   * Add permission for users for this object.
   *
   * @param id User hash/_blitzID.
   * @param permission Permission level
   */
  async addUserPermission(t) {
    if (!t || t.length === 0)
      throw new Error("Users missing!");
    const e = this.getAttribute("_blitzID").value, r = {
      blitzIDs: [e],
      users: t.reduce((o, l) => ({ ...o, [`#${l.id}`]: l.permission }), {})
    }, s = new W({
      action: "addObjectUserPermission",
      model: this.model.getName(),
      blitzID: e,
      data: r,
      hash: ct(r)
    }), a = [];
    for (const o of this.getAttribute("_editURLs").value)
      a.push(
        await Tt.send(
          { url: o, transaction: s.toObject() },
          z._globalHeaders
        )
      );
    const i = a.find((o) => o.status !== L.Success);
    if (i)
      throw new Error(i.message);
  }
  /**
   * The signed-in user's value for one of the model's declared per-user
   * fields, as the last read returned it.
   *
   * Returns `undefined` when the field was not requested. Per-user fields are
   * opt-in on every read: a list or get carries them only when `var` names
   * them (`var: ['title', 'user.lastseen@u']`). Absent is therefore "not
   * asked for", never "not set" — a user with no row reads the declared
   * default, which the server substitutes.
   *
   * @param field Declared name, with or without the `user.` prefix.
   */
  userField(t) {
    var r;
    const e = t.startsWith(at) ? t : at + t;
    return (r = this._attributes[e]) == null ? void 0 : r.value;
  }
  /**
   * Writes one of the model's declared per-user fields for the signed-in
   * user.
   *
   * A per-user field holds that user's own value for this object — a read
   * marker, a personal flag — in the model's `{model}~users` sidecar rather
   * than on the object itself. This is the way to hold per-user state:
   * putting it in an ordinary attribute gives every reader one shared value
   * and makes the last writer win.
   *
   * Personal fields (`name@u`) need only READ on the object, so a
   * collaborator can write their own without being granted anything more,
   * and cannot write anyone else's — the server refuses a personal write
   * aimed at another user.
   *
   * Sent straight to the server rather than through the offline queue, the
   * same way addUserPermission is: the queue carries add/edit/delete against
   * the object's own table, and a per-user row is neither. The non-guarantee
   * that follows is deliberate — a write made offline fails rather than
   * replaying later, which suits the flags this exists for and would not
   * suit durable data.
   *
   * @param field Declared name, with or without the `user.` prefix.
   * @param value New value; serialized using the declared type.
   */
  async editUserField(t, e) {
    var h, f;
    const r = t.startsWith(at) ? t.slice(at.length) : t, s = at + r, a = (h = this.model) == null ? void 0 : h.getUserAttributeDetails(s);
    if (!a)
      throw new Error(`'${r}' is not a per-user field declared on ${((f = this.model) == null ? void 0 : f.getName()) ?? "this model"}.`);
    const i = H.createType(r, a.type, e).serialize(), o = this.getAttribute("_blitzID").value, l = { [r]: i }, c = new W({
      action: "editUserField",
      model: this.model.getName(),
      blitzID: o,
      data: l,
      hash: ct(l)
    }), u = [];
    for (const g of this.getAttribute("_editURLs").value)
      u.push(
        await Tt.send(
          { url: g, transaction: c.toObject() },
          z._globalHeaders
        )
      );
    const d = u.find((g) => g.status !== L.Success);
    if (d)
      throw new Error(d.message);
    this._attributes[s] !== void 0 && (this._attributes[s].value = i), this.dispatchEvent("edit", c.data);
  }
  /**
   * Reads the change history of the object from the server: who changed
   * which attribute to what, and when. Newest first, capped at the newest
   * 100 entries by the server. Server-only — history is provenance, it is
   * never cached locally.
   */
  async history(t) {
    var s;
    if (!this.model)
      throw new Error("Object has no model to read history for.");
    const e = ((s = this.getAttribute("_editURLs")) == null ? void 0 : s.value) ?? [];
    if (!e.length)
      throw new Error("Object has no server URLs to read history from.");
    let r;
    for (const a of e)
      try {
        return await st.getHistory({
          baseUrl: a,
          modelName: this.model.getName(),
          blitzID: this.getAttribute("_blitzID").value
        }, t);
      } catch (i) {
        if (i instanceof ur || (i == null ? void 0 : i.name) === "AbortError")
          throw i;
        r = (i == null ? void 0 : i.message) ?? String(i);
      }
    throw new Error(`Could not read history: no server answered. Last error: ${r}`);
  }
  /**
   * Serializes object into primitive object with serialized attributes.
   */
  toObject() {
    const t = {};
    for (const e in this._attributes)
      t[e] = this._attributes[e].serialize();
    return t;
  }
  /**
   * Adds event listener to the object.
   *
   * @param type Event type.
   * @param callback Callback function.
   */
  addEventListener(t, e) {
    var r;
    this.listeners.has(t) || this.listeners.set(t, []), (r = this.listeners.get(t)) == null || r.push(e);
  }
  /**
   * Removes an event listener from the object.
   *
   * @param type Event type.
   * @param callback Callback function.
   */
  removeEventListener(t, e) {
    this.listeners.has(t) && this.listeners.set(
      t,
      this.listeners.get(t).filter((r) => e !== r)
    );
  }
  /**
   * Dispatches event to the object.
   *
   * @param type Event type.
   * @param data Data to be dispatched.
   */
  dispatchEvent(t, e) {
    var r;
    this.listeners.has(t) && ((r = this.listeners.get(t)) == null || r.forEach((s) => s(e)));
  }
  /**
   * Adds an edit operation to edit queue.
   *
   * @param operation
   */
  enqueueEditOperation(t) {
    return new Promise((e, r) => {
      this.editQueue = this.editQueue.then(async () => {
        try {
          const s = await t();
          e(s);
        } catch (s) {
          r(s);
        }
      });
    });
  }
}
class se {
  /**
   * Transforms BlitzData options.
   */
  static transformBlitzDataOptions(t) {
    if (typeof t > "u")
      throw new Error("Configuration is required.");
    if (typeof t == "string")
      t = {
        clusters: this.transformClusterOptions(t)
      };
    else if (Array.isArray(t))
      t = {
        clusters: this.transformClusterOptions(t)
      };
    else if (typeof t == "object" && !Array.isArray(t))
      t.clusters = this.transformClusterOptions(t.clusters);
    else
      throw new Error("Unknown configuration type.");
    if (!t.queue || typeof t.queue != "object" ? t.queue = {
      workerPath: "/queue-worker.js"
    } : t.queue.workerPath || (t.queue.workerPath = "/queue-worker.js"), t.sync ? typeof t.sync == "string" && (t.sync = {
      level: t.sync
    }) : t.sync = {
      level: "none"
    }, t.sync.level === "partial")
      throw new Error("Partial sync type not supported yet!");
    return typeof t.sync.live != "boolean" && (t.sync.live = !1), t.sync.level === "cache" && (t.sync.ttl || (t.sync.ttl = 30 * 1e3)), t.sync.level === "full" && (t.sync.interval || (t.sync.interval = 30 * 1e3), typeof t.sync.background != "boolean" && (t.sync.background = !1)), t.realtime && (Array.isArray(t.realtime.models) || (t.realtime.models = [])), t.flush || (t.flush = {
      type: ["version", "model"]
    }), t.flush.type.includes("interval") && (t.flush.interval || (t.flush.interval = 30)), t.flush.type.includes("size") && (t.flush.size || (t.flush.size = 128)), t.flush.type.includes("model") && (t.flush.modelCacheTTL || (t.flush.modelCacheTTL = 60 * 5)), t;
  }
  /**
   * Transforms cluster options.
   */
  static transformClusterOptions(t) {
    if (typeof t > "u")
      throw new Error("Clusters are required.");
    if (typeof t == "string")
      t = {
        default: {
          readURL: [t],
          addURL: [t]
        }
      };
    else if (Array.isArray(t))
      t = {
        default: {
          readURL: t,
          addURL: t
        }
      };
    else if (typeof t == "object")
      for (const e of Object.keys(t)) {
        if (typeof t[e] == "string" || Array.isArray(t[e])) {
          const r = Array.isArray(t[e]) ? t[e] : [t[e]];
          t[e] = {
            readURL: r,
            addURL: r
          };
          continue;
        }
        typeof t[e] == "object" && (typeof t[e].readURL == "string" && (t[e].readURL = [t[e].readURL]), typeof t[e].addURL == "string" && (t[e].addURL = [t[e].addURL]));
      }
    else
      throw new Error("Unknown cluster configuration type.");
    return t;
  }
}
class ne {
  /**
   * Extract model name from the given `list` URL.
   *
   * @param url The URL to extract the model name from.
   *
   * @returns The model name.
   */
  static extractModelName(t) {
    const s = new URL(t).pathname.split("/").filter((a) => a !== "").pop();
    if (!s && !(s != null && s.endsWith(".json")))
      throw new Error("Model name not found in the URL.");
    return s.slice(0, s.indexOf(".json"));
  }
  /**
   * Extracts conditions from the given `list` URL.
   *
   * @param url The URL to extract the conditions from.
   *
   * @returns The conditions.
   */
  static extractConditions(t) {
    const e = new URL(t);
    return JSON.parse(e.searchParams.get("conditions") || "[]");
  }
}
const Ua = {
  /**
   * Get handler for the object.
   *
   * @param target BDObject that's being proxied.
   * @param key wanted key.
   */
  get(n, t) {
    if (Reflect.has(n, t)) {
      const e = Reflect.get(n, t);
      return e instanceof Function ? e.bind(n) : e;
    }
    return n._attributes[t];
  },
  /**
   * Set handler for the object.
   */
  set(n, t, e) {
    throw new Error("Setting values directly not supported. Please use `edit` method to change a value for an attribute.");
  }
};
class dr {
  /**
   * Creates new BDObject with supplied type, model and attributes.
   *
   * @param type
   * @param model
   * @param data
   * @param updateMemory
   */
  static create(t, e, r) {
    const s = e.getAttributesDetails() ?? {}, a = H.unserialize(s, r), i = new Proxy(new t({
      model: e,
      attributes: a
    }), Ua);
    for (const o in a)
      a[o].withObject(i);
    return e.memoryClient().update(i);
  }
}
var hr = { exports: {} }, fr = { exports: {} };
(function() {
  var n = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", t = {
    // Bit-wise rotation left
    rotl: function(e, r) {
      return e << r | e >>> 32 - r;
    },
    // Bit-wise rotation right
    rotr: function(e, r) {
      return e << 32 - r | e >>> r;
    },
    // Swap big-endian to little-endian and vice versa
    endian: function(e) {
      if (e.constructor == Number)
        return t.rotl(e, 8) & 16711935 | t.rotl(e, 24) & 4278255360;
      for (var r = 0; r < e.length; r++)
        e[r] = t.endian(e[r]);
      return e;
    },
    // Generate an array of any length of random bytes
    randomBytes: function(e) {
      for (var r = []; e > 0; e--)
        r.push(Math.floor(Math.random() * 256));
      return r;
    },
    // Convert a byte array to big-endian 32-bit words
    bytesToWords: function(e) {
      for (var r = [], s = 0, a = 0; s < e.length; s++, a += 8)
        r[a >>> 5] |= e[s] << 24 - a % 32;
      return r;
    },
    // Convert big-endian 32-bit words to a byte array
    wordsToBytes: function(e) {
      for (var r = [], s = 0; s < e.length * 32; s += 8)
        r.push(e[s >>> 5] >>> 24 - s % 32 & 255);
      return r;
    },
    // Convert a byte array to a hex string
    bytesToHex: function(e) {
      for (var r = [], s = 0; s < e.length; s++)
        r.push((e[s] >>> 4).toString(16)), r.push((e[s] & 15).toString(16));
      return r.join("");
    },
    // Convert a hex string to a byte array
    hexToBytes: function(e) {
      for (var r = [], s = 0; s < e.length; s += 2)
        r.push(parseInt(e.substr(s, 2), 16));
      return r;
    },
    // Convert a byte array to a base-64 string
    bytesToBase64: function(e) {
      for (var r = [], s = 0; s < e.length; s += 3)
        for (var a = e[s] << 16 | e[s + 1] << 8 | e[s + 2], i = 0; i < 4; i++)
          s * 8 + i * 6 <= e.length * 8 ? r.push(n.charAt(a >>> 6 * (3 - i) & 63)) : r.push("=");
      return r.join("");
    },
    // Convert a base-64 string to a byte array
    base64ToBytes: function(e) {
      e = e.replace(/[^A-Z0-9+\/]/ig, "");
      for (var r = [], s = 0, a = 0; s < e.length; a = ++s % 4)
        a != 0 && r.push((n.indexOf(e.charAt(s - 1)) & Math.pow(2, -2 * a + 8) - 1) << a * 2 | n.indexOf(e.charAt(s)) >>> 6 - a * 2);
      return r;
    }
  };
  fr.exports = t;
})();
var La = fr.exports, ae = {
  // UTF-8 encoding
  utf8: {
    // Convert a string to a byte array
    stringToBytes: function(n) {
      return ae.bin.stringToBytes(unescape(encodeURIComponent(n)));
    },
    // Convert a byte array to a string
    bytesToString: function(n) {
      return decodeURIComponent(escape(ae.bin.bytesToString(n)));
    }
  },
  // Binary encoding
  bin: {
    // Convert a string to a byte array
    stringToBytes: function(n) {
      for (var t = [], e = 0; e < n.length; e++)
        t.push(n.charCodeAt(e) & 255);
      return t;
    },
    // Convert a byte array to a string
    bytesToString: function(n) {
      for (var t = [], e = 0; e < n.length; e++)
        t.push(String.fromCharCode(n[e]));
      return t.join("");
    }
  }
}, Ce = ae;
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
var Na = function(n) {
  return n != null && (mr(n) || ja(n) || !!n._isBuffer);
};
function mr(n) {
  return !!n.constructor && typeof n.constructor.isBuffer == "function" && n.constructor.isBuffer(n);
}
function ja(n) {
  return typeof n.readFloatLE == "function" && typeof n.slice == "function" && mr(n.slice(0, 0));
}
(function() {
  var n = La, t = Ce.utf8, e = Na, r = Ce.bin, s = function(a, i) {
    a.constructor == String ? i && i.encoding === "binary" ? a = r.stringToBytes(a) : a = t.stringToBytes(a) : e(a) ? a = Array.prototype.slice.call(a, 0) : !Array.isArray(a) && a.constructor !== Uint8Array && (a = a.toString());
    for (var o = n.bytesToWords(a), l = a.length * 8, c = 1732584193, u = -271733879, d = -1732584194, h = 271733878, f = 0; f < o.length; f++)
      o[f] = (o[f] << 8 | o[f] >>> 24) & 16711935 | (o[f] << 24 | o[f] >>> 8) & 4278255360;
    o[l >>> 5] |= 128 << l % 32, o[(l + 64 >>> 9 << 4) + 14] = l;
    for (var g = s._ff, _ = s._gg, v = s._hh, E = s._ii, f = 0; f < o.length; f += 16) {
      var N = c, C = u, Q = d, Wt = h;
      c = g(c, u, d, h, o[f + 0], 7, -680876936), h = g(h, c, u, d, o[f + 1], 12, -389564586), d = g(d, h, c, u, o[f + 2], 17, 606105819), u = g(u, d, h, c, o[f + 3], 22, -1044525330), c = g(c, u, d, h, o[f + 4], 7, -176418897), h = g(h, c, u, d, o[f + 5], 12, 1200080426), d = g(d, h, c, u, o[f + 6], 17, -1473231341), u = g(u, d, h, c, o[f + 7], 22, -45705983), c = g(c, u, d, h, o[f + 8], 7, 1770035416), h = g(h, c, u, d, o[f + 9], 12, -1958414417), d = g(d, h, c, u, o[f + 10], 17, -42063), u = g(u, d, h, c, o[f + 11], 22, -1990404162), c = g(c, u, d, h, o[f + 12], 7, 1804603682), h = g(h, c, u, d, o[f + 13], 12, -40341101), d = g(d, h, c, u, o[f + 14], 17, -1502002290), u = g(u, d, h, c, o[f + 15], 22, 1236535329), c = _(c, u, d, h, o[f + 1], 5, -165796510), h = _(h, c, u, d, o[f + 6], 9, -1069501632), d = _(d, h, c, u, o[f + 11], 14, 643717713), u = _(u, d, h, c, o[f + 0], 20, -373897302), c = _(c, u, d, h, o[f + 5], 5, -701558691), h = _(h, c, u, d, o[f + 10], 9, 38016083), d = _(d, h, c, u, o[f + 15], 14, -660478335), u = _(u, d, h, c, o[f + 4], 20, -405537848), c = _(c, u, d, h, o[f + 9], 5, 568446438), h = _(h, c, u, d, o[f + 14], 9, -1019803690), d = _(d, h, c, u, o[f + 3], 14, -187363961), u = _(u, d, h, c, o[f + 8], 20, 1163531501), c = _(c, u, d, h, o[f + 13], 5, -1444681467), h = _(h, c, u, d, o[f + 2], 9, -51403784), d = _(d, h, c, u, o[f + 7], 14, 1735328473), u = _(u, d, h, c, o[f + 12], 20, -1926607734), c = v(c, u, d, h, o[f + 5], 4, -378558), h = v(h, c, u, d, o[f + 8], 11, -2022574463), d = v(d, h, c, u, o[f + 11], 16, 1839030562), u = v(u, d, h, c, o[f + 14], 23, -35309556), c = v(c, u, d, h, o[f + 1], 4, -1530992060), h = v(h, c, u, d, o[f + 4], 11, 1272893353), d = v(d, h, c, u, o[f + 7], 16, -155497632), u = v(u, d, h, c, o[f + 10], 23, -1094730640), c = v(c, u, d, h, o[f + 13], 4, 681279174), h = v(h, c, u, d, o[f + 0], 11, -358537222), d = v(d, h, c, u, o[f + 3], 16, -722521979), u = v(u, d, h, c, o[f + 6], 23, 76029189), c = v(c, u, d, h, o[f + 9], 4, -640364487), h = v(h, c, u, d, o[f + 12], 11, -421815835), d = v(d, h, c, u, o[f + 15], 16, 530742520), u = v(u, d, h, c, o[f + 2], 23, -995338651), c = E(c, u, d, h, o[f + 0], 6, -198630844), h = E(h, c, u, d, o[f + 7], 10, 1126891415), d = E(d, h, c, u, o[f + 14], 15, -1416354905), u = E(u, d, h, c, o[f + 5], 21, -57434055), c = E(c, u, d, h, o[f + 12], 6, 1700485571), h = E(h, c, u, d, o[f + 3], 10, -1894986606), d = E(d, h, c, u, o[f + 10], 15, -1051523), u = E(u, d, h, c, o[f + 1], 21, -2054922799), c = E(c, u, d, h, o[f + 8], 6, 1873313359), h = E(h, c, u, d, o[f + 15], 10, -30611744), d = E(d, h, c, u, o[f + 6], 15, -1560198380), u = E(u, d, h, c, o[f + 13], 21, 1309151649), c = E(c, u, d, h, o[f + 4], 6, -145523070), h = E(h, c, u, d, o[f + 11], 10, -1120210379), d = E(d, h, c, u, o[f + 2], 15, 718787259), u = E(u, d, h, c, o[f + 9], 21, -343485551), c = c + N >>> 0, u = u + C >>> 0, d = d + Q >>> 0, h = h + Wt >>> 0;
    }
    return n.endian([c, u, d, h]);
  };
  s._ff = function(a, i, o, l, c, u, d) {
    var h = a + (i & o | ~i & l) + (c >>> 0) + d;
    return (h << u | h >>> 32 - u) + i;
  }, s._gg = function(a, i, o, l, c, u, d) {
    var h = a + (i & l | o & ~l) + (c >>> 0) + d;
    return (h << u | h >>> 32 - u) + i;
  }, s._hh = function(a, i, o, l, c, u, d) {
    var h = a + (i ^ o ^ l) + (c >>> 0) + d;
    return (h << u | h >>> 32 - u) + i;
  }, s._ii = function(a, i, o, l, c, u, d) {
    var h = a + (o ^ (i | ~l)) + (c >>> 0) + d;
    return (h << u | h >>> 32 - u) + i;
  }, s._blocksize = 16, s._digestsize = 16, hr.exports = function(a, i) {
    if (a == null)
      throw new Error("Illegal argument " + a);
    var o = n.wordsToBytes(s(a, i));
    return i && i.asBytes ? o : i && i.asString ? r.bytesToString(o) : n.bytesToHex(o);
  };
})();
var Fa = hr.exports;
const Wa = /* @__PURE__ */ Nr(Fa), Ra = /^[v^~<>=]*?(\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+))?(?:-([\da-z\-]+(?:\.[\da-z\-]+)*))?(?:\+[\da-z\-]+(?:\.[\da-z\-]+)*)?)?)?$/i, Ue = (n) => {
  if (typeof n != "string")
    throw new TypeError("Invalid argument expected string");
  const t = n.match(Ra);
  if (!t)
    throw new Error(`Invalid argument not valid semver ('${n}' received)`);
  return t.shift(), t;
}, Le = (n) => n === "*" || n === "x" || n === "X", Ne = (n) => {
  const t = parseInt(n, 10);
  return isNaN(t) ? n : t;
}, Ja = (n, t) => typeof n != typeof t ? [String(n), String(t)] : [n, t], $a = (n, t) => {
  if (Le(n) || Le(t))
    return 0;
  const [e, r] = Ja(Ne(n), Ne(t));
  return e > r ? 1 : e < r ? -1 : 0;
}, je = (n, t) => {
  for (let e = 0; e < Math.max(n.length, t.length); e++) {
    const r = $a(n[e] || "0", t[e] || "0");
    if (r !== 0)
      return r;
  }
  return 0;
}, Ha = (n, t) => {
  const e = Ue(n), r = Ue(t), s = e.pop(), a = r.pop(), i = je(e, r);
  return i !== 0 ? i : s && a ? je(s.split("."), a.split(".")) : s || a ? s ? -1 : 1 : 0;
}, Fe = (n, t, e) => {
  Ba(e);
  const r = Ha(n, t);
  return gr[e].includes(r);
}, gr = {
  ">": [1],
  ">=": [0, 1],
  "=": [0],
  "<=": [-1, 0],
  "<": [-1],
  "!=": [-1, 1]
}, We = Object.keys(gr), Ba = (n) => {
  if (typeof n != "string")
    throw new TypeError(`Invalid operator type, expected string but got ${typeof n}`);
  if (We.indexOf(n) === -1)
    throw new Error(`Invalid operator, expected one of ${We.join("|")}`);
};
class wr {
  /**
   * Constructor
   * @param options Flush options
   */
  constructor(t) {
    /**
     * Flush options
     */
    m(this, "options");
    this.options = t;
  }
  /**
   * Perform the flush check
   */
  async perform() {
    if (this.options.type.includes("version")) {
      const t = S.get("version");
      if (!t || Fe(y.VERSION, t, ">")) {
        const e = y.VERSION.split(".")[1], r = t == null ? void 0 : t.split(".")[1];
        if (r && Fe(e, r, ">")) {
          await this.flush(), S.set("version", y.VERSION);
          return;
        } else
          S.set("version", y.VERSION);
      }
    }
    if (this.options.type.includes("interval") && this.options.interval) {
      const t = S.get("lastFlush");
      if (!t)
        S.set("lastFlush", Date.now().toString());
      else if (Math.floor((Date.now() - parseInt(t)) / 864e5) >= this.options.interval) {
        await this.flush(), S.set("lastFlush", Date.now().toString()), S.set("version", y.VERSION);
        return;
      }
    }
    if (this.options.type.includes("size") && this.options.size && navigator.storage && navigator.storage.estimate)
      try {
        const t = await navigator.storage.estimate();
        if (t.usage && Math.floor(t.usage / 1e6) >= this.options.size) {
          await this.flush(), S.set("version", y.VERSION);
          return;
        }
      } catch (t) {
        console.error("Error getting storage estimate:", t.message);
      }
    if (this.options.type.includes("model")) {
      const t = await indexedDB.databases(), e = [
        ...t.filter((a) => {
          var i;
          return (i = a.name) == null ? void 0 : i.startsWith("bdt");
        }).map((a) => a.name),
        ...S.getDatabases()
      ].filter((a, i, o) => !["_Model", "_Project", "0BAUsers"].includes(a) && o.findIndex((l) => l === a) === i), r = [
        "_sort",
        "_objectpermission",
        "_modified",
        "hasuserpermissions",
        "haslogs",
        "hasprojects",
        "allowedit",
        "allowdelete",
        "defaultobjectpermission",
        "hassort",
        "hasexpiration",
        "haspublishingdate",
        "modelpermission"
      ], s = t.find((a) => a.name === "_Model") ? await ht("_Model", 1) : null;
      if (s) {
        for (const a of e)
          try {
            const i = (JSON.parse(S.get("model." + a) || "null") ?? {}).object;
            if (i) {
              const o = await s.get("objects", a);
              o && (!r.every((l) => i[l] === o[l]) || !Object.keys(i.attributes ?? []).every((l) => {
                var c, u, d, h, f, g, _, v;
                return (
                  // Check single enum and many enum attributes
                  i.attributes[l].type === "enum" || Array.isArray(i.attributes[l].type) && i.attributes[l].type[0] === "enum" ? (Array.isArray(i.attributes[l].type) ? (u = (c = o.attributes) == null ? void 0 : c[l]) == null ? void 0 : u.type[0] : (h = (d = o.attributes) == null ? void 0 : d[l]) == null ? void 0 : h.type) === "enum" && (i.attributes[l].options ?? []).every((E, N) => {
                    var C, Q;
                    return E === ((Q = (C = o.attributes) == null ? void 0 : C[l]) == null ? void 0 : Q.options[N]);
                  }) : Array.isArray(i.attributes[l].type) ? i.attributes[l].type[0] === ((g = (f = o.attributes) == null ? void 0 : f[l]) == null ? void 0 : g.type[0]) : i.attributes[l].type === ((v = (_ = o.attributes) == null ? void 0 : _[l]) == null ? void 0 : v.type)
                );
              })) && await s.delete("objects", a);
            }
          } catch (i) {
            console.error(`Error flushing "${a}" model:`, i.message);
          }
        s.close();
      }
    }
  }
  /**
   * Deletes local databases and any other footprints generated by library.
   */
  async flush() {
    const t = await indexedDB.databases(), e = [
      ...t.filter((s) => {
        var a;
        return (a = s.name) == null ? void 0 : a.startsWith("bdt");
      }).map((s) => s.name),
      ...S.getDatabases(),
      "_Model",
      "_Project",
      "0BAUsers",
      "db_master"
    ].filter((s, a, i) => i.findIndex((o) => o === s) === a);
    for (const s of e)
      await oe(s);
    const r = t.find((s) => s.name === D.name) ? await ht(D.name, 1) : null;
    r && (await r.clear(D.store), r.close()), S.clear();
  }
  /**
   * Updates model cache in local storage
   */
  static modelCacheUpdate(t, e) {
    if (y.options.flush.type.includes("model") && y.options.flush.modelCacheTTL && t && e !== null && typeof e == "object" && Object.hasOwn(e, "_blitzID"))
      try {
        const r = Date.now(), s = "model." + t.getName(), a = JSON.parse(S.get(s) || "null");
        (!a || r - a.lastFetchedAt >= y.options.flush.modelCacheTTL * 1e3) && S.set(
          s,
          JSON.stringify({
            lastFetchedAt: r,
            object: e
          })
        );
      } catch (r) {
        console.error("Error updating model cache:", r.message);
      }
  }
}
class it {
  constructor() {
    /**
     * clusters to make list call.
     */
    m(this, "_clusters");
    /**
     * Urls to make list call.
     */
    m(this, "_urls");
    /**
     * Model to be listed.
     */
    m(this, "_model");
    /**
     * Query parameters.
     */
    m(this, "_query");
    /**
     * Whether to return raw data or not, defaults to false.
     */
    m(this, "_raw", !1);
    /**
     * Whether to forcefully send http request.
     */
    m(this, "_forceHttp", !1);
    /**
     * Whether to forcefully use local results.
     */
    m(this, "_forceLocal", !1);
    /**
     * Whether to forcefully use local results if found on the cache type.
     */
    m(this, "_skipCacheUpdateIfFound", !1);
    /**
     * Object to be fetched.
     */
    m(this, "_get");
    /**
     * Get call query.
     */
    m(this, "_getQuery");
    /**
     * Abort signal.
     */
    m(this, "_signal");
  }
  /**
   * Creates a new list call.
   */
  static create() {
    return new it();
  }
  /**
   * Sets the model to be listed.
   *
   * @param model Model to be listed.
   */
  model(t) {
    return this._model = t, this;
  }
  /**
   * Sets the clusters to make list call.
   *
   * @param clusters clusters to make list call.
   */
  clusters(t) {
    return this._clusters = t, this;
  }
  /**
   * Sets the abort signal.
   * @param signal
   */
  signal(t) {
    return this._signal = t, this;
  }
  /**
   * Sets the URLs to make list call.
   *
   * @param urls URLs to make list call.
   */
  urls(t) {
    return this._urls = t, this;
  }
  /**
   * Sets the query parameters.
   *
   * @param query Query parameters.
   */
  query(t) {
    var r, s, a;
    this._query = t;
    const e = (r = this._model) == null ? void 0 : r.getAttributesDetails();
    if ((s = this._query) != null && s.conditions)
      for (const i of this._query.conditions) {
        const o = i[0], l = (e == null ? void 0 : e[o]) ?? ((a = this._model) == null ? void 0 : a.getUserAttributeDetails(o)) ?? void 0;
        i.length === 3 && l !== void 0 && typeof l.type == "string" && (i[1] === "IN" && Array.isArray(i[2]) ? i[2] = i[2].map((c) => H.createType(
          o,
          l.type,
          c
        ).serialize()) : i[2] = H.createType(
          o,
          l.type,
          i[2]
        ).serialize());
      }
    return this;
  }
  /**
   * Sets whether to return raw data or not.
   *
   * @param raw Whether to return raw data or not.
   */
  raw(t) {
    return this._raw = t, this;
  }
  /**
   * Whether to force http request
   *
   * @param forceHttp
   */
  forceHttp(t) {
    return this._forceHttp = t, this;
  }
  /**
   * Whether to force local results
   *
   * @param forceLocal
   */
  forceLocal(t) {
    return this._forceLocal = t, this;
  }
  /**
   * Whether to force local results if found on the cache type.
   *
   * @param skipCacheUpdateIfFound
   */
  skipCacheUpdateIfFound(t) {
    return this._skipCacheUpdateIfFound = t, this;
  }
  /**
   * Object to be fetched.
   *
   * @param blitzID Id of the object.
   */
  get(t) {
    return this._get = t, this;
  }
  /**
   * Sets the get call query parameters.
   *
   * @param query Query parameters.
   */
  getQuery(t) {
    return this._getQuery = t, this;
  }
  /**
   * Converts the passed raw objects to BDObject instances.
   * 
   * @param objects Raw objects to be converted.
   * @returns List of BDObject instances.
   */
  convertObjects(t) {
    var r;
    const e = [];
    for (const s of t)
      e.push(dr.create(((r = this._query) == null ? void 0 : r.returnType) ?? ut, this._model, s));
    return e;
  }
  /**
   * Performs the list call.
   */
  async perform() {
    var e;
    let t = !this.hasLocalDatabase() || this._forceHttp && !this._forceLocal ? [] : await this.performIndexedDb();
    if (!this._forceLocal) {
      if (!this.hasLocalDatabase())
        t = await this.filterQueuedObjects(this.mergeObjects(await this.performHttp())), t = await this.filterExpiredObjects(t);
      else if (y.options.sync.level === "full" && t.length === 0 && (this._forceHttp || !S.hasSyncCursors(this._model.getName())))
        t = await this.filterQueuedObjects(this.mergeObjects(await this.performHttp())), t = await this.filterExpiredObjects(t), t.length > 0 && await this._model.idbClient().save(t);
      else if (y.options.sync.level === "cache") {
        const r = this._skipCacheUpdateIfFound && t.length > 0 ? !1 : this.shouldSendHttpRequest();
        if (r || t.length === 0) {
          const s = t, a = await this.filterQueuedObjects(this.mergeObjects(await this.performHttp()));
          t = await this.filterExpiredObjects(a), t.length > 0 && await this._model.idbClient().save(t), await this.settleLocalRows(s, t), r && ((e = this._model) == null ? void 0 : e.getName()) !== "_Model" && S.setListCallLastTimeStamp(this.hash(), (/* @__PURE__ */ new Date()).getTime());
        }
      }
    }
    return this._raw ? t : this.convertObjects(t);
  }
  /**
   * The server's answer is the list now, an empty one too. A local row it
   * left out is evicted, so the next read inside the ttl cannot serve it
   * again (a cache miss only costs a fetch). A row with a queued write is
   * kept, and a pending add stays in the answer: the server has not seen it yet.
   */
  async settleLocalRows(t, e) {
    const r = new Set(e.map((a) => a._blitzID)), s = t.some((a) => !r.has(a._blitzID)) ? await y.queue.getJobs() : [];
    for (const a of t) {
      if (r.has(a._blitzID))
        continue;
      const i = s.filter((o) => o.transaction.blitzID === a._blitzID);
      i.some((o) => o.transaction.action === M.Add && o.status === p.Pending) ? e.push(a) : i.length === 0 && await this._model.idbClient().delete(a._blitzID);
    }
  }
  /**
   * Performs the list call using a signal.
   * 
   * @returns Signal that will emit the results.
   */
  performSignal(t = !1) {
    const e = new ft(null);
    return (async () => {
      var a;
      let r = [];
      const s = (i, o) => {
        r = i, e.set(o ? { items: i, nextSource: o } : { items: i });
      };
      try {
        if (!t) {
          s(await this.perform());
          return;
        }
        const i = await this.performMemory();
        if (s(
          this._raw ? i : this.convertObjects(i),
          this.hasLocalDatabase() ? "local database" : "server"
        ), this.hasLocalDatabase()) {
          const l = await this.performIndexedDb();
          s(
            this._raw ? l : this.convertObjects(l),
            "server"
          );
        }
        let o = await this.filterQueuedObjects(this.mergeObjects(await this.performHttp()));
        o = await this.filterExpiredObjects(o), o.length > 0 && this.hasLocalDatabase() && await ((a = this._model) == null ? void 0 : a.idbClient().save(o)), s(this._raw ? o : this.convertObjects(o));
      } catch (i) {
        console.error("List call failed:", (i == null ? void 0 : i.stack) ?? (i == null ? void 0 : i.message) ?? i), e.set({ items: r });
      }
    })(), e;
  }
  /**
   * Fetches, filters and saves one snapshot page. The pagination signal is
   * the UNFILTERED server page: a page the queue/expiry filters shrank
   * must not read as "server ran dry", or the snapshot silently truncates.
   */
  async performSnapshotPage() {
    const t = this.mergeObjects(await this.performHttp());
    let e = await this.filterQueuedObjects(t);
    e = await this.filterExpiredObjects(e), e.length > 0 && await this._model.idbClient().save(e);
    const r = t.map((s) => Number(s._localID)).filter(Number.isFinite);
    return {
      fetched: t.length,
      lastLocalID: r.length > 0 ? Math.max(...r) : null
    };
  }
  /**
   * Performs the HTTP list call.
   */
  async performHttp() {
    return (await Promise.all(
      this._urls ? this._urls.map((e) => this.performSingleUrlHttp(e)) : this._clusters.map((e) => this.performSingleClusterHttp(e))
    )).flat();
  }
  /**
   * Performs the single HTTP list call for the given cluster.
   *
   * @param cluster cluster to make list call.
   */
  async performSingleClusterHttp(t) {
    var r, s;
    const e = {};
    for (let a = 0; a < t.options.readURL.length; a++) {
      const i = t.getNextReadURL();
      try {
        let o = [];
        if (this._get)
          o = await st.get({
            baseUrl: i,
            modelName: this._model.getName(),
            blitzID: this._get,
            query: this._getQuery
          }, this._signal);
        else {
          const l = await st.list({
            endpoint: {
              baseUrl: i,
              modelName: this._model.getName(),
              query: this._query
            }
          }, this._signal);
          o = l.items || [], wr.modelCacheUpdate(this._model, l.model);
        }
        for (const l of o) {
          l._clusters = [t.name], l._editURLs = JSON.parse(JSON.stringify(t.options.readURL));
          for (const c in l)
            if (c.endsWith("_fk") && l[c] !== null && typeof l[c] == "object" && l[c]._blitzID) {
              const u = (s = (r = this._model) == null ? void 0 : r.getAttributeDetails(c)) == null ? void 0 : s.type;
              if (u && u !== "_Model" && this.hasLocalDatabase()) {
                const d = await V.get(u);
                d && !await this.hasQueuedWrite(l[c]._blitzID) && await d.idbClient().save([l[c]], !0);
              }
              l[c] = l[c]._blitzID;
            } else
              c.endsWith("_mtm") && Array.isArray(l[c]) && (l[c] = l[c].map((u, d) => ({
                _blitzID: typeof u == "string" ? u : u._blitzID,
                _mtmSort: typeof u == "string" ? (l[c].length - d) * 15 : u._mtmSort
              })));
        }
        return o;
      } catch (o) {
        e[i] = (o == null ? void 0 : o.stack) ?? (o == null ? void 0 : o.message) ?? o;
      }
    }
    throw new Error(`All read URLs failed for cluster "${t.name}". Errors: ${JSON.stringify(e)}`);
  }
  /**
   * Performs the single HTTP list call for the given URL.
   *
   * @param url URL to make list call.
   */
  async performSingleUrlHttp(t) {
    return ((await st.list({ fullUrl: t }, this._signal)).items || []).map((r) => (r.cluster = [], r._editURLs = [t], r));
  }
  /**
   * Performs IndexedDB list call.
   */
  async performIndexedDb() {
    var r, s;
    const t = this._model.idbClient();
    if (this._get)
      return await t.query({
        conditions: [["_blitzID", "=", this._get]],
        limit: 1,
        var: (r = this._getQuery) == null ? void 0 : r.var,
        manyToMany: (s = this._getQuery) == null ? void 0 : s.manyToMany
      });
    const e = this._urls ? this._urls.map((a) => ne.extractConditions(a)).flat() : this._query.conditions;
    return await t.query({ ...this._query, conditions: e });
  }
  /**
   * Performs memory list call.
   */
  async performMemory() {
    var r, s;
    const t = this._model.memoryClient();
    if (this._get)
      return await t.query({
        conditions: [["_blitzID", "=", this._get]],
        limit: 1,
        var: (r = this._getQuery) == null ? void 0 : r.var,
        manyToMany: (s = this._getQuery) == null ? void 0 : s.manyToMany
      });
    const e = this._urls ? this._urls.map((a) => ne.extractConditions(a)).flat() : this._query.conditions;
    return await t.query({ ...this._query, conditions: e });
  }
  /**
   * Whether a write to the object is still waiting in the queue.
   */
  async hasQueuedWrite(t) {
    return (await y.queue.getJobsForObject(t)).some((r) => r.status === p.Pending);
  }
  /**
   * Merges objects that has the same blitzID.
   *
   * @param objects Objects to be merged.
   *
   * @returns Merged objects.
   */
  mergeObjects(t) {
    const e = [];
    for (const r of t) {
      const s = e.find((a) => a._blitzID === r._blitzID);
      s ? (s._clusters = [...s._clusters, ...r._clusters].filter((a, i, o) => o.indexOf(a) === i), s._editURLs = [...s._editURLs, ...r._editURLs].filter((a, i, o) => o.indexOf(a) === i)) : e.push(r);
    }
    return e;
  }
  /**
   * Filters the objects that are in the queue to be deleted or with uncompleted edits.
   *
   * @param objects Objects to be filtered.
   * @returns Filtered objects.
   */
  async filterQueuedObjects(t) {
    var s;
    const e = await y.queue.getJobs(), r = [];
    for (const a of t)
      if (!e.find((i) => i.transaction.action === M.Delete && i.transaction.blitzID === a._blitzID))
        if (!e.find((i) => i.transaction.action === M.Edit && i.transaction.blitzID === a._blitzID && i.status === p.Pending))
          r.push(a);
        else {
          const i = await ((s = this._model) == null ? void 0 : s.get({ blitzID: a._blitzID, raw: !0, forceLocal: !0 }));
          i ? r.push(i) : r.push(a);
        }
    return r;
  }
  /**
   * Filters out and deletes the objects that have expired.
   *
   * @param objects Objects to be filtered.
   * @returns Filtered objects.
   */
  async filterExpiredObjects(t) {
    var s;
    const e = S.getCurrentUser();
    if (!e || !e.id)
      return t;
    const r = [];
    try {
      for (const a of t) {
        if (
          // Check if expiration date is present and valid
          typeof a._expiration == "string" && a._expiration !== "" && a._expiration !== "0000-00-00 00:00:00" && // Check if user is not the owner
          e.id !== a._userID
        ) {
          const i = Date.now(), o = new Date(a._expiration).getTime();
          if (i > o) {
            this.hasLocalDatabase() && await ((s = this._model) == null ? void 0 : s.idbClient().delete(a._blitzID));
            continue;
          }
        }
        r.push(a);
      }
    } catch (a) {
      return console.error("Error handling expired objects:", a.stack), t;
    }
    return r;
  }
  /**
   * Whether the current sync level keeps a local database.
   *
   * In the none level list calls must never read from or write to IndexedDB.
   */
  hasLocalDatabase() {
    return y.options.sync.level !== "none";
  }
  /**
   * Decides whether to send http request or not.
   */
  shouldSendHttpRequest() {
    var e;
    if (y.options.sync.level !== "cache" || ((e = this._model) == null ? void 0 : e.getName()) === "_Model")
      return !1;
    const t = S.getListCallLastTimeStamp(this.hash());
    return t ? (/* @__PURE__ */ new Date()).getTime() - t > y.options.sync.ttl : !0;
  }
  /**
   * Calculates hash of the call.
   */
  hash() {
    var t, e;
    return Wa(JSON.stringify({
      clusters: ((t = this._clusters) == null ? void 0 : t.map((r) => r.name)) ?? [],
      blitzId: this._get,
      urls: this._urls,
      modelName: (e = this._model) == null ? void 0 : e.getName(),
      listQuery: this._query,
      getQuery: this._getQuery
    }));
  }
}
class br extends ut {
  /**
   * Returns the model of the custom object.
   */
  static async model() {
    if (typeof this.modelName != "string")
      throw new Error(`${this.name}.modelName is not a string, please provide a valid model name.`);
    const t = this.modelName === "_Model" ? K() : await K().get(this.modelName);
    return t.setReturnType(this), t;
  }
  /**
   * Finds an object by given blitz ID.
   *
   * @param blitzID - Blitz ID of the object.
   */
  static async get(t) {
    return (await this.model()).get(t);
  }
  /**
   * Checks whether the object exists in or not.
   *
   * @param blitzID - Blitz ID of the object.
   */
  static async exists(t) {
    return (await this.model()).exists(t);
  }
  /**
   * Performs an `add` transaction.
   *
   * @param data Data to be added.
   * @param clusterNames [Optional] Clusters to add the object.
   */
  static async add(t, e = []) {
    return (await this.model()).add(t, e);
  }
  /**
   * Performs a `list` call with given parameters.
   *
   * @param options Parameters for the list call.
   *
   * @see {@link https://enunt.notion.site/List-Get-c8fd7cebc60f4c75a8039dca4dc639fe}
   */
  static async list(t = {}) {
    return (await this.model()).list(t);
  }
}
/**
 * Name of the model for custom object.
 */
m(br, "modelName");
const dt = class dt {
  /**
   * Creates a new syncer.
   */
  static create() {
    return new dt();
  }
  /**
   * Runs the synchronization process.
   *
   * Every synced model advances independently: one cursor per
   * (model, cluster, stream), so a truncated page in one model can never
   * move another model's cursor past unfetched transactions, and one
   * failing model never blocks the rest.
   */
  async run(t, e) {
    if (navigator.onLine) {
      if (t)
        return this.syncModel(t, e);
      for (const r of await this.syncableModels())
        try {
          await this.syncModel(r, e);
        } catch (s) {
          console.error(`Sync failed for model "${r}":`, (s == null ? void 0 : s.stack) ?? (s == null ? void 0 : s.message) ?? s);
        }
    }
  }
  /**
   * Runs the synchronization at the given interval, forever.
   *
   * When the Web Locks API is available only one tab holds the sync lock;
   * the others wait and take over if the leader closes.
   */
  async runAtInterval(t) {
    var e;
    return typeof navigator < "u" && ((e = navigator.locks) != null && e.request) && await navigator.locks.request("BlitzData.sync", () => this.loop(t)), this.loop(t);
  }
  /**
   * The interval loop. Fire-and-forget: one failed run (network, storage,
   * a throwing subscriber) must not end syncing for good.
   */
  async loop(t) {
    for (; ; ) {
      await Ye(t);
      try {
        await this.run();
      } catch (e) {
        console.error("Sync run failed:", (e == null ? void 0 : e.stack) ?? (e == null ? void 0 : e.message) ?? e);
      }
    }
  }
  /**
   * Models the sync keeps local: the configured list, or every model whose
   * schema enables logging — the server can only serve change-logs for
   * models with `haslogs` and `hasuserpermissions`.
   */
  async syncableModels() {
    return y.options.sync.models ? y.options.sync.models : [
      "_Project",
      ...(await V.list()).filter((t) => {
        var e, r;
        return this.isTruthyFlag((e = t.haslogs) == null ? void 0 : e.value) && this.isTruthyFlag((r = t.hasuserpermissions) == null ? void 0 : r.value);
      }).map((t) => t.getName()).filter((t) => t.startsWith("bdt") && !["bdt24prszej_appfiles", "bdt24prszej_apps"].includes(t))
    ];
  }
  /**
   * Syncs a single model: bootstrap it if it has no cursors yet, then
   * tail every (cluster, stream) change-log from its own cursor.
   */
  async syncModel(t, e) {
    const r = y.clusterManager.toArray(), s = e === "delete" ? ["delete"] : ["all", "delete"];
    await this.bootstrap(t, r, s);
    for (const a of r)
      for (const i of s)
        await this.syncStream(a, t, i);
    S.setLastSyncRunAt(Math.floor(Date.now() / 1e3), t);
  }
  /**
   * First contact with a model. Cursors are peeked BEFORE the snapshot
   * downloads, so any change landing during the snapshot stays ahead of
   * the cursor and is replayed by the tail — never skipped. They are
   * persisted only AFTER the snapshot succeeds: a failed snapshot must
   * leave the model un-bootstrapped (retried next run), never
   * trusted-but-empty.
   */
  async bootstrap(t, e, r) {
    const s = [];
    for (const i of e)
      for (const o of r)
        S.getSyncCursor(t, i.name, o) === null && s.push({ cluster: i, stream: o });
    if (s.length === 0)
      return;
    const a = [];
    for (const { cluster: i, stream: o } of s)
      a.push({ cluster: i, stream: o, cursor: await this.peek(i, t, o) });
    y.options.sync.level === "full" && await this.snapshot(t);
    for (const { cluster: i, stream: o, cursor: l } of a)
      S.setSyncCursor(t, i.name, o, l);
  }
  /**
   * Asks the server for the latest change-log position (`peek=1`) without
   * fetching any transactions. Servers predating the parameter ignore it
   * and answer with their oldest page instead — the tail then replays
   * history, which converges to the same state, just slower.
   *
   * A position of 0 is never trusted: the server answers 0 for an empty
   * log but also when its peek gate (a `_Model~users` row) refuses a user
   * the log query itself would serve. Tail from now instead of replaying
   * the whole history.
   */
  async peek(t, e, r) {
    const { lastTimestamp: s, lastLogID: a } = await this.fetchLogs(t, e, r, null, !0);
    return typeof s == "number" && s > 0 ? { timestamp: s, logID: a } : { timestamp: Math.floor(Date.now() / 1e3), logID: a };
  }
  /**
   * Downloads the model's complete current state into the local database.
   *
   * The store is cleared first — it is about to become the source of
   * truth, and rows the server deleted long ago must not survive as
   * ghosts. Objects with queued offline adds reappear once the queue
   * posts them and the tail pulls them back.
   *
   * Pages by keyset on `_localID` (unique, in every response, one
   * sequence per cluster). The loop ends only when the server returns a
   * short page — that short page is the completeness proof.
   */
  async snapshot(t) {
    const e = await V.get(t);
    if (e) {
      await e.idbClient().clear();
      for (const r of y.clusterManager.toArray()) {
        let s = null;
        for (; ; ) {
          const { fetched: a, lastLocalID: i } = await it.create().model(e).clusters([r]).raw(!0).query({
            limit: dt.SNAPSHOT_PAGE_SIZE,
            customSort: "_localID",
            customSortDirection: "ASC",
            ...s !== null ? { pagination: s } : {}
          }).performSnapshotPage();
          if (a < dt.SNAPSHOT_PAGE_SIZE)
            break;
          if (i === null || i === s) {
            console.error(`Snapshot of "${t}" cannot page further (no advancing _localID); it may be incomplete.`);
            break;
          }
          s = i;
        }
      }
    }
  }
  /**
   * Tails one change-log stream: fetch a page, apply it, advance the
   * cursor, repeat until the server echoes the cursor back. With the
   * composite cursor pages resume exactly after (timestamp, logID); on
   * servers without it, rows sharing the boundary timestamp wait for the
   * next transaction to move the clock — degraded, never wedged.
   */
  async syncStream(t, e, r) {
    let s = S.getSyncCursor(e, t.name, r) ?? { timestamp: 0, logID: null };
    for (; ; ) {
      const { transactions: a, lastTimestamp: i, lastLogID: o } = await this.fetchLogs(t, e, r, s);
      if (await this.apply(a), typeof i != "number")
        break;
      const l = { timestamp: i, logID: o }, c = l.timestamp !== s.timestamp || l.logID !== s.logID;
      if (S.setSyncCursor(e, t.name, r, l), s = l, !c || a.length === 0)
        break;
    }
  }
  /**
   * Fetches one page of a model's change-log from one cluster.
   */
  async fetchLogs(t, e, r, s, a = !1) {
    const i = await st.listLogs({
      baseUrl: t.getNextReadURL(),
      model: e,
      type: r === "delete" ? "delete" : void 0,
      query: a ? { peek: !0 } : {
        from: (s == null ? void 0 : s.timestamp) ?? 0,
        ...(s == null ? void 0 : s.logID) != null ? { afterLog: s.logID } : {}
      }
    });
    return {
      transactions: (i.transactions ?? []).filter((l) => typeof l == "object" && !Array.isArray(l) && l !== null && typeof l.hash == "string").filter((l, c, u) => u.findIndex((d) => d.hash === l.hash) === c),
      lastTimestamp: i.lastTimestamp ?? null,
      lastLogID: typeof i.lastLogID == "number" ? i.lastLogID : null
    };
  }
  /**
   * Applies fetched transactions to the local database and, with
   * `sync.live`, surfaces them to running subscribers.
   */
  async apply(t) {
    var i;
    const e = await this.withoutEvaluated(t);
    if (e.length === 0)
      return;
    const r = jt.create();
    await r.putMultiple(e);
    const s = (await r.all()).map((o) => W.fromObject(o)), a = await q.create().run(s);
    if (y.options.sync.live === !0) {
      const o = /* @__PURE__ */ new Set();
      for (const l of s)
        if (((i = a.get(l.hash)) == null ? void 0 : i.status) === x.Success)
          try {
            const c = await V.get(l.model), u = `${l.model}:${l.blitzID}:${l.action}`;
            await (c == null ? void 0 : c.memoryClient().applyTransaction(l, !o.has(u))), o.add(u);
          } catch (c) {
            console.error(`Live emission failed for transaction ${l.hash}:`, (c == null ? void 0 : c.stack) ?? (c == null ? void 0 : c.message) ?? c);
          }
    }
  }
  /**
   * Drops transactions already in the evaluated ledger: own writes echoed
   * back by the server, rows another cluster already delivered, and
   * boundary rows re-served by servers without the composite cursor.
   */
  async withoutEvaluated(t) {
    if (t.length === 0)
      return t;
    const e = await new X().openConnection(), r = [];
    for (const s of t)
      await e.get("evaluated_transactions", s.hash) === void 0 && r.push(s);
    return e.close(), r;
  }
  /**
   * Model schema flags arrive as '1'/1/true depending on server version.
   */
  isTruthyFlag(t) {
    return t === !0 || t === 1 || t === "1";
  }
};
/**
 * Rows per snapshot page. Also the truncation detector: a full page
 * means the server may have more.
 */
m(dt, "SNAPSHOT_PAGE_SIZE", 1e3);
let _t = dt;
const bt = (n) => n.trim().toLocaleLowerCase(), qa = (n, t) => bt(n) === bt(t), Ya = 1e3, Mt = /* @__PURE__ */ new Map();
class he {
  /**
   * @param conditions Narrow the values offered, e.g. `[['_userID', '=', '@me']]`
   *                   where the reader may see other users' rows.
   */
  constructor(t, e = "name", r = []) {
    this.model = t, this.attribute = e, this.conditions = r;
  }
  /** The source of an attribute definition, or null when it names none. */
  static of(t, e = []) {
    return (Array.isArray(t == null ? void 0 : t.type) ? t == null ? void 0 : t.type[0] : t == null ? void 0 : t.type) !== "tag" || !(t != null && t.model) ? null : new he(t.model, t.attribute || "name", e);
  }
  /**
   * The values the reader may see, from the newest 1000 source rows: trimmed,
   * one per spelling ignoring case, sorted. Empty when the source model
   * cannot be read.
   */
  async values() {
    const t = await this.sourceModel();
    if (!t)
      return [];
    const e = /* @__PURE__ */ new Map(), r = (i) => {
      typeof i != "string" || !i.trim() || e.has(bt(i)) || e.set(bt(i), i.trim());
    }, s = this.conditions.length ? { conditions: this.conditions } : {};
    for (const i of await t.list({ raw: !0, limit: Ya, ...s }))
      r(i[this.attribute]);
    const a = Mt.get(this.key()) ?? /* @__PURE__ */ new Set();
    for (const i of a)
      e.has(bt(i)) ? a.delete(i) : r(i);
    return [...e.values()].sort((i, o) => i.localeCompare(o, void 0, { sensitivity: "base" }));
  }
  /**
   * Makes sure `text` is a value, adding a source row when no value matches
   * it ignoring case, and returns the spelling to store on the tagged row:
   * the existing one when there is a match. The tagged row is the caller's
   * write.
   */
  async ensure(t) {
    const e = t.trim();
    if (!e)
      return "";
    const r = (await this.values()).find((a) => qa(a, e));
    if (r !== void 0)
      return r;
    const s = await this.sourceModel();
    if (!s)
      throw new Error(`Tag source model ${this.model} is not available.`);
    return await s.add({ [this.attribute]: e }), Mt.has(this.key()) || Mt.set(this.key(), /* @__PURE__ */ new Set()), Mt.get(this.key()).add(e), e;
  }
  key() {
    return `${this.model}.${this.attribute}`;
  }
  // `_Model.get` throws for a model the reader may not see.
  async sourceModel() {
    try {
      return await K().get(this.model);
    } catch {
      return null;
    }
  }
}
const Va = /* @__PURE__ */ new Set([
  "blitzID",
  "raw",
  "clusters",
  "forceHttp",
  "forceLocal",
  "skipCacheUpdateIfFound",
  "signal",
  "query"
]), Qa = "BDModel.get() fetches by object ID. For queries use model.list({ conditions: ... }).";
function Xa(n) {
  if (typeof n == "string")
    return { blitzID: n };
  if (!(n !== null && typeof n == "object" && [Object.prototype, null].includes(Object.getPrototypeOf(n))) || typeof n.blitzID != "string" || Object.keys(n).some((e) => !Va.has(e)))
    throw new TypeError(Qa);
  return n;
}
const Nt = class Nt extends br {
  /**
   * Constructor.
   *
   * @param options Model options.
   */
  constructor({ model: e, attributes: r }) {
    super({ model: e, attributes: r });
    /**
     * Cluster manager instance.
     */
    m(this, "clusterManager");
    /**
     * Last transaction hash.
     */
    m(this, "lastTransactionHash", null);
    /**
     * Return object of the model.
     */
    m(this, "returnType", ut);
    this.clusterManager = y.clusterManager;
  }
  /**
   * Returns the model indexed db connection.
   */
  idbClient() {
    return new Hr(this);
  }
  /**
   * Returns the model memory connection.
   */
  memoryClient() {
    return new Pt(this);
  }
  /**
   * Returns the model name.
   */
  getName() {
    return this._attributes._blitzID.value;
  }
  /**
   * Returns the last transaction hash.
   */
  getLastTransactionHash() {
    return this.lastTransactionHash;
  }
  /**
   * Sets the last transaction hash.
   */
  setLastTransactionHash(e) {
    this.lastTransactionHash = e;
  }
  /**
   * Sets the return type of the model.
   */
  setReturnType(e) {
    this.returnType = e;
  }
  /**
   * Checks whether the object exists in or not.
   *
   * @param blitzID - Blitz ID of the object.
   */
  async exists(e) {
    return !!await this.get(e);
  }
  /**
   * Performs an `add` transaction.
   *
   * @param data Data to be added.
   * @param clusterNames [Optional] Clusters to add the object.
   */
  async add(e, r = []) {
    const s = this.resolveClusters(r), a = this.getAttributesDetails() ?? {}, i = new W({
      action: "add",
      data: H.serialize(H.unserialize(a, e)),
      model: this.getName()
    }), o = await y.getCurrentUser(), l = i.clone();
    l.data = { ...l.data, _userID: o.id };
    const c = await q.create().run([l]);
    if (c[0].status !== x.Success)
      throw new Error(c[0].message ?? "Unknown Error! Please try again.");
    for (const u of s)
      for (const d of u.options.addURL)
        await y.queue.addJob(d, i.toObject());
    return this.memoryClient().emit(i), this.setLastTransactionHash(i.hash), dr.create(this.returnType, this, l.data);
  }
  /**
   * Finds an object by given blitz ID.
   *
   * @param blitzID - Blitz ID of the object.
   */
  async get(e) {
    const r = Xa(e), a = (await it.create().model(this).clusters(this.resolveClusters(r.clusters ?? [])).raw(r.raw ?? !1).get(r.blitzID).query({
      returnType: this.returnType ?? ut
    }).forceHttp(r.forceHttp ?? !1).forceLocal(r.forceLocal ?? !1).skipCacheUpdateIfFound(r.skipCacheUpdateIfFound ?? !1).signal(r.signal).getQuery(r.query ?? {}).perform())[0] ?? null;
    if (!a && this.returnType === Nt)
      throw new Error(`Model with blitzID "${e}" does not exists or you don't have enough permission to view it.`);
    return a || null;
  }
  /**
   * Performs a `list` call with given parameters.
   *
   * @param options Parameters for the list call.
   *
   * @see {@link https://enunt.notion.site/List-Get-c8fd7cebc60f4c75a8039dca4dc639fe}
   */
  async list(e = {}) {
    return await it.create().model(this).clusters(this.resolveClusters(e.clusters ?? [])).raw(e.raw ?? !1).query({
      conditions: e.conditions,
      limit: e.limit,
      returnType: e.returnType ?? this.returnType ?? ut,
      customSort: e.customSort,
      customSortDirection: e.customSortDirection,
      pagination: e.pagination,
      var: e.var,
      manyToMany: e.manyToMany
    }).forceHttp(e.forceHttp ?? !1).forceLocal(e.forceLocal ?? !1).skipCacheUpdateIfFound(e.skipCacheUpdateIfFound ?? !1).signal(e.signal).perform();
  }
  /**
   * Subscribe to a list call.
   *
   * @param options Parameters for the list call.
   * @param callback Callback to receive result updates.
   * @param sequence Enable sequence mode | Defaults to false.
   * @returns Unsubscribe function
   */
  subscribeToList(e = {}, r, s = !1) {
    const a = it.create().model(this).clusters(this.resolveClusters(e.clusters ?? [])).raw(e.raw ?? !1).query({
      conditions: e.conditions,
      limit: e.limit,
      returnType: e.returnType ?? this.returnType ?? ut,
      customSort: e.customSort,
      customSortDirection: e.customSortDirection,
      var: e.var,
      manyToMany: e.manyToMany
    }).forceHttp(e.forceHttp ?? !1).forceLocal(e.forceLocal ?? !1).skipCacheUpdateIfFound(e.skipCacheUpdateIfFound ?? !1).performSignal(s), i = a.subscribe(r, a.get() !== null), o = Pt.channel.filterPipe((l) => l.model === this.getName()).subscribe((l) => {
      if (l.action === M.Add)
        this.list({ ...e, forceLocal: !0 }).then((c) => {
          const u = e.raw ? c.findIndex((d) => d._blitzID === l.blitzID) : c.findIndex((d) => d.getAttribute("_blitzID").value === l.blitzID);
          u > -1 && a.set({
            items: c,
            update: {
              action: M.Add,
              object: c[u],
              index: u
            }
          });
        });
      else if (l.action === M.Edit) {
        const c = a.get();
        if (!c)
          return;
        const u = e.raw ? c.items.findIndex((d) => d._blitzID === l.blitzID) : c.items.findIndex((d) => d.getAttribute("_blitzID").value === l.blitzID);
        u > -1 && this.list({ ...e, forceLocal: !0 }).then((d) => {
          const h = e.raw ? d.findIndex((f) => f._blitzID === l.blitzID) : d.findIndex((f) => f.getAttribute("_blitzID").value === l.blitzID);
          a.set({
            items: d,
            update: {
              action: M.Edit,
              object: h > -1 ? d[h] : c.items[u],
              index: h > -1 ? h : u
            }
          });
        });
      } else if (l.action === M.Delete) {
        const c = a.get();
        if (!c)
          return;
        if (e.raw) {
          const u = c.items.findIndex((d) => d._blitzID === l.blitzID);
          u > -1 && a.set({
            items: c.items.filter((d) => d._blitzID !== l.blitzID),
            update: {
              action: M.Delete,
              object: c.items[u],
              index: u
            }
          });
        } else {
          const u = c.items.findIndex((d) => d.getAttribute("_blitzID").value === l.blitzID);
          u > -1 && a.set({
            items: c.items.filter((d) => d.getAttribute("_blitzID").value !== l.blitzID),
            update: {
              action: M.Delete,
              object: c.items[u],
              index: u
            }
          });
        }
      }
    });
    return () => {
      i(), o();
    };
  }
  /**
   * Syncs the model
   */
  //24-10-24 ANAS: https://app.clickup.com/9015135156/v/dc/8cng2xm-30175/8cng2xm-33435
  async sync() {
    const e = this.getName();
    if (e) {
      const r = Date.now() / 1e3, s = S.getLastSyncRunAt(e) ?? 0, a = 30;
      r - s > a && await _t.create().run(e);
    }
  }
  /**
   * Returns attribute information for all attributes.
   */
  getAttributesDetails() {
    var e;
    return ((e = this._attributes.attributes) == null ? void 0 : e.value) ?? null;
  }
  /**
   * Returns attribute information by given attribute name.
   *
   * @param name Name of the attribute to get information about.
   */
  getAttributeDetails(e) {
    var r, s;
    return ((s = (r = this._attributes.attributes) == null ? void 0 : r.value) == null ? void 0 : s[e]) ?? null;
  }
  /**
   * The model a `tag` attribute offers its values from, or null when the
   * attribute is not a tag or names no source model.
   *
   * @param name Name of the tag attribute.
   * @param conditions Narrow the values offered, e.g. to the reader's own rows.
   */
  tagSource(e, r = []) {
    return he.of(this.getAttributeDetails(e), r);
  }
  /**
   * Returns attribute information for the system attributes every object
   * carries regardless of schema (`_userID`, `_blitzID`, `_modified`, …).
   *
   * Deliberately separate from getAttributesDetails(): schema iterators
   * (add forms, grids) must not suddenly see system fields. Consumers that
   * want them (e.g. a filter form) opt in through this accessor.
   */
  getSystemAttributesDetails() {
    return Object.fromEntries(
      Object.entries(Ge).map(([e, r]) => [e, { ...r }])
    );
  }
  /**
   * Returns the model's declared per-user attributes, keyed by the name they
   * were declared under (`lastseen@u`, `reviewed`).
   *
   * A per-user attribute stores one value per object *per user*, in the
   * model's `{model}~users` sidecar rather than its own table. Deliberately
   * separate from getAttributesDetails(): the two have different storage,
   * different permissions and different read syntax, and a schema iterator
   * that mixed them would offer a per-user field where an ordinary one is
   * meant.
   */
  getUserAttributesDetails() {
    var r;
    let e = (r = this._attributes.userattributes) == null ? void 0 : r.value;
    if (typeof e == "string")
      try {
        e = JSON.parse(e);
      } catch {
        return null;
      }
    return e && typeof e == "object" ? e : null;
  }
  /**
   * Resolves a `user.`-prefixed selection name to its declaration, or null
   * when the model declares no such per-user attribute.
   *
   * Declared names are lowercased on the way in, so the lookup folds case —
   * matching the server, where a mismatch would silently select nothing
   * rather than fail.
   */
  getUserAttributeDetails(e) {
    if (typeof e != "string" || !e.startsWith(at))
      return null;
    const r = this.getUserAttributesDetails();
    if (!r)
      return null;
    const s = e.slice(at.length);
    return r[s] ?? r[s.toLowerCase()] ?? null;
  }
  /**
   * Resolves clusters by given names.
   *
   * @param clusterNames Names to resolve.
   */
  resolveClusters(e) {
    return Object.values(
      e.length === 0 ? this.clusterManager.all() : this.clusterManager.get(e)
    );
  }
  /**
   * Sets custom clusters for the model.
   *
   * @param clusters Clusters to set.
   */
  setClusters(e) {
    this.clusterManager = new $e();
    const r = se.transformClusterOptions(e);
    for (const s of Object.keys(r))
      this.clusterManager.register(s, r[s]);
  }
  /**
   * Returns the cluster manager of the model.
   */
  getClusterManager() {
    return this.clusterManager;
  }
  static async get(e) {
    return super.get(e);
  }
  static async list(e = {}) {
    return super.list(e);
  }
};
/**
 * Name of the model for custom object.
 */
m(Nt, "modelName", "_Model");
let V = Nt;
class Ka {
  //Constructor
  constructor(t) {
    //Properties
    m(this, "_db");
    this._db = t;
  }
  //Update job
  async _updateJob(t) {
    var e;
    return await ((e = this._db) == null ? void 0 : e.put(D.store, t)), t;
  }
  //Delete job — a job that no longer exists must not keep its alert mark alive
  async _deleteJob(t) {
    var e;
    await ((e = this._db) == null ? void 0 : e.delete(D.store, t.id)), y.queue.notifier.resolved(t.id);
  }
  //Get future jobs
  async _getFutureJobs(t) {
    var i;
    const e = [], r = (i = this._db) == null ? void 0 : i.transaction(D.store, "readonly").store, s = IDBKeyRange.lowerBound(t.createdAt, !0);
    let a = await (r == null ? void 0 : r.index(D.timeIndex).openCursor(s, "next"));
    for (; a; )
      //Same destination
      a.value.url === t.url && //Only same object jobs
      a.value.transaction.blitzID === t.transaction.blitzID && e.push(a.value), a = await a.continue();
    return e;
  }
  //Retry jobs
  async retry(t) {
    for (const e of t)
      await this._updateJob({
        ...e,
        status: p.Pending
      }), y.queue.notifier.resolved(e.id);
  }
  //Revert jobs
  async revert(t) {
    var r, s;
    t.sort((a, i) => a.createdAt - i.createdAt);
    const e = t[0];
    if (e) {
      if (e.transaction.action === M.Add) {
        await q.create().run([
          new W({
            action: "delete",
            model: e.transaction.model,
            blitzID: e.transaction.blitzID
          })
        ]);
        const a = await this._getFutureJobs(e);
        for (const i of [e, ...a])
          await this._deleteJob(i);
      } else if (e.transaction.action === M.Delete)
        await this._deleteJob(e), await V.get(e.transaction.model).then((a) => a == null ? void 0 : a.get(e.transaction.blitzID));
      else if (e.transaction.action === M.Edit) {
        const a = Object.keys(e.transaction.data ?? {})[0];
        if (!a || ((r = e.transaction.data) == null ? void 0 : r[a].new) === void 0 || ((s = e.transaction.data) == null ? void 0 : s[a].prev) === void 0)
          return;
        const i = new W({
          action: "edit",
          model: e.transaction.model,
          blitzID: e.transaction.blitzID,
          data: {
            [a]: {
              prev: e.transaction.data[a].new,
              new: e.transaction.data[a].prev
            }
          }
        });
        await q.create().run([i]);
        for (const o of t)
          await this._deleteJob(o);
      }
    }
  }
  //Drop jobs from the queue without touching local state (developer escape hatch)
  async drop(t) {
    for (const e of t)
      await this._deleteJob(e);
  }
  //Get all failed/conflict jobs grouped by server URL
  async getAll() {
    var s;
    const t = {}, e = (s = this._db) == null ? void 0 : s.transaction(D.store, "readonly").store;
    let r = await (e == null ? void 0 : e.index(D.timeIndex).openCursor(null, "next"));
    for (; r; ) {
      if (
        //Only unresolved jobs
        r.value.status !== p.Completed
      ) {
        if (t[r.value.url] || (t[r.value.url] = []), r.value.transaction.action === M.Add || r.value.transaction.action === M.Delete)
          t[r.value.url].push([r.value]);
        else if (r.value.transaction.action === M.Edit) {
          const a = Object.keys(r.value.transaction.data ?? {})[0], i = r.value.transaction.blitzID, o = t[r.value.url].findIndex((l) => l[0].transaction.action === M.Edit && l[0].transaction.blitzID === i && Object.keys(l[0].transaction.data ?? {})[0] === a);
          o === -1 ? t[r.value.url].push([r.value]) : t[r.value.url][o].push(r.value);
        }
      }
      r = await r.continue();
    }
    return t;
  }
}
class Ga {
  constructor(t) {
    m(this, "_alerted", /* @__PURE__ */ new Set());
    m(this, "_listener", null);
    this._effects = t;
  }
  /**
   * Register the app's conflict handler; it replaces the built-in prompt.
   * Returns an unregister function. Register before (or in the same tick as)
   * the first sweep — right after `BlitzData.initialize()` is in time.
   */
  onConflict(t) {
    return this._listener = t, () => {
      this._listener === t && (this._listener = null);
    };
  }
  /** A worker verdict just arrived: dispatch the event, then alert. */
  notifyConflict(t) {
    t.message !== void 0 && (this._effects.dispatch("queue:conflict", t), this._alert(t));
  }
  /**
   * A worker verdict just arrived for a failed job: dispatch `queue:failure` and
   * mark it, so the next sweep does not announce the same failure a second time.
   * One path owns the marking — the worker message and the sweep both come here.
   */
  notifyFailure(t) {
    this._alerted.has(t.id) || (this._alerted.add(t.id), this._effects.dispatch("queue:failure", t));
  }
  /** Re-surface unresolved jobs that were never alerted (missed prompts, reloads). */
  sweep(t) {
    for (const e of t)
      this._alerted.has(e.id) || (e.status === p.Failed ? this.notifyFailure(e) : e.status === p.Conflict && e.message !== void 0 && (this._effects.dispatch("queue:conflict", e), this._alert(e)));
  }
  /** A conflict got resolved — a later re-conflict of the same job must alert again. */
  resolved(t) {
    this._alerted.delete(t);
  }
  _alert(t) {
    this._alerted.has(t.id) || (this._listener ? (this._alerted.add(t.id), this._listener(t, {
      force: () => this._effects.resolve(t, !0),
      revert: () => this._effects.resolve(t, !1)
    })) : this._effects.isHidden() || (this._alerted.add(t.id), this._effects.prompt(t)));
  }
}
class Za {
  constructor() {
    // Properties
    m(this, "_db", null);
    m(this, "conflictHandler", null);
    m(this, "failedHandler", null);
    m(this, "notifier", new Ga({
      dispatch: (t, e) => y.dispatchEvent(t, e),
      prompt: (t) => {
        var e;
        return ((e = this.conflictHandler) == null ? void 0 : e.prompt(t)) ?? Promise.resolve();
      },
      resolve: (t, e) => {
        var r;
        return ((r = this.conflictHandler) == null ? void 0 : r.resolve(t, e)) ?? Promise.resolve();
      },
      isHidden: () => document.hidden
    }));
  }
  /**
   * Replace the built-in conflict prompt with the app's own handler. The handler
   * receives the job and `{force, revert}` resolvers. Register right after
   * `BlitzData.initialize()` — the init sweep is deferred one task so a listener
   * registered in the same tick wins over the default prompt. Returns unregister.
   */
  onConflict(t) {
    return this.notifier.onConflict(t);
  }
  /**
   * Surface unresolved Conflict/Failed jobs that were never alerted this session.
   * Runs after init and whenever the tab becomes visible, so a conflict detected
   * while hidden (or before a reload) is deferred, never lost.
   */
  async sweepUnresolved() {
    this.notifier.sweep(await this.getJobs() ?? []);
  }
  // Handle worker message
  _handleWorkerMessage(t) {
    const e = t.data.job;
    e.status === p.Completed ? y.dispatchEvent("queue:success", e) : e.status === p.Failed ? y.queue.notifier.notifyFailure(e) : e.status === p.Conflict && y.queue.notifier.notifyConflict(e), y._Model.get(e.transaction.model).then((r) => {
      var s;
      return (s = r == null ? void 0 : r.memoryClient().get(e.transaction.blitzID)) == null ? void 0 : s.dispatchEvent("syncStatusChange", e);
    }), y.queue.updateSyncStatus(e);
  }
  /**
   * Recompute an edited attribute's save-state from its jobs (Failed >
   * Conflict > Completed > Pending) and emit it on the attribute's
   * `_syncSignal`. Pass `status` to short-circuit with a known value.
   */
  async updateSyncStatus(t, e) {
    var l, c;
    if (t.transaction.action !== M.Edit)
      return;
    const r = await y._Model.get(t.transaction.model), s = r == null ? void 0 : r.memoryClient().get(t.transaction.blitzID);
    if (!s)
      return;
    const a = Object.keys(t.transaction.data ?? {})[0];
    if (!a)
      return;
    const i = s[a], o = await y.queue.getJobsForObject(t.transaction.blitzID);
    (l = i == null ? void 0 : i._syncSignal) == null || l.set(e ? { status: e } : yt(o, a)), (c = s._syncSignal) == null || c.set(yt(o));
  }
  /**
   * Open the queue database and start the processor: Vite's `?sharedworker`
   * module in dev, the consumer-hosted `options.queue.workerPath` file in
   * production. A worker load failure degrades to a same-thread processor
   * with a console warning. Deployment requirements: README.md § Setup.
   */
  async init() {
    if (this._db = await ht(D.name, 1, {
      upgrade: (r) => {
        const s = r.createObjectStore(D.store, { keyPath: "id" });
        s.createIndex(D.timeIndex, "createdAt"), s.createIndex(D.objectIndex, "transaction.blitzID");
      }
    }), !this._db.objectStoreNames.contains(D.store))
      return await oe(D.name), await this.init();
    this.conflictHandler = new Wr(this._db), this.failedHandler = new Ka(this._db);
    const t = new Lr(
      y.options.queue.workerPath,
      { name: "bd-queue-worker" }
    );
    t.onerror = () => {
      console.warn("⚠️ Failed to run the queue's shared worker, please check that the worker path is correct, falling back to running on the same thread!"), new Qe(
        (r) => this._handleWorkerMessage(r),
        z._globalHeaders,
        z._scopedHeaders
      ).start();
    }, t.port.onmessage = this._handleWorkerMessage, window.addEventListener("beforeunload", () => t.port.postMessage({ type: "close" }));
    const e = () => {
      t.port.postMessage({ type: "headers", data: z._globalHeaders }), t.port.postMessage({ type: "scopedHeaders", data: z._scopedHeaders });
    };
    return e(), z.onGlobalHeadersChange(e), setTimeout(() => void this.sweepUnresolved(), 0), document.addEventListener("visibilitychange", () => {
      document.hidden || this.sweepUnresolved();
    }), this;
  }
  // Add job to queue worker
  async addJob(t, e) {
    var s;
    const r = {
      id: crypto.randomUUID(),
      url: t,
      transaction: e,
      status: p.Pending,
      createdAt: Date.now(),
      attempts: 0,
      priority: 1
    };
    await ((s = this._db) == null ? void 0 : s.add(D.store, r)), await this.updateSyncStatus(r, r.status);
  }
  // Delete job from queue worker
  async deleteJob(t) {
    var e;
    await ((e = this._db) == null ? void 0 : e.delete(D.store, t.id));
  }
  // Get all jobs
  async getJobs() {
    var t;
    return await ((t = this._db) == null ? void 0 : t.getAll(D.store));
  }
  // Get all jobs for an object
  async getJobsForObject(t) {
    var r;
    const e = await ((r = this._db) == null ? void 0 : r.getAllFromIndex(D.store, D.objectIndex, t));
    return e.sort((s, a) => s.createdAt - a.createdAt), e;
  }
}
const ti = "BlitzData.realtime", ei = "BlitzData.realtime", Re = 2e3, ri = 3e4;
class fe {
  constructor() {
    /**
     * Cross-tab fanout for transactions the leader already applied locally.
     */
    m(this, "broadcast", null);
    /**
     * Backoff before the next reconnect attempt, in milliseconds.
     */
    m(this, "backoff", Re);
    /**
     * Tail of the inbound chain: each frame is applied after the one before
     * it, in the order it arrived.
     *
     * Applying a frame is several async round trips deep — dedupe against the
     * ledger, evaluate into IndexedDB, apply to memory — and a socket's
     * `onmessage` awaits none of it. Handling frames concurrently let a cheap
     * one overtake an expensive one, so the order transactions reached memory
     * (and with it every subscriber) was decided by IndexedDB latency rather
     * than by the order the server sent them. An `edit` overtaking its own
     * `add` was the worst of it: the row it needed did not exist yet, so the
     * edit was refused and lost.
     *
     * A plain promise chain is enough. One socket delivers frames in order, so
     * queueing them in handler order carries the server's order through to the
     * subscribers unchanged.
     */
    m(this, "tail", Promise.resolve());
  }
  /**
   * Creates a new realtime client.
   */
  static create() {
    return new fe();
  }
  /**
   * Queues one unit of inbound work behind everything already queued. A
   * failure is reported and swallowed: one bad frame must not break the
   * chain for every frame behind it.
   */
  enqueue(t, e) {
    this.tail = this.tail.then(t).catch((r) => {
      console.error(`Realtime ${e} failed:`, (r == null ? void 0 : r.stack) ?? (r == null ? void 0 : r.message) ?? r);
    });
  }
  /**
   * Starts the client. Never throws — any failure (missing config, no
   * network, server down) degrades to silent, indefinitely-retried
   * reconnection and must never block the app using the library.
   */
  start() {
    try {
      typeof BroadcastChannel < "u" && (this.broadcast = new BroadcastChannel(ei), this.broadcast.onmessage = (t) => {
        this.enqueue(() => this.applyToMemory(W.fromObject(t.data)), "broadcast apply");
      });
    } catch (t) {
      console.error("Realtime broadcast channel setup failed:", (t == null ? void 0 : t.stack) ?? (t == null ? void 0 : t.message) ?? t);
    }
    this.holdLeadership().catch((t) => {
      console.error("Realtime connection failed to start:", (t == null ? void 0 : t.stack) ?? (t == null ? void 0 : t.message) ?? t);
    });
  }
  /**
   * Only one tab connects at a time. When the Web Locks API is available
   * the elected tab holds the connection until it closes; another open tab
   * then takes over — connectivity survives tab lifetime, not just one
   * page's.
   */
  async holdLeadership() {
    var t;
    return typeof navigator < "u" && ((t = navigator.locks) != null && t.request) ? navigator.locks.request(ti, () => this.connectForever()) : this.connectForever();
  }
  /**
   * Reconnects indefinitely with exponential backoff. One failed attempt
   * (server down, network blip) must never end realtime syncing for good.
   */
  async connectForever() {
    for (; ; ) {
      try {
        await this.connectOnce(), this.backoff = Re;
      } catch (t) {
        console.error("Realtime connection error:", (t == null ? void 0 : t.stack) ?? (t == null ? void 0 : t.message) ?? t);
      }
      await Ye(this.backoff), this.backoff = Math.min(this.backoff * 2, ri);
    }
  }
  /**
   * Opens one WebSocket connection, subscribes to every configured model's
   * `_all` channel, and resolves once the connection closes (so the caller
   * can reconnect).
   */
  connectOnce() {
    return new Promise((t, e) => {
      var o;
      const r = ((o = y.options.realtime) == null ? void 0 : o.models) ?? [];
      if (r.length === 0) {
        t();
        return;
      }
      let s;
      try {
        s = this.resolveUrl();
      } catch (l) {
        e(l);
        return;
      }
      const a = this.resolveAuthProtocols(), i = a ? new WebSocket(s, a) : new WebSocket(s);
      i.onopen = () => {
        for (const l of r)
          i.send(JSON.stringify({ action: "subscribe", channel: `${l.model}/_all` }));
      }, i.onmessage = (l) => {
        this.enqueue(() => this.handleMessage(l.data), "message handling");
      }, i.onclose = () => t(), i.onerror = () => {
      };
    });
  }
  /**
   * Resolves the WebSocket endpoint: the explicit override, or
   * `wss://<host of the default cluster>/ws`.
   */
  resolveUrl() {
    var s;
    const t = (s = y.options.realtime) == null ? void 0 : s.url;
    if (t)
      return t;
    const e = y.clusterManager.toArray()[0];
    if (!e)
      throw new Error("No cluster registered to derive the realtime WebSocket URL from.");
    return `wss://${new URL(e.getNextReadURL()).host}/ws`;
  }
  /**
   * A browser WebSocket handshake can't carry custom headers or cookies
   * cross-origin, so header-key auth (`HttpRequest.globalHeaders({ U, K })`,
   * see docs/authentication.md) can't ride along the same way it does on
   * HTTP requests. When those global headers are set, this carries the
   * credential via `Sec-WebSocket-Protocol` instead — the one handshake
   * header a browser lets a script set, via the WebSocket constructor's
   * `protocols` argument.
   */
  resolveAuthProtocols() {
    const t = z._globalHeaders, e = t.u ?? t.U, r = t.k ?? t.K;
    if (!(e === void 0 || r === void 0))
      return ["blitz-ws-auth", `u.${e}`, `k.${r}`];
  }
  /**
   * Handles one inbound WebSocket frame: filters it against the configured
   * models/attributes, dedupes it against transactions this client
   * already evaluated (its own writes, echoed back by the server), then
   * applies it locally and fans it out to every tab.
   */
  async handleMessage(t) {
    var i, o, l;
    let e;
    try {
      e = JSON.parse(t);
    } catch {
      return;
    }
    if (e.status || e.error || !e.model || !e.action || !e.transaction)
      return;
    const r = (((i = y.options.realtime) == null ? void 0 : i.models) ?? []).find((c) => c.model === e.model);
    if (!r || !this.matchesFilters(e, r))
      return;
    const s = W.fromObject(e.transaction);
    await this.alreadyEvaluated(s.hash) || ((o = (await q.create().run([s])).get(s.hash)) == null ? void 0 : o.status) !== x.Success || ((l = this.broadcast) == null || l.postMessage(s.toObject()), await this.applyToMemory(s));
  }
  /**
   * Whether an event passes this model's configured attribute filter.
   */
  matchesFilters(t, e) {
    return !(e.attributes && t.action === "edit" && !Object.keys(t.transaction.data ?? {}).some((s) => e.attributes.includes(s)));
  }
  /**
   * Whether this transaction hash is already in the local ledger — either
   * this tab's own optimistic write, echoed back by the server, or an
   * event already applied by a previous realtime/sync run.
   */
  async alreadyEvaluated(t) {
    const e = await new X().openConnection(), r = await e.get("evaluated_transactions", t);
    return e.close(), r !== void 0;
  }
  /**
   * Surfaces an already-applied transaction to this tab's live subscribers
   * without touching IndexedDB — the leader already persisted it, and
   * follower tabs must only ever update memory.
   */
  async applyToMemory(t) {
    const e = await V.get(t.model);
    await (e == null ? void 0 : e.memoryClient().applyTransaction(t, !0));
  }
}
const A = class A {
  /**
   * _Model instance. Stored in ModelRegistry so low-level modules can
   * reach it without importing this module.
   */
  static get _Model() {
    return K();
  }
  static set _Model(t) {
    Fr(t);
  }
  /**
  * Queue instance. Stored in QueueRegistry so low-level modules can
  * reach it without importing this module.
  */
  static get queue() {
    return rt();
  }
  static set queue(t) {
    Br(t);
  }
  /**
   * Version of the library.
   *
   * Please update on every version.
   * Follows Semantic Versioning (semver) convention:
   * MAJOR.MINOR.PATCH where:
   * - MAJOR version for incompatible API changes
   * - MINOR version for backwards-compatible functionality
   * - PATCH version for backwards-compatible bug fixes
   *
   * {@link https://semver.org/}
   */
  static get VERSION() {
    return "1.17.4";
  }
  /**
   * Initializes BlitzData with given options.
   */
  static async initialize(t) {
    if (this.initialized) {
      console.log("%c⚠️ Warning: Library has already been initialized! Skipping the initialization steps.", "background: #FFF3CD; color: #856404; font-weight: bold;"), console.groupCollapsed("%cStack Trace", "background: #FFF3CD; color: #856404; font-weight: bold; font-style: italic;"), console.log("Options", t), console.trace(), console.groupEnd();
      return;
    }
    this.initialized = !0;
    const e = se.transformBlitzDataOptions(t);
    this.options = e, e.clusters && A.setClusters(e.clusters), await new wr(this.options.flush).perform(), await new X().ping(), this.queue = await new Za().init(), A._Model = new V({
      model: void 0,
      attributes: {
        _blitzID: new wt("_blitzID", "string", "_Model"),
        searchable: new wt("searchable", "json", void 0),
        attributes: new wt("attributes", "json", {
          name: {
            label: "Name",
            type: "varchar"
          },
          label: {
            label: "Label",
            type: "texti18n"
          },
          modelpermission: {
            label: "Model Permission",
            type: "tinyint"
          },
          hasuserpermissions: {
            label: "Has User Permissions",
            type: "boolean"
          },
          subscriberemails: {
            label: "Subscriber Emails",
            type: "text"
          },
          haslogs: {
            label: "Has Logs",
            type: "boolean"
          },
          cache: {
            label: "Cache",
            name: "cache",
            type: "boolean"
          },
          hasprojects: {
            label: "Has Projects",
            type: "boolean"
          },
          attributes: {
            label: "Attributes",
            type: "json"
          },
          objectpermissionoptions: {
            label: "Object Permission Options",
            type: "int"
          },
          haspublishingdate: {
            label: "Has Publishing Date",
            type: "boolean"
          }
        }),
        _editURLs: new wt("_editURLs", "json", []),
        haspublishingdate: new er("haspublishingdate", "boolean", !1)
      }
    }), A._Model.setReturnType(V), t && typeof t != "string" && !Array.isArray(t) && t.uiManager && (this.ui = new t.uiManager(this, t.uiManagerSettings));
    try {
      await A.getCurrentUser();
    } catch (r) {
      console.error("Error fetching current user:", r.stack);
    }
    if (e.sync.level === "full") {
      const r = _t.create();
      A.syncReady = r.run().catch((s) => {
        console.error("Initial sync failed:", (s == null ? void 0 : s.stack) ?? (s == null ? void 0 : s.message) ?? s);
      }), e.sync.background !== !0 && await A.syncReady, r.runAtInterval(e.sync.interval);
    } else if (e.sync.level === "cache") {
      const r = _t.create();
      A.syncReady = r.run(void 0, "delete").catch((s) => {
        console.error("Initial sync failed:", (s == null ? void 0 : s.stack) ?? (s == null ? void 0 : s.message) ?? s);
      }), await A.syncReady;
    }
    e.realtime && e.realtime.models.length > 0 && fe.create().start();
  }
  /**
   * Registers clusters.
   */
  static setClusters(t) {
    t = se.transformClusterOptions(t);
    for (const e of Object.keys(t))
      A.clusterManager.register(e, t[e]);
  }
  /**
   * Performs a list call to the server by given URL.
   *
   * @param url
   */
  static async list(t) {
    const e = ne.extractModelName(t);
    if (!await A._Model.exists(e))
      throw new Error(`Model "${e}" does not exist.`);
    return it.create().model(await A._Model.get(e)).urls([t]).query({}).perform();
  }
  /**
   * Performs an image upload
   *
   * @param file File to be uploaded.
   * @param target Model/attribute the file belongs to. Required for the
   * server to resolve the attribute's access mode — omitting it stores the
   * file as public regardless of the schema.
   */
  static async uploader(t, e) {
    return await st.upload({
      baseUrl: A.clusterManager.toArray()[0].getNextReadURL(),
      image: t,
      modelName: e == null ? void 0 : e.modelName,
      attributeName: e == null ? void 0 : e.attributeName
    });
  }
  /**
   * Performs a video upload
   *
   * @param file File to be uploaded.
   * @param target Model/attribute the file belongs to. Required for the
   * server to resolve the attribute's access mode — omitting it stores the
   * file as public regardless of the schema.
   */
  static async uploaderVideo(t, e) {
    return await st.uploadVideo({
      baseUrl: A.clusterManager.toArray()[0].getNextReadURL(),
      video: t,
      modelName: e == null ? void 0 : e.modelName,
      attributeName: e == null ? void 0 : e.attributeName
    });
  }
  /**
   * Performs a file upload
   *
   * @param file File to be uploaded.
   * @param target Model/attribute the file belongs to. Required for the
   * server to resolve the attribute's access mode — omitting it stores the
   * file as public regardless of the schema.
   */
  static async uploaderFile(t, e) {
    return await st.uploadFile({
      baseUrl: A.clusterManager.toArray()[0].getNextReadURL(),
      file: t,
      modelName: e == null ? void 0 : e.modelName,
      attributeName: e == null ? void 0 : e.attributeName
    });
  }
  /**
   * Runs a server controller by path.
   *
   * @param path Controller path (e.g. `/blitzpm/somescript` or `blitzpm/somescript.json`).
   * @param options Optional request parameters.
   */
  static async runController(t, e) {
    let r = t.startsWith("/") ? t.slice(1) : t;
    r.includes(".json") || (r += ".json");
    const s = P.sanitizeBaseUrl(A.clusterManager.toArray()[0].getNextReadURL()), a = new URL(s).origin !== window.location.origin ? r.includes("?") ? "&enableCors=1" : "?enableCors=1" : "", i = z.create().url(s + r + a).method((e == null ? void 0 : e.method) ?? "GET").header("Accept", "application/json");
    e != null && e.headers && i.headers(e.headers), (e == null ? void 0 : e.body) !== void 0 && i.body(e.body), e != null && e.signal && i.signal(e.signal);
    const o = await i.send(e == null ? void 0 : e.rawResponse);
    if (!(e != null && e.rawResponse) && o.error)
      throw new Error(o.error);
    return o;
  }
  /**
   * List users for a given project.
   *
   * @param _blitzID
   */
  static async listProjectUsers(t) {
    if (!t)
      throw new Error("Project ID required!");
    const e = S.getProjectUsers(t);
    if (e !== null && typeof e == "object") {
      const o = Date.now(), l = 864e5;
      if (o < e.lastSaved + l)
        return e.users;
    }
    const r = P.sanitizeBaseUrl(A.clusterManager.toArray()[0].getNextReadURL()), s = new URL(r).origin !== window.location.origin ? "?enableCors=1" : "", a = await z.create().url(r + `api/listProjectUsers/${t}.json${s}`).get();
    if (a.error)
      throw new Error(a.error);
    if (a.errors instanceof Array && a.errors.length > 0)
      throw new Error(a.errors.map((o) => o.message || o).join(" | "));
    const i = {
      lastSaved: Date.now(),
      users: (a.users || []).map((o) => ({ id: o._blitzID, username: o.username }))
    };
    return S.setProjectUsers(t, i), i.users;
  }
  /**
   * Get current user.
   */
  static async getCurrentUser() {
    var l;
    const t = S.getCurrentUser();
    if (t)
      return t;
    const e = P.sanitizeBaseUrl(A.clusterManager.toArray()[0].getNextReadURL()), r = new URL(e).origin !== window.location.origin ? "?enableCors=1" : "", s = await z.create().url(e + "api/ping.json" + r).get();
    if (s.error)
      throw new Error(s.error);
    if (!s.userhash) {
      const c = { id: "public", username: "Public" };
      return S.setCurrentUser(c), c;
    }
    const a = await V.get("0BAUsers"), i = await (a == null ? void 0 : a.get(s.userhash));
    if (!i || !((l = i.username) != null && l.value))
      throw new Error("Could not get user object!");
    const o = { id: s.userhash, username: i.username.value };
    return S.setCurrentUser(o), o;
  }
  /**
   * Clean up current user.
   */
  static refreshCurrentUser() {
    S.setCurrentUser(null);
  }
  /**
   * Adds event listener to the BlitzData.
   *
   * @param type Event type.
   * @param callback Callback function.
   */
  static addEventListener(t, e) {
    this.listeners.has(t) || this.listeners.set(t, []), this.listeners.get(t).push(e);
  }
  /**
   * Checks whether an event has at least one listener or not.
   *
   * @param type
   */
  static hasEventListener(t) {
    return this.listeners.has(t) ? this.listeners.get(t).length > 0 : !1;
  }
  /**
   * Removes an event listener from the BlitzData.
   *
   * @param type Event type.
   * @param callback Callback function.
   */
  static removeEventListener(t, e) {
    this.listeners.has(t) && this.listeners.set(t, this.listeners.get(t).filter((r) => e !== r));
  }
  /**
   * Dispatches events to callbacks.
   *
   * @param type Event name.
   * @param job Job to be dispatched.
   */
  static dispatchEvent(t, e) {
    this.listeners.has(t) && this.listeners.get(t).forEach((r) => r(e));
  }
};
/**
 * Cluster manager.
 */
m(A, "clusterManager", new $e()), /**
* Cache of loaded objects (model => (blitzID => object)).
*/
m(A, "objects", /* @__PURE__ */ new Map()), /**
 * Options of the BlitzData.
 */
m(A, "options"), /**
* UI manager instance.
*/
m(A, "ui"), /**
 * Event listeners.
 */
m(A, "listeners", /* @__PURE__ */ new Map()), /**
 * Whether library initialized or not.
 */
m(A, "initialized", !1), /**
 * Settles when the first sync pass completes. With `sync.background`
 * initialization returns immediately and apps await this instead.
 */
m(A, "syncReady", Promise.resolve());
let y = A;
class si {
  constructor(t = "blitzdata.oauth.tokens", e = typeof localStorage < "u" ? localStorage : null) {
    this._key = t, this._storage = e;
  }
  load() {
    var e;
    const t = (e = this._storage) == null ? void 0 : e.getItem(this._key);
    if (!t)
      return null;
    try {
      const r = JSON.parse(t);
      if (r != null && r.accessToken && (r != null && r.refreshToken) && (r != null && r.expiresAt))
        return r;
    } catch {
    }
    return this.clear(), null;
  }
  save(t) {
    var e;
    (e = this._storage) == null || e.setItem(this._key, JSON.stringify(t));
  }
  clear() {
    var t;
    (t = this._storage) == null || t.removeItem(this._key);
  }
}
function yr(n) {
  let t = "";
  for (const e of n)
    t += String.fromCharCode(e);
  return btoa(t).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function Yt(n = 32) {
  const t = new Uint8Array(n);
  return crypto.getRandomValues(t), yr(t);
}
async function ni(n) {
  const t = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(n));
  return yr(new Uint8Array(t));
}
function pr(n) {
  const t = n.replace(/-/g, "+").replace(/_/g, "/"), e = t + "=".repeat((4 - t.length % 4) % 4), r = atob(e), s = new Uint8Array(r.length);
  for (let a = 0; a < r.length; a++)
    s[a] = r.charCodeAt(a);
  return s;
}
function Je(n) {
  return JSON.parse(new TextDecoder().decode(pr(n)));
}
function Vt(n) {
  const t = n.split(".");
  if (t.length !== 3)
    throw new Error("id_token is not a well-formed JWT");
  return {
    header: Je(t[0]),
    payload: Je(t[1]),
    signingInput: `${t[0]}.${t[1]}`,
    signature: pr(t[2])
  };
}
function ai(n, t) {
  const e = Math.floor((t.now ?? Date.now()) / 1e3), r = t.clockToleranceSeconds ?? 60;
  if (n.iss !== t.issuer)
    throw new Error(`id_token issuer mismatch: ${n.iss}`);
  if (!(Array.isArray(n.aud) ? n.aud : [n.aud]).includes(t.audience))
    throw new Error(`id_token audience mismatch: ${n.aud}`);
  if (typeof n.exp != "number" || n.exp + r < e)
    throw new Error("id_token has expired");
  if (t.nonce !== void 0 && n.nonce !== t.nonce)
    throw new Error("id_token nonce mismatch");
}
async function ii(n, t) {
  if (typeof crypto > "u" || !crypto.subtle)
    return !1;
  const e = (n.header.kid ? t.keys.find((s) => s.kid === n.header.kid) : t.keys[0]) ?? t.keys[0];
  if (!e)
    return !1;
  const r = await crypto.subtle.importKey(
    "jwk",
    { kty: e.kty, n: e.n, e: e.e, alg: "RS256", ext: !0 },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    !1,
    ["verify"]
  );
  return await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    r,
    n.signature,
    new TextEncoder().encode(n.signingInput)
  );
}
const Qt = "blitzdata.oauth.verifier", Xt = "blitzdata.oauth.state", Kt = "blitzdata.oauth.nonce";
class li {
  constructor(t) {
    m(this, "_baseUrl");
    m(this, "_issuerOrigin");
    m(this, "_redirectUri");
    m(this, "_scope");
    m(this, "_clientId");
    m(this, "_store");
    m(this, "_tokens", null);
    m(this, "_claims", null);
    m(this, "_discovery", null);
    m(this, "_discoveryPromise", null);
    m(this, "_refreshPromise", null);
    m(this, "_refreshTimer", null);
    m(this, "_leewayMs");
    this._baseUrl = t.baseUrl.endsWith("/") ? t.baseUrl : t.baseUrl + "/", this._issuerOrigin = new URL(this._baseUrl).origin, this._redirectUri = t.redirectUri ?? (typeof location < "u" ? location.origin + location.pathname : ""), this._scope = t.scope ?? "openid profile email", this._clientId = t.clientId ?? new URL(this._redirectUri || this._baseUrl).origin, this._store = new si(t.storageKey, t.storage ?? (typeof localStorage < "u" ? localStorage : null)), this._leewayMs = (t.refreshLeewaySeconds ?? 60) * 1e3, z.onUnauthorized(async (e) => new URL(e).origin !== this._issuerOrigin ? !1 : this.refresh());
  }
  /**
   * The validated identity claims from the id_token, or null when not logged in
   * or the instance did not issue one (no OIDC scope / no signing key).
   */
  get claims() {
    return this._claims;
  }
  get isAuthenticated() {
    return !!this._tokens && this._tokens.expiresAt > Date.now();
  }
  get accessToken() {
    var t;
    return ((t = this._tokens) == null ? void 0 : t.accessToken) ?? null;
  }
  /**
   * Call once on app start, before BlitzData.initialize.
   * Completes a pending login redirect or restores the stored session,
   * refreshing it when it is about to expire.
   *
   * @returns Whether a user is authenticated.
   */
  async init() {
    var t;
    if (typeof location < "u" && new URLSearchParams(location.search).has("code"))
      await this.handleRedirectCallback();
    else if (this._tokens = this._store.load(), (t = this._tokens) != null && t.idToken)
      try {
        this._claims = Vt(this._tokens.idToken).payload;
      } catch {
        this._claims = null;
      }
    return this._tokens ? this._tokens.expiresAt <= Date.now() + this._leewayMs ? await this.refresh() : (this._applyTokens(), !0) : !1;
  }
  /**
   * Start the login by sending the browser to the BlitzData authorize page.
   */
  async loginWithRedirect() {
    const t = Yt(32), e = Yt(16), r = Yt(16);
    sessionStorage.setItem(Qt, t), sessionStorage.setItem(Xt, e), sessionStorage.setItem(Kt, r);
    const s = new URLSearchParams({
      response_type: "code",
      client_id: this._clientId,
      redirect_uri: this._redirectUri,
      scope: this._scope,
      state: e,
      nonce: r,
      code_challenge_method: "S256",
      code_challenge: await ni(t)
    });
    location.href = `${this._baseUrl}blitz/o/oauth/authorize?${s}`;
  }
  /**
   * Exchange the ?code from the authorize redirect for tokens.
   * Called automatically by init().
   */
  async handleRedirectCallback() {
    const t = new URLSearchParams(location.search), e = t.get("code");
    if (!e)
      return !1;
    const r = sessionStorage.getItem(Xt), s = sessionStorage.getItem(Qt), a = sessionStorage.getItem(Kt);
    if (sessionStorage.removeItem(Xt), sessionStorage.removeItem(Qt), sessionStorage.removeItem(Kt), !s || !r || t.get("state") !== r)
      throw new Error("OAuth state mismatch, restart the login");
    await this._storeTokenResponse(
      await this._postForm("blitz/o/oauth/token", { code: e, code_verifier: s }),
      a ?? void 0
    ), t.delete("code"), t.delete("state");
    const i = t.toString();
    return history.replaceState(null, "", location.pathname + (i ? "?" + i : "") + location.hash), !0;
  }
  /**
   * Rotate the tokens with the refresh endpoint. Single-flight:
   * concurrent calls share one request. Logs out when the refresh fails.
   */
  refresh() {
    return this._refreshPromise ? this._refreshPromise : (this._refreshPromise = this._withRefreshLock(() => this._doRefresh()).finally(() => {
      this._refreshPromise = null;
    }), this._refreshPromise);
  }
  async _doRefresh() {
    var r;
    const t = this._store.load();
    if (t && t.expiresAt > Date.now() + this._leewayMs) {
      if (this._tokens = t, t.idToken)
        try {
          this._claims = Vt(t.idToken).payload;
        } catch {
          this._claims = null;
        }
      return this._applyTokens(), !0;
    }
    const e = ((r = this._tokens) == null ? void 0 : r.refreshToken) ?? (t == null ? void 0 : t.refreshToken);
    if (!e)
      return !1;
    try {
      const s = await this._postForm("blitz/o/oauth/refresh", { refresh_token: e });
      return await this._storeTokenResponse(s), !0;
    } catch {
      return this.logout(), !1;
    }
  }
  async _withRefreshLock(t) {
    var r;
    const e = (r = globalThis.navigator) == null ? void 0 : r.locks;
    return e != null && e.request ? await e.request("blitzdata.oauth.refresh." + this._issuerOrigin, t) : await t();
  }
  /**
   * Fetch the OIDC userinfo claims for the current access token.
   */
  async getUserInfo() {
    const t = await this._getDiscovery();
    if (!t || !this._tokens)
      return null;
    const e = await fetch(t.userinfo_endpoint, {
      headers: { Authorization: `Bearer ${this._tokens.accessToken}` }
    });
    return e.ok ? await e.json() : null;
  }
  /**
   * Drop the local session and stop authenticating requests. The local
   * session is cleared immediately; server-side revocation is best-effort.
   *
   * @param options.everywhere Revoke every session of the user, not just this one.
   */
  async logout(t = {}) {
    var s, a, i;
    const e = ((s = this._tokens) == null ? void 0 : s.refreshToken) ?? ((a = this._store.load()) == null ? void 0 : a.refreshToken), r = (i = this._tokens) == null ? void 0 : i.accessToken;
    this._tokens = null, this._claims = null, this._store.clear(), this._refreshTimer && clearTimeout(this._refreshTimer), z.setScopedHeaders(this._issuerOrigin, {});
    try {
      t.everywhere && r ? await fetch(this._baseUrl + "blitz/o/oauth/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Bearer ${r}` },
        body: "all=1"
      }) : e && await this._postForm("blitz/o/oauth/revoke", { token: e });
    } catch {
    }
  }
  // nonce is present only on the initial code exchange, absent on refresh.
  async _storeTokenResponse(t, e) {
    if (!(t != null && t.access_token) || !(t != null && t.refresh_token))
      throw new Error("OAuth token endpoint returned no tokens" + (t != null && t.error ? `: ${t.error}` : ""));
    this._tokens = {
      accessToken: t.access_token,
      refreshToken: t.refresh_token,
      expiresAt: Date.now() + t.expires_in * 1e3,
      idToken: t.id_token
    }, t.id_token && (this._claims = await this._validateIdToken(t.id_token, e)), this._store.save(this._tokens), this._applyTokens();
  }
  // Validate the id_token's claims and, when a JWKS is reachable, its RS256 signature.
  async _validateIdToken(t, e) {
    var i;
    const r = Vt(t), s = await this._getDiscovery(), a = (s == null ? void 0 : s.issuer) ?? this._issuerOrigin;
    if (ai(r.payload, { issuer: a, audience: this._clientId, nonce: e }), s) {
      const o = await this._fetchJson(s.jwks_uri);
      if ((i = o == null ? void 0 : o.keys) != null && i.length && !await ii(r, o))
        throw new Error("id_token signature verification failed");
    }
    return r.payload;
  }
  async _getDiscovery() {
    return this._discovery ? this._discovery : this._discoveryPromise ? this._discoveryPromise : (this._discoveryPromise = this._fetchJson(`${this._issuerOrigin}/.well-known/openid-configuration`).then((t) => t != null && t.issuer && new URL(t.issuer).origin === this._issuerOrigin ? (this._discovery = t, t) : null).catch(() => null), this._discoveryPromise);
  }
  async _fetchJson(t) {
    const e = await fetch(t);
    return e.ok ? await e.json() : null;
  }
  _applyTokens() {
    this._tokens && (z.setScopedHeaders(this._issuerOrigin, { Authorization: `Bearer ${this._tokens.accessToken}` }), this._scheduleRefresh());
  }
  _scheduleRefresh() {
    if (this._refreshTimer && clearTimeout(this._refreshTimer), !this._tokens)
      return;
    const t = Math.max(this._tokens.expiresAt - Date.now() - this._leewayMs, 5e3);
    this._refreshTimer = setTimeout(() => this.refresh(), t);
  }
  async _postForm(t, e) {
    const r = await fetch(this._baseUrl + t, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(e).toString()
    });
    if (!r.ok)
      throw new Error(`OAuth request to ${t} failed with status ${r.status}`);
    return await r.json();
  }
}
export {
  br as BDCustomObject,
  V as BDModel,
  ut as BDObject,
  y as BlitzData,
  U as DataType,
  ur as DefinitiveHistoryError,
  z as HttpRequest,
  p as JobStatus,
  S as LocalStorageRepository,
  Jr as ME_SENTINEL,
  ba as ManyForeignKeyType,
  lr as ManyType,
  li as OAuthClient,
  Ge as SYSTEM_ATTRIBUTES,
  he as TagSource,
  cr as TextType,
  ct as blitzhash,
  ot as blitzstamp,
  jr as blitzstampFromDate,
  ci as blitzstampToDate,
  Ye as sleep
};
