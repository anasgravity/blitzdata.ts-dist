var Ge = Object.defineProperty;
var Ze = (n, t, e) => t in n ? Ge(n, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : n[t] = e;
var m = (n, t, e) => (Ze(n, typeof t != "symbol" ? t + "" : t, e), e);
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
    return O._scopedHeaders.filter((r) => r.origin === e).reduce((r, a) => Object.assign(r, a.headers), {});
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
let P = O;
class tr {
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
class Me {
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
    this.clusters[t] = new tr(t, e);
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
const er = (n, t) => t.some((e) => n instanceof e);
let te, ee;
function rr() {
  return te || (te = [
    IDBDatabase,
    IDBObjectStore,
    IDBIndex,
    IDBCursor,
    IDBTransaction
  ]);
}
function nr() {
  return ee || (ee = [
    IDBCursor.prototype.advance,
    IDBCursor.prototype.continue,
    IDBCursor.prototype.continuePrimaryKey
  ]);
}
const ke = /* @__PURE__ */ new WeakMap(), Jt = /* @__PURE__ */ new WeakMap(), Te = /* @__PURE__ */ new WeakMap(), xt = /* @__PURE__ */ new WeakMap(), qt = /* @__PURE__ */ new WeakMap();
function ar(n) {
  const t = new Promise((e, r) => {
    const a = () => {
      n.removeEventListener("success", s), n.removeEventListener("error", i);
    }, s = () => {
      e(X(n.result)), a();
    }, i = () => {
      r(n.error), a();
    };
    n.addEventListener("success", s), n.addEventListener("error", i);
  });
  return t.then((e) => {
    e instanceof IDBCursor && ke.set(e, n);
  }).catch(() => {
  }), qt.set(t, n), t;
}
function sr(n) {
  if (Jt.has(n))
    return;
  const t = new Promise((e, r) => {
    const a = () => {
      n.removeEventListener("complete", s), n.removeEventListener("error", i), n.removeEventListener("abort", i);
    }, s = () => {
      e(), a();
    }, i = () => {
      r(n.error || new DOMException("AbortError", "AbortError")), a();
    };
    n.addEventListener("complete", s), n.addEventListener("error", i), n.addEventListener("abort", i);
  });
  Jt.set(n, t);
}
let Nt = {
  get(n, t, e) {
    if (n instanceof IDBTransaction) {
      if (t === "done")
        return Jt.get(n);
      if (t === "objectStoreNames")
        return n.objectStoreNames || Te.get(n);
      if (t === "store")
        return e.objectStoreNames[1] ? void 0 : e.objectStore(e.objectStoreNames[0]);
    }
    return X(n[t]);
  },
  set(n, t, e) {
    return n[t] = e, !0;
  },
  has(n, t) {
    return n instanceof IDBTransaction && (t === "done" || t === "store") ? !0 : t in n;
  }
};
function ir(n) {
  Nt = n(Nt);
}
function or(n) {
  return n === IDBDatabase.prototype.transaction && !("objectStoreNames" in IDBTransaction.prototype) ? function(t, ...e) {
    const r = n.call(Et(this), t, ...e);
    return Te.set(r, t.sort ? t.sort() : [t]), X(r);
  } : nr().includes(n) ? function(...t) {
    return n.apply(Et(this), t), X(ke.get(this));
  } : function(...t) {
    return X(n.apply(Et(this), t));
  };
}
function cr(n) {
  return typeof n == "function" ? or(n) : (n instanceof IDBTransaction && sr(n), er(n, rr()) ? new Proxy(n, Nt) : n);
}
function X(n) {
  if (n instanceof IDBRequest)
    return ar(n);
  if (xt.has(n))
    return xt.get(n);
  const t = cr(n);
  return t !== n && (xt.set(n, t), qt.set(t, n)), t;
}
const Et = (n) => qt.get(n);
function ot(n, t, { blocked: e, upgrade: r, blocking: a, terminated: s } = {}) {
  const i = indexedDB.open(n, t), o = X(i);
  return r && i.addEventListener("upgradeneeded", (l) => {
    r(X(i.result), l.oldVersion, l.newVersion, X(i.transaction), l);
  }), e && i.addEventListener("blocked", (l) => e(
    // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
    l.oldVersion,
    l.newVersion,
    l
  )), o.then((l) => {
    s && l.addEventListener("close", () => s()), a && l.addEventListener("versionchange", (c) => a(c.oldVersion, c.newVersion, c));
  }).catch(() => {
  }), o;
}
function Vt(n, { blocked: t } = {}) {
  const e = indexedDB.deleteDatabase(n);
  return t && e.addEventListener("blocked", (r) => t(
    // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
    r.oldVersion,
    r
  )), X(e).then(() => {
  });
}
const lr = ["get", "getKey", "getAll", "getAllKeys", "count"], ur = ["put", "add", "delete", "clear"], Ct = /* @__PURE__ */ new Map();
function re(n, t) {
  if (!(n instanceof IDBDatabase && !(t in n) && typeof t == "string"))
    return;
  if (Ct.get(t))
    return Ct.get(t);
  const e = t.replace(/FromIndex$/, ""), r = t !== e, a = ur.includes(e);
  if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(e in (r ? IDBIndex : IDBObjectStore).prototype) || !(a || lr.includes(e))
  )
    return;
  const s = async function(i, ...o) {
    const l = this.transaction(i, a ? "readwrite" : "readonly");
    let c = l.store;
    return r && (c = c.index(o.shift())), (await Promise.all([
      c[e](...o),
      a && l.done
    ]))[0];
  };
  return Ct.set(t, s), s;
}
ir((n) => ({
  ...n,
  get: (t, e, r) => re(t, e) || n.get(t, e, r),
  has: (t, e) => !!re(t, e) || n.has(t, e)
}));
const v = {
  name: "bd-queue",
  store: "jobs",
  timeIndex: "time",
  objectIndex: "object"
};
var b = /* @__PURE__ */ ((n) => (n.Pending = "pending", n.Completed = "completed", n.Failed = "failed", n.Conflict = "conflict", n))(b || {}), F = /* @__PURE__ */ ((n) => (n.Success = "success", n.Exception = "exception", n.Failed = "failed", n.Conflict = "conflict", n))(F || {}), D = /* @__PURE__ */ ((n) => (n.Add = "add", n.Edit = "edit", n.Delete = "delete", n))(D || {}), q = "SharedWorker" in globalThis, dr = class {
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
    return q ? (n = this.ActualWorker) == null ? void 0 : n.port.onmessage : this.ActualWorker.onmessage;
  }
  set onmessage(n) {
    q ? this.ActualWorker.port.onmessage = n : this.ActualWorker.onmessage = n;
  }
  /**
   * An EventListener called when a MessageEvent of type MessageError is fired—that is, when it receives a message that cannot be deserialized.
   */
  get onmessageerror() {
    var n;
    return q ? (n = this.ActualWorker) == null ? void 0 : n.port.onmessageerror : this.ActualWorker.onmessageerror;
  }
  set onmessageerror(n) {
    q ? this.ActualWorker.port.onmessageerror = n : this.ActualWorker.onmessageerror = n;
  }
  /**
   * Starts the sending of messages queued on the port (only needed when using EventTarget.addEventListener; it is implied when using MessagePort.onmessage.)
   */
  start() {
    var n;
    if (q)
      return (n = this.ActualWorker) == null ? void 0 : n.port.start();
  }
  /**
   * Clones message and transmits it to worker's global environment. transfer can be passed as a list of objects that are to be transferred rather than cloned.
   */
  postMessage(n, t) {
    var e;
    return q ? (e = this.ActualWorker) == null ? void 0 : e.port.postMessage(n, t) : this.ActualWorker.postMessage(n, t);
  }
  /**
   * Immediately terminates the worker. This does not let worker finish its operations; it is halted at once. ServiceWorker instances do not support this method.
   */
  terminate() {
    var n;
    return q ? (n = this.ActualWorker) == null ? void 0 : n.port.close() : this.ActualWorker.terminate();
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
    return q ? this.ActualWorker.port : this.ActualWorker;
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
    return q && n !== "error" ? (r = this.ActualWorker) == null ? void 0 : r.port.addEventListener(n, t, e) : this.ActualWorker.addEventListener(n, t, e);
  }
  removeEventListener(n, t, e) {
    var r;
    return q && n !== "error" ? (r = this.ActualWorker) == null ? void 0 : r.port.removeEventListener(n, t, e) : this.ActualWorker.removeEventListener(n, t, e);
  }
  /**
   * Dispatches an event to this EventTarget.
   */
  dispatchEvent(n) {
    return this.ActualWorker.dispatchEvent(n);
  }
}, hr = class extends dr {
  constructor(n, t) {
    let e;
    q ? e = new SharedWorker(n, t) : e = new Worker(n, t), super(e);
  }
};
function fr(n) {
  return n && n.__esModule && Object.prototype.hasOwnProperty.call(n, "default") ? n.default : n;
}
var Ie = {};
/*! crc32.js (C) 2014-present SheetJS -- http://sheetjs.com */
(function(n) {
  (function(t) {
    t(typeof DO_NOT_EXPORT_CRC > "u" ? n : {});
  })(function(t) {
    t.version = "1.2.2";
    function e() {
      for (var w = 0, H = new Array(256), y = 0; y != 256; ++y)
        w = y, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, H[y] = w;
      return typeof Int32Array < "u" ? new Int32Array(H) : H;
    }
    var r = e();
    function a(w) {
      var H = 0, y = 0, k = 0, I = typeof Int32Array < "u" ? new Int32Array(4096) : new Array(4096);
      for (k = 0; k != 256; ++k)
        I[k] = w[k];
      for (k = 0; k != 256; ++k)
        for (y = w[k], H = 256 + k; H < 4096; H += 256)
          y = I[H] = y >>> 8 ^ w[y & 255];
      var W = [];
      for (k = 1; k != 16; ++k)
        W[k - 1] = typeof Int32Array < "u" ? I.subarray(k * 256, k * 256 + 256) : I.slice(k * 256, k * 256 + 256);
      return W;
    }
    var s = a(r), i = s[0], o = s[1], l = s[2], c = s[3], d = s[4], u = s[5], h = s[6], f = s[7], g = s[8], _ = s[9], S = s[10], z = s[11], L = s[12], x = s[13], Q = s[14];
    function At(w, H) {
      for (var y = H ^ -1, k = 0, I = w.length; k < I; )
        y = y >>> 8 ^ r[(y ^ w.charCodeAt(k++)) & 255];
      return ~y;
    }
    function Xe(w, H) {
      for (var y = H ^ -1, k = w.length - 15, I = 0; I < k; )
        y = Q[w[I++] ^ y & 255] ^ x[w[I++] ^ y >> 8 & 255] ^ L[w[I++] ^ y >> 16 & 255] ^ z[w[I++] ^ y >>> 24] ^ S[w[I++]] ^ _[w[I++]] ^ g[w[I++]] ^ f[w[I++]] ^ h[w[I++]] ^ u[w[I++]] ^ d[w[I++]] ^ c[w[I++]] ^ l[w[I++]] ^ o[w[I++]] ^ i[w[I++]] ^ r[w[I++]];
      for (k += 15; I < k; )
        y = y >>> 8 ^ r[(y ^ w[I++]) & 255];
      return ~y;
    }
    function Ke(w, H) {
      for (var y = H ^ -1, k = 0, I = w.length, W = 0, Pt = 0; k < I; )
        W = w.charCodeAt(k++), W < 128 ? y = y >>> 8 ^ r[(y ^ W) & 255] : W < 2048 ? (y = y >>> 8 ^ r[(y ^ (192 | W >> 6 & 31)) & 255], y = y >>> 8 ^ r[(y ^ (128 | W & 63)) & 255]) : W >= 55296 && W < 57344 ? (W = (W & 1023) + 64, Pt = w.charCodeAt(k++) & 1023, y = y >>> 8 ^ r[(y ^ (240 | W >> 8 & 7)) & 255], y = y >>> 8 ^ r[(y ^ (128 | W >> 2 & 63)) & 255], y = y >>> 8 ^ r[(y ^ (128 | Pt >> 6 & 15 | (W & 3) << 4)) & 255], y = y >>> 8 ^ r[(y ^ (128 | Pt & 63)) & 255]) : (y = y >>> 8 ^ r[(y ^ (224 | W >> 12 & 15)) & 255], y = y >>> 8 ^ r[(y ^ (128 | W >> 6 & 63)) & 255], y = y >>> 8 ^ r[(y ^ (128 | W & 63)) & 255]);
      return ~y;
    }
    t.table = r, t.bstr = At, t.buf = Xe, t.str = Ke;
  });
})(Ie);
function nt() {
  return Math.floor(((/* @__PURE__ */ new Date()).getTime() - (/* @__PURE__ */ new Date("2021-01-01T00:00:00Z")).getTime()) / 1e3);
}
function ct(n) {
  return nt().toString(36) + "-" + Ie.str(JSON.stringify(n)).toString(36);
}
function mr(n) {
  return new Promise((t) => {
    setTimeout(t, n);
  });
}
class Rt {
  //Send the job's transaction to its designated server
  static async send(t, e) {
    try {
      const r = new URL(t.url).origin !== self.location.origin ? "?enableCors=1" : "", a = await globalThis.fetch(
        t.url + "/api/post.json" + r,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...e ?? {} },
          body: JSON.stringify([t.transaction])
        }
      );
      if (!a.ok)
        throw new Error(`HTTP request failed with status ${a.status}` + (a.statusText ? `: ${a.statusText}` : ""));
      const s = await a.json();
      if (!s || !s.results)
        throw new Error("No response returned!");
      const i = s.results[t.transaction.hash];
      if (!i)
        throw new Error("No result returned for this job!");
      if (i.s || i.s0 || i.s1 || i.n)
        return {
          status: F.Success
        };
      if (i.conflict) {
        const o = Object.keys(t.transaction.data)[0], l = i.conflict[o];
        if (l === void 0)
          throw new Error("No previous value found in conflict result!");
        return {
          status: F.Conflict,
          message: l
        };
      } else if (i.e)
        return {
          status: F.Failed,
          message: i.e
        };
      return {
        status: F.Exception,
        message: s.error ?? (Array.isArray(s.errors) ? s.errors.map((o) => (o == null ? void 0 : o.message) ?? o).join(" | ") : "Unknown error!")
      };
    } catch (r) {
      return {
        status: F.Exception,
        message: r.message
      };
    }
  }
}
class tt {
  /**
   * Pings the database, ensuring it's correctly set up.
   */
  async ping() {
    const t = await this.openConnection(), e = ["sync_transactions", "evaluated_transactions"];
    for (const r of e)
      if (!t.objectStoreNames.contains(r))
        return t.close(), console.log(`There's missing stores, recreating the database. Available stores: ${t.objectStoreNames}`), await Vt("db_master"), await this.ping();
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
    const r = await this.openConnection(), a = r.transaction("evaluated_transactions", "readwrite");
    for (const s of e)
      a.store.delete(s);
    a.store.put(t), await a.done, r.close();
  }
  /**
   * Opens a connection to the database.
   *
   * @returns instance of the database connection
   */
  async openConnection() {
    return await ot("db_master", 1, {
      upgrade: (t, e, r, a, s) => {
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
var yt = [], Oe, Qt = [];
function ne(n, t) {
  const e = { ...t ?? Oe ?? {} };
  let r;
  try {
    r = new URL(n).origin;
  } catch {
    return e;
  }
  for (const a of Qt)
    a.origin === r && Object.assign(e, a.headers);
  return e;
}
class ze {
  constructor(t, e, r) {
    //Properties
    m(this, "_db", null);
    m(this, "_currentTimestamp", null);
    m(this, "_localHeaders");
    m(this, "_postMessage");
    this._postMessage = t, this._localHeaders = e, r && (Qt = r);
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
      for (const e of yt)
        e == null || e.postMessage({ job: t });
  }
  //Get next job
  async _getNextJob() {
    var s;
    let t = null;
    const e = (s = this._db) == null ? void 0 : s.transaction(v.store, "readonly").store, r = this._currentTimestamp ? IDBKeyRange.lowerBound(this._currentTimestamp, !0) : null;
    let a = await (e == null ? void 0 : e.index(v.timeIndex).openCursor(r, "next"));
    for (; a; ) {
      if (a.value.status === b.Pending) {
        t = a.value;
        break;
      }
      a = await a.continue();
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
    const e = [], r = t.transaction.action === D.Edit ? Object.keys(t.transaction.data)[0] : null, a = (o = this._db) == null ? void 0 : o.transaction(v.store, "readonly").store, s = IDBKeyRange.upperBound(t.createdAt, !0);
    let i = await (a == null ? void 0 : a.index(v.timeIndex).openCursor(s, "next"));
    for (; i; )
      //Only unresolved jobs
      i.value.status !== b.Completed && //Same destination
      i.value.url === t.url && //Only same object jobs
      i.value.transaction.blitzID === t.transaction.blitzID && //Only same attribute jobs if both passed job and current job have an edit action
      (i.value.transaction.action !== D.Edit || t.transaction.action !== D.Edit || Object.keys(i.value.transaction.data)[0] === r) && e.push(i.value), i = await i.continue();
    return e;
  }
  //Handle preceding unresolved add job check
  async _checkPrecedingUnresolvedAddJob(t, e) {
    let r = !1;
    if (e.length > 0 && e[0].transaction.action === D.Add && (r = !0, t.transaction.action === D.Delete))
      for (const a of [t, ...e])
        await this._deleteJob(a);
    return r;
  }
  //Handle preceding conflict edit jobs check
  async _checkPrecedingConflictEditJobs(t, e) {
    let r = !1;
    if (e.find((s) => s.transaction.action === D.Edit && s.status === b.Conflict)) {
      r = !0;
      const s = await this._updateJob({
        ...t,
        status: b.Conflict
      });
      this._sendJobEvent(s);
    }
    return r;
  }
  //Handle preceding failed edit jobs check
  async _checkPrecedingFailedEditJobs(t, e) {
    var o, l;
    let r = !1;
    const a = e.filter((c) => c.transaction.action === D.Edit && (c.status === b.Pending || c.status === b.Failed)), s = Object.keys(t.transaction.data)[0], i = ((o = t.transaction.data) == null ? void 0 : o[s].new) !== void 0 && ((l = t.transaction.data) == null ? void 0 : l[s].prev) !== void 0;
    return a.length > 0 && i && (r = !0, t.attempts || await this._editAttemptHandler(t, a)), r;
  }
  //Handle merging with future edit jobs
  async _mergeWithFutureEditJobs(t) {
    var l, c, d;
    const e = [], r = Object.keys(t.transaction.data)[0], a = (l = this._db) == null ? void 0 : l.transaction(v.store, "readonly").store, s = IDBKeyRange.lowerBound(t.createdAt, !0);
    let i = await (a == null ? void 0 : a.index(v.timeIndex).openCursor(s, "next"));
    for (; i; )
      //Only unresolved jobs
      (i.value.status === b.Pending || i.value.status === b.Failed) && //Same destination
      i.value.url === t.url && //Only edit jobs
      i.value.transaction.action === D.Edit && //Only same object jobs
      i.value.transaction.blitzID === t.transaction.blitzID && //Only same attribute jobs
      Object.keys(i.value.transaction.data)[0] === r && e.push(i.value), i = await i.continue();
    var o = t;
    if (e.length > 0) {
      const u = e[e.length - 1];
      if (u && ((c = u.transaction.data) == null ? void 0 : c[r].new) !== void 0 && ((d = t.transaction.data) == null ? void 0 : d[r].prev) !== void 0) {
        const h = {
          [r]: {
            prev: t.transaction.data[r].prev,
            new: u.transaction.data[r].new
          }
        }, f = (/* @__PURE__ */ new Date()).getTime();
        o = await this._updateJob({
          ...t,
          transaction: {
            ...t.transaction,
            data: h,
            blitzstamp: nt(),
            hash: ct({ ...h, blitzID: t.transaction.blitzID, timestamp: f })
          },
          dataHistory: [...t.dataHistory ?? [], { timestamp: f, type: "worker-succeeding", data: t.transaction.data }]
        }), await new tt().recordRewrittenTransaction(
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
    var r, a, s;
    if (e.status === F.Success) {
      const i = await this._updateJob({
        ...t,
        status: b.Completed
      });
      this._sendJobEvent(i);
    } else if (e.status === F.Exception)
      await this._updateJob({
        ...t,
        status: b.Pending,
        attempts: t.attempts + 1,
        priority: t.priority < 5 ? t.priority + 1 : t.priority,
        message: e.message
      });
    else if (e.status === F.Failed)
      if (t.attempts > 0) {
        const i = await this._updateJob({
          ...t,
          status: b.Failed,
          message: e.message
        });
        this._sendJobEvent(i);
      } else
        await this._updateJob({
          ...t,
          status: b.Pending,
          attempts: t.attempts + 1,
          message: e.message
        });
    else if (e.status === F.Conflict) {
      const i = Object.keys(t.transaction.data)[0];
      if (((r = t.transaction.data) == null ? void 0 : r[i].prev) === ((a = t.transaction.data) == null ? void 0 : a[i].new) || e.message === ((s = t.transaction.data) == null ? void 0 : s[i].new)) {
        const o = await this._updateJob({
          ...t,
          status: b.Completed
        });
        this._sendJobEvent(o);
      } else {
        const o = await this._updateJob({
          ...t,
          status: b.Conflict,
          message: e.message
        });
        this._sendJobEvent(o);
      }
    }
  }
  //Handle edit job attempt
  async _editAttemptHandler(t, e) {
    var c, d, u, h, f;
    const r = Object.keys(t.transaction.data)[0], a = e[0];
    if (((c = a.transaction.data) == null ? void 0 : c[r].prev) === void 0)
      return;
    const s = {
      [r]: {
        prev: a.transaction.data[r].prev,
        new: (d = t.transaction.data) == null ? void 0 : d[r].new
      }
    }, i = (/* @__PURE__ */ new Date()).getTime();
    var o = {
      ...t,
      transaction: {
        ...t.transaction,
        data: s,
        blitzstamp: nt(),
        hash: ct({ ...s, blitzID: t.transaction.blitzID, timestamp: i })
      },
      dataHistory: [...t.dataHistory ?? [], { timestamp: i, type: "worker-attempt", data: t.transaction.data }]
    };
    await new tt().recordRewrittenTransaction(o.transaction, []);
    let l;
    if (s[r].prev === s[r].new ? l = { status: F.Success } : l = await Rt.send(o, ne(o.url, this._localHeaders)), l.status === F.Success) {
      o = await this._updateJob({
        ...o,
        status: b.Completed
      });
      for (const g of e)
        await this._updateJob({
          ...g,
          status: b.Completed
        });
      this._sendJobEvent(o);
    } else if (l.status === F.Exception || l.status === F.Failed)
      await this._updateJob({
        ...t,
        status: a.status,
        attempts: t.attempts + 1,
        message: l.message
      });
    else if (l.status === F.Conflict)
      if (((u = o.transaction.data) == null ? void 0 : u[r].prev) === ((h = o.transaction.data) == null ? void 0 : h[r].new) || l.message === ((f = o.transaction.data) == null ? void 0 : f[r].new)) {
        o = await this._updateJob({
          ...o,
          status: b.Completed
        });
        for (const g of e)
          await this._updateJob({
            ...g,
            status: b.Completed
          });
        this._sendJobEvent(o);
      } else {
        o = await this._updateJob({
          ...o,
          status: b.Conflict,
          message: l.message
        });
        for (const g of e)
          await this._deleteJob(g);
        this._sendJobEvent(o);
      }
    (l.status === F.Success || l.status === F.Conflict) && await new tt().recordRewrittenTransaction(
      o.transaction,
      [t.transaction.hash, ...e.map((g) => g.transaction.hash)]
    );
  }
  //Start processing queue
  async start() {
    var r, a;
    for (this._db = await ot(v.name, 1); ; ) {
      try {
        var t = await this._getNextJob();
        if (!t)
          throw new Error("SKIP");
        if (await this._checkPriority(t))
          throw new Error("SKIP");
        var e = [];
        if ((t.transaction.action === D.Edit || t.transaction.action === D.Delete) && (e = await this._getPrecedingUnresolvedJobs(t), await this._checkPrecedingUnresolvedAddJob(t, e)))
          throw new Error("SKIP");
        if (t.transaction.action === D.Edit) {
          if (await this._checkPrecedingConflictEditJobs(t, e))
            throw new Error("SKIP");
          if (await this._checkPrecedingFailedEditJobs(t, e))
            throw new Error("SKIP");
          t = await this._mergeWithFutureEditJobs(t);
          const c = Object.keys(t.transaction.data)[0];
          if (((r = t.transaction.data) == null ? void 0 : r[c].prev) !== void 0 && ((a = t.transaction.data) == null ? void 0 : a[c].new) !== void 0 && t.transaction.data[c].prev === t.transaction.data[c].new) {
            const d = { status: F.Success };
            throw await this._statusHandler(t, d), new Error("SKIP");
          }
        }
        const i = await Rt.send(t, ne(t.url, this._localHeaders));
        await this._statusHandler(t, i);
      } catch (s) {
        if (s.message !== "SKIP") {
          console.error(s.stack);
          break;
        }
      }
      await new Promise((s) => setTimeout(s, 1e3));
    }
    this._db && this._db.close(), this.start();
  }
}
function ae(n) {
  yt.push(n), n.onmessage = function(t) {
    t.data.type === "close" ? yt = yt.filter((e) => e !== n) : t.data.type === "headers" ? t.data.data && (Oe = t.data.data) : t.data.type === "scopedHeaders" && t.data.data && (Qt = t.data.data);
  };
}
("SharedWorkerGlobalScope" in self || "WorkerGlobalScope" in self) && ("SharedWorkerGlobalScope" in self ? self.onconnect = (n) => ae(n.ports[0]) : ae(self), new ze().start());
class $ {
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
    this.action = t.action, this.blitzstamp = t.blitzstamp ?? nt(), this.hash = t.hash ?? ct(t.data === void 0 ? { blitzID: t.blitzID, milliseconds: (/* @__PURE__ */ new Date()).getTime(), rand: Math.random() } : { ...t.data, blitzID: t.blitzID, milliseconds: (/* @__PURE__ */ new Date()).getTime(), rand: Math.random() }), this.hashAlgo = t.hashAlgo ?? "b-crc32", this.blitzID = t.blitzID ?? ((e = t.data) == null ? void 0 : e._blitzID) ?? this.hash, this.model = t.model, this.data = t.data ?? {}, this.userhash = t.userhash;
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
    return new $({
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
    return new $({
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
var C = /* @__PURE__ */ ((n) => (n.Success = "success", n.Notice = "notice", n.Error = "error", n.Exception = "exception", n))(C || {});
class Y {
  /**
   * Constructor.
   *
   * @param hash Hash of the transaction.
   * @param status Status of the transaction result.
   * @param message Message of the transaction.
   * @param conflict Whether it is a conflicting transaction or not.
   */
  constructor(t, e, r, a = null, s) {
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
    this.blitzID = t, this.hash = e, this.status = r, this.message = a, this.conflict = s;
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
class _t extends Array {
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
    return new _t(...this.filter((t) => t.status));
  }
  /**
   * Returns new transaction result collection that only contains failed transaction results.
   */
  failed() {
    return new _t(...this.filter((t) => !t.status));
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
    const a = `${E.sanitizeBaseUrl(t)}api/list/${e}.json`, s = new URLSearchParams();
    return new URL(t).origin !== window.location.origin && s.append("enableCors", "1"), s.append("fkOptions", JSON.stringify({ _userID: "blitzID" })), (i = r.conditions) != null && i.length && s.append("conditions", JSON.stringify(r.conditions)), r.limit && s.append("limit", r.limit.toString()), r.customSort && s.append("customSort", r.customSort), r.customSortDirection && s.append("customSortDirection", r.customSortDirection), r.pagination && s.append("pagination", r.pagination.toString()), r.var && r.var.length > 0 && s.append("var", JSON.stringify(r.var)), r.manyToMany && s.append("manyToMany", r.manyToMany), `${a}?${s.toString()}`;
  }
  /**
   * Create a get endpoint.
   *
   * @param baseUrl Base URL.
   * @param modelName Model name.
   * @param blitzID Id of the object.
   * @param query Query parameters to be appended to endpoint.
   */
  static createGetEndpoint(t, e, r, a) {
    const s = `${E.sanitizeBaseUrl(t)}api/list/${e}/_blitzID/${r}.json`, i = new URLSearchParams();
    return new URL(t).origin !== window.location.origin && i.append("enableCors", "1"), i.append("fkOptions", JSON.stringify({ _userID: "blitzID" })), a.var && a.var.length > 0 && i.append("var", JSON.stringify(a.var)), a.manyToMany && i.append("manyToMany", a.manyToMany), `${s}?${i.toString()}`;
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
    var s, i;
    const e = t.type === "delete" ? "listDeletedLogs" : "listLogs", r = t.model ? `${E.sanitizeBaseUrl(t.baseUrl)}api/${e}/${t.model}.json` : `${E.sanitizeBaseUrl(t.baseUrl)}api/${e}.json`, a = new URLSearchParams();
    return ((s = t.query) == null ? void 0 : s.from) !== void 0 && a.append("from", t.query.from.toString()), (i = t.query) != null && i.models && !t.model && a.append("models", JSON.stringify(t.query.models)), `${r}?${a.toString()}`;
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
    const r = new URL(t).origin !== window.location.origin ? "?enableCors=1" : "", a = (r ? r + "&" : "?") + `filename=${e}`;
    return `${E.sanitizeBaseUrl(t)}uploadervideo/index` + a;
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
class rt {
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
      throw new Error(r.errors.map((a) => (a == null ? void 0 : a.message) ?? a).join(" | "));
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
      throw new Error(r.errors.map((a) => (a == null ? void 0 : a.message) ?? a).join(" | "));
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
      lastTimestamp: e.lastTimestamp
    };
  }
  /**
   * Performs an image upload call to the server by given base URL and image file.
   *
   * @param options Upload options.
   */
  static async upload(t) {
    const e = new FormData();
    e.append("image", t.image);
    const r = await P.create().url(E.createUploaderEndpoint(t.baseUrl)).body(e).header("Accept", "application/json").post(), a = {};
    for (const [s, i] of Object.entries(r ?? {}))
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
      ].includes(s) && (a[s] = i);
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
    const r = t.video.name.split("."), a = r.length > 1 ? "." + r.pop() : "", s = crypto.randomUUID() + a, i = await P.create().url(E.createVideoUploaderEndpoint(t.baseUrl, s)).body(e).header("Accept", "application/json").post();
    if (!i || !i.s)
      throw new Error("Video upload failed: " + ((i == null ? void 0 : i.error) ?? "Unknown error!"));
    return {
      url: i.url.video,
      thumbnail: i.url.thumb,
      "tn-oq": i.url.tnoq
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
    const r = await P.create().url(E.createFileUploaderEndpoint(t.baseUrl)).body(e).header("Accept", "application/json").post();
    if (!r || !r.s)
      throw new Error("File upload failed: " + ((r == null ? void 0 : r.error) ?? "Unknown error!"));
    return {
      url: r.files.url
    };
  }
  /**
   * Performs a ping call to the server by provided base URL.
   */
  static async ping({ baseUrl: t }) {
    return await P.create().url(E.createPingEndpoint(t)).get();
  }
}
class Xt {
  constructor() {
    /**
     * Query parameters for the call.
     */
    m(this, "_query");
    /**
     * Model to fetch logs from.
     */
    m(this, "_model");
    /**
     * Type of resources to fetch.
     */
    m(this, "_type");
  }
  /**
   * Creates a list logs call instance.
   */
  static create() {
    return new Xt();
  }
  /**
   * Sets the query parameters.
   *
   * @param value The query parameters to set.
   */
  query(t) {
    return this._query = t, this;
  }
  /**
   * Sets the model to fetch logs from.
   */
  model(t) {
    return this._model = t, this;
  }
  /**
   * Sets the type of resources to fetch.
   */
  type(t) {
    return this._type = t, this;
  }
  /**
   * Performs the list logs call.
   */
  async perform() {
    const t = p.clusterManager.toArray().map((a) => a.getNextReadURL()), e = await Promise.all(
      t.map((a) => rt.listLogs({
        baseUrl: a,
        query: this._query,
        model: this._model,
        type: this._type
      }))
    );
    return {
      transactions: [].concat(...e.map((a) => a.transactions)).filter((a, s, i) => i.findIndex((o) => o.hash === a.hash) === s).filter((a) => typeof a == "object" && !Array.isArray(a)),
      userID: e[0].userID,
      userhash: e[0].userhash,
      lastTimestamp: e[0].lastTimestamp
    };
  }
}
class M {
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
   * Returns the timestamp of when the data was last synced with.
   */
  static getLastSyncedAt(t) {
    const e = this.get(t ? `${t}.lastSyncedAt` : "lastSyncedAt");
    return e ? parseInt(e) : null;
  }
  /**
   * Sets the timestamp of when the data was last synced with.
   */
  static setLastSyncedAt(t, e) {
    this.set(e ? `${e}.lastSyncedAt` : "lastSyncedAt", t.toString());
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
class Ot {
  constructor() {
    /**
     * Master indexed db client.
     */
    m(this, "client", new tt());
  }
  /**
   * Creates a new instance of the SyncTransactionRepository class.
   */
  static create() {
    return new Ot();
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
    for (const e of t)
      await this.put(e);
  }
  /**
   * Deletes the transaction from indexed db by its hash.
   */
  async delete(t) {
    const e = await this.client.openConnection();
    await e.delete("sync_transactions", t), e.close();
  }
}
class ht {
  /**
   * Creates a new syncer.
   */
  static create() {
    return new ht();
  }
  /**
   * Runs the synchronization process.
   */
  async run(t, e) {
    var d;
    if (!navigator.onLine)
      return;
    const r = p.options.sync.startDate instanceof Date && t !== "_Model" ? Math.floor(p.options.sync.startDate.getTime() / 1e3) : 0, a = M.getLastSyncedAt(t) ?? r, { transactions: s, lastTimestamp: i } = await Xt.create().type(e).query({
      from: a,
      models: t ? [t] : p.options.sync.models ?? [
        "_Project",
        ...(await R.list()).map((u) => u.getName()).filter((u) => u.startsWith("bdt") && !["bdt24prszej_appfiles", "bdt24prszej_apps"].includes(u))
      ]
    }).perform(), o = Ot.create();
    await o.putMultiple(s), M.setLastSyncedAt(i ?? Math.floor(Date.now() / 1e3), t);
    const l = (await o.all()).map((u) => $.fromObject(u)), c = await V.create().run(l);
    if (p.options.sync.live === !0) {
      const u = /* @__PURE__ */ new Set();
      for (const h of l)
        if (((d = c.get(h.hash)) == null ? void 0 : d.status) === C.Success)
          try {
            const f = await R.get(h.model), g = `${h.model}:${h.blitzID}:${h.action}`;
            await (f == null ? void 0 : f.memoryClient().applyTransaction(h, !u.has(g))), u.add(g);
          } catch (f) {
            console.error(`Live emission failed for transaction ${h.hash}:`, (f == null ? void 0 : f.stack) ?? (f == null ? void 0 : f.message) ?? f);
          }
    }
    a !== i && await this.run(t, e);
  }
  async runAtInterval(t) {
    for (; ; ) {
      await mr(t);
      try {
        await this.run();
      } catch (e) {
        console.error("Sync run failed:", (e == null ? void 0 : e.stack) ?? (e == null ? void 0 : e.message) ?? e);
      }
    }
  }
}
class V {
  /**
   * Creates new transaction evaluator.
   */
  static create() {
    return new V();
  }
  /**
   * Runs the transaction evaluator with supplied transactions.
   *
   * @param transactions Transactions to be processed.
   */
  async run(t) {
    const e = new _t(), r = Ot.create(), a = { add: 1, edit: 2, delete: 3 }, s = await new tt().openConnection();
    t = t.sort((i, o) => a[i.action] - a[o.action]);
    for (const i of t) {
      let o;
      i.model === "@Model" ? i.model = "_Model" : i.model === "@Project" && (i.model = "_Project");
      try {
        if (i.action === "add")
          o = await this.processAddTransaction(i);
        else if (i.action === "edit")
          o = await this.processEditTransaction(i, s);
        else if (i.action === "delete")
          o = await this.processDeleteTransaction(i);
        else
          throw new Error(`Unknown action "${i.action}" on transaction ${i.hash}`);
        await s.put("evaluated_transactions", i.toObject());
      } catch (l) {
        o = new Y(
          i.blitzID,
          i.hash,
          C.Error,
          l.message
        );
      }
      e.push(o), await r.delete(i.hash);
    }
    return s.close(), e;
  }
  /**
   * Processes the `add` transaction.
   *
   * @param transaction Transaction to be processed.
   */
  async processAddTransaction(t) {
    var i;
    const e = await R.get(t.model), r = e.idbClient();
    if (await r.find(t.hash))
      return new Y(
        t.hash,
        t.hash,
        C.Error,
        `Object with ${t.hash} already exists on ${t.model} model.`
      );
    const a = e.getClusterManager(), s = {
      _blitzID: t.hash,
      _blitzstamp: t.blitzstamp.toString(),
      _sort: t.blitzstamp.toString(),
      _clusters: a.names(),
      _editURLs: a.toArray().map((o) => o.options.addURL).flat(),
      ...(() => {
        const o = {};
        for (const [l, c] of Object.entries(t.data)) {
          const d = e.getAttributeDetails(l);
          if (d && Array.isArray(d.type) && c !== void 0) {
            const u = typeof c == "string" ? JSON.parse(c) : c;
            l.endsWith("_mtm") ? o[l] = u.map((f, g) => ({
              _blitzID: typeof f == "string" ? f : f._blitzID,
              _mtmSort: typeof f == "string" ? (u.length - g) * 15 : f._mtmSort
            })) : o[l] = u;
          } else
            o[l] = c;
        }
        return o;
      })()
    };
    if (["1", !0].includes((i = e.haspublishingdate) == null ? void 0 : i.value) && typeof t.data._publishingdate > "u" && typeof t.blitzstamp == "number") {
      const o = /* @__PURE__ */ new Date();
      o.setTime(t.blitzstamp * 1e3 + (/* @__PURE__ */ new Date("2021-01-01T00:00:00Z")).getTime()), o.setMinutes(o.getMinutes() - o.getTimezoneOffset()), s._publishingdate = o.toISOString().slice(0, 19).replace("T", " ");
    }
    return !s._userID && t.userhash && (s._userID = t.userhash), t.data = s, await r.create(s), new Y(t.hash, t.hash, C.Success);
  }
  /**
   * Processes the `edit` transaction.
   *
   * @param transaction Transaction to be processed.
   */
  async processEditTransaction(t, e) {
    var c;
    const r = await R.get(t.model), a = r.idbClient(), s = Object.keys(t.data);
    if (s.length !== 1)
      return new Y(
        t.blitzID,
        t.hash,
        C.Error,
        s.length > 1 ? "Can not edit more than one attribute at once." : "Attribute not provided to perform edit."
      );
    if (await e.get("evaluated_transactions", t.hash))
      return new Y(
        t.blitzID,
        t.hash,
        C.Notice,
        `Transaction ${t.hash} already processed.`
      );
    const i = await a.find(t.blitzID);
    if (!i)
      return new Y(t.blitzID, t.hash, C.Notice, `Object with ${t.blitzID} does not exists.`);
    if (i._savetimestamp && i._savetimestamp > t.blitzstamp)
      return new Y(t.blitzID, t.hash, C.Notice, "Old transaction.");
    const o = s.shift(), l = (c = r.getAttributeDetails(o)) == null ? void 0 : c.type;
    if (Array.isArray(l))
      if (Object.hasOwn(t.data[o], "add")) {
        i[o] = Array.isArray(i[o]) ? i[o] : [];
        const d = t.data[o].add;
        o.endsWith("_mtm") ? i[o].push({
          _blitzID: typeof d == "string" ? d : d._blitzID,
          _mtmSort: typeof d == "string" ? i[o].length ? Math.max(...i[o].map((h) => h._mtmSort)) + 15 : 15 : d._mtmSort
        }) : i[o].push(d);
      } else if (Object.hasOwn(t.data[o], "remove") && Array.isArray(i[o])) {
        const d = t.data[o].remove;
        o.endsWith("_mtm") ? i[o].splice(i[o].findIndex((h) => h._blitzID === d), 1) : i[o].splice(i[o].findIndex((h) => h === d), 1);
      } else
        return new Y(t.blitzID, t.hash, C.Error, `Invalid operation for array attribute ${o}.`);
    else {
      const d = t.data[o];
      if (i[o] === d.new)
        return new Y(t.blitzID, t.hash, C.Notice, "Conflict");
      i[o] = d.new;
    }
    return await a.update(i), new Y(t.blitzID, t.hash, C.Success);
  }
  /**
   * Processes the `delete` transaction.
   *
   * @param transaction Transaction to be processed.
   */
  async processDeleteTransaction(t) {
    const r = (await R.get(t.model)).idbClient();
    return await r.find(t.blitzID) ? (await r.delete(t.blitzID), new Y(t.blitzID, t.hash, C.Success)) : new Y(t.blitzID, t.hash, C.Error, `Object with ${t.blitzID} does not exists.`);
  }
}
class gr {
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
    var s;
    const e = [], r = (s = this._db) == null ? void 0 : s.transaction(v.store, "readonly").store;
    let a = await (r == null ? void 0 : r.openCursor(null, "next"));
    for (; a; )
      //Only completed jobs
      a.value.status === b.Completed && //Not the same destination
      a.value.url !== t.url && //Only edit jobs
      a.value.transaction.action === D.Edit && //Only same object jobs
      a.value.transaction.blitzID === t.transaction.blitzID && //Only same hash
      a.value.transaction.hash === t.transaction.hash && e.push(a.value), a = await a.continue();
    return e;
  }
  //Get future jobs
  async _getFutureJobs(t, e) {
    var o;
    const r = [], a = (o = this._db) == null ? void 0 : o.transaction(v.store, "readonly").store, s = IDBKeyRange.lowerBound(t.createdAt, !0);
    let i = await (a == null ? void 0 : a.index(v.timeIndex).openCursor(s, "next"));
    for (; i; )
      //Only conflict jobs
      i.value.status === b.Conflict && //Same destination
      i.value.url === t.url && //Only edit jobs
      i.value.transaction.action === D.Edit && //Only same object jobs
      i.value.transaction.blitzID === t.transaction.blitzID && //Only same attribute jobs
      Object.keys(i.value.transaction.data)[0] === e && r.push(i.value), i = await i.continue();
    return r;
  }
  //Merge with future jobs
  async _mergeWithFutureEditJobs(t, e) {
    var s, i;
    const r = await this._getFutureJobs(t, e);
    let a = t;
    if (r.length > 0) {
      const o = r[r.length - 1];
      if (o && ((s = o.transaction.data) == null ? void 0 : s[e].new) !== void 0 && ((i = t.transaction.data) == null ? void 0 : i[e].prev) !== void 0) {
        const l = {
          [e]: {
            prev: t.transaction.data[e].prev,
            new: o.transaction.data[e].new
          }
        }, c = (/* @__PURE__ */ new Date()).getTime();
        a = await this._updateJob({
          ...t,
          transaction: {
            ...t.transaction,
            data: l,
            blitzstamp: nt(),
            hash: ct({ ...l, blitzID: t.transaction.blitzID, timestamp: c })
          },
          dataHistory: [...t.dataHistory ?? [], { timestamp: c, type: "conflict-succeeding", data: t.transaction.data }]
        }), await new tt().recordRewrittenTransaction(
          a.transaction,
          [t.transaction.hash, ...r.map((d) => d.transaction.hash)]
        );
        for (const d of r)
          await this._deleteJob(d);
      }
    }
    return a;
  }
  //Prompt the user to force or revert the job
  async prompt(t) {
    var s;
    if (t.message === void 0)
      return;
    const e = Object.keys(t.transaction.data)[0];
    let r = await this._mergeWithFutureEditJobs(t, e);
    const a = `There was a conflict.
The data got changed to "${r.message}".
Do you still want to perform your change to "${(s = r.transaction.data) == null ? void 0 : s[e].new}"?`;
    confirm(a) ? (r = await this.force(r), await p.queue.updateSyncStatus(r, b.Pending)) : (await this.revert(r), await p.queue.updateSyncStatus(r, b.Completed)), p.dispatchEvent("queue:conflict", r);
  }
  //Force the job
  async force(t) {
    var o;
    const e = Object.keys(t.transaction.data)[0], r = await this._getFutureJobs(t, e), a = {
      [e]: {
        prev: t.message,
        new: (o = t.transaction.data) == null ? void 0 : o[e].new
      }
    }, s = (/* @__PURE__ */ new Date()).getTime(), i = await this._updateJob({
      ...t,
      status: b.Pending,
      transaction: {
        ...t.transaction,
        data: a,
        blitzstamp: nt(),
        hash: ct({ ...a, blitzID: t.transaction.blitzID, timestamp: s })
      },
      dataHistory: [...t.dataHistory ?? [], { timestamp: s, type: "conflict-force", data: t.transaction.data }]
    });
    await V.create().run([
      new $({
        action: "edit",
        model: i.transaction.model,
        blitzID: i.transaction.blitzID,
        blitzstamp: i.transaction.blitzstamp,
        hash: i.transaction.hash,
        data: i.transaction.data
      })
    ]), await new tt().recordRewrittenTransaction(i.transaction, [t.transaction.hash]);
    for (const l of r)
      await this._updateJob({
        ...l,
        status: b.Pending
      });
    return i;
  }
  //Revert the job
  async revert(t) {
    var i;
    const e = Object.keys(t.transaction.data)[0], r = new $({
      action: "edit",
      model: t.transaction.model,
      blitzID: t.transaction.blitzID,
      data: {
        [e]: {
          prev: (i = t.transaction.data) == null ? void 0 : i[e].new,
          new: t.message
        }
      }
    });
    await V.create().run([r]);
    const a = await this._getFutureJobs(t, e), s = await this._getCompletedReplicatedJobs(t);
    for (const o of [t, ...a])
      await this._deleteJob(o);
    if (s.length > 0) {
      const o = s.map((l) => l.url).filter((l, c, d) => d.findIndex((u) => u === l) === c);
      for (const l of o)
        await p.queue.addJob(l, r.toObject());
    }
  }
}
class wr {
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
  //Get future jobs
  async _getFutureJobs(t) {
    var i;
    const e = [], r = (i = this._db) == null ? void 0 : i.transaction(v.store, "readonly").store, a = IDBKeyRange.lowerBound(t.createdAt, !0);
    let s = await (r == null ? void 0 : r.index(v.timeIndex).openCursor(a, "next"));
    for (; s; )
      //Same destination
      s.value.url === t.url && //Only same object jobs
      s.value.transaction.blitzID === t.transaction.blitzID && e.push(s.value), s = await s.continue();
    return e;
  }
  //Retry jobs
  async retry(t) {
    for (const e of t)
      await this._updateJob({
        ...e,
        status: b.Pending
      });
  }
  //Revert jobs
  async revert(t) {
    var r, a;
    t.sort((s, i) => s.createdAt - i.createdAt);
    const e = t[0];
    if (e) {
      if (e.transaction.action === D.Add) {
        await V.create().run([
          new $({
            action: "delete",
            model: e.transaction.model,
            blitzID: e.transaction.blitzID
          })
        ]);
        const s = await this._getFutureJobs(e);
        for (const i of [e, ...s])
          await this._deleteJob(i);
      } else if (e.transaction.action === D.Delete)
        await this._deleteJob(e), await R.get(e.transaction.model).then((s) => s == null ? void 0 : s.get(e.transaction.blitzID));
      else if (e.transaction.action === D.Edit) {
        const s = Object.keys(e.transaction.data ?? {})[0];
        if (!s || ((r = e.transaction.data) == null ? void 0 : r[s].new) === void 0 || ((a = e.transaction.data) == null ? void 0 : a[s].prev) === void 0)
          return;
        const i = new $({
          action: "edit",
          model: e.transaction.model,
          blitzID: e.transaction.blitzID,
          data: {
            [s]: {
              prev: e.transaction.data[s].new,
              new: e.transaction.data[s].prev
            }
          }
        });
        await V.create().run([i]);
        for (const o of t)
          await this._deleteJob(o);
      }
    }
  }
  //Get all failed/conflict jobs grouped by server URL
  async getAll() {
    var a;
    const t = {}, e = (a = this._db) == null ? void 0 : a.transaction(v.store, "readonly").store;
    let r = await (e == null ? void 0 : e.index(v.timeIndex).openCursor(null, "next"));
    for (; r; ) {
      if (
        //Only unresolved jobs
        r.value.status !== b.Completed
      ) {
        if (t[r.value.url] || (t[r.value.url] = []), r.value.transaction.action === D.Add || r.value.transaction.action === D.Delete)
          t[r.value.url].push([r.value]);
        else if (r.value.transaction.action === D.Edit) {
          const s = Object.keys(r.value.transaction.data ?? {})[0], i = r.value.transaction.blitzID, o = t[r.value.url].findIndex((l) => l[0].transaction.action === D.Edit && l[0].transaction.blitzID === i && Object.keys(l[0].transaction.data ?? {})[0] === s);
          o === -1 ? t[r.value.url].push([r.value]) : t[r.value.url][o].push(r.value);
        }
      }
      r = await r.continue();
    }
    return t;
  }
}
class br {
  constructor() {
    // Properties
    m(this, "_db", null);
    m(this, "conflictHandler", null);
    m(this, "failedHandler", null);
  }
  // Handle worker message
  _handleWorkerMessage(t) {
    var r;
    const e = t.data.job;
    e.status === b.Completed ? p.dispatchEvent("queue:success", e) : e.status === b.Failed ? p.dispatchEvent("queue:failure", e) : e.status === b.Conflict && (document.hidden || (r = p.queue.conflictHandler) == null || r.prompt(e)), p._Model.get(e.transaction.model).then((a) => {
      var s;
      return (s = a == null ? void 0 : a.memoryClient().get(e.transaction.blitzID)) == null ? void 0 : s.dispatchEvent("syncStatusChange", e);
    }), p.queue.updateSyncStatus(e);
  }
  // Update sync status for attribute
  async updateSyncStatus(t, e) {
    if (t.transaction.action !== D.Edit)
      return;
    const r = await p._Model.get(t.transaction.model), a = r == null ? void 0 : r.memoryClient().get(t.transaction.blitzID);
    if (!a)
      return;
    const s = Object.keys(t.transaction.data ?? {})[0];
    if (!s)
      return;
    const i = a[s];
    if (!(!i || !Object.hasOwn(i, "_syncSignal")))
      if (e)
        i._syncSignal.set({ status: e });
      else {
        const l = (await p.queue.getJobsForObject(t.transaction.blitzID)).filter((f) => {
          var g;
          return f.transaction.action === D.Edit && ((g = f.transaction.data) == null ? void 0 : g[s]) !== void 0;
        });
        let c = b.Pending, d;
        const u = l.find((f) => f.status === b.Failed), h = l.find((f) => f.status === b.Conflict && f.message !== void 0) ?? l.find((f) => f.status === b.Conflict);
        u ? (c = b.Failed, d = u) : h ? (c = b.Conflict, d = h) : l.every((f) => f.status === b.Completed) && (c = b.Completed), i._syncSignal.set({ status: c, job: d });
      }
  }
  // Initialize queue client
  async init() {
    if (this._db = await ot(v.name, 1, {
      upgrade: (r) => {
        const a = r.createObjectStore(v.store, { keyPath: "id" });
        a.createIndex(v.timeIndex, "createdAt"), a.createIndex(v.objectIndex, "transaction.blitzID");
      }
    }), !this._db.objectStoreNames.contains(v.store))
      return await Vt(v.name), await this.init();
    this.conflictHandler = new gr(this._db), this.failedHandler = new wr(this._db);
    const t = new hr(
      p.options.queue.workerPath,
      { name: "bd-queue-worker" }
    );
    t.onerror = () => {
      console.warn("⚠️ Failed to run the queue's shared worker, please check that the worker path is correct, falling back to running on the same thread!"), new ze(
        (r) => this._handleWorkerMessage(r),
        P._globalHeaders,
        P._scopedHeaders
      ).start();
    }, t.port.onmessage = this._handleWorkerMessage, window.addEventListener("beforeunload", () => t.port.postMessage({ type: "close" }));
    const e = () => {
      t.port.postMessage({ type: "headers", data: P._globalHeaders }), t.port.postMessage({ type: "scopedHeaders", data: P._scopedHeaders });
    };
    return e(), P.onGlobalHeadersChange(e), this;
  }
  // Add job to queue worker
  async addJob(t, e) {
    var a;
    const r = {
      id: crypto.randomUUID(),
      url: t,
      transaction: e,
      status: b.Pending,
      createdAt: Date.now(),
      attempts: 0,
      priority: 1
    };
    await ((a = this._db) == null ? void 0 : a.add(v.store, r)), await this.updateSyncStatus(r, r.status);
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
    return e.sort((a, s) => a.createdAt - s.createdAt), e;
  }
}
const ut = {
  a: ["à", "á", "â", "ä"],
  c: ["ç"],
  e: ["è", "é", "ê"],
  o: ["ö", "ó", "ò", "ô", "õ"],
  oe: ["œ"],
  ss: ["ß"],
  u: ["ü"]
};
class wt {
  constructor() {
    m(this, "children");
    m(this, "isEndOfWord");
    m(this, "items");
    this.children = {}, this.isEndOfWord = !1, this.items = [];
  }
}
class yr {
  /**
   * Constructor for the Trie.
   *
   * @param model The model to build the Trie for.
   * @param data The data to build the Trie from.
   */
  constructor(t, e) {
    m(this, "root");
    if (this.root = new wt(), !e)
      return;
    const r = this.getWordFrequency(t, e);
    for (const a in r)
      this.insert(a, r[a].items);
  }
  /**
   * Loads the Trie data structure from a JSON object.
   *
   * @param json The JSON object containing the data to load.
   * @param nod The TrieNode to load the data into.
   */
  _loadFromJson(t, e) {
    Object.keys(t).forEach((r) => {
      typeof t[r] == "string" || typeof t[r] == "boolean" || (e.children[r] || (e.children[r] = new wt()), t[r].hasOwnProperty("isEndOfWord") && t[r].isEndOfWord && (e.children[r].isEndOfWord = !0, e.children[r].items = t[r].items), this._loadFromJson(t[r], e.children[r]));
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
    return this.root = new wt(), this._loadFromJson(t, this.root), this;
  }
  toJson() {
    const t = (e) => {
      let r = {};
      for (const a in e.children)
        r[a] = t(e.children[a]);
      return e.isEndOfWord && (r.isEndOfWord = !0, r.items = e.items), r;
    };
    return t(this.root);
  }
  getWordFrequency(t, e) {
    const r = {}, a = t.getAttributes();
    return e.forEach((s) => {
      a == null || a.forEach((i) => {
        if (!s[i])
          return;
        s[i].toString().toLowerCase().split(" ").forEach((l) => {
          l !== "" && (r[l] ? r[l].items.push(s._blitzID) : r[l] = {
            items: [s._blitzID]
          });
        });
      });
    }), r;
  }
  getVariants(t) {
    const e = ut[t], r = [t];
    return e && r.push(...e), r;
  }
  generateAllPermutations(t, e, r, a, s) {
    if (e === r.length) {
      s.push(t);
      return;
    }
    const i = r[e], o = e !== r.length - 1 ? i + r[e + 1] : void 0;
    if (!ut[i] && !(o && ut[o])) {
      this.generateAllPermutations(
        t + i,
        e + 1,
        r,
        a,
        s
      );
      return;
    }
    if (ut[i]) {
      const l = a[i];
      for (const c of l)
        this.generateAllPermutations(
          t + c,
          e + 1,
          r,
          a,
          s
        );
    }
    if (o && ut[o]) {
      const l = a[o];
      for (const c of l)
        this.generateAllPermutations(
          t + c,
          e + 2,
          r,
          a,
          s
        );
    }
  }
  normalizeQuery(t) {
    const e = /u|e|a|o|c|ss|oe/g, r = t.toLowerCase().match(e);
    if (!r)
      return [t.toLowerCase()];
    const a = {};
    r.forEach((i) => {
      a[i] = this.getVariants(i);
    });
    const s = [];
    return this.generateAllPermutations("", 0, t, a, s), s;
  }
  insert(t, e) {
    let r = this.root;
    for (const a of t)
      r.children[a] || (r.children[a] = new wt()), r = r.children[a];
    r.isEndOfWord = !0, r.items = e;
  }
  addToSet(t, e) {
    const r = this.normalizeQuery(t);
    for (const a of r)
      this._search(a).forEach((i) => {
        e.add(i);
      });
  }
  search(t) {
    const e = t == null ? void 0 : t.toLowerCase().split(" ");
    let r = /* @__PURE__ */ new Set();
    return this.addToSet(e[0], r), e.slice(1).forEach((a) => {
      const s = /* @__PURE__ */ new Set();
      this.addToSet(a, s);
      for (const i of r)
        s.has(i) || r.delete(i);
    }), Array.from(r);
  }
  _search(t) {
    let e = this.root;
    for (const a of t) {
      if (!e.children[a])
        return [];
      e = e.children[a];
    }
    const r = [];
    return t === "" ? this.collectWords(e, "", r) : this.collectWords(e, t, r), r;
  }
  collectWords(t, e, r) {
    t.isEndOfWord && r.push(...t.items);
    for (const a in t.children) {
      const s = t.children[a], i = e + a;
      this.collectWords(s, i, r);
    }
  }
}
function Ae(n, t, e) {
  var a;
  let r = !0;
  for (const s of t) {
    if (!r)
      return !1;
    const [i, o, l] = s, c = (a = e == null ? void 0 : e[i]) == null ? void 0 : a.type;
    let d = n[i], u = l;
    switch (typeof d == "string" && (c === "datetime" || c === "date" || i === "_publishingdate") && (d = new Date(d).getTime()), typeof u == "string" && (c === "datetime" || c === "date" || i === "_publishingdate") && (u = new Date(u).getTime()), o) {
      case "LIKE":
        const h = `${u}`.startsWith("%"), f = `${u}`.endsWith("%"), g = `${u}`.replaceAll("%", "");
        h === f ? r = `${d}`.includes(g) : h ? r = `${d}`.endsWith(g) : f && (r = `${d}`.startsWith(g));
        break;
      case "IN":
        r = (Array.isArray(u) ? u : [u]).includes(d);
        break;
      case "=":
        r = d === u;
        break;
      case "!=":
        r = d !== u;
        break;
      case ">":
        r = d > u;
        break;
      case "<":
        r = d < u;
        break;
      case ">=":
        r = d >= u;
        break;
      case "<=":
        r = d <= u;
        break;
      default:
        r = !0;
        break;
    }
  }
  return r;
}
class pr {
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
    const r = await this.connect(), a = r.transaction("objects", "readonly").store, s = Array.from(a.indexNames), i = t.customSort && s.includes(t.customSort) ? t.customSort : s.includes("_projectsort") && (t.conditions ?? []).find((f) => f[0] === "project_fk" && f[1] === "=") ? "_projectsort" : s.includes("_sort") ? "_sort" : "_blitzstamp", o = t.customSortDirection === "ASC" ? "next" : "prev", l = t.pagination !== void 0 ? o === "next" ? IDBKeyRange.lowerBound(t.pagination.toString(), !0) : IDBKeyRange.upperBound(t.pagination.toString(), !0) : null;
    let c = await a.index(i).openCursor(l, o);
    const d = this.model.getAttributesDetails() ?? void 0;
    let u = [];
    for (; c; ) {
      if (e && !e.includes(c.value.blitzID)) {
        c = await c.continue();
        continue;
      }
      if (Ae(c.value, t.conditions ?? [], d) && (u.push(c.value), t.limit && u.length >= t.limit))
        break;
      c = await c.continue();
    }
    if (r.close(), t.var && t.var.length > 0) {
      const f = ["_blitzID", "_localID", "@permissions", "_sort", "_clusters", "_editURLs", "_savetimestamp", ...t.var];
      for (const g of u)
        for (const _ in g)
          f.includes(_) || delete g[_];
    }
    return u;
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
    const r = await this.connect(), a = new yr(this.model).loadFromJson(r.get("tree", this.model.getName()));
    r.close();
    const s = a.search(t);
    return t !== "" && s.length === 0 ? [] : this.query({ conditions: e }, s);
  }
  /**
   * Generates a tree by supplied data, then saves each item in the data to the database.
   *
   * @param objects list of native data in order to create the tree
   */
  async save(t, e = !1) {
    const r = await this.connect();
    for (const a of t) {
      let s = { ...a };
      const i = await r.get("objects", s._blitzID);
      if (i)
        s = { ...i, ...s };
      else if (e)
        continue;
      s._savetimestamp = nt(), await r.put("objects", s);
    }
    r.close();
  }
  /**
   * Connects to the database
   *
   * @returns instance of the database connection
   */
  async connect() {
    var s, i;
    const t = this.model.getAttributesDetails(), e = ["1", !0].includes((s = this.model._attributes.hassort) == null ? void 0 : s.value), r = e && ["1", !0].includes((i = this.model._attributes.hasprojects) == null ? void 0 : i.value);
    return await ot(this.model.getName(), 1, {
      upgrade: (o, l, c, d, u) => {
        const h = M.getDatabases();
        if (h.includes(o.name) || (h.push(o.name), M.setDatabases(h)), c !== 1)
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
class Kt {
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
    const e = new Kt();
    return e._cleanUp = this.subscribe((r) => {
      t(r) && e.emit(r);
    }), e;
  }
}
const Tt = class Tt {
  /**
   * Constructor.
   */
  constructor(t) {
    /**
     * Model that the client is connected to.
     */
    m(this, "model");
    this.model = t, p.objects.has(this.model.getName()) || p.objects.set(this.model.getName(), /* @__PURE__ */ new Map());
  }
  /**
   * Get model objects.
   */
  getAll() {
    return p.objects.get(this.model.getName());
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
    const r = e.get(t._blitzID.value), a = Object.keys(this.model.getAttributesDetails() ?? {}), s = p.options.sync.live === !0;
    for (const o of a) {
      const l = (i = t[o]) == null ? void 0 : i._value;
      if (l !== void 0) {
        const c = r[o];
        c && (c._value = l, c._valueSignal.set(l, s));
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
    Tt.channel.emit(t);
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
        const a = await this.model.idbClient().find(t.blitzID);
        for (const s of Object.keys(t.data))
          a && r[s] && (r[s].value = a[s]);
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
    var u, h;
    const e = [], r = Array.from(this.getAll().values()).map((f) => f.toObject()), a = this.model.getAttributesDetails() ?? void 0, s = Object.keys(a ?? {}), i = ["1", !0].includes((u = this.model._attributes.hassort) == null ? void 0 : u.value), o = i && ["1", !0].includes((h = this.model._attributes.hasprojects) == null ? void 0 : h.value), l = t.customSort && s.includes(t.customSort) ? t.customSort : o && (t.conditions ?? []).find((f) => f[0] === "project_fk" && f[1] === "=") ? "_projectsort" : i ? "_sort" : "_blitzstamp", c = t.customSortDirection ?? "DESC";
    r.sort((f, g) => {
      try {
        const _ = parseInt(f[l]), S = parseInt(g[l]);
        if (_ < S)
          return c === "ASC" ? -1 : 1;
        if (_ > S)
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
      if (Ae(f, t.conditions ?? [], a) && (e.push(f), t.limit && e.length >= t.limit))
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
m(Tt, "channel", new Kt());
let vt = Tt;
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
    var a, s;
    const r = this._valueSignal.subscribe(t, e);
    return this._value === void 0 && ((s = (a = this._object) == null ? void 0 : a.model) == null || s.get({ blitzID: this._object._blitzID.value, forceHttp: !0 }).then((i) => {
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
    var a;
    const e = this._syncSignal.get() !== null, r = this._syncSignal.subscribe(t, e);
    return e || p.queue.getJobsForObject((a = this._object) == null ? void 0 : a._blitzID.value).then((s) => {
      const i = s.filter((u) => {
        var h;
        return u.transaction.action === D.Edit && ((h = u.transaction.data) == null ? void 0 : h[this._name]) !== void 0;
      });
      let o = b.Pending, l;
      const c = i.find((u) => u.status === b.Failed), d = i.find((u) => u.status === b.Conflict && u.message !== void 0) ?? i.find((u) => u.status === b.Conflict);
      c ? (o = b.Failed, l = c) : d ? (o = b.Conflict, l = d) : i.every((u) => u.status === b.Completed) && (o = b.Completed), this._syncSignal.set({ status: o, job: l }, !1), t(this._syncSignal.get());
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
class dt extends U {
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
class Pe extends U {
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
const xe = 6048e5, _r = 864e5, bt = 43200, se = 1440, ie = Symbol.for("constructDateFrom");
function G(n, t) {
  return typeof n == "function" ? n(t) : n && typeof n == "object" && ie in n ? n[ie](t) : n instanceof Date ? new n.constructor(t) : new Date(t);
}
function j(n, t) {
  return G(t || n, n);
}
let vr = {};
function gt() {
  return vr;
}
function mt(n, t) {
  var o, l, c, d;
  const e = gt(), r = (t == null ? void 0 : t.weekStartsOn) ?? ((l = (o = t == null ? void 0 : t.locale) == null ? void 0 : o.options) == null ? void 0 : l.weekStartsOn) ?? e.weekStartsOn ?? ((d = (c = e.locale) == null ? void 0 : c.options) == null ? void 0 : d.weekStartsOn) ?? 0, a = j(n, t == null ? void 0 : t.in), s = a.getDay(), i = (s < r ? 7 : 0) + s - r;
  return a.setDate(a.getDate() - i), a.setHours(0, 0, 0, 0), a;
}
function Dt(n, t) {
  return mt(n, { ...t, weekStartsOn: 1 });
}
function Ee(n, t) {
  const e = j(n, t == null ? void 0 : t.in), r = e.getFullYear(), a = G(e, 0);
  a.setFullYear(r + 1, 0, 4), a.setHours(0, 0, 0, 0);
  const s = Dt(a), i = G(e, 0);
  i.setFullYear(r, 0, 4), i.setHours(0, 0, 0, 0);
  const o = Dt(i);
  return e.getTime() >= s.getTime() ? r + 1 : e.getTime() >= o.getTime() ? r : r - 1;
}
function St(n) {
  const t = j(n), e = new Date(
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
function zt(n, ...t) {
  const e = G.bind(
    null,
    n || t.find((r) => typeof r == "object")
  );
  return t.map(e);
}
function oe(n, t) {
  const e = j(n, t == null ? void 0 : t.in);
  return e.setHours(0, 0, 0, 0), e;
}
function Dr(n, t, e) {
  const [r, a] = zt(
    e == null ? void 0 : e.in,
    n,
    t
  ), s = oe(r), i = oe(a), o = +s - St(s), l = +i - St(i);
  return Math.round((o - l) / _r);
}
function Sr(n, t) {
  const e = Ee(n, t), r = G((t == null ? void 0 : t.in) || n, 0);
  return r.setFullYear(e, 0, 4), r.setHours(0, 0, 0, 0), Dt(r);
}
function pt(n, t) {
  const e = +j(n) - +j(t);
  return e < 0 ? -1 : e > 0 ? 1 : e;
}
function Mr(n) {
  return G(n, Date.now());
}
function kr(n) {
  return n instanceof Date || typeof n == "object" && Object.prototype.toString.call(n) === "[object Date]";
}
function Tr(n) {
  return !(!kr(n) && typeof n != "number" || isNaN(+j(n)));
}
function Ir(n, t, e) {
  const [r, a] = zt(
    e == null ? void 0 : e.in,
    n,
    t
  ), s = r.getFullYear() - a.getFullYear(), i = r.getMonth() - a.getMonth();
  return s * 12 + i;
}
function Or(n) {
  return (t) => {
    const r = (n ? Math[n] : Math.trunc)(t);
    return r === 0 ? 0 : r;
  };
}
function zr(n, t) {
  return +j(n) - +j(t);
}
function Ar(n, t) {
  const e = j(n, t == null ? void 0 : t.in);
  return e.setHours(23, 59, 59, 999), e;
}
function Pr(n, t) {
  const e = j(n, t == null ? void 0 : t.in), r = e.getMonth();
  return e.setFullYear(e.getFullYear(), r + 1, 0), e.setHours(23, 59, 59, 999), e;
}
function xr(n, t) {
  const e = j(n, t == null ? void 0 : t.in);
  return +Ar(e, t) == +Pr(e, t);
}
function Er(n, t, e) {
  const [r, a, s] = zt(
    e == null ? void 0 : e.in,
    n,
    n,
    t
  ), i = pt(a, s), o = Math.abs(
    Ir(a, s)
  );
  if (o < 1)
    return 0;
  a.getMonth() === 1 && a.getDate() > 27 && a.setDate(30), a.setMonth(a.getMonth() - i * o);
  let l = pt(a, s) === -i;
  xr(r) && o === 1 && pt(r, s) === 1 && (l = !1);
  const c = i * (o - +l);
  return c === 0 ? 0 : c;
}
function Cr(n, t, e) {
  const r = zr(n, t) / 1e3;
  return Or(e == null ? void 0 : e.roundingMethod)(r);
}
function Ur(n, t) {
  const e = j(n, t == null ? void 0 : t.in);
  return e.setFullYear(e.getFullYear(), 0, 1), e.setHours(0, 0, 0, 0), e;
}
const Lr = {
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
}, Wr = (n, t, e) => {
  let r;
  const a = Lr[n];
  return typeof a == "string" ? r = a : t === 1 ? r = a.one : r = a.other.replace("{{count}}", t.toString()), e != null && e.addSuffix ? e.comparison && e.comparison > 0 ? "in " + r : r + " ago" : r;
};
function K(n) {
  return (t = {}) => {
    const e = t.width ? String(t.width) : n.defaultWidth;
    return n.formats[e] || n.formats[n.defaultWidth];
  };
}
const Fr = {
  full: "EEEE, MMMM do, y",
  long: "MMMM do, y",
  medium: "MMM d, y",
  short: "MM/dd/yyyy"
}, jr = {
  full: "h:mm:ss a zzzz",
  long: "h:mm:ss a z",
  medium: "h:mm:ss a",
  short: "h:mm a"
}, Jr = {
  full: "{{date}} 'at' {{time}}",
  long: "{{date}} 'at' {{time}}",
  medium: "{{date}}, {{time}}",
  short: "{{date}}, {{time}}"
}, Nr = {
  date: K({
    formats: Fr,
    defaultWidth: "full"
  }),
  time: K({
    formats: jr,
    defaultWidth: "full"
  }),
  dateTime: K({
    formats: Jr,
    defaultWidth: "full"
  })
}, Rr = {
  lastWeek: "'last' eeee 'at' p",
  yesterday: "'yesterday at' p",
  today: "'today at' p",
  tomorrow: "'tomorrow at' p",
  nextWeek: "eeee 'at' p",
  other: "P"
}, Hr = (n, t, e, r) => Rr[n];
function J(n) {
  return (t, e) => {
    const r = e != null && e.context ? String(e.context) : "standalone";
    let a;
    if (r === "formatting" && n.formattingValues) {
      const i = n.defaultFormattingWidth || n.defaultWidth, o = e != null && e.width ? String(e.width) : i;
      a = n.formattingValues[o] || n.formattingValues[i];
    } else {
      const i = n.defaultWidth, o = e != null && e.width ? String(e.width) : n.defaultWidth;
      a = n.values[o] || n.values[i];
    }
    const s = n.argumentCallback ? n.argumentCallback(t) : t;
    return a[s];
  };
}
const $r = {
  narrow: ["B", "A"],
  abbreviated: ["BC", "AD"],
  wide: ["Before Christ", "Anno Domini"]
}, Br = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["Q1", "Q2", "Q3", "Q4"],
  wide: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"]
}, Yr = {
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
}, qr = {
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
}, Vr = {
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
}, Qr = {
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
}, Xr = (n, t) => {
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
}, Kr = {
  ordinalNumber: Xr,
  era: J({
    values: $r,
    defaultWidth: "wide"
  }),
  quarter: J({
    values: Br,
    defaultWidth: "wide",
    argumentCallback: (n) => n - 1
  }),
  month: J({
    values: Yr,
    defaultWidth: "wide"
  }),
  day: J({
    values: qr,
    defaultWidth: "wide"
  }),
  dayPeriod: J({
    values: Vr,
    defaultWidth: "wide",
    formattingValues: Qr,
    defaultFormattingWidth: "wide"
  })
};
function N(n) {
  return (t, e = {}) => {
    const r = e.width, a = r && n.matchPatterns[r] || n.matchPatterns[n.defaultMatchWidth], s = t.match(a);
    if (!s)
      return null;
    const i = s[0], o = r && n.parsePatterns[r] || n.parsePatterns[n.defaultParseWidth], l = Array.isArray(o) ? Zr(o, (u) => u.test(i)) : (
      // [TODO] -- I challenge you to fix the type
      Gr(o, (u) => u.test(i))
    );
    let c;
    c = n.valueCallback ? n.valueCallback(l) : l, c = e.valueCallback ? (
      // [TODO] -- I challenge you to fix the type
      e.valueCallback(c)
    ) : c;
    const d = t.slice(i.length);
    return { value: c, rest: d };
  };
}
function Gr(n, t) {
  for (const e in n)
    if (Object.prototype.hasOwnProperty.call(n, e) && t(n[e]))
      return e;
}
function Zr(n, t) {
  for (let e = 0; e < n.length; e++)
    if (t(n[e]))
      return e;
}
function Gt(n) {
  return (t, e = {}) => {
    const r = t.match(n.matchPattern);
    if (!r)
      return null;
    const a = r[0], s = t.match(n.parsePattern);
    if (!s)
      return null;
    let i = n.valueCallback ? n.valueCallback(s[0]) : s[0];
    i = e.valueCallback ? e.valueCallback(i) : i;
    const o = t.slice(a.length);
    return { value: i, rest: o };
  };
}
const tn = /^(\d+)(th|st|nd|rd)?/i, en = /\d+/i, rn = {
  narrow: /^(b|a)/i,
  abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
  wide: /^(before christ|before common era|anno domini|common era)/i
}, nn = {
  any: [/^b/i, /^(a|c)/i]
}, an = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](th|st|nd|rd)? quarter/i
}, sn = {
  any: [/1/i, /2/i, /3/i, /4/i]
}, on = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
  wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i
}, cn = {
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
}, ln = {
  narrow: /^[smtwf]/i,
  short: /^(su|mo|tu|we|th|fr|sa)/i,
  abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
  wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
}, un = {
  narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
  any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
}, dn = {
  narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
  any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
}, hn = {
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
}, fn = {
  ordinalNumber: Gt({
    matchPattern: tn,
    parsePattern: en,
    valueCallback: (n) => parseInt(n, 10)
  }),
  era: N({
    matchPatterns: rn,
    defaultMatchWidth: "wide",
    parsePatterns: nn,
    defaultParseWidth: "any"
  }),
  quarter: N({
    matchPatterns: an,
    defaultMatchWidth: "wide",
    parsePatterns: sn,
    defaultParseWidth: "any",
    valueCallback: (n) => n + 1
  }),
  month: N({
    matchPatterns: on,
    defaultMatchWidth: "wide",
    parsePatterns: cn,
    defaultParseWidth: "any"
  }),
  day: N({
    matchPatterns: ln,
    defaultMatchWidth: "wide",
    parsePatterns: un,
    defaultParseWidth: "any"
  }),
  dayPeriod: N({
    matchPatterns: dn,
    defaultMatchWidth: "any",
    parsePatterns: hn,
    defaultParseWidth: "any"
  })
}, lt = {
  code: "en-US",
  formatDistance: Wr,
  formatLong: Nr,
  formatRelative: Hr,
  localize: Kr,
  match: fn,
  options: {
    weekStartsOn: 0,
    firstWeekContainsDate: 1
  }
};
function mn(n, t) {
  const e = j(n, t == null ? void 0 : t.in);
  return Dr(e, Ur(e)) + 1;
}
function gn(n, t) {
  const e = j(n, t == null ? void 0 : t.in), r = +Dt(e) - +Sr(e);
  return Math.round(r / xe) + 1;
}
function Ce(n, t) {
  var d, u, h, f;
  const e = j(n, t == null ? void 0 : t.in), r = e.getFullYear(), a = gt(), s = (t == null ? void 0 : t.firstWeekContainsDate) ?? ((u = (d = t == null ? void 0 : t.locale) == null ? void 0 : d.options) == null ? void 0 : u.firstWeekContainsDate) ?? a.firstWeekContainsDate ?? ((f = (h = a.locale) == null ? void 0 : h.options) == null ? void 0 : f.firstWeekContainsDate) ?? 1, i = G((t == null ? void 0 : t.in) || n, 0);
  i.setFullYear(r + 1, 0, s), i.setHours(0, 0, 0, 0);
  const o = mt(i, t), l = G((t == null ? void 0 : t.in) || n, 0);
  l.setFullYear(r, 0, s), l.setHours(0, 0, 0, 0);
  const c = mt(l, t);
  return +e >= +o ? r + 1 : +e >= +c ? r : r - 1;
}
function wn(n, t) {
  var o, l, c, d;
  const e = gt(), r = (t == null ? void 0 : t.firstWeekContainsDate) ?? ((l = (o = t == null ? void 0 : t.locale) == null ? void 0 : o.options) == null ? void 0 : l.firstWeekContainsDate) ?? e.firstWeekContainsDate ?? ((d = (c = e.locale) == null ? void 0 : c.options) == null ? void 0 : d.firstWeekContainsDate) ?? 1, a = Ce(n, t), s = G((t == null ? void 0 : t.in) || n, 0);
  return s.setFullYear(a, 0, r), s.setHours(0, 0, 0, 0), mt(s, t);
}
function bn(n, t) {
  const e = j(n, t == null ? void 0 : t.in), r = +mt(e, t) - +wn(e, t);
  return Math.round(r / xe) + 1;
}
function T(n, t) {
  const e = n < 0 ? "-" : "", r = Math.abs(n).toString().padStart(t, "0");
  return e + r;
}
const Z = {
  // Year
  y(n, t) {
    const e = n.getFullYear(), r = e > 0 ? e : 1 - e;
    return T(t === "yy" ? r % 100 : r, t.length);
  },
  // Month
  M(n, t) {
    const e = n.getMonth();
    return t === "M" ? String(e + 1) : T(e + 1, 2);
  },
  // Day of the month
  d(n, t) {
    return T(n.getDate(), t.length);
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
    return T(n.getHours() % 12 || 12, t.length);
  },
  // Hour [0-23]
  H(n, t) {
    return T(n.getHours(), t.length);
  },
  // Minute
  m(n, t) {
    return T(n.getMinutes(), t.length);
  },
  // Second
  s(n, t) {
    return T(n.getSeconds(), t.length);
  },
  // Fraction of second
  S(n, t) {
    const e = t.length, r = n.getMilliseconds(), a = Math.trunc(
      r * Math.pow(10, e - 3)
    );
    return T(a, t.length);
  }
}, at = {
  am: "am",
  pm: "pm",
  midnight: "midnight",
  noon: "noon",
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
  night: "night"
}, ce = {
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
      const r = n.getFullYear(), a = r > 0 ? r : 1 - r;
      return e.ordinalNumber(a, { unit: "year" });
    }
    return Z.y(n, t);
  },
  // Local week-numbering year
  Y: function(n, t, e, r) {
    const a = Ce(n, r), s = a > 0 ? a : 1 - a;
    if (t === "YY") {
      const i = s % 100;
      return T(i, 2);
    }
    return t === "Yo" ? e.ordinalNumber(s, { unit: "year" }) : T(s, t.length);
  },
  // ISO week-numbering year
  R: function(n, t) {
    const e = Ee(n);
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
  u: function(n, t) {
    const e = n.getFullYear();
    return T(e, t.length);
  },
  // Quarter
  Q: function(n, t, e) {
    const r = Math.ceil((n.getMonth() + 1) / 3);
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
  q: function(n, t, e) {
    const r = Math.ceil((n.getMonth() + 1) / 3);
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
  M: function(n, t, e) {
    const r = n.getMonth();
    switch (t) {
      case "M":
      case "MM":
        return Z.M(n, t);
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
  w: function(n, t, e, r) {
    const a = bn(n, r);
    return t === "wo" ? e.ordinalNumber(a, { unit: "week" }) : T(a, t.length);
  },
  // ISO week of year
  I: function(n, t, e) {
    const r = gn(n);
    return t === "Io" ? e.ordinalNumber(r, { unit: "week" }) : T(r, t.length);
  },
  // Day of the month
  d: function(n, t, e) {
    return t === "do" ? e.ordinalNumber(n.getDate(), { unit: "date" }) : Z.d(n, t);
  },
  // Day of year
  D: function(n, t, e) {
    const r = mn(n);
    return t === "Do" ? e.ordinalNumber(r, { unit: "dayOfYear" }) : T(r, t.length);
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
    const a = n.getDay(), s = (a - r.weekStartsOn + 8) % 7 || 7;
    switch (t) {
      case "e":
        return String(s);
      case "ee":
        return T(s, 2);
      case "eo":
        return e.ordinalNumber(s, { unit: "day" });
      case "eee":
        return e.day(a, {
          width: "abbreviated",
          context: "formatting"
        });
      case "eeeee":
        return e.day(a, {
          width: "narrow",
          context: "formatting"
        });
      case "eeeeee":
        return e.day(a, {
          width: "short",
          context: "formatting"
        });
      case "eeee":
      default:
        return e.day(a, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // Stand-alone local day of week
  c: function(n, t, e, r) {
    const a = n.getDay(), s = (a - r.weekStartsOn + 8) % 7 || 7;
    switch (t) {
      case "c":
        return String(s);
      case "cc":
        return T(s, t.length);
      case "co":
        return e.ordinalNumber(s, { unit: "day" });
      case "ccc":
        return e.day(a, {
          width: "abbreviated",
          context: "standalone"
        });
      case "ccccc":
        return e.day(a, {
          width: "narrow",
          context: "standalone"
        });
      case "cccccc":
        return e.day(a, {
          width: "short",
          context: "standalone"
        });
      case "cccc":
      default:
        return e.day(a, {
          width: "wide",
          context: "standalone"
        });
    }
  },
  // ISO day of week
  i: function(n, t, e) {
    const r = n.getDay(), a = r === 0 ? 7 : r;
    switch (t) {
      case "i":
        return String(a);
      case "ii":
        return T(a, t.length);
      case "io":
        return e.ordinalNumber(a, { unit: "day" });
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
    const a = n.getHours() / 12 >= 1 ? "pm" : "am";
    switch (t) {
      case "a":
      case "aa":
        return e.dayPeriod(a, {
          width: "abbreviated",
          context: "formatting"
        });
      case "aaa":
        return e.dayPeriod(a, {
          width: "abbreviated",
          context: "formatting"
        }).toLowerCase();
      case "aaaaa":
        return e.dayPeriod(a, {
          width: "narrow",
          context: "formatting"
        });
      case "aaaa":
      default:
        return e.dayPeriod(a, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // AM, PM, midnight, noon
  b: function(n, t, e) {
    const r = n.getHours();
    let a;
    switch (r === 12 ? a = at.noon : r === 0 ? a = at.midnight : a = r / 12 >= 1 ? "pm" : "am", t) {
      case "b":
      case "bb":
        return e.dayPeriod(a, {
          width: "abbreviated",
          context: "formatting"
        });
      case "bbb":
        return e.dayPeriod(a, {
          width: "abbreviated",
          context: "formatting"
        }).toLowerCase();
      case "bbbbb":
        return e.dayPeriod(a, {
          width: "narrow",
          context: "formatting"
        });
      case "bbbb":
      default:
        return e.dayPeriod(a, {
          width: "wide",
          context: "formatting"
        });
    }
  },
  // in the morning, in the afternoon, in the evening, at night
  B: function(n, t, e) {
    const r = n.getHours();
    let a;
    switch (r >= 17 ? a = at.evening : r >= 12 ? a = at.afternoon : r >= 4 ? a = at.morning : a = at.night, t) {
      case "B":
      case "BB":
      case "BBB":
        return e.dayPeriod(a, {
          width: "abbreviated",
          context: "formatting"
        });
      case "BBBBB":
        return e.dayPeriod(a, {
          width: "narrow",
          context: "formatting"
        });
      case "BBBB":
      default:
        return e.dayPeriod(a, {
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
    return Z.h(n, t);
  },
  // Hour [0-23]
  H: function(n, t, e) {
    return t === "Ho" ? e.ordinalNumber(n.getHours(), { unit: "hour" }) : Z.H(n, t);
  },
  // Hour [0-11]
  K: function(n, t, e) {
    const r = n.getHours() % 12;
    return t === "Ko" ? e.ordinalNumber(r, { unit: "hour" }) : T(r, t.length);
  },
  // Hour [1-24]
  k: function(n, t, e) {
    let r = n.getHours();
    return r === 0 && (r = 24), t === "ko" ? e.ordinalNumber(r, { unit: "hour" }) : T(r, t.length);
  },
  // Minute
  m: function(n, t, e) {
    return t === "mo" ? e.ordinalNumber(n.getMinutes(), { unit: "minute" }) : Z.m(n, t);
  },
  // Second
  s: function(n, t, e) {
    return t === "so" ? e.ordinalNumber(n.getSeconds(), { unit: "second" }) : Z.s(n, t);
  },
  // Fraction of second
  S: function(n, t) {
    return Z.S(n, t);
  },
  // Timezone (ISO-8601. If offset is 0, output is always `'Z'`)
  X: function(n, t, e) {
    const r = n.getTimezoneOffset();
    if (r === 0)
      return "Z";
    switch (t) {
      case "X":
        return ue(r);
      case "XXXX":
      case "XX":
        return et(r);
      case "XXXXX":
      case "XXX":
      default:
        return et(r, ":");
    }
  },
  // Timezone (ISO-8601. If offset is 0, output is `'+00:00'` or equivalent)
  x: function(n, t, e) {
    const r = n.getTimezoneOffset();
    switch (t) {
      case "x":
        return ue(r);
      case "xxxx":
      case "xx":
        return et(r);
      case "xxxxx":
      case "xxx":
      default:
        return et(r, ":");
    }
  },
  // Timezone (GMT)
  O: function(n, t, e) {
    const r = n.getTimezoneOffset();
    switch (t) {
      case "O":
      case "OO":
      case "OOO":
        return "GMT" + le(r, ":");
      case "OOOO":
      default:
        return "GMT" + et(r, ":");
    }
  },
  // Timezone (specific non-location)
  z: function(n, t, e) {
    const r = n.getTimezoneOffset();
    switch (t) {
      case "z":
      case "zz":
      case "zzz":
        return "GMT" + le(r, ":");
      case "zzzz":
      default:
        return "GMT" + et(r, ":");
    }
  },
  // Seconds timestamp
  t: function(n, t, e) {
    const r = Math.trunc(+n / 1e3);
    return T(r, t.length);
  },
  // Milliseconds timestamp
  T: function(n, t, e) {
    return T(+n, t.length);
  }
};
function le(n, t = "") {
  const e = n > 0 ? "-" : "+", r = Math.abs(n), a = Math.trunc(r / 60), s = r % 60;
  return s === 0 ? e + String(a) : e + String(a) + t + T(s, 2);
}
function ue(n, t) {
  return n % 60 === 0 ? (n > 0 ? "-" : "+") + T(Math.abs(n) / 60, 2) : et(n, t);
}
function et(n, t = "") {
  const e = n > 0 ? "-" : "+", r = Math.abs(n), a = T(Math.trunc(r / 60), 2), s = T(r % 60, 2);
  return e + a + t + s;
}
const de = (n, t) => {
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
}, Ue = (n, t) => {
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
}, yn = (n, t) => {
  const e = n.match(/(P+)(p+)?/) || [], r = e[1], a = e[2];
  if (!a)
    return de(n, t);
  let s;
  switch (r) {
    case "P":
      s = t.dateTime({ width: "short" });
      break;
    case "PP":
      s = t.dateTime({ width: "medium" });
      break;
    case "PPP":
      s = t.dateTime({ width: "long" });
      break;
    case "PPPP":
    default:
      s = t.dateTime({ width: "full" });
      break;
  }
  return s.replace("{{date}}", de(r, t)).replace("{{time}}", Ue(a, t));
}, pn = {
  p: Ue,
  P: yn
}, _n = /^D+$/, vn = /^Y+$/, Dn = ["D", "DD", "YY", "YYYY"];
function Sn(n) {
  return _n.test(n);
}
function Mn(n) {
  return vn.test(n);
}
function kn(n, t, e) {
  const r = Tn(n, t, e);
  if (console.warn(r), Dn.includes(n))
    throw new RangeError(r);
}
function Tn(n, t, e) {
  const r = n[0] === "Y" ? "years" : "days of the month";
  return `Use \`${n.toLowerCase()}\` instead of \`${n}\` (in \`${t}\`) for formatting ${r} to the input \`${e}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`;
}
const In = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g, On = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g, zn = /^'([^]*?)'?$/, An = /''/g, Pn = /[a-zA-Z]/;
function Le(n, t, e) {
  var d, u, h, f, g, _, S, z;
  const r = gt(), a = (e == null ? void 0 : e.locale) ?? r.locale ?? lt, s = (e == null ? void 0 : e.firstWeekContainsDate) ?? ((u = (d = e == null ? void 0 : e.locale) == null ? void 0 : d.options) == null ? void 0 : u.firstWeekContainsDate) ?? r.firstWeekContainsDate ?? ((f = (h = r.locale) == null ? void 0 : h.options) == null ? void 0 : f.firstWeekContainsDate) ?? 1, i = (e == null ? void 0 : e.weekStartsOn) ?? ((_ = (g = e == null ? void 0 : e.locale) == null ? void 0 : g.options) == null ? void 0 : _.weekStartsOn) ?? r.weekStartsOn ?? ((z = (S = r.locale) == null ? void 0 : S.options) == null ? void 0 : z.weekStartsOn) ?? 0, o = j(n, e == null ? void 0 : e.in);
  if (!Tr(o))
    throw new RangeError("Invalid time value");
  let l = t.match(On).map((L) => {
    const x = L[0];
    if (x === "p" || x === "P") {
      const Q = pn[x];
      return Q(L, a.formatLong);
    }
    return L;
  }).join("").match(In).map((L) => {
    if (L === "''")
      return { isToken: !1, value: "'" };
    const x = L[0];
    if (x === "'")
      return { isToken: !1, value: xn(L) };
    if (ce[x])
      return { isToken: !0, value: L };
    if (x.match(Pn))
      throw new RangeError(
        "Format string contains an unescaped latin alphabet character `" + x + "`"
      );
    return { isToken: !1, value: L };
  });
  a.localize.preprocessor && (l = a.localize.preprocessor(o, l));
  const c = {
    firstWeekContainsDate: s,
    weekStartsOn: i,
    locale: a
  };
  return l.map((L) => {
    if (!L.isToken)
      return L.value;
    const x = L.value;
    (!(e != null && e.useAdditionalWeekYearTokens) && Mn(x) || !(e != null && e.useAdditionalDayOfYearTokens) && Sn(x)) && kn(x, t, String(n));
    const Q = ce[x[0]];
    return Q(o, x, a.localize, c);
  }).join("");
}
function xn(n) {
  const t = n.match(zn);
  return t ? t[1].replace(An, "'") : n;
}
function En(n, t, e) {
  const r = gt(), a = (e == null ? void 0 : e.locale) ?? r.locale ?? lt, s = 2520, i = pt(n, t);
  if (isNaN(i))
    throw new RangeError("Invalid time value");
  const o = Object.assign({}, e, {
    addSuffix: e == null ? void 0 : e.addSuffix,
    comparison: i
  }), [l, c] = zt(
    e == null ? void 0 : e.in,
    ...i > 0 ? [t, n] : [n, t]
  ), d = Cr(c, l), u = (St(c) - St(l)) / 1e3, h = Math.round((d - u) / 60);
  let f;
  if (h < 2)
    return e != null && e.includeSeconds ? d < 5 ? a.formatDistance("lessThanXSeconds", 5, o) : d < 10 ? a.formatDistance("lessThanXSeconds", 10, o) : d < 20 ? a.formatDistance("lessThanXSeconds", 20, o) : d < 40 ? a.formatDistance("halfAMinute", 0, o) : d < 60 ? a.formatDistance("lessThanXMinutes", 1, o) : a.formatDistance("xMinutes", 1, o) : h === 0 ? a.formatDistance("lessThanXMinutes", 1, o) : a.formatDistance("xMinutes", h, o);
  if (h < 45)
    return a.formatDistance("xMinutes", h, o);
  if (h < 90)
    return a.formatDistance("aboutXHours", 1, o);
  if (h < se) {
    const g = Math.round(h / 60);
    return a.formatDistance("aboutXHours", g, o);
  } else {
    if (h < s)
      return a.formatDistance("xDays", 1, o);
    if (h < bt) {
      const g = Math.round(h / se);
      return a.formatDistance("xDays", g, o);
    } else if (h < bt * 2)
      return f = Math.round(h / bt), a.formatDistance("aboutXMonths", f, o);
  }
  if (f = Er(c, l), f < 12) {
    const g = Math.round(h / bt);
    return a.formatDistance("xMonths", g, o);
  } else {
    const g = f % 12, _ = Math.trunc(f / 12);
    return g < 3 ? a.formatDistance("aboutXYears", _, o) : g < 9 ? a.formatDistance("overXYears", _, o) : a.formatDistance("almostXYears", _ + 1, o);
  }
}
function We(n, t) {
  return En(n, Mr(n), t);
}
const he = {
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
}, Cn = (n, t, e) => {
  let r;
  const a = e != null && e.addSuffix ? he[n].withPreposition : he[n].standalone;
  return typeof a == "string" ? r = a : t === 1 ? r = a.one : r = a.other.replace("{{count}}", String(t)), e != null && e.addSuffix ? e.comparison && e.comparison > 0 ? "in " + r : "vor " + r : r;
}, Un = {
  full: "EEEE, do MMMM y",
  // Montag, 7. Januar 2018
  long: "do MMMM y",
  // 7. Januar 2018
  medium: "do MMM y",
  // 7. Jan. 2018
  short: "dd.MM.y"
  // 07.01.2018
}, Ln = {
  full: "HH:mm:ss zzzz",
  long: "HH:mm:ss z",
  medium: "HH:mm:ss",
  short: "HH:mm"
}, Wn = {
  full: "{{date}} 'um' {{time}}",
  long: "{{date}} 'um' {{time}}",
  medium: "{{date}} {{time}}",
  short: "{{date}} {{time}}"
}, Fn = {
  date: K({
    formats: Un,
    defaultWidth: "full"
  }),
  time: K({
    formats: Ln,
    defaultWidth: "full"
  }),
  dateTime: K({
    formats: Wn,
    defaultWidth: "full"
  })
}, jn = {
  lastWeek: "'letzten' eeee 'um' p",
  yesterday: "'gestern um' p",
  today: "'heute um' p",
  tomorrow: "'morgen um' p",
  nextWeek: "eeee 'um' p",
  other: "P"
}, Jn = (n, t, e, r) => jn[n], Nn = {
  narrow: ["v.Chr.", "n.Chr."],
  abbreviated: ["v.Chr.", "n.Chr."],
  wide: ["vor Christus", "nach Christus"]
}, Rn = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["Q1", "Q2", "Q3", "Q4"],
  wide: ["1. Quartal", "2. Quartal", "3. Quartal", "4. Quartal"]
}, Ht = {
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
}, Hn = {
  narrow: Ht.narrow,
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
  wide: Ht.wide
}, $n = {
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
}, Bn = {
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
}, Yn = {
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
}, qn = (n) => Number(n) + ".", Vn = {
  ordinalNumber: qn,
  era: J({
    values: Nn,
    defaultWidth: "wide"
  }),
  quarter: J({
    values: Rn,
    defaultWidth: "wide",
    argumentCallback: (n) => n - 1
  }),
  month: J({
    values: Ht,
    formattingValues: Hn,
    defaultWidth: "wide"
  }),
  day: J({
    values: $n,
    defaultWidth: "wide"
  }),
  dayPeriod: J({
    values: Bn,
    defaultWidth: "wide",
    formattingValues: Yn,
    defaultFormattingWidth: "wide"
  })
}, Qn = /^(\d+)(\.)?/i, Xn = /\d+/i, Kn = {
  narrow: /^(v\.? ?Chr\.?|n\.? ?Chr\.?)/i,
  abbreviated: /^(v\.? ?Chr\.?|n\.? ?Chr\.?)/i,
  wide: /^(vor Christus|vor unserer Zeitrechnung|nach Christus|unserer Zeitrechnung)/i
}, Gn = {
  any: [/^v/i, /^n/i]
}, Zn = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](\.)? Quartal/i
}, ta = {
  any: [/1/i, /2/i, /3/i, /4/i]
}, ea = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(j[aä]n|feb|mär[z]?|apr|mai|jun[i]?|jul[i]?|aug|sep|okt|nov|dez)\.?/i,
  wide: /^(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)/i
}, ra = {
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
}, na = {
  narrow: /^[smdmf]/i,
  short: /^(so|mo|di|mi|do|fr|sa)/i,
  abbreviated: /^(son?|mon?|die?|mit?|don?|fre?|sam?)\.?/i,
  wide: /^(sonntag|montag|dienstag|mittwoch|donnerstag|freitag|samstag)/i
}, aa = {
  any: [/^so/i, /^mo/i, /^di/i, /^mi/i, /^do/i, /^f/i, /^sa/i]
}, sa = {
  narrow: /^(vm\.?|nm\.?|Mitternacht|Mittag|morgens|nachm\.?|abends|nachts)/i,
  abbreviated: /^(vorm\.?|nachm\.?|Mitternacht|Mittag|morgens|nachm\.?|abends|nachts)/i,
  wide: /^(vormittags|nachmittags|Mitternacht|Mittag|morgens|nachmittags|abends|nachts)/i
}, ia = {
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
}, oa = {
  ordinalNumber: Gt({
    matchPattern: Qn,
    parsePattern: Xn,
    valueCallback: (n) => parseInt(n)
  }),
  era: N({
    matchPatterns: Kn,
    defaultMatchWidth: "wide",
    parsePatterns: Gn,
    defaultParseWidth: "any"
  }),
  quarter: N({
    matchPatterns: Zn,
    defaultMatchWidth: "wide",
    parsePatterns: ta,
    defaultParseWidth: "any",
    valueCallback: (n) => n + 1
  }),
  month: N({
    matchPatterns: ea,
    defaultMatchWidth: "wide",
    parsePatterns: ra,
    defaultParseWidth: "any"
  }),
  day: N({
    matchPatterns: na,
    defaultMatchWidth: "wide",
    parsePatterns: aa,
    defaultParseWidth: "any"
  }),
  dayPeriod: N({
    matchPatterns: sa,
    defaultMatchWidth: "wide",
    parsePatterns: ia,
    defaultParseWidth: "any"
  })
}, Mt = {
  code: "de",
  formatDistance: Cn,
  formatLong: Fn,
  formatRelative: Jn,
  localize: Vn,
  match: oa,
  options: {
    weekStartsOn: 1,
    firstWeekContainsDate: 4
  }
}, ca = {
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
}, la = (n, t, e) => {
  let r;
  const a = ca[n];
  return typeof a == "string" ? r = a : t === 1 ? r = a.one : r = a.other.replace("{{count}}", String(t)), e != null && e.addSuffix ? e.comparison && e.comparison > 0 ? "dans " + r : "il y a " + r : r;
}, ua = {
  full: "EEEE d MMMM y",
  long: "d MMMM y",
  medium: "d MMM y",
  short: "dd/MM/y"
}, da = {
  full: "HH:mm:ss zzzz",
  long: "HH:mm:ss z",
  medium: "HH:mm:ss",
  short: "HH:mm"
}, ha = {
  full: "{{date}} 'à' {{time}}",
  long: "{{date}} 'à' {{time}}",
  medium: "{{date}}, {{time}}",
  short: "{{date}}, {{time}}"
}, fa = {
  date: K({
    formats: ua,
    defaultWidth: "full"
  }),
  time: K({
    formats: da,
    defaultWidth: "full"
  }),
  dateTime: K({
    formats: ha,
    defaultWidth: "full"
  })
}, ma = {
  lastWeek: "eeee 'dernier à' p",
  yesterday: "'hier à' p",
  today: "'aujourd’hui à' p",
  tomorrow: "'demain à' p'",
  nextWeek: "eeee 'prochain à' p",
  other: "P"
}, ga = (n, t, e, r) => ma[n], wa = {
  narrow: ["av. J.-C", "ap. J.-C"],
  abbreviated: ["av. J.-C", "ap. J.-C"],
  wide: ["avant Jésus-Christ", "après Jésus-Christ"]
}, ba = {
  narrow: ["T1", "T2", "T3", "T4"],
  abbreviated: ["1er trim.", "2ème trim.", "3ème trim.", "4ème trim."],
  wide: ["1er trimestre", "2ème trimestre", "3ème trimestre", "4ème trimestre"]
}, ya = {
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
}, pa = {
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
}, _a = {
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
}, va = (n, t) => {
  const e = Number(n), r = t == null ? void 0 : t.unit;
  if (e === 0)
    return "0";
  const a = ["year", "week", "hour", "minute", "second"];
  let s;
  return e === 1 ? s = r && a.includes(r) ? "ère" : "er" : s = "ème", e + s;
}, Da = ["MMM", "MMMM"], Sa = {
  preprocessor: (n, t) => n.getDate() === 1 || !t.some(
    (r) => r.isToken && Da.includes(r.value)
  ) ? t : t.map(
    (r) => r.isToken && r.value === "do" ? { isToken: !0, value: "d" } : r
  ),
  ordinalNumber: va,
  era: J({
    values: wa,
    defaultWidth: "wide"
  }),
  quarter: J({
    values: ba,
    defaultWidth: "wide",
    argumentCallback: (n) => n - 1
  }),
  month: J({
    values: ya,
    defaultWidth: "wide"
  }),
  day: J({
    values: pa,
    defaultWidth: "wide"
  }),
  dayPeriod: J({
    values: _a,
    defaultWidth: "wide"
  })
}, Ma = /^(\d+)(ième|ère|ème|er|e)?/i, ka = /\d+/i, Ta = {
  narrow: /^(av\.J\.C|ap\.J\.C|ap\.J\.-C)/i,
  abbreviated: /^(av\.J\.-C|av\.J-C|apr\.J\.-C|apr\.J-C|ap\.J-C)/i,
  wide: /^(avant Jésus-Christ|après Jésus-Christ)/i
}, Ia = {
  any: [/^av/i, /^ap/i]
}, Oa = {
  narrow: /^T?[1234]/i,
  abbreviated: /^[1234](er|ème|e)? trim\.?/i,
  wide: /^[1234](er|ème|e)? trimestre/i
}, za = {
  any: [/1/i, /2/i, /3/i, /4/i]
}, Aa = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(janv|févr|mars|avr|mai|juin|juill|juil|août|sept|oct|nov|déc)\.?/i,
  wide: /^(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i
}, Pa = {
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
}, xa = {
  narrow: /^[lmjvsd]/i,
  short: /^(di|lu|ma|me|je|ve|sa)/i,
  abbreviated: /^(dim|lun|mar|mer|jeu|ven|sam)\.?/i,
  wide: /^(dimanche|lundi|mardi|mercredi|jeudi|vendredi|samedi)/i
}, Ea = {
  narrow: [/^d/i, /^l/i, /^m/i, /^m/i, /^j/i, /^v/i, /^s/i],
  any: [/^di/i, /^lu/i, /^ma/i, /^me/i, /^je/i, /^ve/i, /^sa/i]
}, Ca = {
  narrow: /^(a|p|minuit|midi|mat\.?|ap\.?m\.?|soir|nuit)/i,
  any: /^([ap]\.?\s?m\.?|du matin|de l'après[-\s]midi|du soir|de la nuit)/i
}, Ua = {
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
}, La = {
  ordinalNumber: Gt({
    matchPattern: Ma,
    parsePattern: ka,
    valueCallback: (n) => parseInt(n)
  }),
  era: N({
    matchPatterns: Ta,
    defaultMatchWidth: "wide",
    parsePatterns: Ia,
    defaultParseWidth: "any"
  }),
  quarter: N({
    matchPatterns: Oa,
    defaultMatchWidth: "wide",
    parsePatterns: za,
    defaultParseWidth: "any",
    valueCallback: (n) => n + 1
  }),
  month: N({
    matchPatterns: Aa,
    defaultMatchWidth: "wide",
    parsePatterns: Pa,
    defaultParseWidth: "any"
  }),
  day: N({
    matchPatterns: xa,
    defaultMatchWidth: "wide",
    parsePatterns: Ea,
    defaultParseWidth: "any"
  }),
  dayPeriod: N({
    matchPatterns: Ca,
    defaultMatchWidth: "any",
    parsePatterns: Ua,
    defaultParseWidth: "any"
  })
}, kt = {
  code: "fr",
  formatDistance: la,
  formatLong: fa,
  formatRelative: ga,
  localize: Sa,
  match: La,
  options: {
    weekStartsOn: 1,
    firstWeekContainsDate: 4
  }
}, Wa = /^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$/;
class Fa extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (t === "0000-00-00")
      return null;
    const e = t instanceof Date ? this.toDateString(t) : t;
    if (e != null && Wa.test(e))
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
    const r = t === "fr" ? kt : t === "de" ? Mt : lt;
    let a = t === "de" ? "dd. MMMM yyyy" : "dd MMMM yyyy";
    return e && (a = "EEEE, " + a), Le(
      new Date(this._value),
      a,
      { locale: r }
    );
  }
  /**
   * Convert value to relative time.
   */
  toRelative(t = "en") {
    if (!this._value)
      return null;
    const e = t === "fr" ? kt : t === "de" ? Mt : lt;
    return We(
      new Date(this._value),
      {
        addSuffix: !0,
        locale: e
      }
    );
  }
}
class Fe extends U {
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
class ja extends U {
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
class je extends U {
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
class Ja extends Fe {
  // ...
}
const Na = /^[0-9]{4}\-[0-9]{2}\-[0-9]{2}\s[0-9]{2}\:[0-9]{2}\:[0-9]{2}$/;
class Ra extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (t === "0000-00-00 00:00:00")
      return null;
    const e = t instanceof Date ? this.toDateString(t) : t;
    if (e != null && Na.test(e))
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
    const r = t === "fr" ? kt : t === "de" ? Mt : lt;
    let a = t === "de" ? "dd. MMMM yyyy" : "dd MMMM yyyy";
    return e && (a = "EEEE, " + a), Le(
      new Date(this._value),
      a,
      { locale: r }
    );
  }
  /**
   * Convert value to relative time.
   */
  toRelative(t = "en") {
    if (!this._value)
      return null;
    const e = t === "fr" ? kt : t === "de" ? Mt : lt;
    return We(
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
class Ha extends U {
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
    const r = await R.get(this._type), a = r == null ? void 0 : r.memoryClient().get(e);
    return a || (await (r == null ? void 0 : r.get({ skipCacheUpdateIfFound: !0, ...t, raw: !1, blitzID: e })) ?? null);
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
class $a extends U {
  /**
   * Retrieves the linked user.
   * Task: https://alpha.blitzdata.com/blitzpm/log/blitzsifeddine/2025-09-03/User%20type/2fra4l--t1g94e?proj=1s4dec-3ibnqe
   * 
   */
  async toUser() {
    const t = this.serialize();
    if (!t)
      return null;
    const e = await R.get("0BAUsers"), r = await (e == null ? void 0 : e.get({ blitzID: t, skipCacheUpdateIfFound: !0 }));
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
class Je {
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
    return e && (e = e.map((r) => B.createType(this._name, this._type, r)).filter((r) => r.value != null), e.forEach((r) => r.withObject(this._object))), e;
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
    var s, i, o, l, c, d, u, h, f, g, _, S;
    const e = new $({
      action: "edit",
      data: {
        [this._name]: {
          [t.action]: t.value
        }
      },
      model: (i = (s = this._object) == null ? void 0 : s.model) == null ? void 0 : i.getName(),
      blitzID: (o = this._object) == null ? void 0 : o._blitzID.value
    }), r = await V.create().run([e]);
    if (r[0].status !== C.Success && r[0].status !== C.Notice)
      throw new Error(r[0].message ?? "Unknown Error! Please try again.");
    for (const z of ((c = (l = this._object) == null ? void 0 : l._editURLs) == null ? void 0 : c.value) ?? [])
      await p.queue.addJob(z, e.toObject());
    const a = await ((u = (d = this._object) == null ? void 0 : d.model) == null ? void 0 : u.get({ blitzID: this._object._blitzID.value, forceLocal: !0, raw: !0 }));
    a && Array.isArray(a[this._name]) && (this.value = a[this._name]), (f = (h = this._object) == null ? void 0 : h.model) == null || f.memoryClient().emit(e), (g = this._object) == null || g.dispatchEvent("edit", e.data), (S = (_ = this._object) == null ? void 0 : _.model) == null || S.setLastTransactionHash(e.hash);
  }
  /**
   * Adds new item.
   *
   * @param value The value to be added in many instance.
   */
  async add(t) {
    await this.performAction({
      action: "add",
      value: B.createType(this._name, this._type, t).serialize()
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
      value: B.createType(this._name, this._type, t).serialize()
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
    var a, s;
    const r = this._valueSignal.subscribe(t, e);
    return this._value === void 0 && ((s = (a = this._object) == null ? void 0 : a.model) == null || s.get({ blitzID: this._object._blitzID.value, forceHttp: !0, query: { manyToMany: "object" } }).then((i) => {
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
    var a;
    const e = this._syncSignal.get() !== null, r = this._syncSignal.subscribe(t, e);
    return e || p.queue.getJobsForObject((a = this._object) == null ? void 0 : a._blitzID.value).then((s) => {
      const i = s.filter((u) => {
        var h;
        return u.transaction.action === D.Edit && ((h = u.transaction.data) == null ? void 0 : h[this._name]) !== void 0;
      });
      let o = b.Pending, l;
      const c = i.find((u) => u.status === b.Failed), d = i.find((u) => u.status === b.Conflict && u.message !== void 0) ?? i.find((u) => u.status === b.Conflict);
      c ? (o = b.Failed, l = c) : d ? (o = b.Conflict, l = d) : i.every((u) => u.status === b.Completed) && (o = b.Completed), this._syncSignal.set({ status: o, job: l }, !1), t(this._syncSignal.get());
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
class Ba extends Je {
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
    const r = await R.get(this._type), a = r == null ? void 0 : r.memoryClient(), s = [];
    for (const i of e) {
      if (!i._blitzID)
        continue;
      const o = a == null ? void 0 : a.get(i._blitzID);
      if (o) {
        s.push(o);
        continue;
      }
      const l = await (r == null ? void 0 : r.get({ skipCacheUpdateIfFound: !0, ...t, raw: !1, blitzID: i._blitzID }));
      l && s.push(l);
    }
    return s;
  }
}
function Ya(n) {
  return n && n.constructor && typeof n.constructor.isBuffer == "function" && n.constructor.isBuffer(n);
}
function qa(n) {
  return n;
}
function Va(n, t) {
  t = t || {};
  const e = t.delimiter || ".", r = t.maxDepth, a = t.transformKey || qa, s = {};
  function i(o, l, c) {
    c = c || 1, Object.keys(o).forEach(function(d) {
      const u = o[d], h = t.safe && Array.isArray(u), f = Object.prototype.toString.call(u), g = Ya(u), _ = f === "[object Object]" || f === "[object Array]", S = l ? l + e + a(d) : a(d);
      if (!h && !g && _ && Object.keys(u).length && (!t.maxDepth || c < r))
        return i(u, S, c + 1);
      s[S] = u;
    });
  }
  return i(n), s;
}
class Qa extends U {
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
    return Va(this._value ?? {});
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
class Xa extends U {
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
class Ka extends U {
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
class Zt extends U {
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
class Ga extends je {
  // ...
}
class Za extends Zt {
  // ...
}
class ts extends Zt {
  /**
   * Returns the precentage value.
   */
  toPercentage() {
    return this._value != null ? (this._value * 100).toString() + "%" : null;
  }
}
const fe = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
class es extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (t != null && fe.test(t))
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
    return fe.test(t);
  }
}
const me = /^\+[1-9]{1,3}\-[0-9]{7,14}$/;
class rs extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (t != null && me.test(t))
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
    return me.test(t);
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
const ge = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;
class ns extends U {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (t != null && ge.test(t))
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
    return ge.test(t);
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
class as extends U {
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
class ss extends U {
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
class is extends U {
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
class os extends U {
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
    const a = parseFloat(e.lng);
    return !(isNaN(a) || a < -180 || a > 180);
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
      const a = await (await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(t)}&key=${e}`)).json();
      if (a.status === "OK" && a.results && a.results.length > 0) {
        const s = a.results[0].geometry.location;
        return {
          lat: s.lat.toString(),
          lng: s.lng.toString()
        };
      }
      return null;
    } catch (r) {
      return console.error("Geocoding error:", r.message), null;
    }
  }
}
class B {
  /**
   * Creates appropriate type from given attribute type string and value.
   *
   * @param name
   * @param type
   * @param value
   */
  static createType(t, e, r) {
    return t.endsWith("_fk") ? new Ha(t, e, r) : t === "_userID" ? new $a(t, e, r) : e === "int" || ["_blitzstamp"].includes(t) ? new je(t, "int", r) : e === "tinyint" ? new Ga(t, e, r) : e === "double" ? new Za(t, e, r) : e === "float" ? new Zt(t, e, r) : e === "percentage" ? new ts(t, e, r) : e === "varchar" ? new Ja(t, e, r) : e === "text" ? new Fe(t, e, r) : e === "htmlText" ? new ja(t, e, r) : e === "enum" ? new Ka(t, e, r) : e === "json" ? new Qa(t, e, r) : e === "boolean" ? new Pe(t, e, r) : e === "datetime" || ["_publishingdate", "_modified", "_expiration"].includes(t) ? new Ra(t, "datetime", r) : e === "date" ? new Fa(t, e, r) : e === "code" ? new Xa(t, e, r) : e === "email" ? new es(t, e, r) : e === "phone" ? new rs(t, e, r) : e === "url" ? new ns(t, e, r) : e === "image" ? new as(t, e, r) : e === "video" ? new ss(t, e, r) : e === "file" ? new is(t, e, r) : e === "location" ? new os(t, e, r) : new dt(t, e, r);
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
    return t.endsWith("_mtm") ? new Ba(t, e, r) : new Je(t, e, r);
  }
  /**
   * Unserializes given data to be used within library.
   *
   * @param attributes
   * @param data
   */
  static unserialize(t, e) {
    var s, i, o;
    const r = {}, a = [...Object.keys(t), ...Object.keys(e)].filter((l, c, d) => d.indexOf(l) === c);
    for (const l of a)
      Array.isArray((s = t[l]) == null ? void 0 : s.type) ? r[l] = B.createMany(l, ((i = t[l]) == null ? void 0 : i.type[0]) ?? "anonymous", e[l]) : r[l] = B.createType(
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
class st {
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
      var c, d, u, h;
      const a = (d = (c = this.model) == null ? void 0 : c.getAttributeDetails(t)) == null ? void 0 : d.type, s = B.createType(t, a, e).serialize(), i = r ? B.createType(t, a, r).serialize() : this.getAttribute(t).serialize(), o = new $({
        action: "edit",
        data: {
          [t]: {
            prev: i,
            new: s
          }
        },
        model: this.model.getName(),
        blitzID: this.getAttribute("_blitzID").value
      }), l = await V.create().run([o]);
      if (l[0].status !== C.Success && l[0].status !== C.Notice)
        throw new Error(l[0].message ?? "Unknown Error! Please try again.");
      this._attributes[t].value = s;
      for (const f of this.getAttribute("_editURLs").value)
        await p.queue.addJob(f, o.toObject());
      (u = this.model) == null || u.memoryClient().emit(o), this.dispatchEvent("edit", o.data), (h = this.model) == null || h.setLastTransactionHash(o.hash);
    });
  }
  /**
   * Deletes of object.
   */
  async delete() {
    var a, s;
    const t = new $({
      action: "delete",
      model: this.model.getName(),
      blitzID: this.getAttribute("_blitzID").value
    }), e = await V.create().run([t]);
    if (e[0].status !== C.Success)
      throw new Error(e[0].message ?? "Unknown Error! Please try again.");
    const r = (a = this.model) == null ? void 0 : a.memoryClient();
    r == null || r.delete(this.getAttribute("_blitzID").value);
    for (const i of this.getAttribute("_editURLs").value)
      await p.queue.addJob(i, t.toObject());
    r == null || r.emit(t), this.dispatchEvent("delete", null), (s = this.model) == null || s.setLastTransactionHash(t.hash);
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
    }, a = new $({
      action: "addObjectUserPermission",
      model: this.model.getName(),
      blitzID: e,
      data: r,
      hash: ct(r)
    }), s = [];
    for (const o of this.getAttribute("_editURLs").value)
      s.push(
        await Rt.send(
          { url: o, transaction: a.toObject() },
          P._globalHeaders
        )
      );
    const i = s.find((o) => o.status !== F.Success);
    if (i)
      throw new Error(i.message);
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
    this.listeners.has(t) && ((r = this.listeners.get(t)) == null || r.forEach((a) => a(e)));
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
          const a = await t();
          e(a);
        } catch (a) {
          r(a);
        }
      });
    });
  }
}
class $t {
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
    return typeof t.sync.live != "boolean" && (t.sync.live = !1), t.sync.level === "cache" && (t.sync.ttl || (t.sync.ttl = 30 * 1e3)), t.sync.level === "full" && (t.sync.interval || (t.sync.interval = 30 * 1e3)), t.flush || (t.flush = {
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
const cs = {
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
class Ne {
  /**
   * Creates new BDObject with supplied type, model and attributes.
   *
   * @param type
   * @param model
   * @param data
   * @param updateMemory
   */
  static create(t, e, r) {
    const a = e.getAttributesDetails() ?? {}, s = B.unserialize(a, r), i = new Proxy(new t({
      model: e,
      attributes: s
    }), cs);
    for (const o in s)
      s[o].withObject(i);
    return e.memoryClient().update(i);
  }
}
class Re extends st {
  /**
   * Returns the model of the custom object.
   */
  static async model() {
    if (typeof this.modelName != "string")
      throw new Error(`${this.name}.modelName is not a string, please provide a valid model name.`);
    const t = this.modelName === "_Model" ? p._Model : await p._Model.get(this.modelName);
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
m(Re, "modelName");
const It = class It extends Re {
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
    m(this, "returnType", st);
    this.clusterManager = p.clusterManager;
  }
  /**
   * Returns the model indexed db connection.
   */
  idbClient() {
    return new pr(this);
  }
  /**
   * Returns the model memory connection.
   */
  memoryClient() {
    return new vt(this);
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
    const a = this.resolveClusters(r), s = this.getAttributesDetails() ?? {}, i = new $({
      action: "add",
      data: B.serialize(B.unserialize(s, e)),
      model: this.getName()
    }), o = await p.getCurrentUser(), l = i.clone();
    l.data = { ...l.data, _userID: o.id };
    const c = await V.create().run([l]);
    if (c[0].status !== C.Success)
      throw new Error(c[0].message ?? "Unknown Error! Please try again.");
    for (const d of a)
      for (const u of d.options.addURL)
        await p.queue.addJob(u, i.toObject());
    return this.memoryClient().emit(i), this.setLastTransactionHash(i.hash), Ne.create(this.returnType, this, l.data);
  }
  /**
   * Finds an object by given blitz ID.
   *
   * @param blitzID - Blitz ID of the object.
   */
  async get(e) {
    const r = typeof e == "string" ? { blitzID: e } : e, s = (await it.create().model(this).clusters(this.resolveClusters(r.clusters ?? [])).raw(r.raw ?? !1).get(r.blitzID).query({
      returnType: this.returnType ?? st
    }).forceHttp(r.forceHttp ?? !1).forceLocal(r.forceLocal ?? !1).skipCacheUpdateIfFound(r.skipCacheUpdateIfFound ?? !1).signal(r.signal).getQuery(r.query ?? {}).perform())[0] ?? null;
    if (!s && this.returnType === It)
      throw new Error(`Model with blitzID "${e}" does not exists or you don't have enough permission to view it.`);
    return s || null;
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
      returnType: e.returnType ?? this.returnType ?? st,
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
  subscribeToList(e = {}, r, a = !1) {
    const s = it.create().model(this).clusters(this.resolveClusters(e.clusters ?? [])).raw(e.raw ?? !1).query({
      conditions: e.conditions,
      limit: e.limit,
      returnType: e.returnType ?? this.returnType ?? st,
      customSort: e.customSort,
      customSortDirection: e.customSortDirection,
      var: e.var,
      manyToMany: e.manyToMany
    }).forceHttp(e.forceHttp ?? !1).forceLocal(e.forceLocal ?? !1).skipCacheUpdateIfFound(e.skipCacheUpdateIfFound ?? !1).performSignal(a), i = s.subscribe(r, s.get() !== null), o = vt.channel.filterPipe((l) => l.model === this.getName()).subscribe((l) => {
      if (l.action === D.Add)
        this.list({ ...e, forceLocal: !0 }).then((c) => {
          const d = e.raw ? c.findIndex((u) => u._blitzID === l.blitzID) : c.findIndex((u) => u.getAttribute("_blitzID").value === l.blitzID);
          d > -1 && s.set({
            items: c,
            update: {
              action: D.Add,
              object: c[d],
              index: d
            }
          });
        });
      else if (l.action === D.Edit) {
        const c = s.get();
        if (!c)
          return;
        const d = e.raw ? c.items.findIndex((u) => u._blitzID === l.blitzID) : c.items.findIndex((u) => u.getAttribute("_blitzID").value === l.blitzID);
        d > -1 && this.list({ ...e, forceLocal: !0 }).then((u) => {
          const h = e.raw ? u.findIndex((f) => f._blitzID === l.blitzID) : u.findIndex((f) => f.getAttribute("_blitzID").value === l.blitzID);
          s.set({
            items: u,
            update: {
              action: D.Edit,
              object: h > -1 ? u[h] : c.items[d],
              index: h > -1 ? h : d
            }
          });
        });
      } else if (l.action === D.Delete) {
        const c = s.get();
        if (!c)
          return;
        if (e.raw) {
          const d = c.items.findIndex((u) => u._blitzID === l.blitzID);
          d > -1 && s.set({
            items: c.items.filter((u) => u._blitzID !== l.blitzID),
            update: {
              action: D.Delete,
              object: c.items[d],
              index: d
            }
          });
        } else {
          const d = c.items.findIndex((u) => u.getAttribute("_blitzID").value === l.blitzID);
          d > -1 && s.set({
            items: c.items.filter((u) => u.getAttribute("_blitzID").value !== l.blitzID),
            update: {
              action: D.Delete,
              object: c.items[d],
              index: d
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
      const r = Date.now() / 1e3, a = M.getLastSyncedAt(e) ?? 0, s = 30;
      r - a > s && await ht.create().run(e);
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
    var r, a;
    return ((a = (r = this._attributes.attributes) == null ? void 0 : r.value) == null ? void 0 : a[e]) ?? null;
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
    this.clusterManager = new Me();
    const r = $t.transformClusterOptions(e);
    for (const a of Object.keys(r))
      this.clusterManager.register(a, r[a]);
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
m(It, "modelName", "_Model");
let R = It;
class Bt {
  /**
   * Extract model name from the given `list` URL.
   *
   * @param url The URL to extract the model name from.
   *
   * @returns The model name.
   */
  static extractModelName(t) {
    const a = new URL(t).pathname.split("/").filter((s) => s !== "").pop();
    if (!a && !(a != null && a.endsWith(".json")))
      throw new Error("Model name not found in the URL.");
    return a.slice(0, a.indexOf(".json"));
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
var He = { exports: {} }, $e = { exports: {} };
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
      for (var r = [], a = 0, s = 0; a < e.length; a++, s += 8)
        r[s >>> 5] |= e[a] << 24 - s % 32;
      return r;
    },
    // Convert big-endian 32-bit words to a byte array
    wordsToBytes: function(e) {
      for (var r = [], a = 0; a < e.length * 32; a += 8)
        r.push(e[a >>> 5] >>> 24 - a % 32 & 255);
      return r;
    },
    // Convert a byte array to a hex string
    bytesToHex: function(e) {
      for (var r = [], a = 0; a < e.length; a++)
        r.push((e[a] >>> 4).toString(16)), r.push((e[a] & 15).toString(16));
      return r.join("");
    },
    // Convert a hex string to a byte array
    hexToBytes: function(e) {
      for (var r = [], a = 0; a < e.length; a += 2)
        r.push(parseInt(e.substr(a, 2), 16));
      return r;
    },
    // Convert a byte array to a base-64 string
    bytesToBase64: function(e) {
      for (var r = [], a = 0; a < e.length; a += 3)
        for (var s = e[a] << 16 | e[a + 1] << 8 | e[a + 2], i = 0; i < 4; i++)
          a * 8 + i * 6 <= e.length * 8 ? r.push(n.charAt(s >>> 6 * (3 - i) & 63)) : r.push("=");
      return r.join("");
    },
    // Convert a base-64 string to a byte array
    base64ToBytes: function(e) {
      e = e.replace(/[^A-Z0-9+\/]/ig, "");
      for (var r = [], a = 0, s = 0; a < e.length; s = ++a % 4)
        s != 0 && r.push((n.indexOf(e.charAt(a - 1)) & Math.pow(2, -2 * s + 8) - 1) << s * 2 | n.indexOf(e.charAt(a)) >>> 6 - s * 2);
      return r;
    }
  };
  $e.exports = t;
})();
var ls = $e.exports, Yt = {
  // UTF-8 encoding
  utf8: {
    // Convert a string to a byte array
    stringToBytes: function(n) {
      return Yt.bin.stringToBytes(unescape(encodeURIComponent(n)));
    },
    // Convert a byte array to a string
    bytesToString: function(n) {
      return decodeURIComponent(escape(Yt.bin.bytesToString(n)));
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
}, we = Yt;
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
var us = function(n) {
  return n != null && (Be(n) || ds(n) || !!n._isBuffer);
};
function Be(n) {
  return !!n.constructor && typeof n.constructor.isBuffer == "function" && n.constructor.isBuffer(n);
}
function ds(n) {
  return typeof n.readFloatLE == "function" && typeof n.slice == "function" && Be(n.slice(0, 0));
}
(function() {
  var n = ls, t = we.utf8, e = us, r = we.bin, a = function(s, i) {
    s.constructor == String ? i && i.encoding === "binary" ? s = r.stringToBytes(s) : s = t.stringToBytes(s) : e(s) ? s = Array.prototype.slice.call(s, 0) : !Array.isArray(s) && s.constructor !== Uint8Array && (s = s.toString());
    for (var o = n.bytesToWords(s), l = s.length * 8, c = 1732584193, d = -271733879, u = -1732584194, h = 271733878, f = 0; f < o.length; f++)
      o[f] = (o[f] << 8 | o[f] >>> 24) & 16711935 | (o[f] << 24 | o[f] >>> 8) & 4278255360;
    o[l >>> 5] |= 128 << l % 32, o[(l + 64 >>> 9 << 4) + 14] = l;
    for (var g = a._ff, _ = a._gg, S = a._hh, z = a._ii, f = 0; f < o.length; f += 16) {
      var L = c, x = d, Q = u, At = h;
      c = g(c, d, u, h, o[f + 0], 7, -680876936), h = g(h, c, d, u, o[f + 1], 12, -389564586), u = g(u, h, c, d, o[f + 2], 17, 606105819), d = g(d, u, h, c, o[f + 3], 22, -1044525330), c = g(c, d, u, h, o[f + 4], 7, -176418897), h = g(h, c, d, u, o[f + 5], 12, 1200080426), u = g(u, h, c, d, o[f + 6], 17, -1473231341), d = g(d, u, h, c, o[f + 7], 22, -45705983), c = g(c, d, u, h, o[f + 8], 7, 1770035416), h = g(h, c, d, u, o[f + 9], 12, -1958414417), u = g(u, h, c, d, o[f + 10], 17, -42063), d = g(d, u, h, c, o[f + 11], 22, -1990404162), c = g(c, d, u, h, o[f + 12], 7, 1804603682), h = g(h, c, d, u, o[f + 13], 12, -40341101), u = g(u, h, c, d, o[f + 14], 17, -1502002290), d = g(d, u, h, c, o[f + 15], 22, 1236535329), c = _(c, d, u, h, o[f + 1], 5, -165796510), h = _(h, c, d, u, o[f + 6], 9, -1069501632), u = _(u, h, c, d, o[f + 11], 14, 643717713), d = _(d, u, h, c, o[f + 0], 20, -373897302), c = _(c, d, u, h, o[f + 5], 5, -701558691), h = _(h, c, d, u, o[f + 10], 9, 38016083), u = _(u, h, c, d, o[f + 15], 14, -660478335), d = _(d, u, h, c, o[f + 4], 20, -405537848), c = _(c, d, u, h, o[f + 9], 5, 568446438), h = _(h, c, d, u, o[f + 14], 9, -1019803690), u = _(u, h, c, d, o[f + 3], 14, -187363961), d = _(d, u, h, c, o[f + 8], 20, 1163531501), c = _(c, d, u, h, o[f + 13], 5, -1444681467), h = _(h, c, d, u, o[f + 2], 9, -51403784), u = _(u, h, c, d, o[f + 7], 14, 1735328473), d = _(d, u, h, c, o[f + 12], 20, -1926607734), c = S(c, d, u, h, o[f + 5], 4, -378558), h = S(h, c, d, u, o[f + 8], 11, -2022574463), u = S(u, h, c, d, o[f + 11], 16, 1839030562), d = S(d, u, h, c, o[f + 14], 23, -35309556), c = S(c, d, u, h, o[f + 1], 4, -1530992060), h = S(h, c, d, u, o[f + 4], 11, 1272893353), u = S(u, h, c, d, o[f + 7], 16, -155497632), d = S(d, u, h, c, o[f + 10], 23, -1094730640), c = S(c, d, u, h, o[f + 13], 4, 681279174), h = S(h, c, d, u, o[f + 0], 11, -358537222), u = S(u, h, c, d, o[f + 3], 16, -722521979), d = S(d, u, h, c, o[f + 6], 23, 76029189), c = S(c, d, u, h, o[f + 9], 4, -640364487), h = S(h, c, d, u, o[f + 12], 11, -421815835), u = S(u, h, c, d, o[f + 15], 16, 530742520), d = S(d, u, h, c, o[f + 2], 23, -995338651), c = z(c, d, u, h, o[f + 0], 6, -198630844), h = z(h, c, d, u, o[f + 7], 10, 1126891415), u = z(u, h, c, d, o[f + 14], 15, -1416354905), d = z(d, u, h, c, o[f + 5], 21, -57434055), c = z(c, d, u, h, o[f + 12], 6, 1700485571), h = z(h, c, d, u, o[f + 3], 10, -1894986606), u = z(u, h, c, d, o[f + 10], 15, -1051523), d = z(d, u, h, c, o[f + 1], 21, -2054922799), c = z(c, d, u, h, o[f + 8], 6, 1873313359), h = z(h, c, d, u, o[f + 15], 10, -30611744), u = z(u, h, c, d, o[f + 6], 15, -1560198380), d = z(d, u, h, c, o[f + 13], 21, 1309151649), c = z(c, d, u, h, o[f + 4], 6, -145523070), h = z(h, c, d, u, o[f + 11], 10, -1120210379), u = z(u, h, c, d, o[f + 2], 15, 718787259), d = z(d, u, h, c, o[f + 9], 21, -343485551), c = c + L >>> 0, d = d + x >>> 0, u = u + Q >>> 0, h = h + At >>> 0;
    }
    return n.endian([c, d, u, h]);
  };
  a._ff = function(s, i, o, l, c, d, u) {
    var h = s + (i & o | ~i & l) + (c >>> 0) + u;
    return (h << d | h >>> 32 - d) + i;
  }, a._gg = function(s, i, o, l, c, d, u) {
    var h = s + (i & l | o & ~l) + (c >>> 0) + u;
    return (h << d | h >>> 32 - d) + i;
  }, a._hh = function(s, i, o, l, c, d, u) {
    var h = s + (i ^ o ^ l) + (c >>> 0) + u;
    return (h << d | h >>> 32 - d) + i;
  }, a._ii = function(s, i, o, l, c, d, u) {
    var h = s + (o ^ (i | ~l)) + (c >>> 0) + u;
    return (h << d | h >>> 32 - d) + i;
  }, a._blocksize = 16, a._digestsize = 16, He.exports = function(s, i) {
    if (s == null)
      throw new Error("Illegal argument " + s);
    var o = n.wordsToBytes(a(s, i));
    return i && i.asBytes ? o : i && i.asString ? r.bytesToString(o) : n.bytesToHex(o);
  };
})();
var hs = He.exports;
const fs = /* @__PURE__ */ fr(hs), ms = /^[v^~<>=]*?(\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+))?(?:-([\da-z\-]+(?:\.[\da-z\-]+)*))?(?:\+[\da-z\-]+(?:\.[\da-z\-]+)*)?)?)?$/i, be = (n) => {
  if (typeof n != "string")
    throw new TypeError("Invalid argument expected string");
  const t = n.match(ms);
  if (!t)
    throw new Error(`Invalid argument not valid semver ('${n}' received)`);
  return t.shift(), t;
}, ye = (n) => n === "*" || n === "x" || n === "X", pe = (n) => {
  const t = parseInt(n, 10);
  return isNaN(t) ? n : t;
}, gs = (n, t) => typeof n != typeof t ? [String(n), String(t)] : [n, t], ws = (n, t) => {
  if (ye(n) || ye(t))
    return 0;
  const [e, r] = gs(pe(n), pe(t));
  return e > r ? 1 : e < r ? -1 : 0;
}, _e = (n, t) => {
  for (let e = 0; e < Math.max(n.length, t.length); e++) {
    const r = ws(n[e] || "0", t[e] || "0");
    if (r !== 0)
      return r;
  }
  return 0;
}, bs = (n, t) => {
  const e = be(n), r = be(t), a = e.pop(), s = r.pop(), i = _e(e, r);
  return i !== 0 ? i : a && s ? _e(a.split("."), s.split(".")) : a || s ? a ? -1 : 1 : 0;
}, ve = (n, t, e) => {
  ys(e);
  const r = bs(n, t);
  return Ye[e].includes(r);
}, Ye = {
  ">": [1],
  ">=": [0, 1],
  "=": [0],
  "<=": [-1, 0],
  "<": [-1],
  "!=": [-1, 1]
}, De = Object.keys(Ye), ys = (n) => {
  if (typeof n != "string")
    throw new TypeError(`Invalid operator type, expected string but got ${typeof n}`);
  if (De.indexOf(n) === -1)
    throw new Error(`Invalid operator, expected one of ${De.join("|")}`);
};
class qe {
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
      const t = M.get("version");
      if (!t || ve(p.VERSION, t, ">")) {
        const e = p.VERSION.split(".")[1], r = t == null ? void 0 : t.split(".")[1];
        if (r && ve(e, r, ">")) {
          await this.flush(), M.setLastSyncedAt(Math.floor(Date.now() / 1e3)), M.set("version", p.VERSION);
          return;
        } else
          M.set("version", p.VERSION);
      }
    }
    if (this.options.type.includes("interval") && this.options.interval) {
      const t = M.get("lastFlush");
      if (!t)
        M.set("lastFlush", Date.now().toString());
      else if (Math.floor((Date.now() - parseInt(t)) / 864e5) >= this.options.interval) {
        await this.flush(), M.set("lastFlush", Date.now().toString()), M.setLastSyncedAt(Math.floor(Date.now() / 1e3)), M.set("version", p.VERSION);
        return;
      }
    }
    if (this.options.type.includes("size") && this.options.size && navigator.storage && navigator.storage.estimate)
      try {
        const t = await navigator.storage.estimate();
        if (t.usage && Math.floor(t.usage / 1e6) >= this.options.size) {
          await this.flush(), M.setLastSyncedAt(Math.floor(Date.now() / 1e3)), M.set("version", p.VERSION);
          return;
        }
      } catch (t) {
        console.error("Error getting storage estimate:", t.message);
      }
    if (this.options.type.includes("model")) {
      const t = await indexedDB.databases(), e = [
        ...t.filter((s) => {
          var i;
          return (i = s.name) == null ? void 0 : i.startsWith("bdt");
        }).map((s) => s.name),
        ...M.getDatabases()
      ].filter((s, i, o) => !["_Model", "_Project", "0BAUsers"].includes(s) && o.findIndex((l) => l === s) === i), r = [
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
      ], a = t.find((s) => s.name === "_Model") ? await ot("_Model", 1) : null;
      if (a) {
        for (const s of e)
          try {
            const i = (JSON.parse(M.get("model." + s) || "null") ?? {}).object;
            if (i) {
              const o = await a.get("objects", s);
              o && (!r.every((l) => i[l] === o[l]) || !Object.keys(i.attributes ?? []).every((l) => {
                var c, d, u, h, f, g, _, S;
                return (
                  // Check single enum and many enum attributes
                  i.attributes[l].type === "enum" || Array.isArray(i.attributes[l].type) && i.attributes[l].type[0] === "enum" ? (Array.isArray(i.attributes[l].type) ? (d = (c = o.attributes) == null ? void 0 : c[l]) == null ? void 0 : d.type[0] : (h = (u = o.attributes) == null ? void 0 : u[l]) == null ? void 0 : h.type) === "enum" && (i.attributes[l].options ?? []).every((z, L) => {
                    var x, Q;
                    return z === ((Q = (x = o.attributes) == null ? void 0 : x[l]) == null ? void 0 : Q.options[L]);
                  }) : Array.isArray(i.attributes[l].type) ? i.attributes[l].type[0] === ((g = (f = o.attributes) == null ? void 0 : f[l]) == null ? void 0 : g.type[0]) : i.attributes[l].type === ((S = (_ = o.attributes) == null ? void 0 : _[l]) == null ? void 0 : S.type)
                );
              })) && await a.delete("objects", s);
            }
          } catch (i) {
            console.error(`Error flushing "${s}" model:`, i.message);
          }
        a.close();
      }
    }
  }
  /**
   * Deletes local databases and any other footprints generated by library.
   */
  async flush() {
    const t = await indexedDB.databases(), e = [
      ...t.filter((a) => {
        var s;
        return (s = a.name) == null ? void 0 : s.startsWith("bdt");
      }).map((a) => a.name),
      ...M.getDatabases(),
      "_Model",
      "_Project",
      "0BAUsers",
      "db_master"
    ].filter((a, s, i) => i.findIndex((o) => o === a) === s);
    for (const a of e)
      await Vt(a);
    const r = t.find((a) => a.name === v.name) ? await ot(v.name, 1) : null;
    r && (await r.clear(v.store), r.close()), M.clear();
  }
  /**
   * Updates model cache in local storage
   */
  static modelCacheUpdate(t, e) {
    if (p.options.flush.type.includes("model") && p.options.flush.modelCacheTTL && t && e !== null && typeof e == "object" && Object.hasOwn(e, "_blitzID"))
      try {
        const r = Date.now(), a = "model." + t.getName(), s = JSON.parse(M.get(a) || "null");
        (!s || r - s.lastFetchedAt >= p.options.flush.modelCacheTTL * 1e3) && M.set(
          a,
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
    var r, a;
    this._query = t;
    const e = (r = this._model) == null ? void 0 : r.getAttributesDetails();
    if ((a = this._query) != null && a.conditions && e)
      for (const s of this._query.conditions) {
        const i = s[0];
        s.length === 3 && e[i] !== void 0 && typeof e[i].type == "string" && (s[1] === "IN" && Array.isArray(s[2]) ? s[2] = s[2].map((o) => B.createType(
          i,
          e[i].type,
          o
        ).serialize()) : s[2] = B.createType(
          i,
          e[i].type,
          s[2]
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
    for (const a of t)
      e.push(Ne.create(((r = this._query) == null ? void 0 : r.returnType) ?? st, this._model, a));
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
      else if (p.options.sync.level === "full" && t.length === 0)
        t = await this.filterQueuedObjects(this.mergeObjects(await this.performHttp())), t = await this.filterExpiredObjects(t), t.length > 0 && await this._model.idbClient().save(t);
      else if (p.options.sync.level === "cache") {
        const r = this._skipCacheUpdateIfFound && t.length > 0 ? !1 : this.shouldSendHttpRequest();
        if (r || t.length === 0) {
          const a = await this.filterQueuedObjects(this.mergeObjects(await this.performHttp()));
          (a.length > 0 || this._forceHttp) && (t = await this.filterExpiredObjects(a), t.length > 0 && await this._model.idbClient().save(t)), r && ((e = this._model) == null ? void 0 : e.getName()) !== "_Model" && M.setListCallLastTimeStamp(this.hash(), (/* @__PURE__ */ new Date()).getTime());
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
      var s;
      let r = [];
      const a = (i, o) => {
        r = i, e.set(o ? { items: i, nextSource: o } : { items: i });
      };
      try {
        if (!t) {
          a(await this.perform());
          return;
        }
        const i = await this.performMemory();
        if (a(
          this._raw ? i : this.convertObjects(i),
          this.hasLocalDatabase() ? "local database" : "server"
        ), this.hasLocalDatabase()) {
          const l = await this.performIndexedDb();
          a(
            this._raw ? l : this.convertObjects(l),
            "server"
          );
        }
        let o = await this.filterQueuedObjects(this.mergeObjects(await this.performHttp()));
        o = await this.filterExpiredObjects(o), o.length > 0 && this.hasLocalDatabase() && await ((s = this._model) == null ? void 0 : s.idbClient().save(o)), a(this._raw ? o : this.convertObjects(o));
      } catch (i) {
        console.error("List call failed:", (i == null ? void 0 : i.stack) ?? (i == null ? void 0 : i.message) ?? i), e.set({ items: r });
      }
    })(), e;
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
    var r, a;
    const e = {};
    for (let s = 0; s < t.options.readURL.length; s++) {
      const i = t.getNextReadURL();
      try {
        let o = [];
        if (this._get)
          o = await rt.get({
            baseUrl: i,
            modelName: this._model.getName(),
            blitzID: this._get,
            query: this._getQuery
          }, this._signal);
        else {
          const l = await rt.list({
            endpoint: {
              baseUrl: i,
              modelName: this._model.getName(),
              query: this._query
            }
          }, this._signal);
          o = l.items || [], qe.modelCacheUpdate(this._model, l.model);
        }
        for (const l of o) {
          l._clusters = [t.name], l._editURLs = JSON.parse(JSON.stringify(t.options.readURL));
          for (const c in l)
            if (c.endsWith("_fk") && l[c] !== null && typeof l[c] == "object" && l[c]._blitzID) {
              const d = (a = (r = this._model) == null ? void 0 : r.getAttributeDetails(c)) == null ? void 0 : a.type;
              if (d && d !== "_Model" && this.hasLocalDatabase()) {
                const u = await R.get(d);
                u && await u.idbClient().save([l[c]], !0);
              }
              l[c] = l[c]._blitzID;
            } else
              c.endsWith("_mtm") && Array.isArray(l[c]) && (l[c] = l[c].map((d, u) => ({
                _blitzID: typeof d == "string" ? d : d._blitzID,
                _mtmSort: typeof d == "string" ? (l[c].length - u) * 15 : d._mtmSort
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
    return ((await rt.list({ fullUrl: t }, this._signal)).items || []).map((r) => (r.cluster = [], r._editURLs = [t], r));
  }
  /**
   * Performs IndexedDB list call.
   */
  async performIndexedDb() {
    var r, a;
    const t = this._model.idbClient();
    if (this._get)
      return await t.query({
        conditions: [["_blitzID", "=", this._get]],
        limit: 1,
        var: (r = this._getQuery) == null ? void 0 : r.var,
        manyToMany: (a = this._getQuery) == null ? void 0 : a.manyToMany
      });
    const e = this._urls ? this._urls.map((s) => Bt.extractConditions(s)).flat() : this._query.conditions;
    return await t.query({ ...this._query, conditions: e });
  }
  /**
   * Performs memory list call.
   */
  async performMemory() {
    var r, a;
    const t = this._model.memoryClient();
    if (this._get)
      return await t.query({
        conditions: [["_blitzID", "=", this._get]],
        limit: 1,
        var: (r = this._getQuery) == null ? void 0 : r.var,
        manyToMany: (a = this._getQuery) == null ? void 0 : a.manyToMany
      });
    const e = this._urls ? this._urls.map((s) => Bt.extractConditions(s)).flat() : this._query.conditions;
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
      const a = e.find((s) => s._blitzID === r._blitzID);
      a ? (a._clusters = [...a._clusters, ...r._clusters].filter((s, i, o) => o.indexOf(s) === i), a._editURLs = [...a._editURLs, ...r._editURLs].filter((s, i, o) => o.indexOf(s) === i)) : e.push(r);
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
    var a;
    const e = await p.queue.getJobs(), r = [];
    for (const s of t)
      if (!e.find((i) => i.transaction.action === D.Delete && i.transaction.blitzID === s._blitzID))
        if (!e.find((i) => i.transaction.action === D.Edit && i.transaction.blitzID === s._blitzID && i.status !== b.Completed))
          r.push(s);
        else {
          const i = await ((a = this._model) == null ? void 0 : a.get({ blitzID: s._blitzID, raw: !0, forceLocal: !0 }));
          i ? r.push(i) : r.push(s);
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
    var a;
    const e = M.getCurrentUser();
    if (!e || !e.id)
      return t;
    const r = [];
    try {
      for (const s of t) {
        if (
          // Check if expiration date is present and valid
          typeof s._expiration == "string" && s._expiration !== "" && s._expiration !== "0000-00-00 00:00:00" && // Check if user is not the owner
          e.id !== s._userID
        ) {
          const i = Date.now(), o = new Date(s._expiration).getTime();
          if (i > o) {
            this.hasLocalDatabase() && await ((a = this._model) == null ? void 0 : a.idbClient().delete(s._blitzID));
            continue;
          }
        }
        r.push(s);
      }
    } catch (s) {
      return console.error("Error handling expired objects:", s.stack), t;
    }
    return r;
  }
  /**
   * Whether the current sync level keeps a local database.
   *
   * In the none level list calls must never read from or write to IndexedDB.
   */
  hasLocalDatabase() {
    return p.options.sync.level !== "none";
  }
  /**
   * Decides whether to send http request or not.
   */
  shouldSendHttpRequest() {
    var e;
    if (p.options.sync.level !== "cache" || ((e = this._model) == null ? void 0 : e.getName()) === "_Model")
      return !1;
    const t = M.getListCallLastTimeStamp(this.hash());
    return t ? (/* @__PURE__ */ new Date()).getTime() - t > p.options.sync.ttl : !0;
  }
  /**
   * Calculates hash of the call.
   */
  hash() {
    var t, e;
    return fs(JSON.stringify({
      clusters: ((t = this._clusters) == null ? void 0 : t.map((r) => r.name)) ?? [],
      blitzId: this._get,
      urls: this._urls,
      modelName: (e = this._model) == null ? void 0 : e.getName(),
      listQuery: this._query,
      getQuery: this._getQuery
    }));
  }
}
const A = class A {
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
    return "1.6.0";
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
    const e = $t.transformBlitzDataOptions(t);
    this.options = e, e.clusters && A.setClusters(e.clusters), await new qe(this.options.flush).perform(), await new tt().ping(), this.queue = await new br().init(), A._Model = new R({
      model: void 0,
      attributes: {
        _blitzID: new dt("_blitzID", "string", "_Model"),
        searchable: new dt("searchable", "json", void 0),
        attributes: new dt("attributes", "json", {
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
        _editURLs: new dt("_editURLs", "json", []),
        haspublishingdate: new Pe("haspublishingdate", "boolean", !1)
      }
    }), A._Model.setReturnType(R), t && typeof t != "string" && !Array.isArray(t) && t.uiManager && (this.ui = new t.uiManager(this, t.uiManagerSettings));
    try {
      await A.getCurrentUser();
    } catch (r) {
      console.error("Error fetching current user:", r.stack);
    }
    if (e.sync.level === "full") {
      const r = ht.create();
      await r.run(), r.runAtInterval(e.sync.interval);
    } else
      e.sync.level === "cache" && await ht.create().run(void 0, "delete");
  }
  /**
   * Registers clusters.
   */
  static setClusters(t) {
    t = $t.transformClusterOptions(t);
    for (const e of Object.keys(t))
      A.clusterManager.register(e, t[e]);
  }
  /**
   * Performs a list call to the server by given URL.
   *
   * @param url
   */
  static async list(t) {
    const e = Bt.extractModelName(t);
    if (!await A._Model.exists(e))
      throw new Error(`Model "${e}" does not exist.`);
    return it.create().model(await A._Model.get(e)).urls([t]).query({}).perform();
  }
  /**
   * Performs an image upload
   *
   * @param file File to be uploaded.
   */
  static async uploader(t) {
    return await rt.upload({
      baseUrl: A.clusterManager.toArray()[0].getNextReadURL(),
      image: t
    });
  }
  /**
   * Performs a video upload
   *
   * @param file File to be uploaded.
   */
  static async uploaderVideo(t) {
    return await rt.uploadVideo({
      baseUrl: A.clusterManager.toArray()[0].getNextReadURL(),
      video: t
    });
  }
  /**
   * Performs a file upload
   *
   * @param file File to be uploaded.
   */
  static async uploaderFile(t) {
    return await rt.uploadFile({
      baseUrl: A.clusterManager.toArray()[0].getNextReadURL(),
      file: t
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
    const a = E.sanitizeBaseUrl(A.clusterManager.toArray()[0].getNextReadURL()), s = new URL(a).origin !== window.location.origin ? r.includes("?") ? "&enableCors=1" : "?enableCors=1" : "", i = P.create().url(a + r + s).method((e == null ? void 0 : e.method) ?? "GET").header("Accept", "application/json");
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
    const e = M.getProjectUsers(t);
    if (e !== null && typeof e == "object") {
      const o = Date.now(), l = 864e5;
      if (o < e.lastSaved + l)
        return e.users;
    }
    const r = E.sanitizeBaseUrl(A.clusterManager.toArray()[0].getNextReadURL()), a = new URL(r).origin !== window.location.origin ? "?enableCors=1" : "", s = await P.create().url(r + `api/listProjectUsers/${t}.json${a}`).get();
    if (s.error)
      throw new Error(s.error);
    if (s.errors instanceof Array && s.errors.length > 0)
      throw new Error(s.errors.map((o) => o.message || o).join(" | "));
    const i = {
      lastSaved: Date.now(),
      users: (s.users || []).map((o) => ({ id: o._blitzID, username: o.username }))
    };
    return M.setProjectUsers(t, i), i.users;
  }
  /**
   * Get current user.
   */
  static async getCurrentUser() {
    var l;
    const t = M.getCurrentUser();
    if (t)
      return t;
    const e = E.sanitizeBaseUrl(A.clusterManager.toArray()[0].getNextReadURL()), r = new URL(e).origin !== window.location.origin ? "?enableCors=1" : "", a = await P.create().url(e + "api/ping.json" + r).get();
    if (a.error)
      throw new Error(a.error);
    if (!a.userhash) {
      const c = { id: "public", username: "Public" };
      return M.setCurrentUser(c), c;
    }
    const s = await R.get("0BAUsers"), i = await (s == null ? void 0 : s.get(a.userhash));
    if (!i || !((l = i.username) != null && l.value))
      throw new Error("Could not get user object!");
    const o = { id: a.userhash, username: i.username.value };
    return M.setCurrentUser(o), o;
  }
  /**
   * Clean up current user.
   */
  static refreshCurrentUser() {
    M.setCurrentUser(null);
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
m(A, "clusterManager", new Me()), /**
 * _Model instance.
 */
m(A, "_Model"), /**
* Cache of loaded objects (model => (blitzID => object)).
*/
m(A, "objects", /* @__PURE__ */ new Map()), /**
 * Options of the BlitzData.
 */
m(A, "options"), /**
* Queue instance.
*/
m(A, "queue"), /**
* UI manager instance.
*/
m(A, "ui"), /**
 * Event listeners.
 */
m(A, "listeners", /* @__PURE__ */ new Map()), /**
 * Whether library initialized or not.
 */
m(A, "initialized", !1);
let p = A;
class ps {
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
function Ve(n) {
  let t = "";
  for (const e of n)
    t += String.fromCharCode(e);
  return btoa(t).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function Ut(n = 32) {
  const t = new Uint8Array(n);
  return crypto.getRandomValues(t), Ve(t);
}
async function _s(n) {
  const t = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(n));
  return Ve(new Uint8Array(t));
}
function Qe(n) {
  const t = n.replace(/-/g, "+").replace(/_/g, "/"), e = t + "=".repeat((4 - t.length % 4) % 4), r = atob(e), a = new Uint8Array(r.length);
  for (let s = 0; s < r.length; s++)
    a[s] = r.charCodeAt(s);
  return a;
}
function Se(n) {
  return JSON.parse(new TextDecoder().decode(Qe(n)));
}
function Lt(n) {
  const t = n.split(".");
  if (t.length !== 3)
    throw new Error("id_token is not a well-formed JWT");
  return {
    header: Se(t[0]),
    payload: Se(t[1]),
    signingInput: `${t[0]}.${t[1]}`,
    signature: Qe(t[2])
  };
}
function vs(n, t) {
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
async function Ds(n, t) {
  if (typeof crypto > "u" || !crypto.subtle)
    return !1;
  const e = (n.header.kid ? t.keys.find((a) => a.kid === n.header.kid) : t.keys[0]) ?? t.keys[0];
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
const Wt = "blitzdata.oauth.verifier", Ft = "blitzdata.oauth.state", jt = "blitzdata.oauth.nonce";
class Ms {
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
    this._baseUrl = t.baseUrl.endsWith("/") ? t.baseUrl : t.baseUrl + "/", this._issuerOrigin = new URL(this._baseUrl).origin, this._redirectUri = t.redirectUri ?? (typeof location < "u" ? location.origin + location.pathname : ""), this._scope = t.scope ?? "openid profile email", this._clientId = t.clientId ?? new URL(this._redirectUri || this._baseUrl).origin, this._store = new ps(t.storageKey, t.storage ?? (typeof localStorage < "u" ? localStorage : null)), this._leewayMs = (t.refreshLeewaySeconds ?? 60) * 1e3, P.onUnauthorized(async (e) => new URL(e).origin !== this._issuerOrigin ? !1 : this.refresh());
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
        this._claims = Lt(this._tokens.idToken).payload;
      } catch {
        this._claims = null;
      }
    return this._tokens ? this._tokens.expiresAt <= Date.now() + this._leewayMs ? await this.refresh() : (this._applyTokens(), !0) : !1;
  }
  /**
   * Start the login by sending the browser to the BlitzData authorize page.
   */
  async loginWithRedirect() {
    const t = Ut(32), e = Ut(16), r = Ut(16);
    sessionStorage.setItem(Wt, t), sessionStorage.setItem(Ft, e), sessionStorage.setItem(jt, r);
    const a = new URLSearchParams({
      response_type: "code",
      client_id: this._clientId,
      redirect_uri: this._redirectUri,
      scope: this._scope,
      state: e,
      nonce: r,
      code_challenge_method: "S256",
      code_challenge: await _s(t)
    });
    location.href = `${this._baseUrl}blitz/o/oauth/authorize?${a}`;
  }
  /**
   * Exchange the ?code from the authorize redirect for tokens.
   * Called automatically by init().
   */
  async handleRedirectCallback() {
    const t = new URLSearchParams(location.search), e = t.get("code");
    if (!e)
      return !1;
    const r = sessionStorage.getItem(Ft), a = sessionStorage.getItem(Wt), s = sessionStorage.getItem(jt);
    if (sessionStorage.removeItem(Ft), sessionStorage.removeItem(Wt), sessionStorage.removeItem(jt), !a || !r || t.get("state") !== r)
      throw new Error("OAuth state mismatch, restart the login");
    await this._storeTokenResponse(
      await this._postForm("blitz/o/oauth/token", { code: e, code_verifier: a }),
      s ?? void 0
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
          this._claims = Lt(t.idToken).payload;
        } catch {
          this._claims = null;
        }
      return this._applyTokens(), !0;
    }
    const e = ((r = this._tokens) == null ? void 0 : r.refreshToken) ?? (t == null ? void 0 : t.refreshToken);
    if (!e)
      return !1;
    try {
      const a = await this._postForm("blitz/o/oauth/refresh", { refresh_token: e });
      return await this._storeTokenResponse(a), !0;
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
    var a, s, i;
    const e = ((a = this._tokens) == null ? void 0 : a.refreshToken) ?? ((s = this._store.load()) == null ? void 0 : s.refreshToken), r = (i = this._tokens) == null ? void 0 : i.accessToken;
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
    const r = Lt(t), a = await this._getDiscovery(), s = (a == null ? void 0 : a.issuer) ?? this._issuerOrigin;
    if (vs(r.payload, { issuer: s, audience: this._clientId, nonce: e }), a) {
      const o = await this._fetchJson(a.jwks_uri);
      if ((i = o == null ? void 0 : o.keys) != null && i.length && !await Ds(r, o))
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
  Re as BDCustomObject,
  R as BDModel,
  st as BDObject,
  p as BlitzData,
  U as DataType,
  P as HttpRequest,
  b as JobStatus,
  M as LocalStorageRepository,
  Ba as ManyForeignKeyType,
  Je as ManyType,
  Ms as OAuthClient,
  Fe as TextType,
  ct as blitzhash,
  nt as blitzstamp,
  mr as sleep
};
