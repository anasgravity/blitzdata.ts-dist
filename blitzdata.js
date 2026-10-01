var mr = Object.defineProperty;
var gr = (a, t, e) => t in a ? mr(a, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : a[t] = e;
var m = (a, t, e) => (gr(a, typeof t != "symbol" ? t + "" : t, e), e);
const A = class A {
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
    const t = new A();
    return A._globalHeaders && t.headers(A._globalHeaders), t;
  }
  /**
   * Set the global request headers.
   *
   * @param headers Global request headers.
   */
  static globalHeaders(t) {
    A._globalHeaders = t, A._notifyGlobalHeadersChange();
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
      r === null ? delete A._globalHeaders[e] : A._globalHeaders[e] = r;
    }
    A._notifyGlobalHeadersChange();
  }
  /**
   * Set the headers applied only to requests targeting the given origin.
   * Passing empty headers removes the scope (e.g. on logout).
   *
   * @param origin Exact request origin, e.g. 'https://alpha.blitzdata.com'.
   * @param headers Headers to attach for that origin.
   */
  static setScopedHeaders(t, e) {
    A._scopedHeaders = A._scopedHeaders.filter((r) => r.origin !== t), Object.keys(e).length > 0 && A._scopedHeaders.push({ origin: t, headers: e }), A._notifyGlobalHeadersChange();
  }
  /**
   * Register a handler to recover from a 401 (typically an OAuth refresh).
   * The request is retried once if the handler resolves true.
   */
  static onUnauthorized(t) {
    A._unauthorizedHandler = t;
  }
  /**
   * Register a listener called whenever the global or scoped headers change.
   *
   * @param listener Change listener.
   */
  static onGlobalHeadersChange(t) {
    A._globalHeadersListeners.push(t);
  }
  static _notifyGlobalHeadersChange() {
    for (const t of A._globalHeadersListeners)
      t(A._globalHeaders);
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
    return A._scopedHeaders.filter((r) => r.origin === e).reduce((r, s) => Object.assign(r, s.headers), {});
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
      headers: { ...this._headers, ...A._scopedHeadersFor(this._url) },
      body: this._body ? this._body instanceof FormData ? this._body : JSON.stringify(this._body) : void 0,
      signal: this._signal ? this._signal : void 0
    });
    return e.status === 401 && !this._retriedAfterUnauthorized && A._unauthorizedHandler && this._url && (this._retriedAfterUnauthorized = !0, await A._unauthorizedHandler(this._url)) ? await this.send(t) : t ? e : await e.json();
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
m(A, "_globalHeaders", {}), /**
 * Headers applied only to requests whose URL matches a given origin.
 * Used to keep a Bearer token scoped to the host that issued it,
 * so it never leaks to a second cluster on another host.
 */
m(A, "_scopedHeaders", []), /**
 * Handler invoked once on a 401 to try to recover (e.g. refresh the token).
 * Returning true retries the request with refreshed headers.
 */
m(A, "_unauthorizedHandler", null), /**
 * Listeners notified whenever the global headers change,
 * used to propagate them to the queue's shared worker.
 */
m(A, "_globalHeadersListeners", []);
let P = A;
class wr {
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
class Le {
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
    this.clusters[t] = new wr(t, e);
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
const br = (a, t) => t.some((e) => a instanceof e);
let ce, le;
function yr() {
  return ce || (ce = [
    IDBDatabase,
    IDBObjectStore,
    IDBIndex,
    IDBCursor,
    IDBTransaction
  ]);
}
function pr() {
  return le || (le = [
    IDBCursor.prototype.advance,
    IDBCursor.prototype.continue,
    IDBCursor.prototype.continuePrimaryKey
  ]);
}
const Ne = /* @__PURE__ */ new WeakMap(), Yt = /* @__PURE__ */ new WeakMap(), Fe = /* @__PURE__ */ new WeakMap(), jt = /* @__PURE__ */ new WeakMap(), ee = /* @__PURE__ */ new WeakMap();
function _r(a) {
  const t = new Promise((e, r) => {
    const s = () => {
      a.removeEventListener("success", n), a.removeEventListener("error", i);
    }, n = () => {
      e(K(a.result)), s();
    }, i = () => {
      r(a.error), s();
    };
    a.addEventListener("success", n), a.addEventListener("error", i);
  });
  return t.then((e) => {
    e instanceof IDBCursor && Ne.set(e, a);
  }).catch(() => {
  }), ee.set(t, a), t;
}
function vr(a) {
  if (Yt.has(a))
    return;
  const t = new Promise((e, r) => {
    const s = () => {
      a.removeEventListener("complete", n), a.removeEventListener("error", i), a.removeEventListener("abort", i);
    }, n = () => {
      e(), s();
    }, i = () => {
      r(a.error || new DOMException("AbortError", "AbortError")), s();
    };
    a.addEventListener("complete", n), a.addEventListener("error", i), a.addEventListener("abort", i);
  });
  Yt.set(a, t);
}
let Vt = {
  get(a, t, e) {
    if (a instanceof IDBTransaction) {
      if (t === "done")
        return Yt.get(a);
      if (t === "objectStoreNames")
        return a.objectStoreNames || Fe.get(a);
      if (t === "store")
        return e.objectStoreNames[1] ? void 0 : e.objectStore(e.objectStoreNames[0]);
    }
    return K(a[t]);
  },
  set(a, t, e) {
    return a[t] = e, !0;
  },
  has(a, t) {
    return a instanceof IDBTransaction && (t === "done" || t === "store") ? !0 : t in a;
  }
};
function Dr(a) {
  Vt = a(Vt);
}
function Sr(a) {
  return a === IDBDatabase.prototype.transaction && !("objectStoreNames" in IDBTransaction.prototype) ? function(t, ...e) {
    const r = a.call(Wt(this), t, ...e);
    return Fe.set(r, t.sort ? t.sort() : [t]), K(r);
  } : pr().includes(a) ? function(...t) {
    return a.apply(Wt(this), t), K(Ne.get(this));
  } : function(...t) {
    return K(a.apply(Wt(this), t));
  };
}
function Mr(a) {
  return typeof a == "function" ? Sr(a) : (a instanceof IDBTransaction && vr(a), br(a, yr()) ? new Proxy(a, Vt) : a);
}
function K(a) {
  if (a instanceof IDBRequest)
    return _r(a);
  if (jt.has(a))
    return jt.get(a);
  const t = Mr(a);
  return t !== a && (jt.set(a, t), ee.set(t, a)), t;
}
const Wt = (a) => ee.get(a);
function ht(a, t, { blocked: e, upgrade: r, blocking: s, terminated: n } = {}) {
  const i = indexedDB.open(a, t), o = K(i);
  return r && i.addEventListener("upgradeneeded", (l) => {
    r(K(i.result), l.oldVersion, l.newVersion, K(i.transaction), l);
  }), e && i.addEventListener("blocked", (l) => e(
    // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
    l.oldVersion,
    l.newVersion,
    l
  )), o.then((l) => {
    n && l.addEventListener("close", () => n()), s && l.addEventListener("versionchange", (c) => s(c.oldVersion, c.newVersion, c));
  }).catch(() => {
  }), o;
}
function re(a, { blocked: t } = {}) {
  const e = indexedDB.deleteDatabase(a);
  return t && e.addEventListener("blocked", (r) => t(
    // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
    r.oldVersion,
    r
  )), K(e).then(() => {
  });
}
const kr = ["get", "getKey", "getAll", "getAllKeys", "count"], Tr = ["put", "add", "delete", "clear"], Rt = /* @__PURE__ */ new Map();
function ue(a, t) {
  if (!(a instanceof IDBDatabase && !(t in a) && typeof t == "string"))
    return;
  if (Rt.get(t))
    return Rt.get(t);
  const e = t.replace(/FromIndex$/, ""), r = t !== e, s = Tr.includes(e);
  if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(e in (r ? IDBIndex : IDBObjectStore).prototype) || !(s || kr.includes(e))
  )
    return;
  const n = async function(i, ...o) {
    const l = this.transaction(i, s ? "readwrite" : "readonly");
    let c = l.store;
    return r && (c = c.index(o.shift())), (await Promise.all([
      c[e](...o),
      s && l.done
    ]))[0];
  };
  return Rt.set(t, n), n;
}
Dr((a) => ({
  ...a,
  get: (t, e, r) => ue(t, e) || a.get(t, e, r),
  has: (t, e) => !!ue(t, e) || a.has(t, e)
}));
const v = {
  name: "bd-queue",
  store: "jobs",
  timeIndex: "time",
  objectIndex: "object"
};
var _ = /* @__PURE__ */ ((a) => (a.Pending = "pending", a.Completed = "completed", a.Failed = "failed", a.Conflict = "conflict", a))(_ || {}), L = /* @__PURE__ */ ((a) => (a.Success = "success", a.Exception = "exception", a.Failed = "failed", a.Conflict = "conflict", a))(L || {}), M = /* @__PURE__ */ ((a) => (a.Add = "add", a.Edit = "edit", a.Delete = "delete", a))(M || {}), Y = "SharedWorker" in globalThis, Ir = class {
  constructor(a) {
    /**
     * The actual worker that is used, depending on browser support it can be either a `SharedWorker` or a normal `Worker`.
     */
    m(this, "ActualWorker");
    this.ActualWorker = a;
  }
  /**
   * An EventListener called when MessageEvent of type message is fired on the port—that is, when the port receives a message.
   */
  get onmessage() {
    var a;
    return Y ? (a = this.ActualWorker) == null ? void 0 : a.port.onmessage : this.ActualWorker.onmessage;
  }
  set onmessage(a) {
    Y ? this.ActualWorker.port.onmessage = a : this.ActualWorker.onmessage = a;
  }
  /**
   * An EventListener called when a MessageEvent of type MessageError is fired—that is, when it receives a message that cannot be deserialized.
   */
  get onmessageerror() {
    var a;
    return Y ? (a = this.ActualWorker) == null ? void 0 : a.port.onmessageerror : this.ActualWorker.onmessageerror;
  }
  set onmessageerror(a) {
    Y ? this.ActualWorker.port.onmessageerror = a : this.ActualWorker.onmessageerror = a;
  }
  /**
   * Starts the sending of messages queued on the port (only needed when using EventTarget.addEventListener; it is implied when using MessagePort.onmessage.)
   */
  start() {
    var a;
    if (Y)
      return (a = this.ActualWorker) == null ? void 0 : a.port.start();
  }
  /**
   * Clones message and transmits it to worker's global environment. transfer can be passed as a list of objects that are to be transferred rather than cloned.
   */
  postMessage(a, t) {
    var e;
    return Y ? (e = this.ActualWorker) == null ? void 0 : e.port.postMessage(a, t) : this.ActualWorker.postMessage(a, t);
  }
  /**
   * Immediately terminates the worker. This does not let worker finish its operations; it is halted at once. ServiceWorker instances do not support this method.
   */
  terminate() {
    var a;
    return Y ? (a = this.ActualWorker) == null ? void 0 : a.port.close() : this.ActualWorker.terminate();
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
  set onerror(a) {
    this.ActualWorker.onerror = a;
  }
  addEventListener(a, t, e) {
    var r;
    return Y && a !== "error" ? (r = this.ActualWorker) == null ? void 0 : r.port.addEventListener(a, t, e) : this.ActualWorker.addEventListener(a, t, e);
  }
  removeEventListener(a, t, e) {
    var r;
    return Y && a !== "error" ? (r = this.ActualWorker) == null ? void 0 : r.port.removeEventListener(a, t, e) : this.ActualWorker.removeEventListener(a, t, e);
  }
  /**
   * Dispatches an event to this EventTarget.
   */
  dispatchEvent(a) {
    return this.ActualWorker.dispatchEvent(a);
  }
}, Ar = class extends Ir {
  constructor(a, t) {
    let e;
    Y ? e = new SharedWorker(a, t) : e = new Worker(a, t), super(e);
  }
};
function Or(a) {
  return a && a.__esModule && Object.prototype.hasOwnProperty.call(a, "default") ? a.default : a;
}
var je = {};
/*! crc32.js (C) 2014-present SheetJS -- http://sheetjs.com */
(function(a) {
  (function(t) {
    t(typeof DO_NOT_EXPORT_CRC > "u" ? a : {});
  })(function(t) {
    t.version = "1.2.2";
    function e() {
      for (var w = 0, $ = new Array(256), b = 0; b != 256; ++b)
        w = b, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, $[b] = w;
      return typeof Int32Array < "u" ? new Int32Array($) : $;
    }
    var r = e();
    function s(w) {
      var $ = 0, b = 0, k = 0, I = typeof Int32Array < "u" ? new Int32Array(4096) : new Array(4096);
      for (k = 0; k != 256; ++k)
        I[k] = w[k];
      for (k = 0; k != 256; ++k)
        for (b = w[k], $ = 256 + k; $ < 4096; $ += 256)
          b = I[$] = b >>> 8 ^ w[b & 255];
      var F = [];
      for (k = 1; k != 16; ++k)
        F[k - 1] = typeof Int32Array < "u" ? I.subarray(k * 256, k * 256 + 256) : I.slice(k * 256, k * 256 + 256);
      return F;
    }
    var n = s(r), i = n[0], o = n[1], l = n[2], c = n[3], u = n[4], d = n[5], h = n[6], f = n[7], g = n[8], p = n[9], D = n[10], z = n[11], N = n[12], C = n[13], Q = n[14];
    function Nt(w, $) {
      for (var b = $ ^ -1, k = 0, I = w.length; k < I; )
        b = b >>> 8 ^ r[(b ^ w.charCodeAt(k++)) & 255];
      return ~b;
    }
    function hr(w, $) {
      for (var b = $ ^ -1, k = w.length - 15, I = 0; I < k; )
        b = Q[w[I++] ^ b & 255] ^ C[w[I++] ^ b >> 8 & 255] ^ N[w[I++] ^ b >> 16 & 255] ^ z[w[I++] ^ b >>> 24] ^ D[w[I++]] ^ p[w[I++]] ^ g[w[I++]] ^ f[w[I++]] ^ h[w[I++]] ^ d[w[I++]] ^ u[w[I++]] ^ c[w[I++]] ^ l[w[I++]] ^ o[w[I++]] ^ i[w[I++]] ^ r[w[I++]];
      for (k += 15; I < k; )
        b = b >>> 8 ^ r[(b ^ w[I++]) & 255];
      return ~b;
    }
    function fr(w, $) {
      for (var b = $ ^ -1, k = 0, I = w.length, F = 0, Ft = 0; k < I; )
        F = w.charCodeAt(k++), F < 128 ? b = b >>> 8 ^ r[(b ^ F) & 255] : F < 2048 ? (b = b >>> 8 ^ r[(b ^ (192 | F >> 6 & 31)) & 255], b = b >>> 8 ^ r[(b ^ (128 | F & 63)) & 255]) : F >= 55296 && F < 57344 ? (F = (F & 1023) + 64, Ft = w.charCodeAt(k++) & 1023, b = b >>> 8 ^ r[(b ^ (240 | F >> 8 & 7)) & 255], b = b >>> 8 ^ r[(b ^ (128 | F >> 2 & 63)) & 255], b = b >>> 8 ^ r[(b ^ (128 | Ft >> 6 & 15 | (F & 3) << 4)) & 255], b = b >>> 8 ^ r[(b ^ (128 | Ft & 63)) & 255]) : (b = b >>> 8 ^ r[(b ^ (224 | F >> 12 & 15)) & 255], b = b >>> 8 ^ r[(b ^ (128 | F >> 6 & 63)) & 255], b = b >>> 8 ^ r[(b ^ (128 | F & 63)) & 255]);
      return ~b;
    }
    t.table = r, t.bstr = Nt, t.buf = hr, t.str = fr;
  });
})(je);
function ot() {
  return zr(/* @__PURE__ */ new Date());
}
function zr(a) {
  return Math.floor((a.getTime() - (/* @__PURE__ */ new Date("2021-01-01T00:00:00Z")).getTime()) / 1e3);
}
function Vn(a) {
  return new Date(a * 1e3 + (/* @__PURE__ */ new Date("2021-01-01T00:00:00Z")).getTime());
}
function ct(a) {
  return ot().toString(36) + "-" + je.str(JSON.stringify(a)).toString(36);
}
function We(a) {
  return new Promise((t) => {
    setTimeout(t, a);
  });
}
class kt {
  //Send the job's transaction to its designated server
  static async send(t, e) {
    try {
      const r = new URL(t.url).origin !== self.location.origin ? "?enableCors=1" : "", s = await globalThis.fetch(
        t.url + "/api/post.json" + r,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...e ?? {} },
          body: JSON.stringify([t.transaction])
        }
      );
      if (!s.ok)
        throw new Error(`HTTP request failed with status ${s.status}` + (s.statusText ? `: ${s.statusText}` : ""));
      const n = await s.json();
      if (!n || !n.results)
        throw new Error("No response returned!");
      const i = n.results[t.transaction.hash];
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
        message: n.error ?? (Array.isArray(n.errors) ? n.errors.map((o) => (o == null ? void 0 : o.message) ?? o).join(" | ") : "Unknown error!")
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
        return t.close(), console.log(`There's missing stores, recreating the database. Available stores: ${t.objectStoreNames}`), await re("db_master"), await this.ping();
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
    for (const n of e)
      s.store.delete(n);
    s.store.put(t), await s.done, r.close();
  }
  /**
   * Opens a connection to the database.
   *
   * @returns instance of the database connection
   */
  async openConnection() {
    return await ht("db_master", 1, {
      upgrade: (t, e, r, s, n) => {
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
function Qt(a, t) {
  if (typeof a != "string" || t === null || typeof t != "object")
    return a;
  try {
    return JSON.parse(a);
  } catch {
    return a;
  }
}
function Tt(a, t) {
  if (a === t)
    return !0;
  if (a === null || t === null || typeof a != "object" || typeof t != "object" || Array.isArray(a) !== Array.isArray(t))
    return !1;
  const e = Object.keys(a);
  return e.length !== Object.keys(t).length ? !1 : e.every((r) => Object.hasOwn(t, r) && Tt(a[r], t[r]));
}
function de(a, t) {
  return Tt(Qt(a, t), t);
}
var St = [], Re, se = [];
function he(a, t) {
  const e = { ...t ?? Re ?? {} };
  let r;
  try {
    r = new URL(a).origin;
  } catch {
    return e;
  }
  for (const s of se)
    s.origin === r && Object.assign(e, s.headers);
  return e;
}
class Je {
  constructor(t, e, r) {
    //Properties
    m(this, "_db", null);
    m(this, "_currentTimestamp", null);
    m(this, "_localHeaders");
    m(this, "_postMessage");
    this._postMessage = t, this._localHeaders = e, r && (se = r);
  }
  //Update job
  async _updateJob(t) {
    var e;
    return await ((e = this._db) == null ? void 0 : e.put(v.store, t)), t;
  }
  //Delete job
  async _deleteJob(t) {
    var e;
    await ((e = this._db) == null ? void 0 : e.delete(v.store, t.id));
  }
  //Send job to clients
  _sendJobEvent(t) {
    if (typeof this._postMessage == "function")
      this._postMessage({ data: { job: t } });
    else
      for (const e of St)
        e == null || e.postMessage({ job: t });
  }
  //Get next job
  async _getNextJob() {
    var n;
    let t = null;
    const e = (n = this._db) == null ? void 0 : n.transaction(v.store, "readonly").store, r = this._currentTimestamp ? IDBKeyRange.lowerBound(this._currentTimestamp, !0) : null;
    let s = await (e == null ? void 0 : e.index(v.timeIndex).openCursor(r, "next"));
    for (; s; ) {
      if (s.value.status === _.Pending) {
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
    const e = [], r = t.transaction.action === M.Edit ? Object.keys(t.transaction.data)[0] : null, s = (o = this._db) == null ? void 0 : o.transaction(v.store, "readonly").store, n = IDBKeyRange.upperBound(t.createdAt, !0);
    let i = await (s == null ? void 0 : s.index(v.timeIndex).openCursor(n, "next"));
    for (; i; )
      //Only unresolved jobs
      i.value.status !== _.Completed && //Same destination
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
    if (e.find((n) => n.transaction.action === M.Edit && n.status === _.Conflict)) {
      r = !0;
      const n = await this._updateJob({
        ...t,
        status: _.Conflict
      });
      this._sendJobEvent(n);
    }
    return r;
  }
  //Handle preceding failed edit jobs check
  async _checkPrecedingFailedEditJobs(t, e) {
    var o, l;
    let r = !1;
    const s = e.filter((c) => c.transaction.action === M.Edit && (c.status === _.Pending || c.status === _.Failed)), n = Object.keys(t.transaction.data)[0], i = ((o = t.transaction.data) == null ? void 0 : o[n].new) !== void 0 && ((l = t.transaction.data) == null ? void 0 : l[n].prev) !== void 0;
    return s.length > 0 && i && (r = !0, t.attempts || await this._editAttemptHandler(t, s)), r;
  }
  //Handle merging with future edit jobs
  async _mergeWithFutureEditJobs(t) {
    var l, c, u;
    const e = [], r = Object.keys(t.transaction.data)[0], s = (l = this._db) == null ? void 0 : l.transaction(v.store, "readonly").store, n = IDBKeyRange.lowerBound(t.createdAt, !0);
    let i = await (s == null ? void 0 : s.index(v.timeIndex).openCursor(n, "next"));
    for (; i; )
      //Only unresolved jobs
      (i.value.status === _.Pending || i.value.status === _.Failed) && //Same destination
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
    var r, s, n;
    if (e.status === L.Success) {
      const i = await this._updateJob({
        ...t,
        status: _.Completed
      });
      this._sendJobEvent(i);
    } else if (e.status === L.Exception)
      await this._updateJob({
        ...t,
        status: _.Pending,
        attempts: t.attempts + 1,
        priority: t.priority < 5 ? t.priority + 1 : t.priority,
        message: e.message
      });
    else if (e.status === L.Failed)
      if (t.attempts > 0) {
        const i = await this._updateJob({
          ...t,
          status: _.Failed,
          message: e.message
        });
        this._sendJobEvent(i);
      } else
        await this._updateJob({
          ...t,
          status: _.Pending,
          attempts: t.attempts + 1,
          message: e.message
        });
    else if (e.status === L.Conflict) {
      const i = Object.keys(t.transaction.data)[0];
      if (Tt((r = t.transaction.data) == null ? void 0 : r[i].prev, (s = t.transaction.data) == null ? void 0 : s[i].new) || de(e.message, (n = t.transaction.data) == null ? void 0 : n[i].new)) {
        const o = await this._updateJob({
          ...t,
          status: _.Completed
        });
        this._sendJobEvent(o);
      } else {
        const o = await this._updateJob({
          ...t,
          status: _.Conflict,
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
    const n = {
      [r]: {
        prev: s.transaction.data[r].prev,
        new: (u = t.transaction.data) == null ? void 0 : u[r].new
      }
    }, i = (/* @__PURE__ */ new Date()).getTime();
    var o = {
      ...t,
      transaction: {
        ...t.transaction,
        data: n,
        blitzstamp: ot(),
        hash: ct({ ...n, blitzID: t.transaction.blitzID, timestamp: i })
      },
      dataHistory: [...t.dataHistory ?? [], { timestamp: i, type: "worker-attempt", data: t.transaction.data }]
    };
    await new X().recordRewrittenTransaction(o.transaction, []);
    let l;
    if (n[r].prev === n[r].new ? l = { status: L.Success } : l = await kt.send(o, he(o.url, this._localHeaders)), l.status === L.Success) {
      o = await this._updateJob({
        ...o,
        status: _.Completed
      });
      for (const g of e)
        await this._updateJob({
          ...g,
          status: _.Completed
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
      if (Tt((d = o.transaction.data) == null ? void 0 : d[r].prev, (h = o.transaction.data) == null ? void 0 : h[r].new) || de(l.message, (f = o.transaction.data) == null ? void 0 : f[r].new)) {
        o = await this._updateJob({
          ...o,
          status: _.Completed
        });
        for (const g of e)
          await this._updateJob({
            ...g,
            status: _.Completed
          });
        this._sendJobEvent(o);
      } else {
        o = await this._updateJob({
          ...o,
          status: _.Conflict,
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
    for (this._db = await ht(v.name, 1); ; ) {
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
        const i = await kt.send(t, he(t.url, this._localHeaders));
        await this._statusHandler(t, i);
      } catch (n) {
        if (n.message !== "SKIP") {
          console.error(n.stack);
          break;
        }
      }
      await new Promise((n) => setTimeout(n, 1e3));
    }
    this._db && this._db.close(), this.start();
  }
}
function fe(a) {
  St.push(a), a.onmessage = function(t) {
    t.data.type === "close" ? St = St.filter((e) => e !== a) : t.data.type === "headers" ? t.data.data && (Re = t.data.data) : t.data.type === "scopedHeaders" && t.data.data && (se = t.data.data);
  };
}
("SharedWorkerGlobalScope" in self || "WorkerGlobalScope" in self) && ("SharedWorkerGlobalScope" in self ? self.onconnect = (a) => fe(a.ports[0]) : fe(self), new Je().start());
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
var x = /* @__PURE__ */ ((a) => (a.Success = "success", a.Notice = "notice", a.Error = "error", a.Exception = "exception", a))(x || {});
class B {
  /**
   * Constructor.
   *
   * @param hash Hash of the transaction.
   * @param status Status of the transaction result.
   * @param message Message of the transaction.
   * @param conflict Whether it is a conflicting transaction or not.
   */
  constructor(t, e, r, s = null, n) {
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
    this.blitzID = t, this.hash = e, this.status = r, this.message = s, this.conflict = n;
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
class It extends Array {
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
    return new It(...this.filter((t) => t.status));
  }
  /**
   * Returns new transaction result collection that only contains failed transaction results.
   */
  failed() {
    return new It(...this.filter((t) => !t.status));
  }
}
let $e;
function Pr(a) {
  $e = a;
}
function G() {
  return $e;
}
class Ut {
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
    return new Ut();
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
    const e = new It(), r = Ut.create(), s = { add: 1, edit: 2, delete: 3 }, n = await new X().openConnection();
    t = t.sort((i, o) => s[i.action] - s[o.action]);
    for (const i of t) {
      let o;
      i.model === "@Model" ? i.model = "_Model" : i.model === "@Project" && (i.model = "_Project");
      try {
        if (i.action === "add")
          o = await this.processAddTransaction(i);
        else if (i.action === "edit")
          o = await this.processEditTransaction(i, n);
        else if (i.action === "delete")
          o = await this.processDeleteTransaction(i);
        else
          throw new Error(`Unknown action "${i.action}" on transaction ${i.hash}`);
        o.status === x.Success && await n.put("evaluated_transactions", i.toObject());
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
    return n.close(), e;
  }
  /**
   * Processes the `add` transaction.
   *
   * @param transaction Transaction to be processed.
   */
  async processAddTransaction(t) {
    var i;
    const e = await G().get(t.model), r = e.idbClient();
    if (await r.find(t.hash))
      return new B(
        t.hash,
        t.hash,
        x.Error,
        `Object with ${t.hash} already exists on ${t.model} model.`
      );
    const s = e.getClusterManager(), n = {
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
      o.setTime(t.blitzstamp * 1e3 + (/* @__PURE__ */ new Date("2021-01-01T00:00:00Z")).getTime()), o.setMinutes(o.getMinutes() - o.getTimezoneOffset()), n._publishingdate = o.toISOString().slice(0, 19).replace("T", " ");
    }
    return !n._userID && t.userhash && (n._userID = t.userhash), t.data = n, await r.create(n), new B(t.hash, t.hash, x.Success);
  }
  /**
   * Processes the `edit` transaction.
   *
   * @param transaction Transaction to be processed.
   */
  async processEditTransaction(t, e) {
    var c;
    const r = await G().get(t.model), s = r.idbClient(), n = Object.keys(t.data);
    if (n.length !== 1)
      return new B(
        t.blitzID,
        t.hash,
        x.Error,
        n.length > 1 ? "Can not edit more than one attribute at once." : "Attribute not provided to perform edit."
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
    const o = n.shift(), l = (c = r.getAttributeDetails(o)) == null ? void 0 : c.type;
    if (Array.isArray(l))
      if (Object.hasOwn(t.data[o], "add")) {
        i[o] = Array.isArray(i[o]) ? i[o] : [];
        const u = t.data[o].add;
        o.endsWith("_mtm") ? i[o].push({
          _blitzID: typeof u == "string" ? u : u._blitzID,
          _mtmSort: typeof u == "string" ? i[o].length ? Math.max(...i[o].map((h) => h._mtmSort)) + 15 : 15 : u._mtmSort
        }) : i[o].push(u);
      } else if (Object.hasOwn(t.data[o], "remove") && Array.isArray(i[o])) {
        const u = t.data[o].remove;
        o.endsWith("_mtm") ? i[o].splice(i[o].findIndex((h) => h._blitzID === u), 1) : i[o].splice(i[o].findIndex((h) => h === u), 1);
      } else
        return new B(t.blitzID, t.hash, x.Error, `Invalid operation for array attribute ${o}.`);
    else {
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
    const r = (await G().get(t.model)).idbClient();
    return await r.find(t.blitzID) ? (await r.delete(t.blitzID), new B(t.blitzID, t.hash, x.Success)) : new B(t.blitzID, t.hash, x.Error, `Object with ${t.blitzID} does not exists.`);
  }
}
class Er {
  //Constructor
  constructor(t) {
    //Properties
    m(this, "_db");
    this._db = t;
  }
  //Update job
  async _updateJob(t) {
    var e;
    return await ((e = this._db) == null ? void 0 : e.put(v.store, t)), t;
  }
  //Delete job
  async _deleteJob(t) {
    var e;
    await ((e = this._db) == null ? void 0 : e.delete(v.store, t.id));
  }
  //Get completed replicated jobs
  async _getCompletedReplicatedJobs(t) {
    var n;
    const e = [], r = (n = this._db) == null ? void 0 : n.transaction(v.store, "readonly").store;
    let s = await (r == null ? void 0 : r.openCursor(null, "next"));
    for (; s; )
      //Only completed jobs
      s.value.status === _.Completed && //Not the same destination
      s.value.url !== t.url && //Only edit jobs
      s.value.transaction.action === M.Edit && //Only same object jobs
      s.value.transaction.blitzID === t.transaction.blitzID && //Only same hash
      s.value.transaction.hash === t.transaction.hash && e.push(s.value), s = await s.continue();
    return e;
  }
  //Get future jobs
  async _getFutureJobs(t, e) {
    var o;
    const r = [], s = (o = this._db) == null ? void 0 : o.transaction(v.store, "readonly").store, n = IDBKeyRange.lowerBound(t.createdAt, !0);
    let i = await (s == null ? void 0 : s.index(v.timeIndex).openCursor(n, "next"));
    for (; i; )
      //Only conflict jobs
      i.value.status === _.Conflict && //Same destination
      i.value.url === t.url && //Only edit jobs
      i.value.transaction.action === M.Edit && //Only same object jobs
      i.value.transaction.blitzID === t.transaction.blitzID && //Only same attribute jobs
      Object.keys(i.value.transaction.data)[0] === e && r.push(i.value), i = await i.continue();
    return r;
  }
  //Merge with future jobs
  async _mergeWithFutureEditJobs(t, e) {
    var n, i;
    const r = await this._getFutureJobs(t, e);
    let s = t;
    if (r.length > 0) {
      const o = r[r.length - 1];
      if (o && ((n = o.transaction.data) == null ? void 0 : n[e].new) !== void 0 && ((i = t.transaction.data) == null ? void 0 : i[e].prev) !== void 0) {
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
    const { newJob: r, attribute: s } = e, n = `There was a conflict.
The data got changed to "${r.message}".
Do you still want to perform your change to "${(i = r.transaction.data) == null ? void 0 : i[s].new}"?`;
    await this._apply(r, confirm(n));
  }
  //Resolve a conflict without prompting: execute the local change (force) or take the server value (revert)
  async resolve(t, e) {
    const r = await this._prepare(t);
    r && await this._apply(r.newJob, e);
  }
  //Apply a resolution to an already-merged conflict job
  async _apply(t, e) {
    let r = t;
    e ? (r = await this.force(r), await y.queue.updateSyncStatus(r, _.Pending)) : (await this.revert(r), await y.queue.updateSyncStatus(r, _.Completed)), y.dispatchEvent("queue:conflict-resolved", r), y.queue.notifier.resolved(r.id);
  }
  //Force the job
  async force(t) {
    var o, l;
    const e = Object.keys(t.transaction.data)[0], r = await this._getFutureJobs(t, e), s = {
      [e]: {
        prev: Qt(t.message, (o = t.transaction.data) == null ? void 0 : o[e].new),
        new: (l = t.transaction.data) == null ? void 0 : l[e].new
      }
    }, n = (/* @__PURE__ */ new Date()).getTime(), i = await this._updateJob({
      ...t,
      status: _.Pending,
      transaction: {
        ...t.transaction,
        data: s,
        blitzstamp: ot(),
        hash: ct({ ...s, blitzID: t.transaction.blitzID, timestamp: n })
      },
      dataHistory: [...t.dataHistory ?? [], { timestamp: n, type: "conflict-force", data: t.transaction.data }]
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
        status: _.Pending
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
          new: Qt(t.message, (o = t.transaction.data) == null ? void 0 : o[e].new)
        }
      }
    });
    await q.create().run([r]);
    const s = await this._getFutureJobs(t, e), n = await this._getCompletedReplicatedJobs(t);
    for (const l of [t, ...s])
      await this._deleteJob(l);
    if (n.length > 0) {
      const l = n.map((c) => c.url).filter((c, u, d) => d.findIndex((h) => h === c) === u);
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
class vt {
  constructor() {
    m(this, "children");
    m(this, "isEndOfWord");
    m(this, "items");
    this.children = {}, this.isEndOfWord = !1, this.items = [];
  }
}
class xr {
  /**
   * Constructor for the Trie.
   *
   * @param model The model to build the Trie for.
   * @param data The data to build the Trie from.
   */
  constructor(t, e) {
    m(this, "root");
    if (this.root = new vt(), !e)
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
      typeof t[r] == "string" || typeof t[r] == "boolean" || (e.children[r] || (e.children[r] = new vt()), t[r].hasOwnProperty("isEndOfWord") && t[r].isEndOfWord && (e.children[r].isEndOfWord = !0, e.children[r].items = t[r].items), this._loadFromJson(t[r], e.children[r]));
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
    return this.root = new vt(), this._loadFromJson(t, this.root), this;
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
    return e.forEach((n) => {
      s == null || s.forEach((i) => {
        if (!n[i])
          return;
        n[i].toString().toLowerCase().split(" ").forEach((l) => {
          l !== "" && (r[l] ? r[l].items.push(n._blitzID) : r[l] = {
            items: [n._blitzID]
          });
        });
      });
    }), r;
  }
  getVariants(t) {
    const e = gt[t], r = [t];
    return e && r.push(...e), r;
  }
  generateAllPermutations(t, e, r, s, n) {
    if (e === r.length) {
      n.push(t);
      return;
    }
    const i = r[e], o = e !== r.length - 1 ? i + r[e + 1] : void 0;
    if (!gt[i] && !(o && gt[o])) {
      this.generateAllPermutations(
        t + i,
        e + 1,
        r,
        s,
        n
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
          n
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
          n
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
    const n = [];
    return this.generateAllPermutations("", 0, t, s, n), n;
  }
  insert(t, e) {
    let r = this.root;
    for (const s of t)
      r.children[s] || (r.children[s] = new vt()), r = r.children[s];
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
      const n = /* @__PURE__ */ new Set();
      this.addToSet(s, n);
      for (const i of r)
        n.has(i) || r.delete(i);
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
      const n = t.children[s], i = e + s;
      this.collectWords(n, i, r);
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
      const n = JSON.parse(s);
      if (typeof n == "number")
        return { timestamp: n, logID: null };
      if (n && typeof n.timestamp == "number")
        return { timestamp: n.timestamp, logID: typeof n.logID == "number" ? n.logID : null };
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
const He = {
  _blitzID: { type: "anonymous", label: "ID" },
  _userID: { type: "user", label: "User" },
  // a BlitzData epoch (seconds since 2021-01-01 UTC, see helpers.blitzstamp)
  // — its own type so UIs can present it as the creation date it is,
  // not the bare integer it is stored as
  _blitzstamp: { type: "blitzstamp", label: "Created" },
  _modified: { type: "datetime", label: "Modified" },
  _publishingdate: { type: "datetime", label: "Publishing date" },
  _expiration: { type: "datetime", label: "Expiration" }
}, Cr = "@me", me = (a) => {
  var t;
  return a === Cr ? ((t = S.getCurrentUser()) == null ? void 0 : t.id) ?? a : a;
};
function Be(a, t, e) {
  var s;
  let r = !0;
  for (const n of t) {
    if (!r)
      return !1;
    const [i, o, l] = n, c = (s = e == null ? void 0 : e[i]) == null ? void 0 : s.type;
    let u = a[i], d = l;
    const h = typeof o == "string" ? o.toUpperCase() : "";
    if (h === "IS NULL" || h === "IS NOT NULL") {
      const f = u == null;
      r = h === "IS NULL" ? f : !f;
      continue;
    }
    switch (i === "_userID" && (d = Array.isArray(d) ? d.map(me) : me(d)), typeof u == "string" && (c === "datetime" || c === "date" || i === "_publishingdate") && (u = new Date(u).getTime()), typeof d == "string" && (c === "datetime" || c === "date" || i === "_publishingdate") && (d = new Date(d).getTime()), o) {
      case "LIKE":
        const f = `${d}`.startsWith("%"), g = `${d}`.endsWith("%"), p = `${d}`.replaceAll("%", "");
        f === g ? r = `${u}`.includes(p) : f ? r = `${u}`.endsWith(p) : g && (r = `${u}`.startsWith(p));
        break;
      case "IN":
        r = (Array.isArray(d) ? d : [d]).includes(u);
        break;
      case "=":
        r = u === d;
        break;
      case "!=":
        r = u !== d;
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
class Ur {
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
    const r = await this.connect(), s = r.transaction("objects", "readonly").store, n = Array.from(s.indexNames), i = t.customSort && n.includes(t.customSort) ? t.customSort : n.includes("_projectsort") && (t.conditions ?? []).find((f) => f[0] === "project_fk" && f[1] === "=") ? "_projectsort" : n.includes("_sort") ? "_sort" : "_blitzstamp", o = t.customSortDirection === "ASC" ? "next" : "prev", l = t.pagination !== void 0 ? o === "next" ? IDBKeyRange.lowerBound(t.pagination.toString(), !0) : IDBKeyRange.upperBound(t.pagination.toString(), !0) : null;
    let c = await s.index(i).openCursor(l, o);
    const u = this.model.getAttributesDetails() ?? void 0;
    let d = [];
    for (; c; ) {
      if (e && !e.includes(c.value.blitzID)) {
        c = await c.continue();
        continue;
      }
      if (Be(c.value, t.conditions ?? [], u) && (d.push(c.value), t.limit && d.length >= t.limit))
        break;
      c = await c.continue();
    }
    if (r.close(), t.var && t.var.length > 0) {
      const f = ["_blitzID", "_localID", "@permissions", "_sort", "_clusters", "_editURLs", "_savetimestamp", ...t.var];
      for (const g of d)
        for (const p in g)
          f.includes(p) || delete g[p];
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
    const r = await this.connect(), s = new xr(this.model).loadFromJson(r.get("tree", this.model.getName()));
    r.close();
    const n = s.search(t);
    return t !== "" && n.length === 0 ? [] : this.query({ conditions: e }, n);
  }
  /**
   * Generates a tree by supplied data, then saves each item in the data to the database.
   *
   * @param objects list of native data in order to create the tree
   */
  async save(t, e = !1) {
    const r = await this.connect();
    for (const s of t) {
      let n = { ...s };
      const i = await r.get("objects", n._blitzID);
      if (i)
        n = { ...i, ...n };
      else if (e)
        continue;
      n._savetimestamp = ot(), await r.put("objects", n);
    }
    r.close();
  }
  /**
   * Connects to the database
   *
   * @returns instance of the database connection
   */
  async connect() {
    var n, i;
    const t = this.model.getAttributesDetails(), e = ["1", !0].includes((n = this.model._attributes.hassort) == null ? void 0 : n.value), r = e && ["1", !0].includes((i = this.model._attributes.hasprojects) == null ? void 0 : i.value);
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
class ae {
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
    const e = new ae();
    return e._cleanUp = this.subscribe((r) => {
      t(r) && e.emit(r);
    }), e;
  }
}
const xt = class xt {
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
    const r = e.get(t._blitzID.value), s = Object.keys(this.model.getAttributesDetails() ?? {}), n = y.options.sync.live === !0;
    for (const o of s) {
      const l = (i = t[o]) == null ? void 0 : i._value;
      if (l !== void 0) {
        const c = r[o];
        c && (c._value = l, c._valueSignal.set(l, n));
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
    xt.channel.emit(t);
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
        for (const n of Object.keys(t.data))
          s && r[n] && (r[n].value = s[n]);
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
    const e = [], r = Array.from(this.getAll().values()).map((f) => f.toObject()), s = this.model.getAttributesDetails() ?? void 0, n = Object.keys(s ?? {}), i = ["1", !0].includes((d = this.model._attributes.hassort) == null ? void 0 : d.value), o = i && ["1", !0].includes((h = this.model._attributes.hasprojects) == null ? void 0 : h.value), l = t.customSort && n.includes(t.customSort) ? t.customSort : o && (t.conditions ?? []).find((f) => f[0] === "project_fk" && f[1] === "=") ? "_projectsort" : i ? "_sort" : "_blitzstamp", c = t.customSortDirection ?? "DESC";
    r.sort((f, g) => {
      try {
        const p = parseInt(f[l]), D = parseInt(g[l]);
        if (p < D)
          return c === "ASC" ? -1 : 1;
        if (p > D)
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
      if (Be(f, t.conditions ?? [], s) && (e.push(f), t.limit && e.length >= t.limit))
        break;
    }
    if (t.var && t.var.length > 0) {
      const f = ["_blitzID", "_localID", "@permissions", "_sort", "_clusters", "_editURLs", "_savetimestamp", ...t.var];
      for (const g of e)
        for (const p in g)
          f.includes(p) || delete g[p];
    }
    return e;
  }
};
/**
 * Channel subject for updates.
 */
m(xt, "channel", new ae());
let At = xt;
const nt = "user.";
let qe;
function Lr(a) {
  qe = a;
}
function rt() {
  return qe;
}
function bt(a, t) {
  const e = a.filter((o) => {
    var l;
    return o.transaction.action === M.Edit && (t === void 0 || ((l = o.transaction.data) == null ? void 0 : l[t]) !== void 0);
  });
  let r = _.Pending, s;
  const n = e.find((o) => o.status === _.Failed), i = e.find((o) => o.status === _.Conflict && o.message !== void 0) ?? e.find((o) => o.status === _.Conflict);
  return n ? (r = _.Failed, s = n) : i ? (r = _.Conflict, s = i) : e.every((o) => o.status === _.Completed) && (r = _.Completed), { status: r, job: s };
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
    var s, n;
    const r = this._valueSignal.subscribe(t, e);
    return this._value === void 0 && ((n = (s = this._object) == null ? void 0 : s.model) == null || n.get({ blitzID: this._object._blitzID.value, forceHttp: !0 }).then((i) => {
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
    return e || rt().getJobsForObject((s = this._object) == null ? void 0 : s._blitzID.value).then((n) => {
      this._syncSignal.set(bt(n, this._name), !1), t(this._syncSignal.get());
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
class Ye extends U {
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
const Ve = 6048e5, Nr = 864e5, Dt = 43200, ge = 1440, we = Symbol.for("constructDateFrom");
function tt(a, t) {
  return typeof a == "function" ? a(t) : a && typeof a == "object" && we in a ? a[we](t) : a instanceof Date ? new a.constructor(t) : new Date(t);
}
function j(a, t) {
  return tt(t || a, a);
}
let Fr = {};
function _t() {
  return Fr;
}
function yt(a, t) {
  var o, l, c, u;
  const e = _t(), r = (t == null ? void 0 : t.weekStartsOn) ?? ((l = (o = t == null ? void 0 : t.locale) == null ? void 0 : o.options) == null ? void 0 : l.weekStartsOn) ?? e.weekStartsOn ?? ((u = (c = e.locale) == null ? void 0 : c.options) == null ? void 0 : u.weekStartsOn) ?? 0, s = j(a, t == null ? void 0 : t.in), n = s.getDay(), i = (n < r ? 7 : 0) + n - r;
  return s.setDate(s.getDate() - i), s.setHours(0, 0, 0, 0), s;
}
function Ot(a, t) {
  return yt(a, { ...t, weekStartsOn: 1 });
}
function Qe(a, t) {
  const e = j(a, t == null ? void 0 : t.in), r = e.getFullYear(), s = tt(e, 0);
  s.setFullYear(r + 1, 0, 4), s.setHours(0, 0, 0, 0);
  const n = Ot(s), i = tt(e, 0);
  i.setFullYear(r, 0, 4), i.setHours(0, 0, 0, 0);
  const o = Ot(i);
  return e.getTime() >= n.getTime() ? r + 1 : e.getTime() >= o.getTime() ? r : r - 1;
}
function zt(a) {
  const t = j(a), e = new Date(
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
  return e.setUTCFullYear(t.getFullYear()), +a - +e;
}
function Lt(a, ...t) {
  const e = tt.bind(
    null,
    a || t.find((r) => typeof r == "object")
  );
  return t.map(e);
}
function be(a, t) {
  const e = j(a, t == null ? void 0 : t.in);
  return e.setHours(0, 0, 0, 0), e;
}
function jr(a, t, e) {
  const [r, s] = Lt(
    e == null ? void 0 : e.in,
    a,
    t
  ), n = be(r), i = be(s), o = +n - zt(n), l = +i - zt(i);
  return Math.round((o - l) / Nr);
}
function Wr(a, t) {
  const e = Qe(a, t), r = tt((t == null ? void 0 : t.in) || a, 0);
  return r.setFullYear(e, 0, 4), r.setHours(0, 0, 0, 0), Ot(r);
}
function Mt(a, t) {
  const e = +j(a) - +j(t);
  return e < 0 ? -1 : e > 0 ? 1 : e;
}
function Rr(a) {
  return tt(a, Date.now());
}
function Jr(a) {
  return a instanceof Date || typeof a == "object" && Object.prototype.toString.call(a) === "[object Date]";
}
function $r(a) {
  return !(!Jr(a) && typeof a != "number" || isNaN(+j(a)));
}
function Hr(a, t, e) {
  const [r, s] = Lt(
    e == null ? void 0 : e.in,
    a,
    t
  ), n = r.getFullYear() - s.getFullYear(), i = r.getMonth() - s.getMonth();
  return n * 12 + i;
}
function Br(a) {
  return (t) => {
    const r = (a ? Math[a] : Math.trunc)(t);
    return r === 0 ? 0 : r;
  };
}
function qr(a, t) {
  return +j(a) - +j(t);
}
function Yr(a, t) {
  const e = j(a, t == null ? void 0 : t.in);
  return e.setHours(23, 59, 59, 999), e;
}
function Vr(a, t) {
  const e = j(a, t == null ? void 0 : t.in), r = e.getMonth();
  return e.setFullYear(e.getFullYear(), r + 1, 0), e.setHours(23, 59, 59, 999), e;
}
function Qr(a, t) {
  const e = j(a, t == null ? void 0 : t.in);
  return +Yr(e, t) == +Vr(e, t);
}
function Xr(a, t, e) {
  const [r, s, n] = Lt(
    e == null ? void 0 : e.in,
    a,
    a,
    t
  ), i = Mt(s, n), o = Math.abs(
    Hr(s, n)
  );
  if (o < 1)
    return 0;
  s.getMonth() === 1 && s.getDate() > 27 && s.setDate(30), s.setMonth(s.getMonth() - i * o);
  let l = Mt(s, n) === -i;
  Qr(r) && o === 1 && Mt(r, n) === 1 && (l = !1);
  const c = i * (o - +l);
  return c === 0 ? 0 : c;
}
function Kr(a, t, e) {
  const r = qr(a, t) / 1e3;
  return Br(e == null ? void 0 : e.roundingMethod)(r);
}
function Gr(a, t) {
  const e = j(a, t == null ? void 0 : t.in);
  return e.setFullYear(e.getFullYear(), 0, 1), e.setHours(0, 0, 0, 0), e;
}
const Zr = {
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
}, ts = (a, t, e) => {
  let r;
  const s = Zr[a];
  return typeof s == "string" ? r = s : t === 1 ? r = s.one : r = s.other.replace("{{count}}", t.toString()), e != null && e.addSuffix ? e.comparison && e.comparison > 0 ? "in " + r : r + " ago" : r;
};
function Z(a) {
  return (t = {}) => {
    const e = t.width ? String(t.width) : a.defaultWidth;
    return a.formats[e] || a.formats[a.defaultWidth];
  };
}
const es = {
  full: "EEEE, MMMM do, y",
  long: "MMMM do, y",
  medium: "MMM d, y",
  short: "MM/dd/yyyy"
}, rs = {
  full: "h:mm:ss a zzzz",
  long: "h:mm:ss a z",
  medium: "h:mm:ss a",
  short: "h:mm a"
}, ss = {
  full: "{{date}} 'at' {{time}}",
  long: "{{date}} 'at' {{time}}",
  medium: "{{date}}, {{time}}",
  short: "{{date}}, {{time}}"
}, as = {
  date: Z({
    formats: es,
    defaultWidth: "full"
  }),
  time: Z({
    formats: rs,
    defaultWidth: "full"
  }),
  dateTime: Z({
    formats: ss,
    defaultWidth: "full"
  })
}, ns = {
  lastWeek: "'last' eeee 'at' p",
  yesterday: "'yesterday at' p",
  today: "'today at' p",
  tomorrow: "'tomorrow at' p",
  nextWeek: "eeee 'at' p",
  other: "P"
}, is = (a, t, e, r) => ns[a];
function R(a) {
  return (t, e) => {
    const r = e != null && e.context ? String(e.context) : "standalone";
    let s;
    if (r === "formatting" && a.formattingValues) {
      const i = a.defaultFormattingWidth || a.defaultWidth, o = e != null && e.width ? String(e.width) : i;
      s = a.formattingValues[o] || a.formattingValues[i];
    } else {
      const i = a.defaultWidth, o = e != null && e.width ? String(e.width) : a.defaultWidth;
      s = a.values[o] || a.values[i];
    }
    const n = a.argumentCallback ? a.argumentCallback(t) : t;
    return s[n];
  };
}
const os = {
  narrow: ["B", "A"],
  abbreviated: ["BC", "AD"],
  wide: ["Before Christ", "Anno Domini"]
}, cs = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["Q1", "Q2", "Q3", "Q4"],
  wide: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"]
}, ls = {
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
}, us = {
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
}, ds = {
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
}, hs = {
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
}, fs = (a, t) => {
  const e = Number(a), r = e % 100;
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
}, ms = {
  ordinalNumber: fs,
  era: R({
    values: os,
    defaultWidth: "wide"
  }),
  quarter: R({
    values: cs,
    defaultWidth: "wide",
    argumentCallback: (a) => a - 1
  }),
  month: R({
    values: ls,
    defaultWidth: "wide"
  }),
  day: R({
    values: us,
    defaultWidth: "wide"
  }),
  dayPeriod: R({
    values: ds,
    defaultWidth: "wide",
    formattingValues: hs,
    defaultFormattingWidth: "wide"
  })
};
function J(a) {
  return (t, e = {}) => {
    const r = e.width, s = r && a.matchPatterns[r] || a.matchPatterns[a.defaultMatchWidth], n = t.match(s);
    if (!n)
      return null;
    const i = n[0], o = r && a.parsePatterns[r] || a.parsePatterns[a.defaultParseWidth], l = Array.isArray(o) ? ws(o, (d) => d.test(i)) : (
      // [TODO] -- I challenge you to fix the type
      gs(o, (d) => d.test(i))
    );
    let c;
    c = a.valueCallback ? a.valueCallback(l) : l, c = e.valueCallback ? (
      // [TODO] -- I challenge you to fix the type
      e.valueCallback(c)
    ) : c;
    const u = t.slice(i.length);
    return { value: c, rest: u };
  };
}
function gs(a, t) {
  for (const e in a)
    if (Object.prototype.hasOwnProperty.call(a, e) && t(a[e]))
      return e;
}
function ws(a, t) {
  for (let e = 0; e < a.length; e++)
    if (t(a[e]))
      return e;
}
function ne(a) {
  return (t, e = {}) => {
    const r = t.match(a.matchPattern);
    if (!r)
      return null;
    const s = r[0], n = t.match(a.parsePattern);
    if (!n)
      return null;
    let i = a.valueCallback ? a.valueCallback(n[0]) : n[0];
    i = e.valueCallback ? e.valueCallback(i) : i;
    const o = t.slice(s.length);
    return { value: i, rest: o };
  };
}
const bs = /^(\d+)(th|st|nd|rd)?/i, ys = /\d+/i, ps = {
  narrow: /^(b|a)/i,
  abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
  wide: /^(before christ|before common era|anno domini|common era)/i
}, _s = {
  any: [/^b/i, /^(a|c)/i]
}, vs = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](th|st|nd|rd)? quarter/i
}, Ds = {
  any: [/1/i, /2/i, /3/i, /4/i]
}, Ss = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
  wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i
}, Ms = {
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
}, ks = {
  narrow: /^[smtwf]/i,
  short: /^(su|mo|tu|we|th|fr|sa)/i,
  abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
  wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
}, Ts = {
  narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
  any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
}, Is = {
  narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
  any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
}, As = {
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
}, Os = {
  ordinalNumber: ne({
    matchPattern: bs,
    parsePattern: ys,
    valueCallback: (a) => parseInt(a, 10)
  }),
  era: J({
    matchPatterns: ps,
    defaultMatchWidth: "wide",
    parsePatterns: _s,
    defaultParseWidth: "any"
  }),
  quarter: J({
    matchPatterns: vs,
    defaultMatchWidth: "wide",
    parsePatterns: Ds,
    defaultParseWidth: "any",
    valueCallback: (a) => a + 1
  }),
  month: J({
    matchPatterns: Ss,
    defaultMatchWidth: "wide",
    parsePatterns: Ms,
    defaultParseWidth: "any"
  }),
  day: J({
    matchPatterns: ks,
    defaultMatchWidth: "wide",
    parsePatterns: Ts,
    defaultParseWidth: "any"
  }),
  dayPeriod: J({
    matchPatterns: Is,
    defaultMatchWidth: "any",
    parsePatterns: As,
    defaultParseWidth: "any"
  })
}, mt = {
  code: "en-US",
  formatDistance: ts,
  formatLong: as,
  formatRelative: is,
  localize: ms,
  match: Os,
  options: {
    weekStartsOn: 0,
    firstWeekContainsDate: 1
  }
};
function zs(a, t) {
  const e = j(a, t == null ? void 0 : t.in);
  return jr(e, Gr(e)) + 1;
}
function Ps(a, t) {
  const e = j(a, t == null ? void 0 : t.in), r = +Ot(e) - +Wr(e);
  return Math.round(r / Ve) + 1;
}
function Xe(a, t) {
  var u, d, h, f;
  const e = j(a, t == null ? void 0 : t.in), r = e.getFullYear(), s = _t(), n = (t == null ? void 0 : t.firstWeekContainsDate) ?? ((d = (u = t == null ? void 0 : t.locale) == null ? void 0 : u.options) == null ? void 0 : d.firstWeekContainsDate) ?? s.firstWeekContainsDate ?? ((f = (h = s.locale) == null ? void 0 : h.options) == null ? void 0 : f.firstWeekContainsDate) ?? 1, i = tt((t == null ? void 0 : t.in) || a, 0);
  i.setFullYear(r + 1, 0, n), i.setHours(0, 0, 0, 0);
  const o = yt(i, t), l = tt((t == null ? void 0 : t.in) || a, 0);
  l.setFullYear(r, 0, n), l.setHours(0, 0, 0, 0);
  const c = yt(l, t);
  return +e >= +o ? r + 1 : +e >= +c ? r : r - 1;
}
function Es(a, t) {
  var o, l, c, u;
  const e = _t(), r = (t == null ? void 0 : t.firstWeekContainsDate) ?? ((l = (o = t == null ? void 0 : t.locale) == null ? void 0 : o.options) == null ? void 0 : l.firstWeekContainsDate) ?? e.firstWeekContainsDate ?? ((u = (c = e.locale) == null ? void 0 : c.options) == null ? void 0 : u.firstWeekContainsDate) ?? 1, s = Xe(a, t), n = tt((t == null ? void 0 : t.in) || a, 0);
  return n.setFullYear(s, 0, r), n.setHours(0, 0, 0, 0), yt(n, t);
}
function xs(a, t) {
  const e = j(a, t == null ? void 0 : t.in), r = +yt(e, t) - +Es(e, t);
  return Math.round(r / Ve) + 1;
}
function T(a, t) {
  const e = a < 0 ? "-" : "", r = Math.abs(a).toString().padStart(t, "0");
  return e + r;
}
const et = {
  // Year
  y(a, t) {
    const e = a.getFullYear(), r = e > 0 ? e : 1 - e;
    return T(t === "yy" ? r % 100 : r, t.length);
  },
  // Month
  M(a, t) {
    const e = a.getMonth();
    return t === "M" ? String(e + 1) : T(e + 1, 2);
  },
  // Day of the month
  d(a, t) {
    return T(a.getDate(), t.length);
  },
  // AM or PM
  a(a, t) {
    const e = a.getHours() / 12 >= 1 ? "pm" : "am";
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
  h(a, t) {
    return T(a.getHours() % 12 || 12, t.length);
  },
  // Hour [0-23]
  H(a, t) {
    return T(a.getHours(), t.length);
  },
  // Minute
  m(a, t) {
    return T(a.getMinutes(), t.length);
  },
  // Second
  s(a, t) {
    return T(a.getSeconds(), t.length);
  },
  // Fraction of second
  S(a, t) {
    const e = t.length, r = a.getMilliseconds(), s = Math.trunc(
      r * Math.pow(10, e - 3)
    );
    return T(s, t.length);
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
}, ye = {
  // Era
  G: function(a, t, e) {
    const r = a.getFullYear() > 0 ? 1 : 0;
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
  y: function(a, t, e) {
    if (t === "yo") {
      const r = a.getFullYear(), s = r > 0 ? r : 1 - r;
      return e.ordinalNumber(s, { unit: "year" });
    }
    return et.y(a, t);
  },
  // Local week-numbering year
  Y: function(a, t, e, r) {
    const s = Xe(a, r), n = s > 0 ? s : 1 - s;
    if (t === "YY") {
      const i = n % 100;
      return T(i, 2);
    }
    return t === "Yo" ? e.ordinalNumber(n, { unit: "year" }) : T(n, t.length);
  },
  // ISO week-numbering year
  R: function(a, t) {
    const e = Qe(a);
    return T(e, t.length);
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
  u: function(a, t) {
    const e = a.getFullYear();
    return T(e, t.length);
  },
  // Quarter
  Q: function(a, t, e) {
    const r = Math.ceil((a.getMonth() + 1) / 3);
    switch (t) {
      case "Q":
        return String(r);
      case "QQ":
        return T(r, 2);
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
  q: function(a, t, e) {
    const r = Math.ceil((a.getMonth() + 1) / 3);
    switch (t) {
      case "q":
        return String(r);
      case "qq":
        return T(r, 2);
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
  M: function(a, t, e) {
    const r = a.getMonth();
    switch (t) {
      case "M":
      case "MM":
        return et.M(a, t);
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
  L: function(a, t, e) {
    const r = a.getMonth();
    switch (t) {
      case "L":
        return String(r + 1);
      case "LL":
        return T(r + 1, 2);
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
  w: function(a, t, e, r) {
    const s = xs(a, r);
    return t === "wo" ? e.ordinalNumber(s, { unit: "week" }) : T(s, t.length);
  },
  // ISO week of year
  I: function(a, t, e) {
    const r = Ps(a);
    return t === "Io" ? e.ordinalNumber(r, { unit: "week" }) : T(r, t.length);
  },
  // Day of the month
  d: function(a, t, e) {
    return t === "do" ? e.ordinalNumber(a.getDate(), { unit: "date" }) : et.d(a, t);
  },
  // Day of year
  D: function(a, t, e) {
    const r = zs(a);
    return t === "Do" ? e.ordinalNumber(r, { unit: "dayOfYear" }) : T(r, t.length);
  },
  // Day of week
  E: function(a, t, e) {
    const r = a.getDay();
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
  e: function(a, t, e, r) {
    const s = a.getDay(), n = (s - r.weekStartsOn + 8) % 7 || 7;
    switch (t) {
      case "e":
        return String(n);
      case "ee":
        return T(n, 2);
      case "eo":
        return e.ordinalNumber(n, { unit: "day" });
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
  c: function(a, t, e, r) {
    const s = a.getDay(), n = (s - r.weekStartsOn + 8) % 7 || 7;
    switch (t) {
      case "c":
        return String(n);
      case "cc":
        return T(n, t.length);
      case "co":
        return e.ordinalNumber(n, { unit: "day" });
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
  i: function(a, t, e) {
    const r = a.getDay(), s = r === 0 ? 7 : r;
    switch (t) {
      case "i":
        return String(s);
      case "ii":
        return T(s, t.length);
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
  a: function(a, t, e) {
    const s = a.getHours() / 12 >= 1 ? "pm" : "am";
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
  b: function(a, t, e) {
    const r = a.getHours();
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
  B: function(a, t, e) {
    const r = a.getHours();
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
  h: function(a, t, e) {
    if (t === "ho") {
      let r = a.getHours() % 12;
      return r === 0 && (r = 12), e.ordinalNumber(r, { unit: "hour" });
    }
    return et.h(a, t);
  },
  // Hour [0-23]
  H: function(a, t, e) {
    return t === "Ho" ? e.ordinalNumber(a.getHours(), { unit: "hour" }) : et.H(a, t);
  },
  // Hour [0-11]
  K: function(a, t, e) {
    const r = a.getHours() % 12;
    return t === "Ko" ? e.ordinalNumber(r, { unit: "hour" }) : T(r, t.length);
  },
  // Hour [1-24]
  k: function(a, t, e) {
    let r = a.getHours();
    return r === 0 && (r = 24), t === "ko" ? e.ordinalNumber(r, { unit: "hour" }) : T(r, t.length);
  },
  // Minute
  m: function(a, t, e) {
    return t === "mo" ? e.ordinalNumber(a.getMinutes(), { unit: "minute" }) : et.m(a, t);
  },
  // Second
  s: function(a, t, e) {
    return t === "so" ? e.ordinalNumber(a.getSeconds(), { unit: "second" }) : et.s(a, t);
  },
  // Fraction of second
  S: function(a, t) {
    return et.S(a, t);
  },
  // Timezone (ISO-8601. If offset is 0, output is always `'Z'`)
  X: function(a, t, e) {
    const r = a.getTimezoneOffset();
    if (r === 0)
      return "Z";
    switch (t) {
      case "X":
        return _e(r);
      case "XXXX":
      case "XX":
        return at(r);
      case "XXXXX":
      case "XXX":
      default:
        return at(r, ":");
    }
  },
  // Timezone (ISO-8601. If offset is 0, output is `'+00:00'` or equivalent)
  x: function(a, t, e) {
    const r = a.getTimezoneOffset();
    switch (t) {
      case "x":
        return _e(r);
      case "xxxx":
      case "xx":
        return at(r);
      case "xxxxx":
      case "xxx":
      default:
        return at(r, ":");
    }
  },
  // Timezone (GMT)
  O: function(a, t, e) {
    const r = a.getTimezoneOffset();
    switch (t) {
      case "O":
      case "OO":
      case "OOO":
        return "GMT" + pe(r, ":");
      case "OOOO":
      default:
        return "GMT" + at(r, ":");
    }
  },
  // Timezone (specific non-location)
  z: function(a, t, e) {
    const r = a.getTimezoneOffset();
    switch (t) {
      case "z":
      case "zz":
      case "zzz":
        return "GMT" + pe(r, ":");
      case "zzzz":
      default:
        return "GMT" + at(r, ":");
    }
  },
  // Seconds timestamp
  t: function(a, t, e) {
    const r = Math.trunc(+a / 1e3);
    return T(r, t.length);
  },
  // Milliseconds timestamp
  T: function(a, t, e) {
    return T(+a, t.length);
  }
};
function pe(a, t = "") {
  const e = a > 0 ? "-" : "+", r = Math.abs(a), s = Math.trunc(r / 60), n = r % 60;
  return n === 0 ? e + String(s) : e + String(s) + t + T(n, 2);
}
function _e(a, t) {
  return a % 60 === 0 ? (a > 0 ? "-" : "+") + T(Math.abs(a) / 60, 2) : at(a, t);
}
function at(a, t = "") {
  const e = a > 0 ? "-" : "+", r = Math.abs(a), s = T(Math.trunc(r / 60), 2), n = T(r % 60, 2);
  return e + s + t + n;
}
const ve = (a, t) => {
  switch (a) {
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
}, Ke = (a, t) => {
  switch (a) {
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
}, Cs = (a, t) => {
  const e = a.match(/(P+)(p+)?/) || [], r = e[1], s = e[2];
  if (!s)
    return ve(a, t);
  let n;
  switch (r) {
    case "P":
      n = t.dateTime({ width: "short" });
      break;
    case "PP":
      n = t.dateTime({ width: "medium" });
      break;
    case "PPP":
      n = t.dateTime({ width: "long" });
      break;
    case "PPPP":
    default:
      n = t.dateTime({ width: "full" });
      break;
  }
  return n.replace("{{date}}", ve(r, t)).replace("{{time}}", Ke(s, t));
}, Us = {
  p: Ke,
  P: Cs
}, Ls = /^D+$/, Ns = /^Y+$/, Fs = ["D", "DD", "YY", "YYYY"];
function js(a) {
  return Ls.test(a);
}
function Ws(a) {
  return Ns.test(a);
}
function Rs(a, t, e) {
  const r = Js(a, t, e);
  if (console.warn(r), Fs.includes(a))
    throw new RangeError(r);
}
function Js(a, t, e) {
  const r = a[0] === "Y" ? "years" : "days of the month";
  return `Use \`${a.toLowerCase()}\` instead of \`${a}\` (in \`${t}\`) for formatting ${r} to the input \`${e}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`;
}
const $s = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g, Hs = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g, Bs = /^'([^]*?)'?$/, qs = /''/g, Ys = /[a-zA-Z]/;
function Ge(a, t, e) {
  var u, d, h, f, g, p, D, z;
  const r = _t(), s = (e == null ? void 0 : e.locale) ?? r.locale ?? mt, n = (e == null ? void 0 : e.firstWeekContainsDate) ?? ((d = (u = e == null ? void 0 : e.locale) == null ? void 0 : u.options) == null ? void 0 : d.firstWeekContainsDate) ?? r.firstWeekContainsDate ?? ((f = (h = r.locale) == null ? void 0 : h.options) == null ? void 0 : f.firstWeekContainsDate) ?? 1, i = (e == null ? void 0 : e.weekStartsOn) ?? ((p = (g = e == null ? void 0 : e.locale) == null ? void 0 : g.options) == null ? void 0 : p.weekStartsOn) ?? r.weekStartsOn ?? ((z = (D = r.locale) == null ? void 0 : D.options) == null ? void 0 : z.weekStartsOn) ?? 0, o = j(a, e == null ? void 0 : e.in);
  if (!$r(o))
    throw new RangeError("Invalid time value");
  let l = t.match(Hs).map((N) => {
    const C = N[0];
    if (C === "p" || C === "P") {
      const Q = Us[C];
      return Q(N, s.formatLong);
    }
    return N;
  }).join("").match($s).map((N) => {
    if (N === "''")
      return { isToken: !1, value: "'" };
    const C = N[0];
    if (C === "'")
      return { isToken: !1, value: Vs(N) };
    if (ye[C])
      return { isToken: !0, value: N };
    if (C.match(Ys))
      throw new RangeError(
        "Format string contains an unescaped latin alphabet character `" + C + "`"
      );
    return { isToken: !1, value: N };
  });
  s.localize.preprocessor && (l = s.localize.preprocessor(o, l));
  const c = {
    firstWeekContainsDate: n,
    weekStartsOn: i,
    locale: s
  };
  return l.map((N) => {
    if (!N.isToken)
      return N.value;
    const C = N.value;
    (!(e != null && e.useAdditionalWeekYearTokens) && Ws(C) || !(e != null && e.useAdditionalDayOfYearTokens) && js(C)) && Rs(C, t, String(a));
    const Q = ye[C[0]];
    return Q(o, C, s.localize, c);
  }).join("");
}
function Vs(a) {
  const t = a.match(Bs);
  return t ? t[1].replace(qs, "'") : a;
}
function Qs(a, t, e) {
  const r = _t(), s = (e == null ? void 0 : e.locale) ?? r.locale ?? mt, n = 2520, i = Mt(a, t);
  if (isNaN(i))
    throw new RangeError("Invalid time value");
  const o = Object.assign({}, e, {
    addSuffix: e == null ? void 0 : e.addSuffix,
    comparison: i
  }), [l, c] = Lt(
    e == null ? void 0 : e.in,
    ...i > 0 ? [t, a] : [a, t]
  ), u = Kr(c, l), d = (zt(c) - zt(l)) / 1e3, h = Math.round((u - d) / 60);
  let f;
  if (h < 2)
    return e != null && e.includeSeconds ? u < 5 ? s.formatDistance("lessThanXSeconds", 5, o) : u < 10 ? s.formatDistance("lessThanXSeconds", 10, o) : u < 20 ? s.formatDistance("lessThanXSeconds", 20, o) : u < 40 ? s.formatDistance("halfAMinute", 0, o) : u < 60 ? s.formatDistance("lessThanXMinutes", 1, o) : s.formatDistance("xMinutes", 1, o) : h === 0 ? s.formatDistance("lessThanXMinutes", 1, o) : s.formatDistance("xMinutes", h, o);
  if (h < 45)
    return s.formatDistance("xMinutes", h, o);
  if (h < 90)
    return s.formatDistance("aboutXHours", 1, o);
  if (h < ge) {
    const g = Math.round(h / 60);
    return s.formatDistance("aboutXHours", g, o);
  } else {
    if (h < n)
      return s.formatDistance("xDays", 1, o);
    if (h < Dt) {
      const g = Math.round(h / ge);
      return s.formatDistance("xDays", g, o);
    } else if (h < Dt * 2)
      return f = Math.round(h / Dt), s.formatDistance("aboutXMonths", f, o);
  }
  if (f = Xr(c, l), f < 12) {
    const g = Math.round(h / Dt);
    return s.formatDistance("xMonths", g, o);
  } else {
    const g = f % 12, p = Math.trunc(f / 12);
    return g < 3 ? s.formatDistance("aboutXYears", p, o) : g < 9 ? s.formatDistance("overXYears", p, o) : s.formatDistance("almostXYears", p + 1, o);
  }
}
function Ze(a, t) {
  return Qs(a, Rr(a), t);
}
const De = {
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
}, Xs = (a, t, e) => {
  let r;
  const s = e != null && e.addSuffix ? De[a].withPreposition : De[a].standalone;
  return typeof s == "string" ? r = s : t === 1 ? r = s.one : r = s.other.replace("{{count}}", String(t)), e != null && e.addSuffix ? e.comparison && e.comparison > 0 ? "in " + r : "vor " + r : r;
}, Ks = {
  full: "EEEE, do MMMM y",
  // Montag, 7. Januar 2018
  long: "do MMMM y",
  // 7. Januar 2018
  medium: "do MMM y",
  // 7. Jan. 2018
  short: "dd.MM.y"
  // 07.01.2018
}, Gs = {
  full: "HH:mm:ss zzzz",
  long: "HH:mm:ss z",
  medium: "HH:mm:ss",
  short: "HH:mm"
}, Zs = {
  full: "{{date}} 'um' {{time}}",
  long: "{{date}} 'um' {{time}}",
  medium: "{{date}} {{time}}",
  short: "{{date}} {{time}}"
}, ta = {
  date: Z({
    formats: Ks,
    defaultWidth: "full"
  }),
  time: Z({
    formats: Gs,
    defaultWidth: "full"
  }),
  dateTime: Z({
    formats: Zs,
    defaultWidth: "full"
  })
}, ea = {
  lastWeek: "'letzten' eeee 'um' p",
  yesterday: "'gestern um' p",
  today: "'heute um' p",
  tomorrow: "'morgen um' p",
  nextWeek: "eeee 'um' p",
  other: "P"
}, ra = (a, t, e, r) => ea[a], sa = {
  narrow: ["v.Chr.", "n.Chr."],
  abbreviated: ["v.Chr.", "n.Chr."],
  wide: ["vor Christus", "nach Christus"]
}, aa = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["Q1", "Q2", "Q3", "Q4"],
  wide: ["1. Quartal", "2. Quartal", "3. Quartal", "4. Quartal"]
}, Xt = {
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
}, na = {
  narrow: Xt.narrow,
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
  wide: Xt.wide
}, ia = {
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
}, oa = {
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
}, ca = {
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
}, la = (a) => Number(a) + ".", ua = {
  ordinalNumber: la,
  era: R({
    values: sa,
    defaultWidth: "wide"
  }),
  quarter: R({
    values: aa,
    defaultWidth: "wide",
    argumentCallback: (a) => a - 1
  }),
  month: R({
    values: Xt,
    formattingValues: na,
    defaultWidth: "wide"
  }),
  day: R({
    values: ia,
    defaultWidth: "wide"
  }),
  dayPeriod: R({
    values: oa,
    defaultWidth: "wide",
    formattingValues: ca,
    defaultFormattingWidth: "wide"
  })
}, da = /^(\d+)(\.)?/i, ha = /\d+/i, fa = {
  narrow: /^(v\.? ?Chr\.?|n\.? ?Chr\.?)/i,
  abbreviated: /^(v\.? ?Chr\.?|n\.? ?Chr\.?)/i,
  wide: /^(vor Christus|vor unserer Zeitrechnung|nach Christus|unserer Zeitrechnung)/i
}, ma = {
  any: [/^v/i, /^n/i]
}, ga = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](\.)? Quartal/i
}, wa = {
  any: [/1/i, /2/i, /3/i, /4/i]
}, ba = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(j[aä]n|feb|mär[z]?|apr|mai|jun[i]?|jul[i]?|aug|sep|okt|nov|dez)\.?/i,
  wide: /^(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)/i
}, ya = {
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
}, pa = {
  narrow: /^[smdmf]/i,
  short: /^(so|mo|di|mi|do|fr|sa)/i,
  abbreviated: /^(son?|mon?|die?|mit?|don?|fre?|sam?)\.?/i,
  wide: /^(sonntag|montag|dienstag|mittwoch|donnerstag|freitag|samstag)/i
}, _a = {
  any: [/^so/i, /^mo/i, /^di/i, /^mi/i, /^do/i, /^f/i, /^sa/i]
}, va = {
  narrow: /^(vm\.?|nm\.?|Mitternacht|Mittag|morgens|nachm\.?|abends|nachts)/i,
  abbreviated: /^(vorm\.?|nachm\.?|Mitternacht|Mittag|morgens|nachm\.?|abends|nachts)/i,
  wide: /^(vormittags|nachmittags|Mitternacht|Mittag|morgens|nachmittags|abends|nachts)/i
}, Da = {
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
}, Sa = {
  ordinalNumber: ne({
    matchPattern: da,
    parsePattern: ha,
    valueCallback: (a) => parseInt(a)
  }),
  era: J({
    matchPatterns: fa,
    defaultMatchWidth: "wide",
    parsePatterns: ma,
    defaultParseWidth: "any"
  }),
  quarter: J({
    matchPatterns: ga,
    defaultMatchWidth: "wide",
    parsePatterns: wa,
    defaultParseWidth: "any",
    valueCallback: (a) => a + 1
  }),
  month: J({
    matchPatterns: ba,
    defaultMatchWidth: "wide",
    parsePatterns: ya,
    defaultParseWidth: "any"
  }),
  day: J({
    matchPatterns: pa,
    defaultMatchWidth: "wide",
    parsePatterns: _a,
    defaultParseWidth: "any"
  }),
  dayPeriod: J({
    matchPatterns: va,
    defaultMatchWidth: "wide",
    parsePatterns: Da,
    defaultParseWidth: "any"
  })
}, Pt = {
  code: "de",
  formatDistance: Xs,
  formatLong: ta,
  formatRelative: ra,
  localize: ua,
  match: Sa,
  options: {
    weekStartsOn: 1,
    firstWeekContainsDate: 4
  }
}, Ma = {
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
}, ka = (a, t, e) => {
  let r;
  const s = Ma[a];
  return typeof s == "string" ? r = s : t === 1 ? r = s.one : r = s.other.replace("{{count}}", String(t)), e != null && e.addSuffix ? e.comparison && e.comparison > 0 ? "dans " + r : "il y a " + r : r;
}, Ta = {
  full: "EEEE d MMMM y",
  long: "d MMMM y",
  medium: "d MMM y",
  short: "dd/MM/y"
}, Ia = {
  full: "HH:mm:ss zzzz",
  long: "HH:mm:ss z",
  medium: "HH:mm:ss",
  short: "HH:mm"
}, Aa = {
  full: "{{date}} 'à' {{time}}",
  long: "{{date}} 'à' {{time}}",
  medium: "{{date}}, {{time}}",
  short: "{{date}}, {{time}}"
}, Oa = {
  date: Z({
    formats: Ta,
    defaultWidth: "full"
  }),
  time: Z({
    formats: Ia,
    defaultWidth: "full"
  }),
  dateTime: Z({
    formats: Aa,
    defaultWidth: "full"
  })
}, za = {
  lastWeek: "eeee 'dernier à' p",
  yesterday: "'hier à' p",
  today: "'aujourd’hui à' p",
  tomorrow: "'demain à' p'",
  nextWeek: "eeee 'prochain à' p",
  other: "P"
}, Pa = (a, t, e, r) => za[a], Ea = {
  narrow: ["av. J.-C", "ap. J.-C"],
  abbreviated: ["av. J.-C", "ap. J.-C"],
  wide: ["avant Jésus-Christ", "après Jésus-Christ"]
}, xa = {
  narrow: ["T1", "T2", "T3", "T4"],
  abbreviated: ["1er trim.", "2ème trim.", "3ème trim.", "4ème trim."],
  wide: ["1er trimestre", "2ème trimestre", "3ème trimestre", "4ème trimestre"]
}, Ca = {
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
}, Ua = {
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
}, La = {
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
}, Na = (a, t) => {
  const e = Number(a), r = t == null ? void 0 : t.unit;
  if (e === 0)
    return "0";
  const s = ["year", "week", "hour", "minute", "second"];
  let n;
  return e === 1 ? n = r && s.includes(r) ? "ère" : "er" : n = "ème", e + n;
}, Fa = ["MMM", "MMMM"], ja = {
  preprocessor: (a, t) => a.getDate() === 1 || !t.some(
    (r) => r.isToken && Fa.includes(r.value)
  ) ? t : t.map(
    (r) => r.isToken && r.value === "do" ? { isToken: !0, value: "d" } : r
  ),
  ordinalNumber: Na,
  era: R({
    values: Ea,
    defaultWidth: "wide"
  }),
  quarter: R({
    values: xa,
    defaultWidth: "wide",
    argumentCallback: (a) => a - 1
  }),
  month: R({
    values: Ca,
    defaultWidth: "wide"
  }),
  day: R({
    values: Ua,
    defaultWidth: "wide"
  }),
  dayPeriod: R({
    values: La,
    defaultWidth: "wide"
  })
}, Wa = /^(\d+)(ième|ère|ème|er|e)?/i, Ra = /\d+/i, Ja = {
  narrow: /^(av\.J\.C|ap\.J\.C|ap\.J\.-C)/i,
  abbreviated: /^(av\.J\.-C|av\.J-C|apr\.J\.-C|apr\.J-C|ap\.J-C)/i,
  wide: /^(avant Jésus-Christ|après Jésus-Christ)/i
}, $a = {
  any: [/^av/i, /^ap/i]
}, Ha = {
  narrow: /^T?[1234]/i,
  abbreviated: /^[1234](er|ème|e)? trim\.?/i,
  wide: /^[1234](er|ème|e)? trimestre/i
}, Ba = {
  any: [/1/i, /2/i, /3/i, /4/i]
}, qa = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(janv|févr|mars|avr|mai|juin|juill|juil|août|sept|oct|nov|déc)\.?/i,
  wide: /^(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i
}, Ya = {
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
}, Va = {
  narrow: /^[lmjvsd]/i,
  short: /^(di|lu|ma|me|je|ve|sa)/i,
  abbreviated: /^(dim|lun|mar|mer|jeu|ven|sam)\.?/i,
  wide: /^(dimanche|lundi|mardi|mercredi|jeudi|vendredi|samedi)/i
}, Qa = {
  narrow: [/^d/i, /^l/i, /^m/i, /^m/i, /^j/i, /^v/i, /^s/i],
  any: [/^di/i, /^lu/i, /^ma/i, /^me/i, /^je/i, /^ve/i, /^sa/i]
}, Xa = {
  narrow: /^(a|p|minuit|midi|mat\.?|ap\.?m\.?|soir|nuit)/i,
  any: /^([ap]\.?\s?m\.?|du matin|de l'après[-\s]midi|du soir|de la nuit)/i
}, Ka = {
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
}, Ga = {
  ordinalNumber: ne({
    matchPattern: Wa,
    parsePattern: Ra,
    valueCallback: (a) => parseInt(a)
  }),
  era: J({
    matchPatterns: Ja,
    defaultMatchWidth: "wide",
    parsePatterns: $a,
    defaultParseWidth: "any"
  }),
  quarter: J({
    matchPatterns: Ha,
    defaultMatchWidth: "wide",
    parsePatterns: Ba,
    defaultParseWidth: "any",
    valueCallback: (a) => a + 1
  }),
  month: J({
    matchPatterns: qa,
    defaultMatchWidth: "wide",
    parsePatterns: Ya,
    defaultParseWidth: "any"
  }),
  day: J({
    matchPatterns: Va,
    defaultMatchWidth: "wide",
    parsePatterns: Qa,
    defaultParseWidth: "any"
  }),
  dayPeriod: J({
    matchPatterns: Xa,
    defaultMatchWidth: "any",
    parsePatterns: Ka,
    defaultParseWidth: "any"
  })
}, Et = {
  code: "fr",
  formatDistance: ka,
  formatLong: Oa,
  formatRelative: Pa,
  localize: ja,
  match: Ga,
  options: {
    weekStartsOn: 1,
    firstWeekContainsDate: 4
  }
}, Za = /^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$/;
class tn extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (t === "0000-00-00")
      return null;
    const e = t instanceof Date ? this.toDateString(t) : t;
    if (e != null && Za.test(e))
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
    const r = t === "fr" ? Et : t === "de" ? Pt : mt;
    let s = t === "de" ? "dd. MMMM yyyy" : "dd MMMM yyyy";
    return e && (s = "EEEE, " + s), Ge(
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
    const e = t === "fr" ? Et : t === "de" ? Pt : mt;
    return Ze(
      new Date(this._value),
      {
        addSuffix: !0,
        locale: e
      }
    );
  }
}
class tr extends U {
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
class en extends U {
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
class Kt extends U {
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
class rn extends tr {
  // ...
}
const sn = /^[0-9]{4}\-[0-9]{2}\-[0-9]{2}\s[0-9]{2}\:[0-9]{2}\:[0-9]{2}$/;
class an extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (t === "0000-00-00 00:00:00")
      return null;
    const e = t instanceof Date ? this.toDateString(t) : t;
    if (e != null && sn.test(e))
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
    const r = t === "fr" ? Et : t === "de" ? Pt : mt;
    let s = t === "de" ? "dd. MMMM yyyy" : "dd MMMM yyyy";
    return e && (s = "EEEE, " + s), Ge(
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
    const e = t === "fr" ? Et : t === "de" ? Pt : mt;
    return Ze(
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
class nn extends U {
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
    const r = await G().get(this._type), s = r == null ? void 0 : r.memoryClient().get(e);
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
class on extends U {
  /**
   * Retrieves the linked user.
   * Task: https://alpha.blitzdata.com/blitzpm/log/blitzsifeddine/2025-09-03/User%20type/2fra4l--t1g94e?proj=1s4dec-3ibnqe
   * 
   */
  async toUser() {
    const t = this.serialize();
    if (!t)
      return null;
    const e = await G().get("0BAUsers"), r = await (e == null ? void 0 : e.get({ blitzID: t, skipCacheUpdateIfFound: !0 }));
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
class er {
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
    var n, i, o, l, c, u, d, h, f, g, p, D;
    const e = new W({
      action: "edit",
      data: {
        [this._name]: {
          [t.action]: t.value
        }
      },
      model: (i = (n = this._object) == null ? void 0 : n.model) == null ? void 0 : i.getName(),
      blitzID: (o = this._object) == null ? void 0 : o._blitzID.value
    }), r = await q.create().run([e]);
    if (r[0].status !== x.Success && r[0].status !== x.Notice)
      throw new Error(r[0].message ?? "Unknown Error! Please try again.");
    for (const z of ((c = (l = this._object) == null ? void 0 : l._editURLs) == null ? void 0 : c.value) ?? [])
      await rt().addJob(z, e.toObject());
    const s = await ((d = (u = this._object) == null ? void 0 : u.model) == null ? void 0 : d.get({ blitzID: this._object._blitzID.value, forceLocal: !0, raw: !0 }));
    s && Array.isArray(s[this._name]) && (this.value = s[this._name]), (f = (h = this._object) == null ? void 0 : h.model) == null || f.memoryClient().emit(e), (g = this._object) == null || g.dispatchEvent("edit", e.data), (D = (p = this._object) == null ? void 0 : p.model) == null || D.setLastTransactionHash(e.hash);
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
    var s, n;
    const r = this._valueSignal.subscribe(t, e);
    return this._value === void 0 && ((n = (s = this._object) == null ? void 0 : s.model) == null || n.get({ blitzID: this._object._blitzID.value, forceHttp: !0, query: { manyToMany: "object" } }).then((i) => {
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
    return e || rt().getJobsForObject((s = this._object) == null ? void 0 : s._blitzID.value).then((n) => {
      this._syncSignal.set(bt(n, this._name), !1), t(this._syncSignal.get());
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
class cn extends er {
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
    const r = await G().get(this._type), s = r == null ? void 0 : r.memoryClient(), n = [];
    for (const i of e) {
      if (!i._blitzID)
        continue;
      const o = s == null ? void 0 : s.get(i._blitzID);
      if (o) {
        n.push(o);
        continue;
      }
      const l = await (r == null ? void 0 : r.get({ skipCacheUpdateIfFound: !0, ...t, raw: !1, blitzID: i._blitzID }));
      l && n.push(l);
    }
    return n;
  }
}
function ln(a) {
  return a && a.constructor && typeof a.constructor.isBuffer == "function" && a.constructor.isBuffer(a);
}
function un(a) {
  return a;
}
function dn(a, t) {
  t = t || {};
  const e = t.delimiter || ".", r = t.maxDepth, s = t.transformKey || un, n = {};
  function i(o, l, c) {
    c = c || 1, Object.keys(o).forEach(function(u) {
      const d = o[u], h = t.safe && Array.isArray(d), f = Object.prototype.toString.call(d), g = ln(d), p = f === "[object Object]" || f === "[object Array]", D = l ? l + e + s(u) : s(u);
      if (!h && !g && p && Object.keys(d).length && (!t.maxDepth || c < r))
        return i(d, D, c + 1);
      n[D] = d;
    });
  }
  return i(a), n;
}
class hn extends U {
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
    return dn(this._value ?? {});
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
class fn extends U {
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
class mn extends U {
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
class ie extends U {
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
class gn extends Kt {
  // ...
}
class wn extends ie {
  // ...
}
class bn extends ie {
  /**
   * Returns the precentage value.
   */
  toPercentage() {
    return this._value != null ? (this._value * 100).toString() + "%" : null;
  }
}
const Se = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
class yn extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (t != null && Se.test(t))
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
    return Se.test(t);
  }
}
const Me = /^\+[1-9]{1,3}\-[0-9]{7,14}$/;
class pn extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (t != null && Me.test(t))
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
    return Me.test(t);
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
const ke = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;
class _n extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (t != null && ke.test(t))
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
    return ke.test(t);
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
class vn extends U {
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
class Dn extends U {
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
class Sn extends U {
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
const Te = /^https?:\/\/[^\s]+$/i;
class Mn extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (typeof t == "string" && Te.test(t))
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
    return Te.test(t);
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
class kn extends U {
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
        const n = s.results[0].geometry.location;
        return {
          lat: n.lat.toString(),
          lng: n.lng.toString()
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
    var n;
    if (t.endsWith("_fk"))
      return new nn(t, e, r);
    const s = (n = He[t]) == null ? void 0 : n.type;
    return typeof s == "string" && (e = s), e === "user" ? new on(t, e, r) : e === "int" ? new Kt(t, "int", r) : e === "blitzstamp" ? new Kt(t, e, r) : e === "tinyint" ? new gn(t, e, r) : e === "double" ? new wn(t, e, r) : e === "float" ? new ie(t, e, r) : e === "percentage" ? new bn(t, e, r) : e === "varchar" ? new rn(t, e, r) : e === "text" ? new tr(t, e, r) : e === "htmlText" ? new en(t, e, r) : e === "enum" ? new mn(t, e, r) : e === "json" ? new hn(t, e, r) : e === "boolean" ? new Ye(t, e, r) : e === "datetime" ? new an(t, "datetime", r) : e === "date" ? new tn(t, e, r) : e === "code" ? new fn(t, e, r) : e === "email" ? new yn(t, e, r) : e === "phone" ? new pn(t, e, r) : e === "url" ? new _n(t, e, r) : e === "image" ? new vn(t, e, r) : e === "video" ? new Dn(t, e, r) : e === "file" ? new Sn(t, e, r) : e === "pdf" ? new Mn(t, e, r) : e === "location" ? new kn(t, e, r) : new wt(t, e, r);
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
    return t.endsWith("_mtm") ? new cn(t, e, r) : new er(t, e, r);
  }
  /**
   * Unserializes given data to be used within library.
   *
   * @param attributes
   * @param data
   */
  static unserialize(t, e) {
    var n, i, o;
    const r = {}, s = [...Object.keys(t), ...Object.keys(e)].filter((l, c, u) => u.indexOf(l) === c);
    for (const l of s)
      Array.isArray((n = t[l]) == null ? void 0 : n.type) ? r[l] = H.createMany(l, ((i = t[l]) == null ? void 0 : i.type[0]) ?? "anonymous", e[l]) : r[l] = H.createType(
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
class E {
  /**
   * Create a list endpoint.
   *
   * @param baseUrl Base URL.
   * @param modelName Model name.
   * @param query Query parameters to be appended to the endpoint.
   */
  static createListEndpoint(t, e, r) {
    var i;
    const s = `${E.sanitizeBaseUrl(t)}api/list/${e}.json`, n = new URLSearchParams();
    return new URL(t).origin !== window.location.origin && n.append("enableCors", "1"), n.append("fkOptions", JSON.stringify({ _userID: "blitzID" })), (i = r.conditions) != null && i.length && n.append("conditions", JSON.stringify(r.conditions)), r.limit && n.append("limit", r.limit.toString()), r.customSort && n.append("customSort", r.customSort), r.customSortDirection && n.append("customSortDirection", r.customSortDirection), r.pagination && n.append("pagination", r.pagination.toString()), r.var && r.var.length > 0 && n.append("var", JSON.stringify(r.var)), r.manyToMany && n.append("manyToMany", r.manyToMany), `${s}?${n.toString()}`;
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
    const n = `${E.sanitizeBaseUrl(t)}api/list/${e}/_blitzID/${r}.json`, i = new URLSearchParams();
    return new URL(t).origin !== window.location.origin && i.append("enableCors", "1"), i.append("fkOptions", JSON.stringify({ _userID: "blitzID" })), s.var && s.var.length > 0 && i.append("var", JSON.stringify(s.var)), s.manyToMany && i.append("manyToMany", s.manyToMany), `${n}?${i.toString()}`;
  }
  /**
   * Create a get history endpoint.
   *
   * @param baseUrl Base URL.
   * @param modelName Model name.
   * @param blitzID Id of the object.
   */
  static createGetHistoryEndpoint(t, e, r) {
    const s = `${E.sanitizeBaseUrl(t)}api/getHistory/${e}/${r}.json`;
    return new URL(t).origin !== window.location.origin ? `${s}?enableCors=1` : s;
  }
  /**
   * Create a post endpoint.
   *
   * @param baseUrl Base URL.
   */
  static createPostEndpoint(t) {
    return `${E.sanitizeBaseUrl(t)}api/post.json`;
  }
  /**
   * Create a ping endpoint.
   *
   * @param baseUrl Base URL.
   */
  static createPingEndpoint(t) {
    return `${E.sanitizeBaseUrl(t)}api/ping.json`;
  }
  /**
   * Create a list logs endpoint.
   *
   * @param baseUrl Base URL.
   * @param model
   * @param query
   */
  static createListLogsEndpoint(t) {
    var n, i, o, l;
    const e = t.type === "delete" ? "listDeletedLogs" : "listLogs", r = t.model ? `${E.sanitizeBaseUrl(t.baseUrl)}api/${e}/${t.model}.json` : `${E.sanitizeBaseUrl(t.baseUrl)}api/${e}.json`, s = new URLSearchParams();
    return ((n = t.query) == null ? void 0 : n.from) !== void 0 && s.append("from", t.query.from.toString()), ((i = t.query) == null ? void 0 : i.afterLog) !== void 0 && t.model && s.append("afterLog", t.query.afterLog.toString()), ((o = t.query) == null ? void 0 : o.peek) === !0 && t.model && s.append("peek", "1"), (l = t.query) != null && l.models && !t.model && s.append("models", JSON.stringify(t.query.models)), `${r}?${s.toString()}`;
  }
  /**
   * Create an uploader endpoint.
   *
   * @param baseUrl Base URL.
   */
  static createUploaderEndpoint(t) {
    const e = new URL(t).origin !== window.location.origin ? "?enableCors=1" : "";
    return `${E.sanitizeBaseUrl(t)}uploader/index` + e;
  }
  /**
   * Create a video uploader endpoint.
   *
   * @param baseUrl Base URL.
   */
  static createVideoUploaderEndpoint(t, e) {
    const r = new URL(t).origin !== window.location.origin ? "?enableCors=1" : "", s = (r ? r + "&" : "?") + `filename=${e}`;
    return `${E.sanitizeBaseUrl(t)}uploadervideo/index` + s;
  }
  /**
   * Create a file uploader endpoint.
   *
   * @param baseUrl Base URL.
   */
  static createFileUploaderEndpoint(t) {
    const e = new URL(t).origin !== window.location.origin ? "?enableCors=1" : "";
    return `${E.sanitizeBaseUrl(t)}uploaderfile/index` + e;
  }
  /**
   * Sanitize the base URL.
   *
   * @param baseUrl Base URL.
   */
  static sanitizeBaseUrl(t) {
    const e = new URL(t);
    if (!e.origin || !e.pathname || !e.protocol.match(/^https?:$/))
      throw new Error(`Supplied base URL is invalid: ${t}`);
    return e.pathname.endsWith("/") && (e.pathname = e.pathname.slice(0, -1)), e.toString();
  }
}
class rr extends Error {
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
    const r = await P.create().url(
      // We got 2 urls, because it is possible to have a full url.
      // See `BlitzData.list()` and `BlitzData.listRaw()` methods.
      t.fullUrl ? t.fullUrl : E.createListEndpoint(t.endpoint.baseUrl, t.endpoint.modelName, t.endpoint.query)
    ).signal(e).get();
    if (!Array.isArray(r.items) && Array.isArray(r.errors))
      throw new Error(r.errors.map((s) => (s == null ? void 0 : s.message) ?? s).join(" | "));
    return r;
  }
  /**
   * Performs a get call to the server by provided options.
   */
  static async get(t, e) {
    const r = await P.create().url(
      E.createGetEndpoint(t.baseUrl, t.modelName, t.blitzID, t.query)
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
    const e = await P.create().url(E.createPostEndpoint(t.baseUrl)).body(t.transactions).post();
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
    const e = await P.create().url(E.createListLogsEndpoint(t)).get();
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
    const r = await P.create().url(E.createGetHistoryEndpoint(t.baseUrl, t.modelName, t.blitzID)).signal(e).get();
    if (!Array.isArray(r.data)) {
      if ((s = r.errors) != null && s.length)
        throw new Error(r.errors.map((i) => (i == null ? void 0 : i.message) ?? i).join(" | "));
      const n = `History of "${t.modelName}/${t.blitzID}" is not readable: the record may not exist or you may lack permission.`;
      throw !r.error && r.userID !== void 0 ? new rr(n) : new Error(r.error ?? n);
    }
    return r.data.map((n) => ({
      ...n,
      data: typeof n.data == "object" && n.data !== null ? JSON.stringify(n.data) : n.data,
      newValue: typeof n.newValue == "object" && n.newValue !== null ? JSON.stringify(n.newValue) : n.newValue
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
    const r = P.create().url(E.createUploaderEndpoint(t.baseUrl)).body(e).header("Accept", "application/json");
    t.modelName && r.header("Bb-Target-Model", t.modelName), t.attributeName && r.header("Bb-Target-Attribute", t.attributeName);
    const s = await r.post(), n = {};
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
      ].includes(i) && (n[i] = o);
    return n;
  }
  /**
   * Performs a video upload call to the server by given base URL and video file.
   *
   * @param options Upload options.
   */
  static async uploadVideo(t) {
    const e = new FormData();
    e.append("fileToUpload", t.video);
    const r = t.video.name.split("."), s = r.length > 1 ? "." + r.pop() : "", n = crypto.randomUUID() + s, i = P.create().url(E.createVideoUploaderEndpoint(t.baseUrl, n)).body(e).header("Accept", "application/json");
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
    const r = P.create().url(E.createFileUploaderEndpoint(t.baseUrl)).body(e).header("Accept", "application/json");
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
    return await P.create().url(E.createPingEndpoint(t)).get();
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
      const s = (u = (c = this.model) == null ? void 0 : c.getAttributeDetails(t)) == null ? void 0 : u.type, n = H.createType(t, s, e).serialize(), i = r ? H.createType(t, s, r).serialize() : this.getAttribute(t).serialize(), o = new W({
        action: "edit",
        data: {
          [t]: {
            prev: i,
            new: n
          }
        },
        model: this.model.getName(),
        blitzID: this.getAttribute("_blitzID").value
      }), l = await q.create().run([o]);
      if (l[0].status !== x.Success && l[0].status !== x.Notice)
        throw new Error(l[0].message ?? "Unknown Error! Please try again.");
      this._attributes[t].value = n;
      for (const f of this.getAttribute("_editURLs").value)
        await rt().addJob(f, o.toObject());
      (d = this.model) == null || d.memoryClient().emit(o), this.dispatchEvent("edit", o.data), (h = this.model) == null || h.setLastTransactionHash(o.hash);
    });
  }
  /**
   * Deletes of object.
   */
  async delete() {
    var s, n;
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
    r == null || r.emit(t), this.dispatchEvent("delete", null), (n = this.model) == null || n.setLastTransactionHash(t.hash);
  }
  syncStatus(t) {
    if (!t)
      return rt().getJobsForObject(this.getAttribute("_blitzID").value).then((s) => s.every((n) => n.status === _.Completed));
    const e = this._syncSignal.get() !== null, r = this._syncSignal.subscribe(t, e);
    return e || rt().getJobsForObject(this.getAttribute("_blitzID").value).then((s) => {
      this._syncSignal.set(bt(s), !1), t(this._syncSignal.get());
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
    }), n = [];
    for (const o of this.getAttribute("_editURLs").value)
      n.push(
        await kt.send(
          { url: o, transaction: s.toObject() },
          P._globalHeaders
        )
      );
    const i = n.find((o) => o.status !== L.Success);
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
    const e = t.startsWith(nt) ? t : nt + t;
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
    const r = t.startsWith(nt) ? t.slice(nt.length) : t, s = nt + r, n = (h = this.model) == null ? void 0 : h.getUserAttributeDetails(s);
    if (!n)
      throw new Error(`'${r}' is not a per-user field declared on ${((f = this.model) == null ? void 0 : f.getName()) ?? "this model"}.`);
    const i = H.createType(r, n.type, e).serialize(), o = this.getAttribute("_blitzID").value, l = { [r]: i }, c = new W({
      action: "editUserField",
      model: this.model.getName(),
      blitzID: o,
      data: l,
      hash: ct(l)
    }), u = [];
    for (const g of this.getAttribute("_editURLs").value)
      u.push(
        await kt.send(
          { url: g, transaction: c.toObject() },
          P._globalHeaders
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
    for (const n of e)
      try {
        return await st.getHistory({
          baseUrl: n,
          modelName: this.model.getName(),
          blitzID: this.getAttribute("_blitzID").value
        }, t);
      } catch (i) {
        if (i instanceof rr || (i == null ? void 0 : i.name) === "AbortError")
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
class Gt {
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
class Zt {
  /**
   * Extract model name from the given `list` URL.
   *
   * @param url The URL to extract the model name from.
   *
   * @returns The model name.
   */
  static extractModelName(t) {
    const s = new URL(t).pathname.split("/").filter((n) => n !== "").pop();
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
const Tn = {
  /**
   * Get handler for the object.
   *
   * @param target BDObject that's being proxied.
   * @param key wanted key.
   */
  get(a, t) {
    if (Reflect.has(a, t)) {
      const e = Reflect.get(a, t);
      return e instanceof Function ? e.bind(a) : e;
    }
    return a._attributes[t];
  },
  /**
   * Set handler for the object.
   */
  set(a, t, e) {
    throw new Error("Setting values directly not supported. Please use `edit` method to change a value for an attribute.");
  }
};
class sr {
  /**
   * Creates new BDObject with supplied type, model and attributes.
   *
   * @param type
   * @param model
   * @param data
   * @param updateMemory
   */
  static create(t, e, r) {
    const s = e.getAttributesDetails() ?? {}, n = H.unserialize(s, r), i = new Proxy(new t({
      model: e,
      attributes: n
    }), Tn);
    for (const o in n)
      n[o].withObject(i);
    return e.memoryClient().update(i);
  }
}
var ar = { exports: {} }, nr = { exports: {} };
(function() {
  var a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", t = {
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
      for (var r = [], s = 0, n = 0; s < e.length; s++, n += 8)
        r[n >>> 5] |= e[s] << 24 - n % 32;
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
        for (var n = e[s] << 16 | e[s + 1] << 8 | e[s + 2], i = 0; i < 4; i++)
          s * 8 + i * 6 <= e.length * 8 ? r.push(a.charAt(n >>> 6 * (3 - i) & 63)) : r.push("=");
      return r.join("");
    },
    // Convert a base-64 string to a byte array
    base64ToBytes: function(e) {
      e = e.replace(/[^A-Z0-9+\/]/ig, "");
      for (var r = [], s = 0, n = 0; s < e.length; n = ++s % 4)
        n != 0 && r.push((a.indexOf(e.charAt(s - 1)) & Math.pow(2, -2 * n + 8) - 1) << n * 2 | a.indexOf(e.charAt(s)) >>> 6 - n * 2);
      return r;
    }
  };
  nr.exports = t;
})();
var In = nr.exports, te = {
  // UTF-8 encoding
  utf8: {
    // Convert a string to a byte array
    stringToBytes: function(a) {
      return te.bin.stringToBytes(unescape(encodeURIComponent(a)));
    },
    // Convert a byte array to a string
    bytesToString: function(a) {
      return decodeURIComponent(escape(te.bin.bytesToString(a)));
    }
  },
  // Binary encoding
  bin: {
    // Convert a string to a byte array
    stringToBytes: function(a) {
      for (var t = [], e = 0; e < a.length; e++)
        t.push(a.charCodeAt(e) & 255);
      return t;
    },
    // Convert a byte array to a string
    bytesToString: function(a) {
      for (var t = [], e = 0; e < a.length; e++)
        t.push(String.fromCharCode(a[e]));
      return t.join("");
    }
  }
}, Ie = te;
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
var An = function(a) {
  return a != null && (ir(a) || On(a) || !!a._isBuffer);
};
function ir(a) {
  return !!a.constructor && typeof a.constructor.isBuffer == "function" && a.constructor.isBuffer(a);
}
function On(a) {
  return typeof a.readFloatLE == "function" && typeof a.slice == "function" && ir(a.slice(0, 0));
}
(function() {
  var a = In, t = Ie.utf8, e = An, r = Ie.bin, s = function(n, i) {
    n.constructor == String ? i && i.encoding === "binary" ? n = r.stringToBytes(n) : n = t.stringToBytes(n) : e(n) ? n = Array.prototype.slice.call(n, 0) : !Array.isArray(n) && n.constructor !== Uint8Array && (n = n.toString());
    for (var o = a.bytesToWords(n), l = n.length * 8, c = 1732584193, u = -271733879, d = -1732584194, h = 271733878, f = 0; f < o.length; f++)
      o[f] = (o[f] << 8 | o[f] >>> 24) & 16711935 | (o[f] << 24 | o[f] >>> 8) & 4278255360;
    o[l >>> 5] |= 128 << l % 32, o[(l + 64 >>> 9 << 4) + 14] = l;
    for (var g = s._ff, p = s._gg, D = s._hh, z = s._ii, f = 0; f < o.length; f += 16) {
      var N = c, C = u, Q = d, Nt = h;
      c = g(c, u, d, h, o[f + 0], 7, -680876936), h = g(h, c, u, d, o[f + 1], 12, -389564586), d = g(d, h, c, u, o[f + 2], 17, 606105819), u = g(u, d, h, c, o[f + 3], 22, -1044525330), c = g(c, u, d, h, o[f + 4], 7, -176418897), h = g(h, c, u, d, o[f + 5], 12, 1200080426), d = g(d, h, c, u, o[f + 6], 17, -1473231341), u = g(u, d, h, c, o[f + 7], 22, -45705983), c = g(c, u, d, h, o[f + 8], 7, 1770035416), h = g(h, c, u, d, o[f + 9], 12, -1958414417), d = g(d, h, c, u, o[f + 10], 17, -42063), u = g(u, d, h, c, o[f + 11], 22, -1990404162), c = g(c, u, d, h, o[f + 12], 7, 1804603682), h = g(h, c, u, d, o[f + 13], 12, -40341101), d = g(d, h, c, u, o[f + 14], 17, -1502002290), u = g(u, d, h, c, o[f + 15], 22, 1236535329), c = p(c, u, d, h, o[f + 1], 5, -165796510), h = p(h, c, u, d, o[f + 6], 9, -1069501632), d = p(d, h, c, u, o[f + 11], 14, 643717713), u = p(u, d, h, c, o[f + 0], 20, -373897302), c = p(c, u, d, h, o[f + 5], 5, -701558691), h = p(h, c, u, d, o[f + 10], 9, 38016083), d = p(d, h, c, u, o[f + 15], 14, -660478335), u = p(u, d, h, c, o[f + 4], 20, -405537848), c = p(c, u, d, h, o[f + 9], 5, 568446438), h = p(h, c, u, d, o[f + 14], 9, -1019803690), d = p(d, h, c, u, o[f + 3], 14, -187363961), u = p(u, d, h, c, o[f + 8], 20, 1163531501), c = p(c, u, d, h, o[f + 13], 5, -1444681467), h = p(h, c, u, d, o[f + 2], 9, -51403784), d = p(d, h, c, u, o[f + 7], 14, 1735328473), u = p(u, d, h, c, o[f + 12], 20, -1926607734), c = D(c, u, d, h, o[f + 5], 4, -378558), h = D(h, c, u, d, o[f + 8], 11, -2022574463), d = D(d, h, c, u, o[f + 11], 16, 1839030562), u = D(u, d, h, c, o[f + 14], 23, -35309556), c = D(c, u, d, h, o[f + 1], 4, -1530992060), h = D(h, c, u, d, o[f + 4], 11, 1272893353), d = D(d, h, c, u, o[f + 7], 16, -155497632), u = D(u, d, h, c, o[f + 10], 23, -1094730640), c = D(c, u, d, h, o[f + 13], 4, 681279174), h = D(h, c, u, d, o[f + 0], 11, -358537222), d = D(d, h, c, u, o[f + 3], 16, -722521979), u = D(u, d, h, c, o[f + 6], 23, 76029189), c = D(c, u, d, h, o[f + 9], 4, -640364487), h = D(h, c, u, d, o[f + 12], 11, -421815835), d = D(d, h, c, u, o[f + 15], 16, 530742520), u = D(u, d, h, c, o[f + 2], 23, -995338651), c = z(c, u, d, h, o[f + 0], 6, -198630844), h = z(h, c, u, d, o[f + 7], 10, 1126891415), d = z(d, h, c, u, o[f + 14], 15, -1416354905), u = z(u, d, h, c, o[f + 5], 21, -57434055), c = z(c, u, d, h, o[f + 12], 6, 1700485571), h = z(h, c, u, d, o[f + 3], 10, -1894986606), d = z(d, h, c, u, o[f + 10], 15, -1051523), u = z(u, d, h, c, o[f + 1], 21, -2054922799), c = z(c, u, d, h, o[f + 8], 6, 1873313359), h = z(h, c, u, d, o[f + 15], 10, -30611744), d = z(d, h, c, u, o[f + 6], 15, -1560198380), u = z(u, d, h, c, o[f + 13], 21, 1309151649), c = z(c, u, d, h, o[f + 4], 6, -145523070), h = z(h, c, u, d, o[f + 11], 10, -1120210379), d = z(d, h, c, u, o[f + 2], 15, 718787259), u = z(u, d, h, c, o[f + 9], 21, -343485551), c = c + N >>> 0, u = u + C >>> 0, d = d + Q >>> 0, h = h + Nt >>> 0;
    }
    return a.endian([c, u, d, h]);
  };
  s._ff = function(n, i, o, l, c, u, d) {
    var h = n + (i & o | ~i & l) + (c >>> 0) + d;
    return (h << u | h >>> 32 - u) + i;
  }, s._gg = function(n, i, o, l, c, u, d) {
    var h = n + (i & l | o & ~l) + (c >>> 0) + d;
    return (h << u | h >>> 32 - u) + i;
  }, s._hh = function(n, i, o, l, c, u, d) {
    var h = n + (i ^ o ^ l) + (c >>> 0) + d;
    return (h << u | h >>> 32 - u) + i;
  }, s._ii = function(n, i, o, l, c, u, d) {
    var h = n + (o ^ (i | ~l)) + (c >>> 0) + d;
    return (h << u | h >>> 32 - u) + i;
  }, s._blocksize = 16, s._digestsize = 16, ar.exports = function(n, i) {
    if (n == null)
      throw new Error("Illegal argument " + n);
    var o = a.wordsToBytes(s(n, i));
    return i && i.asBytes ? o : i && i.asString ? r.bytesToString(o) : a.bytesToHex(o);
  };
})();
var zn = ar.exports;
const Pn = /* @__PURE__ */ Or(zn), En = /^[v^~<>=]*?(\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+))?(?:-([\da-z\-]+(?:\.[\da-z\-]+)*))?(?:\+[\da-z\-]+(?:\.[\da-z\-]+)*)?)?)?$/i, Ae = (a) => {
  if (typeof a != "string")
    throw new TypeError("Invalid argument expected string");
  const t = a.match(En);
  if (!t)
    throw new Error(`Invalid argument not valid semver ('${a}' received)`);
  return t.shift(), t;
}, Oe = (a) => a === "*" || a === "x" || a === "X", ze = (a) => {
  const t = parseInt(a, 10);
  return isNaN(t) ? a : t;
}, xn = (a, t) => typeof a != typeof t ? [String(a), String(t)] : [a, t], Cn = (a, t) => {
  if (Oe(a) || Oe(t))
    return 0;
  const [e, r] = xn(ze(a), ze(t));
  return e > r ? 1 : e < r ? -1 : 0;
}, Pe = (a, t) => {
  for (let e = 0; e < Math.max(a.length, t.length); e++) {
    const r = Cn(a[e] || "0", t[e] || "0");
    if (r !== 0)
      return r;
  }
  return 0;
}, Un = (a, t) => {
  const e = Ae(a), r = Ae(t), s = e.pop(), n = r.pop(), i = Pe(e, r);
  return i !== 0 ? i : s && n ? Pe(s.split("."), n.split(".")) : s || n ? s ? -1 : 1 : 0;
}, Ee = (a, t, e) => {
  Ln(e);
  const r = Un(a, t);
  return or[e].includes(r);
}, or = {
  ">": [1],
  ">=": [0, 1],
  "=": [0],
  "<=": [-1, 0],
  "<": [-1],
  "!=": [-1, 1]
}, xe = Object.keys(or), Ln = (a) => {
  if (typeof a != "string")
    throw new TypeError(`Invalid operator type, expected string but got ${typeof a}`);
  if (xe.indexOf(a) === -1)
    throw new Error(`Invalid operator, expected one of ${xe.join("|")}`);
};
class cr {
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
      if (!t || Ee(y.VERSION, t, ">")) {
        const e = y.VERSION.split(".")[1], r = t == null ? void 0 : t.split(".")[1];
        if (r && Ee(e, r, ">")) {
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
        ...t.filter((n) => {
          var i;
          return (i = n.name) == null ? void 0 : i.startsWith("bdt");
        }).map((n) => n.name),
        ...S.getDatabases()
      ].filter((n, i, o) => !["_Model", "_Project", "0BAUsers"].includes(n) && o.findIndex((l) => l === n) === i), r = [
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
      ], s = t.find((n) => n.name === "_Model") ? await ht("_Model", 1) : null;
      if (s) {
        for (const n of e)
          try {
            const i = (JSON.parse(S.get("model." + n) || "null") ?? {}).object;
            if (i) {
              const o = await s.get("objects", n);
              o && (!r.every((l) => i[l] === o[l]) || !Object.keys(i.attributes ?? []).every((l) => {
                var c, u, d, h, f, g, p, D;
                return (
                  // Check single enum and many enum attributes
                  i.attributes[l].type === "enum" || Array.isArray(i.attributes[l].type) && i.attributes[l].type[0] === "enum" ? (Array.isArray(i.attributes[l].type) ? (u = (c = o.attributes) == null ? void 0 : c[l]) == null ? void 0 : u.type[0] : (h = (d = o.attributes) == null ? void 0 : d[l]) == null ? void 0 : h.type) === "enum" && (i.attributes[l].options ?? []).every((z, N) => {
                    var C, Q;
                    return z === ((Q = (C = o.attributes) == null ? void 0 : C[l]) == null ? void 0 : Q.options[N]);
                  }) : Array.isArray(i.attributes[l].type) ? i.attributes[l].type[0] === ((g = (f = o.attributes) == null ? void 0 : f[l]) == null ? void 0 : g.type[0]) : i.attributes[l].type === ((D = (p = o.attributes) == null ? void 0 : p[l]) == null ? void 0 : D.type)
                );
              })) && await s.delete("objects", n);
            }
          } catch (i) {
            console.error(`Error flushing "${n}" model:`, i.message);
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
        var n;
        return (n = s.name) == null ? void 0 : n.startsWith("bdt");
      }).map((s) => s.name),
      ...S.getDatabases(),
      "_Model",
      "_Project",
      "0BAUsers",
      "db_master"
    ].filter((s, n, i) => i.findIndex((o) => o === s) === n);
    for (const s of e)
      await re(s);
    const r = t.find((s) => s.name === v.name) ? await ht(v.name, 1) : null;
    r && (await r.clear(v.store), r.close()), S.clear();
  }
  /**
   * Updates model cache in local storage
   */
  static modelCacheUpdate(t, e) {
    if (y.options.flush.type.includes("model") && y.options.flush.modelCacheTTL && t && e !== null && typeof e == "object" && Object.hasOwn(e, "_blitzID"))
      try {
        const r = Date.now(), s = "model." + t.getName(), n = JSON.parse(S.get(s) || "null");
        (!n || r - n.lastFetchedAt >= y.options.flush.modelCacheTTL * 1e3) && S.set(
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
    var r, s, n;
    this._query = t;
    const e = (r = this._model) == null ? void 0 : r.getAttributesDetails();
    if ((s = this._query) != null && s.conditions)
      for (const i of this._query.conditions) {
        const o = i[0], l = (e == null ? void 0 : e[o]) ?? ((n = this._model) == null ? void 0 : n.getUserAttributeDetails(o)) ?? void 0;
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
      e.push(sr.create(((r = this._query) == null ? void 0 : r.returnType) ?? ut, this._model, s));
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
          const s = await this.filterQueuedObjects(this.mergeObjects(await this.performHttp()));
          (s.length > 0 || this._forceHttp) && (t = await this.filterExpiredObjects(s), t.length > 0 && await this._model.idbClient().save(t)), r && ((e = this._model) == null ? void 0 : e.getName()) !== "_Model" && S.setListCallLastTimeStamp(this.hash(), (/* @__PURE__ */ new Date()).getTime());
        }
      }
    }
    return this._raw ? t : this.convertObjects(t);
  }
  /**
   * Performs the list call using a signal.
   * 
   * @returns Signal that will emit the results.
   */
  performSignal(t = !1) {
    const e = new ft(null);
    return (async () => {
      var n;
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
        o = await this.filterExpiredObjects(o), o.length > 0 && this.hasLocalDatabase() && await ((n = this._model) == null ? void 0 : n.idbClient().save(o)), s(this._raw ? o : this.convertObjects(o));
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
    for (let n = 0; n < t.options.readURL.length; n++) {
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
          o = l.items || [], cr.modelCacheUpdate(this._model, l.model);
        }
        for (const l of o) {
          l._clusters = [t.name], l._editURLs = JSON.parse(JSON.stringify(t.options.readURL));
          for (const c in l)
            if (c.endsWith("_fk") && l[c] !== null && typeof l[c] == "object" && l[c]._blitzID) {
              const u = (s = (r = this._model) == null ? void 0 : r.getAttributeDetails(c)) == null ? void 0 : s.type;
              if (u && u !== "_Model" && this.hasLocalDatabase()) {
                const d = await V.get(u);
                d && await d.idbClient().save([l[c]], !0);
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
    const e = this._urls ? this._urls.map((n) => Zt.extractConditions(n)).flat() : this._query.conditions;
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
    const e = this._urls ? this._urls.map((n) => Zt.extractConditions(n)).flat() : this._query.conditions;
    return await t.query({ ...this._query, conditions: e });
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
      const s = e.find((n) => n._blitzID === r._blitzID);
      s ? (s._clusters = [...s._clusters, ...r._clusters].filter((n, i, o) => o.indexOf(n) === i), s._editURLs = [...s._editURLs, ...r._editURLs].filter((n, i, o) => o.indexOf(n) === i)) : e.push(r);
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
    for (const n of t)
      if (!e.find((i) => i.transaction.action === M.Delete && i.transaction.blitzID === n._blitzID))
        if (!e.find((i) => i.transaction.action === M.Edit && i.transaction.blitzID === n._blitzID && i.status === _.Pending))
          r.push(n);
        else {
          const i = await ((s = this._model) == null ? void 0 : s.get({ blitzID: n._blitzID, raw: !0, forceLocal: !0 }));
          i ? r.push(i) : r.push(n);
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
      for (const n of t) {
        if (
          // Check if expiration date is present and valid
          typeof n._expiration == "string" && n._expiration !== "" && n._expiration !== "0000-00-00 00:00:00" && // Check if user is not the owner
          e.id !== n._userID
        ) {
          const i = Date.now(), o = new Date(n._expiration).getTime();
          if (i > o) {
            this.hasLocalDatabase() && await ((s = this._model) == null ? void 0 : s.idbClient().delete(n._blitzID));
            continue;
          }
        }
        r.push(n);
      }
    } catch (n) {
      return console.error("Error handling expired objects:", n.stack), t;
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
    return Pn(JSON.stringify({
      clusters: ((t = this._clusters) == null ? void 0 : t.map((r) => r.name)) ?? [],
      blitzId: this._get,
      urls: this._urls,
      modelName: (e = this._model) == null ? void 0 : e.getName(),
      listQuery: this._query,
      getQuery: this._getQuery
    }));
  }
}
class lr extends ut {
  /**
   * Returns the model of the custom object.
   */
  static async model() {
    if (typeof this.modelName != "string")
      throw new Error(`${this.name}.modelName is not a string, please provide a valid model name.`);
    const t = this.modelName === "_Model" ? G() : await G().get(this.modelName);
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
m(lr, "modelName");
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
      await We(t);
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
    for (const n of r)
      for (const i of s)
        await this.syncStream(n, t, i);
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
    const n = [];
    for (const { cluster: i, stream: o } of s)
      n.push({ cluster: i, stream: o, cursor: await this.peek(i, t, o) });
    y.options.sync.level === "full" && await this.snapshot(t);
    for (const { cluster: i, stream: o, cursor: l } of n)
      S.setSyncCursor(t, i.name, o, l);
  }
  /**
   * Asks the server for the latest change-log position (`peek=1`) without
   * fetching any transactions. Servers predating the parameter ignore it
   * and answer with their oldest page instead — the tail then replays
   * history, which converges to the same state, just slower.
   */
  async peek(t, e, r) {
    const { lastTimestamp: s, lastLogID: n } = await this.fetchLogs(t, e, r, null, !0);
    return { timestamp: s ?? 0, logID: n };
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
          const { fetched: n, lastLocalID: i } = await it.create().model(e).clusters([r]).raw(!0).query({
            limit: dt.SNAPSHOT_PAGE_SIZE,
            customSort: "_localID",
            customSortDirection: "ASC",
            ...s !== null ? { pagination: s } : {}
          }).performSnapshotPage();
          if (n < dt.SNAPSHOT_PAGE_SIZE)
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
      const { transactions: n, lastTimestamp: i, lastLogID: o } = await this.fetchLogs(t, e, r, s);
      if (await this.apply(n), typeof i != "number")
        break;
      const l = { timestamp: i, logID: o }, c = l.timestamp !== s.timestamp || l.logID !== s.logID;
      if (S.setSyncCursor(e, t.name, r, l), s = l, !c || n.length === 0)
        break;
    }
  }
  /**
   * Fetches one page of a model's change-log from one cluster.
   */
  async fetchLogs(t, e, r, s, n = !1) {
    const i = await st.listLogs({
      baseUrl: t.getNextReadURL(),
      model: e,
      type: r === "delete" ? "delete" : void 0,
      query: n ? { peek: !0 } : {
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
    const r = Ut.create();
    await r.putMultiple(e);
    const s = (await r.all()).map((o) => W.fromObject(o)), n = await q.create().run(s);
    if (y.options.sync.live === !0) {
      const o = /* @__PURE__ */ new Set();
      for (const l of s)
        if (((i = n.get(l.hash)) == null ? void 0 : i.status) === x.Success)
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
let pt = dt;
const Ct = class Ct extends lr {
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
    return new Ur(this);
  }
  /**
   * Returns the model memory connection.
   */
  memoryClient() {
    return new At(this);
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
    const s = this.resolveClusters(r), n = this.getAttributesDetails() ?? {}, i = new W({
      action: "add",
      data: H.serialize(H.unserialize(n, e)),
      model: this.getName()
    }), o = await y.getCurrentUser(), l = i.clone();
    l.data = { ...l.data, _userID: o.id };
    const c = await q.create().run([l]);
    if (c[0].status !== x.Success)
      throw new Error(c[0].message ?? "Unknown Error! Please try again.");
    for (const u of s)
      for (const d of u.options.addURL)
        await y.queue.addJob(d, i.toObject());
    return this.memoryClient().emit(i), this.setLastTransactionHash(i.hash), sr.create(this.returnType, this, l.data);
  }
  /**
   * Finds an object by given blitz ID.
   *
   * @param blitzID - Blitz ID of the object.
   */
  async get(e) {
    const r = typeof e == "string" ? { blitzID: e } : e, n = (await it.create().model(this).clusters(this.resolveClusters(r.clusters ?? [])).raw(r.raw ?? !1).get(r.blitzID).query({
      returnType: this.returnType ?? ut
    }).forceHttp(r.forceHttp ?? !1).forceLocal(r.forceLocal ?? !1).skipCacheUpdateIfFound(r.skipCacheUpdateIfFound ?? !1).signal(r.signal).getQuery(r.query ?? {}).perform())[0] ?? null;
    if (!n && this.returnType === Ct)
      throw new Error(`Model with blitzID "${e}" does not exists or you don't have enough permission to view it.`);
    return n || null;
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
    const n = it.create().model(this).clusters(this.resolveClusters(e.clusters ?? [])).raw(e.raw ?? !1).query({
      conditions: e.conditions,
      limit: e.limit,
      returnType: e.returnType ?? this.returnType ?? ut,
      customSort: e.customSort,
      customSortDirection: e.customSortDirection,
      var: e.var,
      manyToMany: e.manyToMany
    }).forceHttp(e.forceHttp ?? !1).forceLocal(e.forceLocal ?? !1).skipCacheUpdateIfFound(e.skipCacheUpdateIfFound ?? !1).performSignal(s), i = n.subscribe(r, n.get() !== null), o = At.channel.filterPipe((l) => l.model === this.getName()).subscribe((l) => {
      if (l.action === M.Add)
        this.list({ ...e, forceLocal: !0 }).then((c) => {
          const u = e.raw ? c.findIndex((d) => d._blitzID === l.blitzID) : c.findIndex((d) => d.getAttribute("_blitzID").value === l.blitzID);
          u > -1 && n.set({
            items: c,
            update: {
              action: M.Add,
              object: c[u],
              index: u
            }
          });
        });
      else if (l.action === M.Edit) {
        const c = n.get();
        if (!c)
          return;
        const u = e.raw ? c.items.findIndex((d) => d._blitzID === l.blitzID) : c.items.findIndex((d) => d.getAttribute("_blitzID").value === l.blitzID);
        u > -1 && this.list({ ...e, forceLocal: !0 }).then((d) => {
          const h = e.raw ? d.findIndex((f) => f._blitzID === l.blitzID) : d.findIndex((f) => f.getAttribute("_blitzID").value === l.blitzID);
          n.set({
            items: d,
            update: {
              action: M.Edit,
              object: h > -1 ? d[h] : c.items[u],
              index: h > -1 ? h : u
            }
          });
        });
      } else if (l.action === M.Delete) {
        const c = n.get();
        if (!c)
          return;
        if (e.raw) {
          const u = c.items.findIndex((d) => d._blitzID === l.blitzID);
          u > -1 && n.set({
            items: c.items.filter((d) => d._blitzID !== l.blitzID),
            update: {
              action: M.Delete,
              object: c.items[u],
              index: u
            }
          });
        } else {
          const u = c.items.findIndex((d) => d.getAttribute("_blitzID").value === l.blitzID);
          u > -1 && n.set({
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
      const r = Date.now() / 1e3, s = S.getLastSyncRunAt(e) ?? 0, n = 30;
      r - s > n && await pt.create().run(e);
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
   * Returns attribute information for the system attributes every object
   * carries regardless of schema (`_userID`, `_blitzID`, `_modified`, …).
   *
   * Deliberately separate from getAttributesDetails(): schema iterators
   * (add forms, grids) must not suddenly see system fields. Consumers that
   * want them (e.g. a filter form) opt in through this accessor.
   */
  getSystemAttributesDetails() {
    return Object.fromEntries(
      Object.entries(He).map(([e, r]) => [e, { ...r }])
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
    if (typeof e != "string" || !e.startsWith(nt))
      return null;
    const r = this.getUserAttributesDetails();
    if (!r)
      return null;
    const s = e.slice(nt.length);
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
    this.clusterManager = new Le();
    const r = Gt.transformClusterOptions(e);
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
m(Ct, "modelName", "_Model");
let V = Ct;
class Nn {
  //Constructor
  constructor(t) {
    //Properties
    m(this, "_db");
    this._db = t;
  }
  //Update job
  async _updateJob(t) {
    var e;
    return await ((e = this._db) == null ? void 0 : e.put(v.store, t)), t;
  }
  //Delete job — a job that no longer exists must not keep its alert mark alive
  async _deleteJob(t) {
    var e;
    await ((e = this._db) == null ? void 0 : e.delete(v.store, t.id)), y.queue.notifier.resolved(t.id);
  }
  //Get future jobs
  async _getFutureJobs(t) {
    var i;
    const e = [], r = (i = this._db) == null ? void 0 : i.transaction(v.store, "readonly").store, s = IDBKeyRange.lowerBound(t.createdAt, !0);
    let n = await (r == null ? void 0 : r.index(v.timeIndex).openCursor(s, "next"));
    for (; n; )
      //Same destination
      n.value.url === t.url && //Only same object jobs
      n.value.transaction.blitzID === t.transaction.blitzID && e.push(n.value), n = await n.continue();
    return e;
  }
  //Retry jobs
  async retry(t) {
    for (const e of t)
      await this._updateJob({
        ...e,
        status: _.Pending
      }), y.queue.notifier.resolved(e.id);
  }
  //Revert jobs
  async revert(t) {
    var r, s;
    t.sort((n, i) => n.createdAt - i.createdAt);
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
        const n = await this._getFutureJobs(e);
        for (const i of [e, ...n])
          await this._deleteJob(i);
      } else if (e.transaction.action === M.Delete)
        await this._deleteJob(e), await V.get(e.transaction.model).then((n) => n == null ? void 0 : n.get(e.transaction.blitzID));
      else if (e.transaction.action === M.Edit) {
        const n = Object.keys(e.transaction.data ?? {})[0];
        if (!n || ((r = e.transaction.data) == null ? void 0 : r[n].new) === void 0 || ((s = e.transaction.data) == null ? void 0 : s[n].prev) === void 0)
          return;
        const i = new W({
          action: "edit",
          model: e.transaction.model,
          blitzID: e.transaction.blitzID,
          data: {
            [n]: {
              prev: e.transaction.data[n].new,
              new: e.transaction.data[n].prev
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
    const t = {}, e = (s = this._db) == null ? void 0 : s.transaction(v.store, "readonly").store;
    let r = await (e == null ? void 0 : e.index(v.timeIndex).openCursor(null, "next"));
    for (; r; ) {
      if (
        //Only unresolved jobs
        r.value.status !== _.Completed
      ) {
        if (t[r.value.url] || (t[r.value.url] = []), r.value.transaction.action === M.Add || r.value.transaction.action === M.Delete)
          t[r.value.url].push([r.value]);
        else if (r.value.transaction.action === M.Edit) {
          const n = Object.keys(r.value.transaction.data ?? {})[0], i = r.value.transaction.blitzID, o = t[r.value.url].findIndex((l) => l[0].transaction.action === M.Edit && l[0].transaction.blitzID === i && Object.keys(l[0].transaction.data ?? {})[0] === n);
          o === -1 ? t[r.value.url].push([r.value]) : t[r.value.url][o].push(r.value);
        }
      }
      r = await r.continue();
    }
    return t;
  }
}
class Fn {
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
      this._alerted.has(e.id) || (e.status === _.Failed ? this.notifyFailure(e) : e.status === _.Conflict && e.message !== void 0 && (this._effects.dispatch("queue:conflict", e), this._alert(e)));
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
class jn {
  constructor() {
    // Properties
    m(this, "_db", null);
    m(this, "conflictHandler", null);
    m(this, "failedHandler", null);
    m(this, "notifier", new Fn({
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
    e.status === _.Completed ? y.dispatchEvent("queue:success", e) : e.status === _.Failed ? y.queue.notifier.notifyFailure(e) : e.status === _.Conflict && y.queue.notifier.notifyConflict(e), y._Model.get(e.transaction.model).then((r) => {
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
    const n = Object.keys(t.transaction.data ?? {})[0];
    if (!n)
      return;
    const i = s[n], o = await y.queue.getJobsForObject(t.transaction.blitzID);
    (l = i == null ? void 0 : i._syncSignal) == null || l.set(e ? { status: e } : bt(o, n)), (c = s._syncSignal) == null || c.set(bt(o));
  }
  /**
   * Open the queue database and start the processor: Vite's `?sharedworker`
   * module in dev, the consumer-hosted `options.queue.workerPath` file in
   * production. A worker load failure degrades to a same-thread processor
   * with a console warning. Deployment requirements: README.md § Setup.
   */
  async init() {
    if (this._db = await ht(v.name, 1, {
      upgrade: (r) => {
        const s = r.createObjectStore(v.store, { keyPath: "id" });
        s.createIndex(v.timeIndex, "createdAt"), s.createIndex(v.objectIndex, "transaction.blitzID");
      }
    }), !this._db.objectStoreNames.contains(v.store))
      return await re(v.name), await this.init();
    this.conflictHandler = new Er(this._db), this.failedHandler = new Nn(this._db);
    const t = new Ar(
      y.options.queue.workerPath,
      { name: "bd-queue-worker" }
    );
    t.onerror = () => {
      console.warn("⚠️ Failed to run the queue's shared worker, please check that the worker path is correct, falling back to running on the same thread!"), new Je(
        (r) => this._handleWorkerMessage(r),
        P._globalHeaders,
        P._scopedHeaders
      ).start();
    }, t.port.onmessage = this._handleWorkerMessage, window.addEventListener("beforeunload", () => t.port.postMessage({ type: "close" }));
    const e = () => {
      t.port.postMessage({ type: "headers", data: P._globalHeaders }), t.port.postMessage({ type: "scopedHeaders", data: P._scopedHeaders });
    };
    return e(), P.onGlobalHeadersChange(e), setTimeout(() => void this.sweepUnresolved(), 0), document.addEventListener("visibilitychange", () => {
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
      status: _.Pending,
      createdAt: Date.now(),
      attempts: 0,
      priority: 1
    };
    await ((s = this._db) == null ? void 0 : s.add(v.store, r)), await this.updateSyncStatus(r, r.status);
  }
  // Delete job from queue worker
  async deleteJob(t) {
    var e;
    await ((e = this._db) == null ? void 0 : e.delete(v.store, t.id));
  }
  // Get all jobs
  async getJobs() {
    var t;
    return await ((t = this._db) == null ? void 0 : t.getAll(v.store));
  }
  // Get all jobs for an object
  async getJobsForObject(t) {
    var r;
    const e = await ((r = this._db) == null ? void 0 : r.getAllFromIndex(v.store, v.objectIndex, t));
    return e.sort((s, n) => s.createdAt - n.createdAt), e;
  }
}
const Wn = "BlitzData.realtime", Rn = "BlitzData.realtime", Ce = 2e3, Jn = 3e4;
class oe {
  constructor() {
    /**
     * Cross-tab fanout for transactions the leader already applied locally.
     */
    m(this, "broadcast", null);
    /**
     * Backoff before the next reconnect attempt, in milliseconds.
     */
    m(this, "backoff", Ce);
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
    return new oe();
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
      typeof BroadcastChannel < "u" && (this.broadcast = new BroadcastChannel(Rn), this.broadcast.onmessage = (t) => {
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
    return typeof navigator < "u" && ((t = navigator.locks) != null && t.request) ? navigator.locks.request(Wn, () => this.connectForever()) : this.connectForever();
  }
  /**
   * Reconnects indefinitely with exponential backoff. One failed attempt
   * (server down, network blip) must never end realtime syncing for good.
   */
  async connectForever() {
    for (; ; ) {
      try {
        await this.connectOnce(), this.backoff = Ce;
      } catch (t) {
        console.error("Realtime connection error:", (t == null ? void 0 : t.stack) ?? (t == null ? void 0 : t.message) ?? t);
      }
      await We(this.backoff), this.backoff = Math.min(this.backoff * 2, Jn);
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
      const n = this.resolveAuthProtocols(), i = n ? new WebSocket(s, n) : new WebSocket(s);
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
    const t = P._globalHeaders, e = t.u ?? t.U, r = t.k ?? t.K;
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
const O = class O {
  /**
   * _Model instance. Stored in ModelRegistry so low-level modules can
   * reach it without importing this module.
   */
  static get _Model() {
    return G();
  }
  static set _Model(t) {
    Pr(t);
  }
  /**
  * Queue instance. Stored in QueueRegistry so low-level modules can
  * reach it without importing this module.
  */
  static get queue() {
    return rt();
  }
  static set queue(t) {
    Lr(t);
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
    return "1.16.1";
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
    const e = Gt.transformBlitzDataOptions(t);
    this.options = e, e.clusters && O.setClusters(e.clusters), await new cr(this.options.flush).perform(), await new X().ping(), this.queue = await new jn().init(), O._Model = new V({
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
        haspublishingdate: new Ye("haspublishingdate", "boolean", !1)
      }
    }), O._Model.setReturnType(V), t && typeof t != "string" && !Array.isArray(t) && t.uiManager && (this.ui = new t.uiManager(this, t.uiManagerSettings));
    try {
      await O.getCurrentUser();
    } catch (r) {
      console.error("Error fetching current user:", r.stack);
    }
    if (e.sync.level === "full") {
      const r = pt.create();
      O.syncReady = r.run().catch((s) => {
        console.error("Initial sync failed:", (s == null ? void 0 : s.stack) ?? (s == null ? void 0 : s.message) ?? s);
      }), e.sync.background !== !0 && await O.syncReady, r.runAtInterval(e.sync.interval);
    } else if (e.sync.level === "cache") {
      const r = pt.create();
      O.syncReady = r.run(void 0, "delete").catch((s) => {
        console.error("Initial sync failed:", (s == null ? void 0 : s.stack) ?? (s == null ? void 0 : s.message) ?? s);
      }), await O.syncReady;
    }
    e.realtime && e.realtime.models.length > 0 && oe.create().start();
  }
  /**
   * Registers clusters.
   */
  static setClusters(t) {
    t = Gt.transformClusterOptions(t);
    for (const e of Object.keys(t))
      O.clusterManager.register(e, t[e]);
  }
  /**
   * Performs a list call to the server by given URL.
   *
   * @param url
   */
  static async list(t) {
    const e = Zt.extractModelName(t);
    if (!await O._Model.exists(e))
      throw new Error(`Model "${e}" does not exist.`);
    return it.create().model(await O._Model.get(e)).urls([t]).query({}).perform();
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
      baseUrl: O.clusterManager.toArray()[0].getNextReadURL(),
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
      baseUrl: O.clusterManager.toArray()[0].getNextReadURL(),
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
      baseUrl: O.clusterManager.toArray()[0].getNextReadURL(),
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
    const s = E.sanitizeBaseUrl(O.clusterManager.toArray()[0].getNextReadURL()), n = new URL(s).origin !== window.location.origin ? r.includes("?") ? "&enableCors=1" : "?enableCors=1" : "", i = P.create().url(s + r + n).method((e == null ? void 0 : e.method) ?? "GET").header("Accept", "application/json");
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
    const r = E.sanitizeBaseUrl(O.clusterManager.toArray()[0].getNextReadURL()), s = new URL(r).origin !== window.location.origin ? "?enableCors=1" : "", n = await P.create().url(r + `api/listProjectUsers/${t}.json${s}`).get();
    if (n.error)
      throw new Error(n.error);
    if (n.errors instanceof Array && n.errors.length > 0)
      throw new Error(n.errors.map((o) => o.message || o).join(" | "));
    const i = {
      lastSaved: Date.now(),
      users: (n.users || []).map((o) => ({ id: o._blitzID, username: o.username }))
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
    const e = E.sanitizeBaseUrl(O.clusterManager.toArray()[0].getNextReadURL()), r = new URL(e).origin !== window.location.origin ? "?enableCors=1" : "", s = await P.create().url(e + "api/ping.json" + r).get();
    if (s.error)
      throw new Error(s.error);
    if (!s.userhash) {
      const c = { id: "public", username: "Public" };
      return S.setCurrentUser(c), c;
    }
    const n = await V.get("0BAUsers"), i = await (n == null ? void 0 : n.get(s.userhash));
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
m(O, "clusterManager", new Le()), /**
* Cache of loaded objects (model => (blitzID => object)).
*/
m(O, "objects", /* @__PURE__ */ new Map()), /**
 * Options of the BlitzData.
 */
m(O, "options"), /**
* UI manager instance.
*/
m(O, "ui"), /**
 * Event listeners.
 */
m(O, "listeners", /* @__PURE__ */ new Map()), /**
 * Whether library initialized or not.
 */
m(O, "initialized", !1), /**
 * Settles when the first sync pass completes. With `sync.background`
 * initialization returns immediately and apps await this instead.
 */
m(O, "syncReady", Promise.resolve());
let y = O;
class $n {
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
function ur(a) {
  let t = "";
  for (const e of a)
    t += String.fromCharCode(e);
  return btoa(t).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function Jt(a = 32) {
  const t = new Uint8Array(a);
  return crypto.getRandomValues(t), ur(t);
}
async function Hn(a) {
  const t = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(a));
  return ur(new Uint8Array(t));
}
function dr(a) {
  const t = a.replace(/-/g, "+").replace(/_/g, "/"), e = t + "=".repeat((4 - t.length % 4) % 4), r = atob(e), s = new Uint8Array(r.length);
  for (let n = 0; n < r.length; n++)
    s[n] = r.charCodeAt(n);
  return s;
}
function Ue(a) {
  return JSON.parse(new TextDecoder().decode(dr(a)));
}
function $t(a) {
  const t = a.split(".");
  if (t.length !== 3)
    throw new Error("id_token is not a well-formed JWT");
  return {
    header: Ue(t[0]),
    payload: Ue(t[1]),
    signingInput: `${t[0]}.${t[1]}`,
    signature: dr(t[2])
  };
}
function Bn(a, t) {
  const e = Math.floor((t.now ?? Date.now()) / 1e3), r = t.clockToleranceSeconds ?? 60;
  if (a.iss !== t.issuer)
    throw new Error(`id_token issuer mismatch: ${a.iss}`);
  if (!(Array.isArray(a.aud) ? a.aud : [a.aud]).includes(t.audience))
    throw new Error(`id_token audience mismatch: ${a.aud}`);
  if (typeof a.exp != "number" || a.exp + r < e)
    throw new Error("id_token has expired");
  if (t.nonce !== void 0 && a.nonce !== t.nonce)
    throw new Error("id_token nonce mismatch");
}
async function qn(a, t) {
  if (typeof crypto > "u" || !crypto.subtle)
    return !1;
  const e = (a.header.kid ? t.keys.find((s) => s.kid === a.header.kid) : t.keys[0]) ?? t.keys[0];
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
    a.signature,
    new TextEncoder().encode(a.signingInput)
  );
}
const Ht = "blitzdata.oauth.verifier", Bt = "blitzdata.oauth.state", qt = "blitzdata.oauth.nonce";
class Qn {
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
    this._baseUrl = t.baseUrl.endsWith("/") ? t.baseUrl : t.baseUrl + "/", this._issuerOrigin = new URL(this._baseUrl).origin, this._redirectUri = t.redirectUri ?? (typeof location < "u" ? location.origin + location.pathname : ""), this._scope = t.scope ?? "openid profile email", this._clientId = t.clientId ?? new URL(this._redirectUri || this._baseUrl).origin, this._store = new $n(t.storageKey, t.storage ?? (typeof localStorage < "u" ? localStorage : null)), this._leewayMs = (t.refreshLeewaySeconds ?? 60) * 1e3, P.onUnauthorized(async (e) => new URL(e).origin !== this._issuerOrigin ? !1 : this.refresh());
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
        this._claims = $t(this._tokens.idToken).payload;
      } catch {
        this._claims = null;
      }
    return this._tokens ? this._tokens.expiresAt <= Date.now() + this._leewayMs ? await this.refresh() : (this._applyTokens(), !0) : !1;
  }
  /**
   * Start the login by sending the browser to the BlitzData authorize page.
   */
  async loginWithRedirect() {
    const t = Jt(32), e = Jt(16), r = Jt(16);
    sessionStorage.setItem(Ht, t), sessionStorage.setItem(Bt, e), sessionStorage.setItem(qt, r);
    const s = new URLSearchParams({
      response_type: "code",
      client_id: this._clientId,
      redirect_uri: this._redirectUri,
      scope: this._scope,
      state: e,
      nonce: r,
      code_challenge_method: "S256",
      code_challenge: await Hn(t)
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
    const r = sessionStorage.getItem(Bt), s = sessionStorage.getItem(Ht), n = sessionStorage.getItem(qt);
    if (sessionStorage.removeItem(Bt), sessionStorage.removeItem(Ht), sessionStorage.removeItem(qt), !s || !r || t.get("state") !== r)
      throw new Error("OAuth state mismatch, restart the login");
    await this._storeTokenResponse(
      await this._postForm("blitz/o/oauth/token", { code: e, code_verifier: s }),
      n ?? void 0
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
          this._claims = $t(t.idToken).payload;
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
    var s, n, i;
    const e = ((s = this._tokens) == null ? void 0 : s.refreshToken) ?? ((n = this._store.load()) == null ? void 0 : n.refreshToken), r = (i = this._tokens) == null ? void 0 : i.accessToken;
    this._tokens = null, this._claims = null, this._store.clear(), this._refreshTimer && clearTimeout(this._refreshTimer), P.setScopedHeaders(this._issuerOrigin, {});
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
    const r = $t(t), s = await this._getDiscovery(), n = (s == null ? void 0 : s.issuer) ?? this._issuerOrigin;
    if (Bn(r.payload, { issuer: n, audience: this._clientId, nonce: e }), s) {
      const o = await this._fetchJson(s.jwks_uri);
      if ((i = o == null ? void 0 : o.keys) != null && i.length && !await qn(r, o))
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
    this._tokens && (P.setScopedHeaders(this._issuerOrigin, { Authorization: `Bearer ${this._tokens.accessToken}` }), this._scheduleRefresh());
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
  lr as BDCustomObject,
  V as BDModel,
  ut as BDObject,
  y as BlitzData,
  U as DataType,
  rr as DefinitiveHistoryError,
  P as HttpRequest,
  _ as JobStatus,
  S as LocalStorageRepository,
  Cr as ME_SENTINEL,
  cn as ManyForeignKeyType,
  er as ManyType,
  Qn as OAuthClient,
  He as SYSTEM_ATTRIBUTES,
  tr as TextType,
  ct as blitzhash,
  ot as blitzstamp,
  zr as blitzstampFromDate,
  Vn as blitzstampToDate,
  We as sleep
};
