var Re = Object.defineProperty;
var $e = (n, t, e) => t in n ? Re(n, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : n[t] = e;
var m = (n, t, e) => ($e(n, typeof t != "symbol" ? t + "" : t, e), e);
const tt = class tt {
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
    const t = new tt();
    return tt._globalHeaders && t.headers(tt._globalHeaders), t;
  }
  /**
   * Set the global request headers.
   *
   * @param headers Global request headers.
   */
  static globalHeaders(t) {
    tt._globalHeaders = t;
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
  async send() {
    const t = await fetch(this._url, {
      method: this._method,
      headers: this._headers,
      body: this._body ? this._body instanceof FormData ? this._body : JSON.stringify(this._body) : void 0,
      signal: this._signal ? this._signal : void 0
    });
    if (!t.ok)
      throw new Error(`HTTP request failed with status code ${t.status}. Status text: ${t.statusText} and response: ${await t.text()}`);
    return await t.json();
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
m(tt, "_globalHeaders", {});
let F = tt;
class He {
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
class be {
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
    this.clusters[t] = new He(t, e);
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
const Be = (n, t) => t.some((e) => n instanceof e);
let Qt, Xt;
function Ye() {
  return Qt || (Qt = [
    IDBDatabase,
    IDBObjectStore,
    IDBIndex,
    IDBCursor,
    IDBTransaction
  ]);
}
function qe() {
  return Xt || (Xt = [
    IDBCursor.prototype.advance,
    IDBCursor.prototype.continue,
    IDBCursor.prototype.continuePrimaryKey
  ]);
}
const ye = /* @__PURE__ */ new WeakMap(), Wt = /* @__PURE__ */ new WeakMap(), pe = /* @__PURE__ */ new WeakMap(), Et = /* @__PURE__ */ new WeakMap(), Rt = /* @__PURE__ */ new WeakMap();
function Ve(n) {
  const t = new Promise((e, r) => {
    const a = () => {
      n.removeEventListener("success", s), n.removeEventListener("error", i);
    }, s = () => {
      e(Q(n.result)), a();
    }, i = () => {
      r(n.error), a();
    };
    n.addEventListener("success", s), n.addEventListener("error", i);
  });
  return t.then((e) => {
    e instanceof IDBCursor && ye.set(e, n);
  }).catch(() => {
  }), Rt.set(t, n), t;
}
function Qe(n) {
  if (Wt.has(n))
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
  Wt.set(n, t);
}
let Ut = {
  get(n, t, e) {
    if (n instanceof IDBTransaction) {
      if (t === "done")
        return Wt.get(n);
      if (t === "objectStoreNames")
        return n.objectStoreNames || pe.get(n);
      if (t === "store")
        return e.objectStoreNames[1] ? void 0 : e.objectStore(e.objectStoreNames[0]);
    }
    return Q(n[t]);
  },
  set(n, t, e) {
    return n[t] = e, !0;
  },
  has(n, t) {
    return n instanceof IDBTransaction && (t === "done" || t === "store") ? !0 : t in n;
  }
};
function Xe(n) {
  Ut = n(Ut);
}
function Ke(n) {
  return n === IDBDatabase.prototype.transaction && !("objectStoreNames" in IDBTransaction.prototype) ? function(t, ...e) {
    const r = n.call(kt(this), t, ...e);
    return pe.set(r, t.sort ? t.sort() : [t]), Q(r);
  } : qe().includes(n) ? function(...t) {
    return n.apply(kt(this), t), Q(ye.get(this));
  } : function(...t) {
    return Q(n.apply(kt(this), t));
  };
}
function Ge(n) {
  return typeof n == "function" ? Ke(n) : (n instanceof IDBTransaction && Qe(n), Be(n, Ye()) ? new Proxy(n, Ut) : n);
}
function Q(n) {
  if (n instanceof IDBRequest)
    return Ve(n);
  if (Et.has(n))
    return Et.get(n);
  const t = Ge(n);
  return t !== n && (Et.set(n, t), Rt.set(t, n)), t;
}
const kt = (n) => Rt.get(n);
function it(n, t, { blocked: e, upgrade: r, blocking: a, terminated: s } = {}) {
  const i = indexedDB.open(n, t), o = Q(i);
  return r && i.addEventListener("upgradeneeded", (u) => {
    r(Q(i.result), u.oldVersion, u.newVersion, Q(i.transaction), u);
  }), e && i.addEventListener("blocked", (u) => e(
    // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
    u.oldVersion,
    u.newVersion,
    u
  )), o.then((u) => {
    s && u.addEventListener("close", () => s()), a && u.addEventListener("versionchange", (c) => a(c.oldVersion, c.newVersion, c));
  }).catch(() => {
  }), o;
}
function $t(n, { blocked: t } = {}) {
  const e = indexedDB.deleteDatabase(n);
  return t && e.addEventListener("blocked", (r) => t(
    // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
    r.oldVersion,
    r
  )), Q(e).then(() => {
  });
}
const Ze = ["get", "getKey", "getAll", "getAllKeys", "count"], tr = ["put", "add", "delete", "clear"], Ct = /* @__PURE__ */ new Map();
function Kt(n, t) {
  if (!(n instanceof IDBDatabase && !(t in n) && typeof t == "string"))
    return;
  if (Ct.get(t))
    return Ct.get(t);
  const e = t.replace(/FromIndex$/, ""), r = t !== e, a = tr.includes(e);
  if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(e in (r ? IDBIndex : IDBObjectStore).prototype) || !(a || Ze.includes(e))
  )
    return;
  const s = async function(i, ...o) {
    const u = this.transaction(i, a ? "readwrite" : "readonly");
    let c = u.store;
    return r && (c = c.index(o.shift())), (await Promise.all([
      c[e](...o),
      a && u.done
    ]))[0];
  };
  return Ct.set(t, s), s;
}
Xe((n) => ({
  ...n,
  get: (t, e, r) => Kt(t, e) || n.get(t, e, r),
  has: (t, e) => !!Kt(t, e) || n.has(t, e)
}));
const _ = {
  name: "bd-queue",
  store: "jobs",
  timeIndex: "time",
  objectIndex: "object"
};
var y = /* @__PURE__ */ ((n) => (n.Pending = "pending", n.Completed = "completed", n.Failed = "failed", n.Conflict = "conflict", n))(y || {}), j = /* @__PURE__ */ ((n) => (n.Success = "success", n.Exception = "exception", n.Failed = "failed", n.Conflict = "conflict", n))(j || {}), D = /* @__PURE__ */ ((n) => (n.Add = "add", n.Edit = "edit", n.Delete = "delete", n))(D || {}), Y = "SharedWorker" in globalThis, er = class {
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
}, rr = class extends er {
  constructor(n, t) {
    let e;
    Y ? e = new SharedWorker(n, t) : e = new Worker(n, t), super(e);
  }
};
function nr(n) {
  return n && n.__esModule && Object.prototype.hasOwnProperty.call(n, "default") ? n.default : n;
}
var ve = {};
/*! crc32.js (C) 2014-present SheetJS -- http://sheetjs.com */
(function(n) {
  (function(t) {
    t(typeof DO_NOT_EXPORT_CRC > "u" ? n : {});
  })(function(t) {
    t.version = "1.2.2";
    function e() {
      for (var w = 0, N = new Array(256), b = 0; b != 256; ++b)
        w = b, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, w = w & 1 ? -306674912 ^ w >>> 1 : w >>> 1, N[b] = w;
      return typeof Int32Array < "u" ? new Int32Array(N) : N;
    }
    var r = e();
    function a(w) {
      var N = 0, b = 0, I = 0, O = typeof Int32Array < "u" ? new Int32Array(4096) : new Array(4096);
      for (I = 0; I != 256; ++I)
        O[I] = w[I];
      for (I = 0; I != 256; ++I)
        for (b = w[I], N = 256 + I; N < 4096; N += 256)
          b = O[N] = b >>> 8 ^ w[b & 255];
      var C = [];
      for (I = 1; I != 16; ++I)
        C[I - 1] = typeof Int32Array < "u" ? O.subarray(I * 256, I * 256 + 256) : O.slice(I * 256, I * 256 + 256);
      return C;
    }
    var s = a(r), i = s[0], o = s[1], u = s[2], c = s[3], l = s[4], d = s[5], h = s[6], f = s[7], g = s[8], v = s[9], M = s[10], P = s[11], k = s[12], A = s[13], V = s[14];
    function At(w, N) {
      for (var b = N ^ -1, I = 0, O = w.length; I < O; )
        b = b >>> 8 ^ r[(b ^ w.charCodeAt(I++)) & 255];
      return ~b;
    }
    function Le(w, N) {
      for (var b = N ^ -1, I = w.length - 15, O = 0; O < I; )
        b = V[w[O++] ^ b & 255] ^ A[w[O++] ^ b >> 8 & 255] ^ k[w[O++] ^ b >> 16 & 255] ^ P[w[O++] ^ b >>> 24] ^ M[w[O++]] ^ v[w[O++]] ^ g[w[O++]] ^ f[w[O++]] ^ h[w[O++]] ^ d[w[O++]] ^ l[w[O++]] ^ c[w[O++]] ^ u[w[O++]] ^ o[w[O++]] ^ i[w[O++]] ^ r[w[O++]];
      for (I += 15; O < I; )
        b = b >>> 8 ^ r[(b ^ w[O++]) & 255];
      return ~b;
    }
    function Ne(w, N) {
      for (var b = N ^ -1, I = 0, O = w.length, C = 0, Tt = 0; I < O; )
        C = w.charCodeAt(I++), C < 128 ? b = b >>> 8 ^ r[(b ^ C) & 255] : C < 2048 ? (b = b >>> 8 ^ r[(b ^ (192 | C >> 6 & 31)) & 255], b = b >>> 8 ^ r[(b ^ (128 | C & 63)) & 255]) : C >= 55296 && C < 57344 ? (C = (C & 1023) + 64, Tt = w.charCodeAt(I++) & 1023, b = b >>> 8 ^ r[(b ^ (240 | C >> 8 & 7)) & 255], b = b >>> 8 ^ r[(b ^ (128 | C >> 2 & 63)) & 255], b = b >>> 8 ^ r[(b ^ (128 | Tt >> 6 & 15 | (C & 3) << 4)) & 255], b = b >>> 8 ^ r[(b ^ (128 | Tt & 63)) & 255]) : (b = b >>> 8 ^ r[(b ^ (224 | C >> 12 & 15)) & 255], b = b >>> 8 ^ r[(b ^ (128 | C >> 6 & 63)) & 255], b = b >>> 8 ^ r[(b ^ (128 | C & 63)) & 255]);
      return ~b;
    }
    t.table = r, t.bstr = At, t.buf = Le, t.str = Ne;
  });
})(ve);
function rt() {
  return Math.floor(((/* @__PURE__ */ new Date()).getTime() - (/* @__PURE__ */ new Date("2021-01-01T00:00:00Z")).getTime()) / 1e3);
}
function ot(n) {
  return rt().toString(36) + "-" + ve.str(JSON.stringify(n)).toString(36);
}
function ar(n) {
  return new Promise((t) => {
    setTimeout(t, n);
  });
}
class jt {
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
          status: j.Success
        };
      if (i.conflict) {
        const o = Object.keys(t.transaction.data)[0], u = i.conflict[o];
        if (!u)
          throw new Error("No previous value found in conflict result!");
        return {
          status: j.Conflict,
          message: u
        };
      } else if (i.e)
        return {
          status: j.Failed,
          message: i.e
        };
      return {
        status: j.Exception,
        message: s.error ?? (Array.isArray(s.errors) ? s.errors.map((o) => (o == null ? void 0 : o.message) ?? o).join(" | ") : "Unknown error!")
      };
    } catch (r) {
      return {
        status: j.Exception,
        message: r.message
      };
    }
  }
}
var bt = [], pt;
class _e {
  constructor(t, e) {
    //Properties
    m(this, "_db", null);
    m(this, "_currentTimestamp", null);
    m(this, "_localHeaders");
    m(this, "_postMessage");
    this._postMessage = t, this._localHeaders = e;
  }
  //Update job
  async _updateJob(t) {
    var e;
    return await ((e = this._db) == null ? void 0 : e.put(_.store, t)), t;
  }
  //Delete job
  async _deleteJob(t) {
    var e;
    await ((e = this._db) == null ? void 0 : e.delete(_.store, t.id));
  }
  //Send job to clients
  _sendJobEvent(t) {
    if (typeof this._postMessage == "function")
      this._postMessage({ data: { job: t } });
    else
      for (const e of bt)
        e == null || e.postMessage({ job: t });
  }
  //Get next job
  async _getNextJob() {
    var s;
    let t = null;
    const e = (s = this._db) == null ? void 0 : s.transaction(_.store, "readonly").store, r = this._currentTimestamp ? IDBKeyRange.lowerBound(this._currentTimestamp, !0) : null;
    let a = await (e == null ? void 0 : e.index(_.timeIndex).openCursor(r, "next"));
    for (; a; ) {
      if (a.value.status === y.Pending) {
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
    const e = [], r = t.transaction.action === D.Edit ? Object.keys(t.transaction.data)[0] : null, a = (o = this._db) == null ? void 0 : o.transaction(_.store, "readonly").store, s = IDBKeyRange.upperBound(t.createdAt, !0);
    let i = await (a == null ? void 0 : a.index(_.timeIndex).openCursor(s, "next"));
    for (; i; )
      //Only unresolved jobs
      i.value.status !== y.Completed && //Same destination
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
    if (e.find((s) => s.transaction.action === D.Edit && s.status === y.Conflict)) {
      r = !0;
      const s = await this._updateJob({
        ...t,
        status: y.Conflict
      });
      this._sendJobEvent(s);
    }
    return r;
  }
  //Handle preceding failed edit jobs check
  async _checkPrecedingFailedEditJobs(t, e) {
    var o, u;
    let r = !1;
    const a = e.filter((c) => c.transaction.action === D.Edit && (c.status === y.Pending || c.status === y.Failed)), s = Object.keys(t.transaction.data)[0], i = ((o = t.transaction.data) == null ? void 0 : o[s].new) !== void 0 && ((u = t.transaction.data) == null ? void 0 : u[s].prev) !== void 0;
    return a.length > 0 && i && (r = !0, t.attempts || await this._editAttemptHandler(t, a)), r;
  }
  //Handle merging with future edit jobs
  async _mergeWithFutureEditJobs(t) {
    var u, c, l;
    const e = [], r = Object.keys(t.transaction.data)[0], a = (u = this._db) == null ? void 0 : u.transaction(_.store, "readonly").store, s = IDBKeyRange.lowerBound(t.createdAt, !0);
    let i = await (a == null ? void 0 : a.index(_.timeIndex).openCursor(s, "next"));
    for (; i; )
      //Only unresolved jobs
      (i.value.status === y.Pending || i.value.status === y.Failed) && //Same destination
      i.value.url === t.url && //Only edit jobs
      i.value.transaction.action === D.Edit && //Only same object jobs
      i.value.transaction.blitzID === t.transaction.blitzID && //Only same attribute jobs
      Object.keys(i.value.transaction.data)[0] === r && e.push(i.value), i = await i.continue();
    var o = t;
    if (e.length > 0) {
      const d = e[e.length - 1];
      if (d && ((c = d.transaction.data) == null ? void 0 : c[r].new) !== void 0 && ((l = t.transaction.data) == null ? void 0 : l[r].prev) !== void 0) {
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
            blitzstamp: rt(),
            hash: ot({ ...h, blitzID: t.transaction.blitzID, timestamp: f })
          },
          dataHistory: [...t.dataHistory ?? [], { timestamp: f, type: "worker-succeeding", data: t.transaction.data }]
        });
        for (const g of e)
          await this._deleteJob(g);
      }
    }
    return o;
  }
  //Handle job's status response
  async _statusHandler(t, e) {
    var r, a, s;
    if (e.status === j.Success) {
      const i = await this._updateJob({
        ...t,
        status: y.Completed
      });
      this._sendJobEvent(i);
    } else if (e.status === j.Exception)
      await this._updateJob({
        ...t,
        status: y.Pending,
        attempts: t.attempts + 1,
        priority: t.priority < 5 ? t.priority + 1 : t.priority,
        message: e.message
      });
    else if (e.status === j.Failed)
      if (t.attempts > 0) {
        const i = await this._updateJob({
          ...t,
          status: y.Failed,
          message: e.message
        });
        this._sendJobEvent(i);
      } else
        await this._updateJob({
          ...t,
          status: y.Pending,
          attempts: t.attempts + 1,
          message: e.message
        });
    else if (e.status === j.Conflict) {
      const i = Object.keys(t.transaction.data)[0];
      if (((r = t.transaction.data) == null ? void 0 : r[i].prev) === ((a = t.transaction.data) == null ? void 0 : a[i].new) || e.message === ((s = t.transaction.data) == null ? void 0 : s[i].new)) {
        const o = await this._updateJob({
          ...t,
          status: y.Completed
        });
        this._sendJobEvent(o);
      } else {
        const o = await this._updateJob({
          ...t,
          status: y.Conflict,
          message: e.message
        });
        this._sendJobEvent(o);
      }
    }
  }
  //Handle edit job attempt
  async _editAttemptHandler(t, e) {
    var c, l, d, h, f;
    const r = Object.keys(t.transaction.data)[0], a = e[0];
    if (((c = a.transaction.data) == null ? void 0 : c[r].prev) === void 0)
      return;
    const s = {
      [r]: {
        prev: a.transaction.data[r].prev,
        new: (l = t.transaction.data) == null ? void 0 : l[r].new
      }
    }, i = (/* @__PURE__ */ new Date()).getTime();
    var o = {
      ...t,
      transaction: {
        ...t.transaction,
        data: s,
        blitzstamp: rt(),
        hash: ot({ ...s, blitzID: t.transaction.blitzID, timestamp: i })
      },
      dataHistory: [...t.dataHistory ?? [], { timestamp: i, type: "worker-attempt", data: t.transaction.data }]
    };
    let u;
    if (s[r].prev === s[r].new ? u = { status: j.Success } : u = await jt.send(o, this._localHeaders ?? pt), u.status === j.Success) {
      o = await this._updateJob({
        ...o,
        status: y.Completed
      });
      for (const g of e)
        await this._updateJob({
          ...g,
          status: y.Completed
        });
      this._sendJobEvent(o);
    } else if (u.status === j.Exception || u.status === j.Failed)
      await this._updateJob({
        ...t,
        status: a.status,
        attempts: t.attempts + 1,
        message: u.message
      });
    else if (u.status === j.Conflict)
      if (((d = o.transaction.data) == null ? void 0 : d[r].prev) === ((h = o.transaction.data) == null ? void 0 : h[r].new) || u.message === ((f = o.transaction.data) == null ? void 0 : f[r].new)) {
        o = await this._updateJob({
          ...o,
          status: y.Completed
        });
        for (const g of e)
          await this._updateJob({
            ...g,
            status: y.Completed
          });
        this._sendJobEvent(o);
      } else {
        o = await this._updateJob({
          ...o,
          status: y.Conflict,
          message: u.message
        });
        for (const g of e)
          await this._deleteJob(g);
        this._sendJobEvent(o);
      }
  }
  //Start processing queue
  async start() {
    var r, a;
    for (this._db = await it(_.name, 1); ; ) {
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
            const l = { status: j.Success };
            throw await this._statusHandler(t, l), new Error("SKIP");
          }
        }
        const i = await jt.send(t, this._localHeaders ?? pt);
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
function Gt(n) {
  bt.push(n), n.onmessage = function(t) {
    t.data.type === "close" ? bt = bt.filter((e) => e !== n) : t.data.type === "headers" && !pt && t.data.data && (pt = t.data.data);
  };
}
("SharedWorkerGlobalScope" in self || "WorkerGlobalScope" in self) && ("SharedWorkerGlobalScope" in self ? self.onconnect = (n) => Gt(n.ports[0]) : Gt(self), new _e().start());
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
    this.action = t.action, this.blitzstamp = t.blitzstamp ?? rt(), this.hash = t.hash ?? ot(t.data === void 0 ? { blitzID: t.blitzID, milliseconds: (/* @__PURE__ */ new Date()).getTime(), rand: Math.random() } : { ...t.data, blitzID: t.blitzID, milliseconds: (/* @__PURE__ */ new Date()).getTime(), rand: Math.random() }), this.hashAlgo = t.hashAlgo ?? "b-crc32", this.blitzID = t.blitzID ?? ((e = t.data) == null ? void 0 : e._blitzID) ?? this.hash, this.model = t.model, this.data = t.data ?? {}, this.userhash = t.userhash;
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
var W = /* @__PURE__ */ ((n) => (n.Success = "success", n.Notice = "notice", n.Error = "error", n.Exception = "exception", n))(W || {});
class B {
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
class vt extends Array {
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
    return new vt(...this.filter((t) => t.status));
  }
  /**
   * Returns new transaction result collection that only contains failed transaction results.
   */
  failed() {
    return new vt(...this.filter((t) => !t.status));
  }
}
class T {
  /**
   * Create a list endpoint.
   *
   * @param baseUrl Base URL.
   * @param modelName Model name.
   * @param query Query parameters to be appended to the endpoint.
   */
  static createListEndpoint(t, e, r) {
    var i;
    const a = `${T.sanitizeBaseUrl(t)}api/list/${e}.json`, s = new URLSearchParams();
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
    const s = `${T.sanitizeBaseUrl(t)}api/list/${e}/_blitzID/${r}.json`, i = new URLSearchParams();
    return new URL(t).origin !== window.location.origin && i.append("enableCors", "1"), i.append("fkOptions", JSON.stringify({ _userID: "blitzID" })), a.var && a.var.length > 0 && i.append("var", JSON.stringify(a.var)), a.manyToMany && i.append("manyToMany", a.manyToMany), `${s}?${i.toString()}`;
  }
  /**
   * Create a post endpoint.
   *
   * @param baseUrl Base URL.
   */
  static createPostEndpoint(t) {
    return `${T.sanitizeBaseUrl(t)}api/post.json`;
  }
  /**
   * Create a ping endpoint.
   *
   * @param baseUrl Base URL.
   */
  static createPingEndpoint(t) {
    return `${T.sanitizeBaseUrl(t)}api/ping.json`;
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
    const e = t.type === "delete" ? "listDeletedLogs" : "listLogs", r = t.model ? `${T.sanitizeBaseUrl(t.baseUrl)}api/${e}/${t.model}.json` : `${T.sanitizeBaseUrl(t.baseUrl)}api/${e}.json`, a = new URLSearchParams();
    return ((s = t.query) == null ? void 0 : s.from) !== void 0 && a.append("from", t.query.from.toString()), (i = t.query) != null && i.models && !t.model && a.append("models", JSON.stringify(t.query.models)), `${r}?${a.toString()}`;
  }
  /**
   * Create an uploader endpoint.
   *
   * @param baseUrl Base URL.
   */
  static createUploaderEndpoint(t) {
    const e = new URL(t).origin !== window.location.origin ? "?enableCors=1" : "";
    return `${T.sanitizeBaseUrl(t)}uploader/index` + e;
  }
  /**
   * Create a video uploader endpoint.
   *
   * @param baseUrl Base URL.
   */
  static createVideoUploaderEndpoint(t, e) {
    const r = new URL(t).origin !== window.location.origin ? "?enableCors=1" : "", a = (r ? r + "&" : "?") + `filename=${e}`;
    return `${T.sanitizeBaseUrl(t)}uploadervideo/index` + a;
  }
  /**
   * Create a file uploader endpoint.
   *
   * @param baseUrl Base URL.
   */
  static createFileUploaderEndpoint(t) {
    const e = new URL(t).origin !== window.location.origin ? "?enableCors=1" : "";
    return `${T.sanitizeBaseUrl(t)}uploaderfile/index` + e;
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
class et {
  /**
   * Performs a list call to the server by given base URL, model name and query parameters.
   */
  static async list(t, e) {
    if (!t.endpoint && !t.fullUrl)
      throw new Error("Either baseUrl or fullUrl must be provided.");
    const r = await F.create().url(
      // We got 2 urls, because it is possible to have a full url.
      // See `BlitzData.list()` and `BlitzData.listRaw()` methods.
      t.fullUrl ? t.fullUrl : T.createListEndpoint(t.endpoint.baseUrl, t.endpoint.modelName, t.endpoint.query)
    ).signal(e).get();
    if (!Array.isArray(r.items) && Array.isArray(r.errors))
      throw new Error(r.errors.map((a) => (a == null ? void 0 : a.message) ?? a).join(" | "));
    return r;
  }
  /**
   * Performs a get call to the server by provided options.
   */
  static async get(t, e) {
    const r = await F.create().url(
      T.createGetEndpoint(t.baseUrl, t.modelName, t.blitzID, t.query)
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
    const e = await F.create().url(T.createPostEndpoint(t.baseUrl)).body(t.transactions).post();
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
    const e = await F.create().url(T.createListLogsEndpoint(t)).get();
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
    const r = await F.create().url(T.createUploaderEndpoint(t.baseUrl)).body(e).header("Accept", "application/json").post(), a = {};
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
    const r = t.video.name.split("."), a = r.length > 1 ? "." + r.pop() : "", s = crypto.randomUUID() + a, i = await F.create().url(T.createVideoUploaderEndpoint(t.baseUrl, s)).body(e).header("Accept", "application/json").post();
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
    const r = await F.create().url(T.createFileUploaderEndpoint(t.baseUrl)).body(e).header("Accept", "application/json").post();
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
    return await F.create().url(T.createPingEndpoint(t)).get();
  }
}
class Ht {
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
    return new Ht();
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
      t.map((a) => et.listLogs({
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
class Bt {
  /**
   * Pings the database, ensuring it's correctly set up.
   */
  async ping() {
    const t = await this.openConnection(), e = ["sync_transactions", "evaluated_transactions"];
    for (const r of e)
      if (!t.objectStoreNames.contains(r))
        return t.close(), console.log(`There's missing stores, recreating the database. Available stores: ${t.objectStoreNames}`), await $t("db_master"), await this.ping();
    t.close();
  }
  /**
   * Opens a connection to the database.
   *
   * @returns instance of the database connection
   */
  async openConnection() {
    return await it("db_master", 1, {
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
class Pt {
  constructor() {
    /**
     * Master indexed db client.
     */
    m(this, "client", new Bt());
  }
  /**
   * Creates a new instance of the SyncTransactionRepository class.
   */
  static create() {
    return new Pt();
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
class dt {
  /**
   * Creates a new syncer.
   */
  static create() {
    return new dt();
  }
  /**
   * Runs the synchronization process.
   */
  async run(t, e) {
    if (!navigator.onLine)
      return;
    const r = p.options.sync.startDate instanceof Date && t !== "_Model" ? Math.floor(p.options.sync.startDate.getTime() / 1e3) : 0, a = S.getLastSyncedAt(t) ?? r, { transactions: s, lastTimestamp: i } = await Ht.create().type(e).query({
      from: a,
      models: t ? [t] : p.options.sync.models ?? [
        "_Project",
        ...(await R.list()).map((u) => u.getName()).filter((u) => u.startsWith("bdt") && !["bdt24prszej_appfiles", "bdt24prszej_apps"].includes(u))
      ]
    }).perform(), o = Pt.create();
    await o.putMultiple(s), S.setLastSyncedAt(i ?? Math.floor(Date.now() / 1e3), t), await q.create().run(
      (await o.all()).map((u) => $.fromObject(u))
    ), a !== i && await this.run(t, e);
  }
  async runAtInterval(t) {
    for (; ; )
      await ar(t), await this.run();
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
    const e = new vt(), r = Pt.create(), a = { add: 1, edit: 2, delete: 3 }, s = await new Bt().openConnection();
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
      } catch (u) {
        o = new B(
          i.blitzID,
          i.hash,
          W.Error,
          u.message
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
      return new B(
        t.hash,
        t.hash,
        W.Error,
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
        for (const [u, c] of Object.entries(t.data)) {
          const l = e.getAttributeDetails(u);
          if (l && Array.isArray(l.type) && c !== void 0) {
            const d = typeof c == "string" ? JSON.parse(c) : c;
            u.endsWith("_mtm") ? o[u] = d.map((f, g) => ({
              _blitzID: typeof f == "string" ? f : f._blitzID,
              _mtmSort: typeof f == "string" ? (d.length - g) * 15 : f._mtmSort
            })) : o[u] = d;
          } else
            o[u] = c;
        }
        return o;
      })()
    };
    if (["1", !0].includes((i = e.haspublishingdate) == null ? void 0 : i.value) && typeof t.data._publishingdate > "u" && typeof t.blitzstamp == "number") {
      const o = /* @__PURE__ */ new Date();
      o.setTime(t.blitzstamp * 1e3 + (/* @__PURE__ */ new Date("2021-01-01T00:00:00Z")).getTime()), o.setMinutes(o.getMinutes() - o.getTimezoneOffset()), s._publishingdate = o.toISOString().slice(0, 19).replace("T", " ");
    }
    return !s._userID && t.userhash && (s._userID = t.userhash), t.data = s, await r.create(s), new B(t.hash, t.hash, W.Success);
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
      return new B(
        t.blitzID,
        t.hash,
        W.Error,
        s.length > 1 ? "Can not edit more than one attribute at once." : "Attribute not provided to perform edit."
      );
    if (await e.get("evaluated_transactions", t.hash))
      return new B(
        t.blitzID,
        t.hash,
        W.Notice,
        `Transaction ${t.hash} already processed.`
      );
    const i = await a.find(t.blitzID);
    if (!i)
      return new B(t.blitzID, t.hash, W.Notice, `Object with ${t.blitzID} does not exists.`);
    if (i._savetimestamp && i._savetimestamp > t.blitzstamp)
      return new B(t.blitzID, t.hash, W.Notice, "Old transaction.");
    const o = s.shift(), u = (c = r.getAttributeDetails(o)) == null ? void 0 : c.type;
    if (Array.isArray(u))
      if (Object.hasOwn(t.data[o], "add")) {
        i[o] = Array.isArray(i[o]) ? i[o] : [];
        const l = t.data[o].add;
        o.endsWith("_mtm") ? i[o].push({
          _blitzID: typeof l == "string" ? l : l._blitzID,
          _mtmSort: typeof l == "string" ? i[o].length ? Math.max(...i[o].map((h) => h._mtmSort)) + 15 : 15 : l._mtmSort
        }) : i[o].push(l);
      } else if (Object.hasOwn(t.data[o], "remove") && Array.isArray(i[o])) {
        const l = t.data[o].remove;
        o.endsWith("_mtm") ? i[o].splice(i[o].findIndex((h) => h._blitzID === l), 1) : i[o].splice(i[o].findIndex((h) => h === l), 1);
      } else
        return new B(t.blitzID, t.hash, W.Error, `Invalid operation for array attribute ${o}.`);
    else {
      const l = t.data[o];
      if (i[o] === l.new)
        return new B(t.blitzID, t.hash, W.Notice, "Conflict");
      i[o] = l.new;
    }
    return await a.update(i), new B(t.blitzID, t.hash, W.Success);
  }
  /**
   * Processes the `delete` transaction.
   *
   * @param transaction Transaction to be processed.
   */
  async processDeleteTransaction(t) {
    const r = (await R.get(t.model)).idbClient();
    return await r.find(t.blitzID) ? (await r.delete(t.blitzID), new B(t.blitzID, t.hash, W.Success)) : new B(t.blitzID, t.hash, W.Error, `Object with ${t.blitzID} does not exists.`);
  }
}
class sr {
  //Constructor
  constructor(t) {
    //Properties
    m(this, "_db");
    this._db = t;
  }
  //Update job
  async _updateJob(t) {
    var e;
    return await ((e = this._db) == null ? void 0 : e.put(_.store, t)), t;
  }
  //Delete job
  async _deleteJob(t) {
    var e;
    await ((e = this._db) == null ? void 0 : e.delete(_.store, t.id));
  }
  //Get completed replicated jobs
  async _getCompletedReplicatedJobs(t) {
    var s;
    const e = [], r = (s = this._db) == null ? void 0 : s.transaction(_.store, "readonly").store;
    let a = await (r == null ? void 0 : r.openCursor(null, "next"));
    for (; a; )
      //Only completed jobs
      a.value.status === y.Completed && //Not the same destination
      a.value.url !== t.url && //Only edit jobs
      a.value.transaction.action === D.Edit && //Only same object jobs
      a.value.transaction.blitzID === t.transaction.blitzID && //Only same hash
      a.value.transaction.hash === t.transaction.hash && e.push(a.value), a = await a.continue();
    return e;
  }
  //Get future jobs
  async _getFutureJobs(t, e) {
    var o;
    const r = [], a = (o = this._db) == null ? void 0 : o.transaction(_.store, "readonly").store, s = IDBKeyRange.lowerBound(t.createdAt, !0);
    let i = await (a == null ? void 0 : a.index(_.timeIndex).openCursor(s, "next"));
    for (; i; )
      //Only conflict jobs
      i.value.status === y.Conflict && //Same destination
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
        const u = {
          [e]: {
            prev: t.transaction.data[e].prev,
            new: o.transaction.data[e].new
          }
        }, c = (/* @__PURE__ */ new Date()).getTime();
        a = await this._updateJob({
          ...t,
          transaction: {
            ...t.transaction,
            data: u,
            blitzstamp: rt(),
            hash: ot({ ...u, blitzID: t.transaction.blitzID, timestamp: c })
          },
          dataHistory: [...t.dataHistory ?? [], { timestamp: c, type: "conflict-succeeding", data: t.transaction.data }]
        });
        for (const l of r)
          await this._deleteJob(l);
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
    confirm(a) ? (r = await this.force(r), await p.queue.updateSyncStatus(r, y.Pending)) : (await this.revert(r), await p.queue.updateSyncStatus(r, y.Completed)), p.dispatchEvent("queue:conflict", r);
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
      status: y.Pending,
      transaction: {
        ...t.transaction,
        data: a,
        blitzstamp: rt(),
        hash: ot({ ...a, blitzID: t.transaction.blitzID, timestamp: s })
      },
      dataHistory: [...t.dataHistory ?? [], { timestamp: s, type: "conflict-force", data: t.transaction.data }]
    });
    await q.create().run([
      new $({
        action: "edit",
        model: i.transaction.model,
        blitzID: i.transaction.blitzID,
        data: i.transaction.data
      })
    ]);
    for (const u of r)
      await this._updateJob({
        ...u,
        status: y.Pending
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
    await q.create().run([r]);
    const a = await this._getFutureJobs(t, e), s = await this._getCompletedReplicatedJobs(t);
    for (const o of [t, ...a])
      await this._deleteJob(o);
    if (s.length > 0) {
      const o = s.map((u) => u.url).filter((u, c, l) => l.findIndex((d) => d === u) === c);
      for (const u of o)
        await p.queue.addJob(u, r.toObject());
    }
  }
}
class ir {
  //Constructor
  constructor(t) {
    //Properties
    m(this, "_db");
    this._db = t;
  }
  //Update job
  async _updateJob(t) {
    var e;
    return await ((e = this._db) == null ? void 0 : e.put(_.store, t)), t;
  }
  //Delete job
  async _deleteJob(t) {
    var e;
    await ((e = this._db) == null ? void 0 : e.delete(_.store, t.id));
  }
  //Get future jobs
  async _getFutureJobs(t) {
    var i;
    const e = [], r = (i = this._db) == null ? void 0 : i.transaction(_.store, "readonly").store, a = IDBKeyRange.lowerBound(t.createdAt, !0);
    let s = await (r == null ? void 0 : r.index(_.timeIndex).openCursor(a, "next"));
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
        status: y.Pending
      });
  }
  //Revert jobs
  async revert(t) {
    var r, a;
    t.sort((s, i) => s.createdAt - i.createdAt);
    const e = t[0];
    if (e) {
      if (e.transaction.action === D.Add) {
        await q.create().run([
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
        await q.create().run([i]);
        for (const o of t)
          await this._deleteJob(o);
      }
    }
  }
  //Get all failed/conflict jobs grouped by server URL
  async getAll() {
    var a;
    const t = {}, e = (a = this._db) == null ? void 0 : a.transaction(_.store, "readonly").store;
    let r = await (e == null ? void 0 : e.index(_.timeIndex).openCursor(null, "next"));
    for (; r; ) {
      if (
        //Only unresolved jobs
        r.value.status !== y.Completed
      ) {
        if (t[r.value.url] || (t[r.value.url] = []), r.value.transaction.action === D.Add || r.value.transaction.action === D.Delete)
          t[r.value.url].push([r.value]);
        else if (r.value.transaction.action === D.Edit) {
          const s = Object.keys(r.value.transaction.data ?? {})[0], i = r.value.transaction.blitzID, o = t[r.value.url].findIndex((u) => u[0].transaction.action === D.Edit && u[0].transaction.blitzID === i && Object.keys(u[0].transaction.data ?? {})[0] === s);
          o === -1 ? t[r.value.url].push([r.value]) : t[r.value.url][o].push(r.value);
        }
      }
      r = await r.continue();
    }
    return t;
  }
}
class or {
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
    e.status === y.Completed ? p.dispatchEvent("queue:success", e) : e.status === y.Failed ? p.dispatchEvent("queue:failure", e) : e.status === y.Conflict && (document.hidden || (r = p.queue.conflictHandler) == null || r.prompt(e)), p._Model.get(e.transaction.model).then((a) => {
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
        const u = (await p.queue.getJobsForObject(t.transaction.blitzID)).filter((f) => {
          var g;
          return f.transaction.action === D.Edit && ((g = f.transaction.data) == null ? void 0 : g[s]) !== void 0;
        });
        let c = y.Pending, l;
        const d = u.find((f) => f.status === y.Failed), h = u.find((f) => f.status === y.Conflict);
        d ? (c = y.Failed, l = d) : h ? (c = y.Conflict, l = h) : u.every((f) => f.status === y.Completed) && (c = y.Completed), i._syncSignal.set({ status: c, job: l });
      }
  }
  // Initialize queue client
  async init() {
    if (this._db = await it(_.name, 1, {
      upgrade: (e) => {
        const r = e.createObjectStore(_.store, { keyPath: "id" });
        r.createIndex(_.timeIndex, "createdAt"), r.createIndex(_.objectIndex, "transaction.blitzID");
      }
    }), !this._db.objectStoreNames.contains(_.store))
      return await $t(_.name), await this.init();
    this.conflictHandler = new sr(this._db), this.failedHandler = new ir(this._db);
    const t = new rr(
      p.options.queue.workerPath,
      { name: "bd-queue-worker" }
    );
    return t.onerror = () => {
      console.warn("⚠️ Failed to run the queue's shared worker, please check that the worker path is correct, falling back to running on the same thread!"), new _e(
        (e) => this._handleWorkerMessage(e),
        F._globalHeaders
      ).start();
    }, t.port.onmessage = this._handleWorkerMessage, window.addEventListener("beforeunload", () => t.port.postMessage({ type: "close" })), F._globalHeaders && t.port.postMessage({ type: "headers", data: F._globalHeaders }), this;
  }
  // Add job to queue worker
  async addJob(t, e) {
    var a;
    const r = {
      id: crypto.randomUUID(),
      url: t,
      transaction: e,
      status: y.Pending,
      createdAt: Date.now(),
      attempts: 0,
      priority: 1
    };
    await ((a = this._db) == null ? void 0 : a.add(_.store, r)), await this.updateSyncStatus(r, r.status);
  }
  // Delete job from queue worker
  async deleteJob(t) {
    var e;
    await ((e = this._db) == null ? void 0 : e.delete(_.store, t.id));
  }
  // Get all jobs
  async getJobs() {
    var t;
    return await ((t = this._db) == null ? void 0 : t.getAll(_.store));
  }
  // Get all jobs for an object
  async getJobsForObject(t) {
    var r;
    const e = await ((r = this._db) == null ? void 0 : r.getAllFromIndex(_.store, _.objectIndex, t));
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
class gt {
  constructor() {
    m(this, "children");
    m(this, "isEndOfWord");
    m(this, "items");
    this.children = {}, this.isEndOfWord = !1, this.items = [];
  }
}
class cr {
  /**
   * Constructor for the Trie.
   *
   * @param model The model to build the Trie for.
   * @param data The data to build the Trie from.
   */
  constructor(t, e) {
    m(this, "root");
    if (this.root = new gt(), !e)
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
      typeof t[r] == "string" || typeof t[r] == "boolean" || (e.children[r] || (e.children[r] = new gt()), t[r].hasOwnProperty("isEndOfWord") && t[r].isEndOfWord && (e.children[r].isEndOfWord = !0, e.children[r].items = t[r].items), this._loadFromJson(t[r], e.children[r]));
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
    return this.root = new gt(), this._loadFromJson(t, this.root), this;
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
        s[i].toString().toLowerCase().split(" ").forEach((u) => {
          u !== "" && (r[u] ? r[u].items.push(s._blitzID) : r[u] = {
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
      const u = a[i];
      for (const c of u)
        this.generateAllPermutations(
          t + c,
          e + 1,
          r,
          a,
          s
        );
    }
    if (o && ut[o]) {
      const u = a[o];
      for (const c of u)
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
      r.children[a] || (r.children[a] = new gt()), r = r.children[a];
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
function De(n, t, e) {
  var a;
  let r = !0;
  for (const s of t) {
    if (!r)
      return !1;
    const [i, o, u] = s, c = (a = e == null ? void 0 : e[i]) == null ? void 0 : a.type;
    let l = n[i], d = u;
    switch (typeof l == "string" && (c === "datetime" || c === "date" || i === "_publishingdate") && (l = new Date(l).getTime()), typeof d == "string" && (c === "datetime" || c === "date" || i === "_publishingdate") && (d = new Date(d).getTime()), o) {
      case "LIKE":
        const h = `${d}`.startsWith("%"), f = `${d}`.endsWith("%"), g = `${d}`.replaceAll("%", "");
        h === f ? r = `${l}`.includes(g) : h ? r = `${l}`.endsWith(g) : f && (r = `${l}`.startsWith(g));
        break;
      case "IN":
        r = (Array.isArray(d) ? d : [d]).includes(l);
        break;
      case "=":
        r = l === d;
        break;
      case "!=":
        r = l !== d;
        break;
      case ">":
        r = l > d;
        break;
      case "<":
        r = l < d;
        break;
      case ">=":
        r = l >= d;
        break;
      case "<=":
        r = l <= d;
        break;
      default:
        r = !0;
        break;
    }
  }
  return r;
}
class ur {
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
    const r = await this.connect(), a = r.transaction("objects", "readonly").store, s = Array.from(a.indexNames), i = t.customSort && s.includes(t.customSort) ? t.customSort : s.includes("_projectsort") && (t.conditions ?? []).find((f) => f[0] === "project_fk" && f[1] === "=") ? "_projectsort" : s.includes("_sort") ? "_sort" : "_blitzstamp", o = t.customSortDirection === "ASC" ? "next" : "prev", u = t.pagination !== void 0 ? o === "next" ? IDBKeyRange.lowerBound(t.pagination.toString(), !0) : IDBKeyRange.upperBound(t.pagination.toString(), !0) : null;
    let c = await a.index(i).openCursor(u, o);
    const l = this.model.getAttributesDetails() ?? void 0;
    let d = [];
    for (; c; ) {
      if (e && !e.includes(c.value.blitzID)) {
        c = await c.continue();
        continue;
      }
      if (De(c.value, t.conditions ?? [], l) && (d.push(c.value), t.limit && d.length >= t.limit))
        break;
      c = await c.continue();
    }
    if (r.close(), t.var && t.var.length > 0) {
      const f = ["_blitzID", "_localID", "@permissions", "_sort", "_clusters", "_editURLs", "_savetimestamp", ...t.var];
      for (const g of d)
        for (const v in g)
          f.includes(v) || delete g[v];
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
    const r = await this.connect(), a = new cr(this.model).loadFromJson(r.get("tree", this.model.getName()));
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
      s._savetimestamp = rt(), await r.put("objects", s);
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
    return await it(this.model.getName(), 1, {
      upgrade: (o, u, c, l, d) => {
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
class Yt {
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
    const e = new Yt();
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
    var s;
    const e = this.getAll();
    if (!e.has(t._blitzID.value))
      return e.set(t._blitzID.value, t), t;
    const r = e.get(t._blitzID.value), a = Object.keys(this.model.getAttributesDetails() ?? {});
    for (const i of a) {
      const o = (s = t[i]) == null ? void 0 : s._value;
      if (o !== void 0) {
        const u = r[i];
        u && (u._value = o, u._valueSignal.set(o, !1));
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
   * Returns raw objects for the current model filtered by the given conditions and parameters.
   *
   * @param query Query parameters including array of conditions to filter the objects.
   * @return Promise with array of filtered raw objects.
   */
  async query(t = {}) {
    var d, h;
    const e = [], r = Array.from(this.getAll().values()).map((f) => f.toObject()), a = this.model.getAttributesDetails() ?? void 0, s = Object.keys(a ?? {}), i = ["1", !0].includes((d = this.model._attributes.hassort) == null ? void 0 : d.value), o = i && ["1", !0].includes((h = this.model._attributes.hasprojects) == null ? void 0 : h.value), u = t.customSort && s.includes(t.customSort) ? t.customSort : o && (t.conditions ?? []).find((f) => f[0] === "project_fk" && f[1] === "=") ? "_projectsort" : i ? "_sort" : "_blitzstamp", c = t.customSortDirection ?? "DESC";
    r.sort((f, g) => {
      try {
        const v = parseInt(f[u]), M = parseInt(g[u]);
        if (v < M)
          return c === "ASC" ? -1 : 1;
        if (v > M)
          return c === "ASC" ? 1 : -1;
      } catch {
      }
      return 0;
    });
    for (const f of r) {
      if (t.pagination !== void 0)
        try {
          const g = parseInt(f[u]);
          if (typeof g != "number" || (c === "ASC" ? t.pagination >= g : t.pagination <= g))
            continue;
        } catch {
        }
      if (De(f, t.conditions ?? [], a) && (e.push(f), t.limit && e.length >= t.limit))
        break;
    }
    if (t.var && t.var.length > 0) {
      const f = ["_blitzID", "_localID", "@permissions", "_sort", "_clusters", "_editURLs", "_savetimestamp", ...t.var];
      for (const g of e)
        for (const v in g)
          f.includes(v) || delete g[v];
    }
    return e;
  }
};
/**
 * Channel subject for updates.
 */
m(xt, "channel", new Yt());
let _t = xt;
class ht {
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
class E {
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
    this._name = t, this._type = e, this._value = this.unserialize(r), this._valueSignal = new ht(this._value), this._syncSignal = new ht(null);
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
      const i = s.filter((d) => {
        var h;
        return d.transaction.action === D.Edit && ((h = d.transaction.data) == null ? void 0 : h[this._name]) !== void 0;
      });
      let o = y.Pending, u;
      const c = i.find((d) => d.status === y.Failed), l = i.find((d) => d.status === y.Conflict);
      c ? (o = y.Failed, u = c) : l ? (o = y.Conflict, u = l) : i.every((d) => d.status === y.Completed) && (o = y.Completed), this._syncSignal.set({ status: o, job: u }, !1), t(this._syncSignal.get());
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
class lt extends E {
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
class Me extends E {
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
const Se = 6048e5, lr = 864e5, wt = 43200, Zt = 1440, te = Symbol.for("constructDateFrom");
function K(n, t) {
  return typeof n == "function" ? n(t) : n && typeof n == "object" && te in n ? n[te](t) : n instanceof Date ? new n.constructor(t) : new Date(t);
}
function U(n, t) {
  return K(t || n, n);
}
let dr = {};
function mt() {
  return dr;
}
function ft(n, t) {
  var o, u, c, l;
  const e = mt(), r = (t == null ? void 0 : t.weekStartsOn) ?? ((u = (o = t == null ? void 0 : t.locale) == null ? void 0 : o.options) == null ? void 0 : u.weekStartsOn) ?? e.weekStartsOn ?? ((l = (c = e.locale) == null ? void 0 : c.options) == null ? void 0 : l.weekStartsOn) ?? 0, a = U(n, t == null ? void 0 : t.in), s = a.getDay(), i = (s < r ? 7 : 0) + s - r;
  return a.setDate(a.getDate() - i), a.setHours(0, 0, 0, 0), a;
}
function Dt(n, t) {
  return ft(n, { ...t, weekStartsOn: 1 });
}
function Ie(n, t) {
  const e = U(n, t == null ? void 0 : t.in), r = e.getFullYear(), a = K(e, 0);
  a.setFullYear(r + 1, 0, 4), a.setHours(0, 0, 0, 0);
  const s = Dt(a), i = K(e, 0);
  i.setFullYear(r, 0, 4), i.setHours(0, 0, 0, 0);
  const o = Dt(i);
  return e.getTime() >= s.getTime() ? r + 1 : e.getTime() >= o.getTime() ? r : r - 1;
}
function Mt(n) {
  const t = U(n), e = new Date(
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
  const e = K.bind(
    null,
    n || t.find((r) => typeof r == "object")
  );
  return t.map(e);
}
function ee(n, t) {
  const e = U(n, t == null ? void 0 : t.in);
  return e.setHours(0, 0, 0, 0), e;
}
function hr(n, t, e) {
  const [r, a] = zt(
    e == null ? void 0 : e.in,
    n,
    t
  ), s = ee(r), i = ee(a), o = +s - Mt(s), u = +i - Mt(i);
  return Math.round((o - u) / lr);
}
function fr(n, t) {
  const e = Ie(n, t), r = K((t == null ? void 0 : t.in) || n, 0);
  return r.setFullYear(e, 0, 4), r.setHours(0, 0, 0, 0), Dt(r);
}
function yt(n, t) {
  const e = +U(n) - +U(t);
  return e < 0 ? -1 : e > 0 ? 1 : e;
}
function mr(n) {
  return K(n, Date.now());
}
function gr(n) {
  return n instanceof Date || typeof n == "object" && Object.prototype.toString.call(n) === "[object Date]";
}
function wr(n) {
  return !(!gr(n) && typeof n != "number" || isNaN(+U(n)));
}
function br(n, t, e) {
  const [r, a] = zt(
    e == null ? void 0 : e.in,
    n,
    t
  ), s = r.getFullYear() - a.getFullYear(), i = r.getMonth() - a.getMonth();
  return s * 12 + i;
}
function yr(n) {
  return (t) => {
    const r = (n ? Math[n] : Math.trunc)(t);
    return r === 0 ? 0 : r;
  };
}
function pr(n, t) {
  return +U(n) - +U(t);
}
function vr(n, t) {
  const e = U(n, t == null ? void 0 : t.in);
  return e.setHours(23, 59, 59, 999), e;
}
function _r(n, t) {
  const e = U(n, t == null ? void 0 : t.in), r = e.getMonth();
  return e.setFullYear(e.getFullYear(), r + 1, 0), e.setHours(23, 59, 59, 999), e;
}
function Dr(n, t) {
  const e = U(n, t == null ? void 0 : t.in);
  return +vr(e, t) == +_r(e, t);
}
function Mr(n, t, e) {
  const [r, a, s] = zt(
    e == null ? void 0 : e.in,
    n,
    n,
    t
  ), i = yt(a, s), o = Math.abs(
    br(a, s)
  );
  if (o < 1)
    return 0;
  a.getMonth() === 1 && a.getDate() > 27 && a.setDate(30), a.setMonth(a.getMonth() - i * o);
  let u = yt(a, s) === -i;
  Dr(r) && o === 1 && yt(r, s) === 1 && (u = !1);
  const c = i * (o - +u);
  return c === 0 ? 0 : c;
}
function Sr(n, t, e) {
  const r = pr(n, t) / 1e3;
  return yr(e == null ? void 0 : e.roundingMethod)(r);
}
function Ir(n, t) {
  const e = U(n, t == null ? void 0 : t.in);
  return e.setFullYear(e.getFullYear(), 0, 1), e.setHours(0, 0, 0, 0), e;
}
const xr = {
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
}, Or = (n, t, e) => {
  let r;
  const a = xr[n];
  return typeof a == "string" ? r = a : t === 1 ? r = a.one : r = a.other.replace("{{count}}", t.toString()), e != null && e.addSuffix ? e.comparison && e.comparison > 0 ? "in " + r : r + " ago" : r;
};
function X(n) {
  return (t = {}) => {
    const e = t.width ? String(t.width) : n.defaultWidth;
    return n.formats[e] || n.formats[n.defaultWidth];
  };
}
const Pr = {
  full: "EEEE, MMMM do, y",
  long: "MMMM do, y",
  medium: "MMM d, y",
  short: "MM/dd/yyyy"
}, zr = {
  full: "h:mm:ss a zzzz",
  long: "h:mm:ss a z",
  medium: "h:mm:ss a",
  short: "h:mm a"
}, Ar = {
  full: "{{date}} 'at' {{time}}",
  long: "{{date}} 'at' {{time}}",
  medium: "{{date}}, {{time}}",
  short: "{{date}}, {{time}}"
}, Tr = {
  date: X({
    formats: Pr,
    defaultWidth: "full"
  }),
  time: X({
    formats: zr,
    defaultWidth: "full"
  }),
  dateTime: X({
    formats: Ar,
    defaultWidth: "full"
  })
}, Er = {
  lastWeek: "'last' eeee 'at' p",
  yesterday: "'yesterday at' p",
  today: "'today at' p",
  tomorrow: "'tomorrow at' p",
  nextWeek: "eeee 'at' p",
  other: "P"
}, kr = (n, t, e, r) => Er[n];
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
const Cr = {
  narrow: ["B", "A"],
  abbreviated: ["BC", "AD"],
  wide: ["Before Christ", "Anno Domini"]
}, Wr = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["Q1", "Q2", "Q3", "Q4"],
  wide: ["1st quarter", "2nd quarter", "3rd quarter", "4th quarter"]
}, Ur = {
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
}, jr = {
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
}, Fr = {
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
}, Jr = {
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
}, Lr = (n, t) => {
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
}, Nr = {
  ordinalNumber: Lr,
  era: J({
    values: Cr,
    defaultWidth: "wide"
  }),
  quarter: J({
    values: Wr,
    defaultWidth: "wide",
    argumentCallback: (n) => n - 1
  }),
  month: J({
    values: Ur,
    defaultWidth: "wide"
  }),
  day: J({
    values: jr,
    defaultWidth: "wide"
  }),
  dayPeriod: J({
    values: Fr,
    defaultWidth: "wide",
    formattingValues: Jr,
    defaultFormattingWidth: "wide"
  })
};
function L(n) {
  return (t, e = {}) => {
    const r = e.width, a = r && n.matchPatterns[r] || n.matchPatterns[n.defaultMatchWidth], s = t.match(a);
    if (!s)
      return null;
    const i = s[0], o = r && n.parsePatterns[r] || n.parsePatterns[n.defaultParseWidth], u = Array.isArray(o) ? $r(o, (d) => d.test(i)) : (
      // [TODO] -- I challenge you to fix the type
      Rr(o, (d) => d.test(i))
    );
    let c;
    c = n.valueCallback ? n.valueCallback(u) : u, c = e.valueCallback ? (
      // [TODO] -- I challenge you to fix the type
      e.valueCallback(c)
    ) : c;
    const l = t.slice(i.length);
    return { value: c, rest: l };
  };
}
function Rr(n, t) {
  for (const e in n)
    if (Object.prototype.hasOwnProperty.call(n, e) && t(n[e]))
      return e;
}
function $r(n, t) {
  for (let e = 0; e < n.length; e++)
    if (t(n[e]))
      return e;
}
function qt(n) {
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
const Hr = /^(\d+)(th|st|nd|rd)?/i, Br = /\d+/i, Yr = {
  narrow: /^(b|a)/i,
  abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
  wide: /^(before christ|before common era|anno domini|common era)/i
}, qr = {
  any: [/^b/i, /^(a|c)/i]
}, Vr = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](th|st|nd|rd)? quarter/i
}, Qr = {
  any: [/1/i, /2/i, /3/i, /4/i]
}, Xr = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
  wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i
}, Kr = {
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
}, Gr = {
  narrow: /^[smtwf]/i,
  short: /^(su|mo|tu|we|th|fr|sa)/i,
  abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
  wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
}, Zr = {
  narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
  any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
}, tn = {
  narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
  any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
}, en = {
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
}, rn = {
  ordinalNumber: qt({
    matchPattern: Hr,
    parsePattern: Br,
    valueCallback: (n) => parseInt(n, 10)
  }),
  era: L({
    matchPatterns: Yr,
    defaultMatchWidth: "wide",
    parsePatterns: qr,
    defaultParseWidth: "any"
  }),
  quarter: L({
    matchPatterns: Vr,
    defaultMatchWidth: "wide",
    parsePatterns: Qr,
    defaultParseWidth: "any",
    valueCallback: (n) => n + 1
  }),
  month: L({
    matchPatterns: Xr,
    defaultMatchWidth: "wide",
    parsePatterns: Kr,
    defaultParseWidth: "any"
  }),
  day: L({
    matchPatterns: Gr,
    defaultMatchWidth: "wide",
    parsePatterns: Zr,
    defaultParseWidth: "any"
  }),
  dayPeriod: L({
    matchPatterns: tn,
    defaultMatchWidth: "any",
    parsePatterns: en,
    defaultParseWidth: "any"
  })
}, ct = {
  code: "en-US",
  formatDistance: Or,
  formatLong: Tr,
  formatRelative: kr,
  localize: Nr,
  match: rn,
  options: {
    weekStartsOn: 0,
    firstWeekContainsDate: 1
  }
};
function nn(n, t) {
  const e = U(n, t == null ? void 0 : t.in);
  return hr(e, Ir(e)) + 1;
}
function an(n, t) {
  const e = U(n, t == null ? void 0 : t.in), r = +Dt(e) - +fr(e);
  return Math.round(r / Se) + 1;
}
function xe(n, t) {
  var l, d, h, f;
  const e = U(n, t == null ? void 0 : t.in), r = e.getFullYear(), a = mt(), s = (t == null ? void 0 : t.firstWeekContainsDate) ?? ((d = (l = t == null ? void 0 : t.locale) == null ? void 0 : l.options) == null ? void 0 : d.firstWeekContainsDate) ?? a.firstWeekContainsDate ?? ((f = (h = a.locale) == null ? void 0 : h.options) == null ? void 0 : f.firstWeekContainsDate) ?? 1, i = K((t == null ? void 0 : t.in) || n, 0);
  i.setFullYear(r + 1, 0, s), i.setHours(0, 0, 0, 0);
  const o = ft(i, t), u = K((t == null ? void 0 : t.in) || n, 0);
  u.setFullYear(r, 0, s), u.setHours(0, 0, 0, 0);
  const c = ft(u, t);
  return +e >= +o ? r + 1 : +e >= +c ? r : r - 1;
}
function sn(n, t) {
  var o, u, c, l;
  const e = mt(), r = (t == null ? void 0 : t.firstWeekContainsDate) ?? ((u = (o = t == null ? void 0 : t.locale) == null ? void 0 : o.options) == null ? void 0 : u.firstWeekContainsDate) ?? e.firstWeekContainsDate ?? ((l = (c = e.locale) == null ? void 0 : c.options) == null ? void 0 : l.firstWeekContainsDate) ?? 1, a = xe(n, t), s = K((t == null ? void 0 : t.in) || n, 0);
  return s.setFullYear(a, 0, r), s.setHours(0, 0, 0, 0), ft(s, t);
}
function on(n, t) {
  const e = U(n, t == null ? void 0 : t.in), r = +ft(e, t) - +sn(e, t);
  return Math.round(r / Se) + 1;
}
function x(n, t) {
  const e = n < 0 ? "-" : "", r = Math.abs(n).toString().padStart(t, "0");
  return e + r;
}
const G = {
  // Year
  y(n, t) {
    const e = n.getFullYear(), r = e > 0 ? e : 1 - e;
    return x(t === "yy" ? r % 100 : r, t.length);
  },
  // Month
  M(n, t) {
    const e = n.getMonth();
    return t === "M" ? String(e + 1) : x(e + 1, 2);
  },
  // Day of the month
  d(n, t) {
    return x(n.getDate(), t.length);
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
    return x(n.getHours() % 12 || 12, t.length);
  },
  // Hour [0-23]
  H(n, t) {
    return x(n.getHours(), t.length);
  },
  // Minute
  m(n, t) {
    return x(n.getMinutes(), t.length);
  },
  // Second
  s(n, t) {
    return x(n.getSeconds(), t.length);
  },
  // Fraction of second
  S(n, t) {
    const e = t.length, r = n.getMilliseconds(), a = Math.trunc(
      r * Math.pow(10, e - 3)
    );
    return x(a, t.length);
  }
}, nt = {
  am: "am",
  pm: "pm",
  midnight: "midnight",
  noon: "noon",
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
  night: "night"
}, re = {
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
    return G.y(n, t);
  },
  // Local week-numbering year
  Y: function(n, t, e, r) {
    const a = xe(n, r), s = a > 0 ? a : 1 - a;
    if (t === "YY") {
      const i = s % 100;
      return x(i, 2);
    }
    return t === "Yo" ? e.ordinalNumber(s, { unit: "year" }) : x(s, t.length);
  },
  // ISO week-numbering year
  R: function(n, t) {
    const e = Ie(n);
    return x(e, t.length);
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
    return x(e, t.length);
  },
  // Quarter
  Q: function(n, t, e) {
    const r = Math.ceil((n.getMonth() + 1) / 3);
    switch (t) {
      case "Q":
        return String(r);
      case "QQ":
        return x(r, 2);
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
        return x(r, 2);
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
        return G.M(n, t);
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
        return x(r + 1, 2);
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
    const a = on(n, r);
    return t === "wo" ? e.ordinalNumber(a, { unit: "week" }) : x(a, t.length);
  },
  // ISO week of year
  I: function(n, t, e) {
    const r = an(n);
    return t === "Io" ? e.ordinalNumber(r, { unit: "week" }) : x(r, t.length);
  },
  // Day of the month
  d: function(n, t, e) {
    return t === "do" ? e.ordinalNumber(n.getDate(), { unit: "date" }) : G.d(n, t);
  },
  // Day of year
  D: function(n, t, e) {
    const r = nn(n);
    return t === "Do" ? e.ordinalNumber(r, { unit: "dayOfYear" }) : x(r, t.length);
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
        return x(s, 2);
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
        return x(s, t.length);
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
        return x(a, t.length);
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
    switch (r === 12 ? a = nt.noon : r === 0 ? a = nt.midnight : a = r / 12 >= 1 ? "pm" : "am", t) {
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
    switch (r >= 17 ? a = nt.evening : r >= 12 ? a = nt.afternoon : r >= 4 ? a = nt.morning : a = nt.night, t) {
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
    return G.h(n, t);
  },
  // Hour [0-23]
  H: function(n, t, e) {
    return t === "Ho" ? e.ordinalNumber(n.getHours(), { unit: "hour" }) : G.H(n, t);
  },
  // Hour [0-11]
  K: function(n, t, e) {
    const r = n.getHours() % 12;
    return t === "Ko" ? e.ordinalNumber(r, { unit: "hour" }) : x(r, t.length);
  },
  // Hour [1-24]
  k: function(n, t, e) {
    let r = n.getHours();
    return r === 0 && (r = 24), t === "ko" ? e.ordinalNumber(r, { unit: "hour" }) : x(r, t.length);
  },
  // Minute
  m: function(n, t, e) {
    return t === "mo" ? e.ordinalNumber(n.getMinutes(), { unit: "minute" }) : G.m(n, t);
  },
  // Second
  s: function(n, t, e) {
    return t === "so" ? e.ordinalNumber(n.getSeconds(), { unit: "second" }) : G.s(n, t);
  },
  // Fraction of second
  S: function(n, t) {
    return G.S(n, t);
  },
  // Timezone (ISO-8601. If offset is 0, output is always `'Z'`)
  X: function(n, t, e) {
    const r = n.getTimezoneOffset();
    if (r === 0)
      return "Z";
    switch (t) {
      case "X":
        return ae(r);
      case "XXXX":
      case "XX":
        return Z(r);
      case "XXXXX":
      case "XXX":
      default:
        return Z(r, ":");
    }
  },
  // Timezone (ISO-8601. If offset is 0, output is `'+00:00'` or equivalent)
  x: function(n, t, e) {
    const r = n.getTimezoneOffset();
    switch (t) {
      case "x":
        return ae(r);
      case "xxxx":
      case "xx":
        return Z(r);
      case "xxxxx":
      case "xxx":
      default:
        return Z(r, ":");
    }
  },
  // Timezone (GMT)
  O: function(n, t, e) {
    const r = n.getTimezoneOffset();
    switch (t) {
      case "O":
      case "OO":
      case "OOO":
        return "GMT" + ne(r, ":");
      case "OOOO":
      default:
        return "GMT" + Z(r, ":");
    }
  },
  // Timezone (specific non-location)
  z: function(n, t, e) {
    const r = n.getTimezoneOffset();
    switch (t) {
      case "z":
      case "zz":
      case "zzz":
        return "GMT" + ne(r, ":");
      case "zzzz":
      default:
        return "GMT" + Z(r, ":");
    }
  },
  // Seconds timestamp
  t: function(n, t, e) {
    const r = Math.trunc(+n / 1e3);
    return x(r, t.length);
  },
  // Milliseconds timestamp
  T: function(n, t, e) {
    return x(+n, t.length);
  }
};
function ne(n, t = "") {
  const e = n > 0 ? "-" : "+", r = Math.abs(n), a = Math.trunc(r / 60), s = r % 60;
  return s === 0 ? e + String(a) : e + String(a) + t + x(s, 2);
}
function ae(n, t) {
  return n % 60 === 0 ? (n > 0 ? "-" : "+") + x(Math.abs(n) / 60, 2) : Z(n, t);
}
function Z(n, t = "") {
  const e = n > 0 ? "-" : "+", r = Math.abs(n), a = x(Math.trunc(r / 60), 2), s = x(r % 60, 2);
  return e + a + t + s;
}
const se = (n, t) => {
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
}, Oe = (n, t) => {
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
}, cn = (n, t) => {
  const e = n.match(/(P+)(p+)?/) || [], r = e[1], a = e[2];
  if (!a)
    return se(n, t);
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
  return s.replace("{{date}}", se(r, t)).replace("{{time}}", Oe(a, t));
}, un = {
  p: Oe,
  P: cn
}, ln = /^D+$/, dn = /^Y+$/, hn = ["D", "DD", "YY", "YYYY"];
function fn(n) {
  return ln.test(n);
}
function mn(n) {
  return dn.test(n);
}
function gn(n, t, e) {
  const r = wn(n, t, e);
  if (console.warn(r), hn.includes(n))
    throw new RangeError(r);
}
function wn(n, t, e) {
  const r = n[0] === "Y" ? "years" : "days of the month";
  return `Use \`${n.toLowerCase()}\` instead of \`${n}\` (in \`${t}\`) for formatting ${r} to the input \`${e}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`;
}
const bn = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g, yn = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g, pn = /^'([^]*?)'?$/, vn = /''/g, _n = /[a-zA-Z]/;
function Pe(n, t, e) {
  var l, d, h, f, g, v, M, P;
  const r = mt(), a = (e == null ? void 0 : e.locale) ?? r.locale ?? ct, s = (e == null ? void 0 : e.firstWeekContainsDate) ?? ((d = (l = e == null ? void 0 : e.locale) == null ? void 0 : l.options) == null ? void 0 : d.firstWeekContainsDate) ?? r.firstWeekContainsDate ?? ((f = (h = r.locale) == null ? void 0 : h.options) == null ? void 0 : f.firstWeekContainsDate) ?? 1, i = (e == null ? void 0 : e.weekStartsOn) ?? ((v = (g = e == null ? void 0 : e.locale) == null ? void 0 : g.options) == null ? void 0 : v.weekStartsOn) ?? r.weekStartsOn ?? ((P = (M = r.locale) == null ? void 0 : M.options) == null ? void 0 : P.weekStartsOn) ?? 0, o = U(n, e == null ? void 0 : e.in);
  if (!wr(o))
    throw new RangeError("Invalid time value");
  let u = t.match(yn).map((k) => {
    const A = k[0];
    if (A === "p" || A === "P") {
      const V = un[A];
      return V(k, a.formatLong);
    }
    return k;
  }).join("").match(bn).map((k) => {
    if (k === "''")
      return { isToken: !1, value: "'" };
    const A = k[0];
    if (A === "'")
      return { isToken: !1, value: Dn(k) };
    if (re[A])
      return { isToken: !0, value: k };
    if (A.match(_n))
      throw new RangeError(
        "Format string contains an unescaped latin alphabet character `" + A + "`"
      );
    return { isToken: !1, value: k };
  });
  a.localize.preprocessor && (u = a.localize.preprocessor(o, u));
  const c = {
    firstWeekContainsDate: s,
    weekStartsOn: i,
    locale: a
  };
  return u.map((k) => {
    if (!k.isToken)
      return k.value;
    const A = k.value;
    (!(e != null && e.useAdditionalWeekYearTokens) && mn(A) || !(e != null && e.useAdditionalDayOfYearTokens) && fn(A)) && gn(A, t, String(n));
    const V = re[A[0]];
    return V(o, A, a.localize, c);
  }).join("");
}
function Dn(n) {
  const t = n.match(pn);
  return t ? t[1].replace(vn, "'") : n;
}
function Mn(n, t, e) {
  const r = mt(), a = (e == null ? void 0 : e.locale) ?? r.locale ?? ct, s = 2520, i = yt(n, t);
  if (isNaN(i))
    throw new RangeError("Invalid time value");
  const o = Object.assign({}, e, {
    addSuffix: e == null ? void 0 : e.addSuffix,
    comparison: i
  }), [u, c] = zt(
    e == null ? void 0 : e.in,
    ...i > 0 ? [t, n] : [n, t]
  ), l = Sr(c, u), d = (Mt(c) - Mt(u)) / 1e3, h = Math.round((l - d) / 60);
  let f;
  if (h < 2)
    return e != null && e.includeSeconds ? l < 5 ? a.formatDistance("lessThanXSeconds", 5, o) : l < 10 ? a.formatDistance("lessThanXSeconds", 10, o) : l < 20 ? a.formatDistance("lessThanXSeconds", 20, o) : l < 40 ? a.formatDistance("halfAMinute", 0, o) : l < 60 ? a.formatDistance("lessThanXMinutes", 1, o) : a.formatDistance("xMinutes", 1, o) : h === 0 ? a.formatDistance("lessThanXMinutes", 1, o) : a.formatDistance("xMinutes", h, o);
  if (h < 45)
    return a.formatDistance("xMinutes", h, o);
  if (h < 90)
    return a.formatDistance("aboutXHours", 1, o);
  if (h < Zt) {
    const g = Math.round(h / 60);
    return a.formatDistance("aboutXHours", g, o);
  } else {
    if (h < s)
      return a.formatDistance("xDays", 1, o);
    if (h < wt) {
      const g = Math.round(h / Zt);
      return a.formatDistance("xDays", g, o);
    } else if (h < wt * 2)
      return f = Math.round(h / wt), a.formatDistance("aboutXMonths", f, o);
  }
  if (f = Mr(c, u), f < 12) {
    const g = Math.round(h / wt);
    return a.formatDistance("xMonths", g, o);
  } else {
    const g = f % 12, v = Math.trunc(f / 12);
    return g < 3 ? a.formatDistance("aboutXYears", v, o) : g < 9 ? a.formatDistance("overXYears", v, o) : a.formatDistance("almostXYears", v + 1, o);
  }
}
function ze(n, t) {
  return Mn(n, mr(n), t);
}
const ie = {
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
}, Sn = (n, t, e) => {
  let r;
  const a = e != null && e.addSuffix ? ie[n].withPreposition : ie[n].standalone;
  return typeof a == "string" ? r = a : t === 1 ? r = a.one : r = a.other.replace("{{count}}", String(t)), e != null && e.addSuffix ? e.comparison && e.comparison > 0 ? "in " + r : "vor " + r : r;
}, In = {
  full: "EEEE, do MMMM y",
  // Montag, 7. Januar 2018
  long: "do MMMM y",
  // 7. Januar 2018
  medium: "do MMM y",
  // 7. Jan. 2018
  short: "dd.MM.y"
  // 07.01.2018
}, xn = {
  full: "HH:mm:ss zzzz",
  long: "HH:mm:ss z",
  medium: "HH:mm:ss",
  short: "HH:mm"
}, On = {
  full: "{{date}} 'um' {{time}}",
  long: "{{date}} 'um' {{time}}",
  medium: "{{date}} {{time}}",
  short: "{{date}} {{time}}"
}, Pn = {
  date: X({
    formats: In,
    defaultWidth: "full"
  }),
  time: X({
    formats: xn,
    defaultWidth: "full"
  }),
  dateTime: X({
    formats: On,
    defaultWidth: "full"
  })
}, zn = {
  lastWeek: "'letzten' eeee 'um' p",
  yesterday: "'gestern um' p",
  today: "'heute um' p",
  tomorrow: "'morgen um' p",
  nextWeek: "eeee 'um' p",
  other: "P"
}, An = (n, t, e, r) => zn[n], Tn = {
  narrow: ["v.Chr.", "n.Chr."],
  abbreviated: ["v.Chr.", "n.Chr."],
  wide: ["vor Christus", "nach Christus"]
}, En = {
  narrow: ["1", "2", "3", "4"],
  abbreviated: ["Q1", "Q2", "Q3", "Q4"],
  wide: ["1. Quartal", "2. Quartal", "3. Quartal", "4. Quartal"]
}, Ft = {
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
}, kn = {
  narrow: Ft.narrow,
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
  wide: Ft.wide
}, Cn = {
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
}, Wn = {
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
}, Un = {
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
}, jn = (n) => Number(n) + ".", Fn = {
  ordinalNumber: jn,
  era: J({
    values: Tn,
    defaultWidth: "wide"
  }),
  quarter: J({
    values: En,
    defaultWidth: "wide",
    argumentCallback: (n) => n - 1
  }),
  month: J({
    values: Ft,
    formattingValues: kn,
    defaultWidth: "wide"
  }),
  day: J({
    values: Cn,
    defaultWidth: "wide"
  }),
  dayPeriod: J({
    values: Wn,
    defaultWidth: "wide",
    formattingValues: Un,
    defaultFormattingWidth: "wide"
  })
}, Jn = /^(\d+)(\.)?/i, Ln = /\d+/i, Nn = {
  narrow: /^(v\.? ?Chr\.?|n\.? ?Chr\.?)/i,
  abbreviated: /^(v\.? ?Chr\.?|n\.? ?Chr\.?)/i,
  wide: /^(vor Christus|vor unserer Zeitrechnung|nach Christus|unserer Zeitrechnung)/i
}, Rn = {
  any: [/^v/i, /^n/i]
}, $n = {
  narrow: /^[1234]/i,
  abbreviated: /^q[1234]/i,
  wide: /^[1234](\.)? Quartal/i
}, Hn = {
  any: [/1/i, /2/i, /3/i, /4/i]
}, Bn = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(j[aä]n|feb|mär[z]?|apr|mai|jun[i]?|jul[i]?|aug|sep|okt|nov|dez)\.?/i,
  wide: /^(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)/i
}, Yn = {
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
}, qn = {
  narrow: /^[smdmf]/i,
  short: /^(so|mo|di|mi|do|fr|sa)/i,
  abbreviated: /^(son?|mon?|die?|mit?|don?|fre?|sam?)\.?/i,
  wide: /^(sonntag|montag|dienstag|mittwoch|donnerstag|freitag|samstag)/i
}, Vn = {
  any: [/^so/i, /^mo/i, /^di/i, /^mi/i, /^do/i, /^f/i, /^sa/i]
}, Qn = {
  narrow: /^(vm\.?|nm\.?|Mitternacht|Mittag|morgens|nachm\.?|abends|nachts)/i,
  abbreviated: /^(vorm\.?|nachm\.?|Mitternacht|Mittag|morgens|nachm\.?|abends|nachts)/i,
  wide: /^(vormittags|nachmittags|Mitternacht|Mittag|morgens|nachmittags|abends|nachts)/i
}, Xn = {
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
}, Kn = {
  ordinalNumber: qt({
    matchPattern: Jn,
    parsePattern: Ln,
    valueCallback: (n) => parseInt(n)
  }),
  era: L({
    matchPatterns: Nn,
    defaultMatchWidth: "wide",
    parsePatterns: Rn,
    defaultParseWidth: "any"
  }),
  quarter: L({
    matchPatterns: $n,
    defaultMatchWidth: "wide",
    parsePatterns: Hn,
    defaultParseWidth: "any",
    valueCallback: (n) => n + 1
  }),
  month: L({
    matchPatterns: Bn,
    defaultMatchWidth: "wide",
    parsePatterns: Yn,
    defaultParseWidth: "any"
  }),
  day: L({
    matchPatterns: qn,
    defaultMatchWidth: "wide",
    parsePatterns: Vn,
    defaultParseWidth: "any"
  }),
  dayPeriod: L({
    matchPatterns: Qn,
    defaultMatchWidth: "wide",
    parsePatterns: Xn,
    defaultParseWidth: "any"
  })
}, St = {
  code: "de",
  formatDistance: Sn,
  formatLong: Pn,
  formatRelative: An,
  localize: Fn,
  match: Kn,
  options: {
    weekStartsOn: 1,
    firstWeekContainsDate: 4
  }
}, Gn = {
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
}, Zn = (n, t, e) => {
  let r;
  const a = Gn[n];
  return typeof a == "string" ? r = a : t === 1 ? r = a.one : r = a.other.replace("{{count}}", String(t)), e != null && e.addSuffix ? e.comparison && e.comparison > 0 ? "dans " + r : "il y a " + r : r;
}, ta = {
  full: "EEEE d MMMM y",
  long: "d MMMM y",
  medium: "d MMM y",
  short: "dd/MM/y"
}, ea = {
  full: "HH:mm:ss zzzz",
  long: "HH:mm:ss z",
  medium: "HH:mm:ss",
  short: "HH:mm"
}, ra = {
  full: "{{date}} 'à' {{time}}",
  long: "{{date}} 'à' {{time}}",
  medium: "{{date}}, {{time}}",
  short: "{{date}}, {{time}}"
}, na = {
  date: X({
    formats: ta,
    defaultWidth: "full"
  }),
  time: X({
    formats: ea,
    defaultWidth: "full"
  }),
  dateTime: X({
    formats: ra,
    defaultWidth: "full"
  })
}, aa = {
  lastWeek: "eeee 'dernier à' p",
  yesterday: "'hier à' p",
  today: "'aujourd’hui à' p",
  tomorrow: "'demain à' p'",
  nextWeek: "eeee 'prochain à' p",
  other: "P"
}, sa = (n, t, e, r) => aa[n], ia = {
  narrow: ["av. J.-C", "ap. J.-C"],
  abbreviated: ["av. J.-C", "ap. J.-C"],
  wide: ["avant Jésus-Christ", "après Jésus-Christ"]
}, oa = {
  narrow: ["T1", "T2", "T3", "T4"],
  abbreviated: ["1er trim.", "2ème trim.", "3ème trim.", "4ème trim."],
  wide: ["1er trimestre", "2ème trimestre", "3ème trimestre", "4ème trimestre"]
}, ca = {
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
}, ua = {
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
}, la = {
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
}, da = (n, t) => {
  const e = Number(n), r = t == null ? void 0 : t.unit;
  if (e === 0)
    return "0";
  const a = ["year", "week", "hour", "minute", "second"];
  let s;
  return e === 1 ? s = r && a.includes(r) ? "ère" : "er" : s = "ème", e + s;
}, ha = ["MMM", "MMMM"], fa = {
  preprocessor: (n, t) => n.getDate() === 1 || !t.some(
    (r) => r.isToken && ha.includes(r.value)
  ) ? t : t.map(
    (r) => r.isToken && r.value === "do" ? { isToken: !0, value: "d" } : r
  ),
  ordinalNumber: da,
  era: J({
    values: ia,
    defaultWidth: "wide"
  }),
  quarter: J({
    values: oa,
    defaultWidth: "wide",
    argumentCallback: (n) => n - 1
  }),
  month: J({
    values: ca,
    defaultWidth: "wide"
  }),
  day: J({
    values: ua,
    defaultWidth: "wide"
  }),
  dayPeriod: J({
    values: la,
    defaultWidth: "wide"
  })
}, ma = /^(\d+)(ième|ère|ème|er|e)?/i, ga = /\d+/i, wa = {
  narrow: /^(av\.J\.C|ap\.J\.C|ap\.J\.-C)/i,
  abbreviated: /^(av\.J\.-C|av\.J-C|apr\.J\.-C|apr\.J-C|ap\.J-C)/i,
  wide: /^(avant Jésus-Christ|après Jésus-Christ)/i
}, ba = {
  any: [/^av/i, /^ap/i]
}, ya = {
  narrow: /^T?[1234]/i,
  abbreviated: /^[1234](er|ème|e)? trim\.?/i,
  wide: /^[1234](er|ème|e)? trimestre/i
}, pa = {
  any: [/1/i, /2/i, /3/i, /4/i]
}, va = {
  narrow: /^[jfmasond]/i,
  abbreviated: /^(janv|févr|mars|avr|mai|juin|juill|juil|août|sept|oct|nov|déc)\.?/i,
  wide: /^(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i
}, _a = {
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
}, Da = {
  narrow: /^[lmjvsd]/i,
  short: /^(di|lu|ma|me|je|ve|sa)/i,
  abbreviated: /^(dim|lun|mar|mer|jeu|ven|sam)\.?/i,
  wide: /^(dimanche|lundi|mardi|mercredi|jeudi|vendredi|samedi)/i
}, Ma = {
  narrow: [/^d/i, /^l/i, /^m/i, /^m/i, /^j/i, /^v/i, /^s/i],
  any: [/^di/i, /^lu/i, /^ma/i, /^me/i, /^je/i, /^ve/i, /^sa/i]
}, Sa = {
  narrow: /^(a|p|minuit|midi|mat\.?|ap\.?m\.?|soir|nuit)/i,
  any: /^([ap]\.?\s?m\.?|du matin|de l'après[-\s]midi|du soir|de la nuit)/i
}, Ia = {
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
}, xa = {
  ordinalNumber: qt({
    matchPattern: ma,
    parsePattern: ga,
    valueCallback: (n) => parseInt(n)
  }),
  era: L({
    matchPatterns: wa,
    defaultMatchWidth: "wide",
    parsePatterns: ba,
    defaultParseWidth: "any"
  }),
  quarter: L({
    matchPatterns: ya,
    defaultMatchWidth: "wide",
    parsePatterns: pa,
    defaultParseWidth: "any",
    valueCallback: (n) => n + 1
  }),
  month: L({
    matchPatterns: va,
    defaultMatchWidth: "wide",
    parsePatterns: _a,
    defaultParseWidth: "any"
  }),
  day: L({
    matchPatterns: Da,
    defaultMatchWidth: "wide",
    parsePatterns: Ma,
    defaultParseWidth: "any"
  }),
  dayPeriod: L({
    matchPatterns: Sa,
    defaultMatchWidth: "any",
    parsePatterns: Ia,
    defaultParseWidth: "any"
  })
}, It = {
  code: "fr",
  formatDistance: Zn,
  formatLong: na,
  formatRelative: sa,
  localize: fa,
  match: xa,
  options: {
    weekStartsOn: 1,
    firstWeekContainsDate: 4
  }
}, Oa = /^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$/;
class Pa extends E {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (t === "0000-00-00")
      return null;
    const e = t instanceof Date ? this.toDateString(t) : t;
    if (e != null && Oa.test(e))
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
    const r = t === "fr" ? It : t === "de" ? St : ct;
    let a = t === "de" ? "dd. MMMM yyyy" : "dd MMMM yyyy";
    return e && (a = "EEEE, " + a), Pe(
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
    const e = t === "fr" ? It : t === "de" ? St : ct;
    return ze(
      new Date(this._value),
      {
        addSuffix: !0,
        locale: e
      }
    );
  }
}
class Ae extends E {
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
class za extends E {
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
class Te extends E {
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
class Aa extends Ae {
  // ...
}
const Ta = /^[0-9]{4}\-[0-9]{2}\-[0-9]{2}\s[0-9]{2}\:[0-9]{2}\:[0-9]{2}$/;
class Ea extends E {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (t === "0000-00-00 00:00:00")
      return null;
    const e = t instanceof Date ? this.toDateString(t) : t;
    if (e != null && Ta.test(e))
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
    const r = t === "fr" ? It : t === "de" ? St : ct;
    let a = t === "de" ? "dd. MMMM yyyy" : "dd MMMM yyyy";
    return e && (a = "EEEE, " + a), Pe(
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
    const e = t === "fr" ? It : t === "de" ? St : ct;
    return ze(
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
class ka extends E {
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
class Ca extends E {
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
class Ee {
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
    this._name = t, this._type = e, this._value = this.unserialize(r), this._valueSignal = new ht(this._value), this._syncSignal = new ht(null);
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
    var s, i, o, u, c, l, d, h, f, g, v, M;
    const e = new $({
      action: "edit",
      data: {
        [this._name]: {
          [t.action]: t.value
        }
      },
      model: (i = (s = this._object) == null ? void 0 : s.model) == null ? void 0 : i.getName(),
      blitzID: (o = this._object) == null ? void 0 : o._blitzID.value
    }), r = await q.create().run([e]);
    if (r[0].status !== W.Success && r[0].status !== W.Notice)
      throw new Error(r[0].message ?? "Unknown Error! Please try again.");
    for (const P of ((c = (u = this._object) == null ? void 0 : u._editURLs) == null ? void 0 : c.value) ?? [])
      await p.queue.addJob(P, e.toObject());
    const a = await ((d = (l = this._object) == null ? void 0 : l.model) == null ? void 0 : d.get({ blitzID: this._object._blitzID.value, forceLocal: !0, raw: !0 }));
    a && Array.isArray(a[this._name]) && (this.value = a[this._name]), (f = (h = this._object) == null ? void 0 : h.model) == null || f.memoryClient().emit(e), (g = this._object) == null || g.dispatchEvent("edit", e.data), (M = (v = this._object) == null ? void 0 : v.model) == null || M.setLastTransactionHash(e.hash);
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
      const i = s.filter((d) => {
        var h;
        return d.transaction.action === D.Edit && ((h = d.transaction.data) == null ? void 0 : h[this._name]) !== void 0;
      });
      let o = y.Pending, u;
      const c = i.find((d) => d.status === y.Failed), l = i.find((d) => d.status === y.Conflict);
      c ? (o = y.Failed, u = c) : l ? (o = y.Conflict, u = l) : i.every((d) => d.status === y.Completed) && (o = y.Completed), this._syncSignal.set({ status: o, job: u }, !1), t(this._syncSignal.get());
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
class Wa extends Ee {
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
      const u = await (r == null ? void 0 : r.get({ skipCacheUpdateIfFound: !0, ...t, raw: !1, blitzID: i._blitzID }));
      u && s.push(u);
    }
    return s;
  }
}
function Ua(n) {
  return n && n.constructor && typeof n.constructor.isBuffer == "function" && n.constructor.isBuffer(n);
}
function ja(n) {
  return n;
}
function Fa(n, t) {
  t = t || {};
  const e = t.delimiter || ".", r = t.maxDepth, a = t.transformKey || ja, s = {};
  function i(o, u, c) {
    c = c || 1, Object.keys(o).forEach(function(l) {
      const d = o[l], h = t.safe && Array.isArray(d), f = Object.prototype.toString.call(d), g = Ua(d), v = f === "[object Object]" || f === "[object Array]", M = u ? u + e + a(l) : a(l);
      if (!h && !g && v && Object.keys(d).length && (!t.maxDepth || c < r))
        return i(d, M, c + 1);
      s[M] = d;
    });
  }
  return i(n), s;
}
class Ja extends E {
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
    return Fa(this._value ?? {});
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
class La extends E {
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
class Na extends E {
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
class Vt extends E {
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
class Ra extends Te {
  // ...
}
class $a extends Vt {
  // ...
}
class Ha extends Vt {
  /**
   * Returns the precentage value.
   */
  toPercentage() {
    return this._value != null ? (this._value * 100).toString() + "%" : null;
  }
}
const oe = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
class Ba extends E {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (t != null && oe.test(t))
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
    return oe.test(t);
  }
}
const ce = /^\+[1-9]{1,3}\-[0-9]{7,14}$/;
class Ya extends E {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (t != null && ce.test(t))
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
    return ce.test(t);
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
const ue = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;
class qa extends E {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (t != null && ue.test(t))
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
    return ue.test(t);
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
class Va extends E {
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
class Qa extends E {
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
class Xa extends E {
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
class Ka extends E {
  /**
   * Returns the unserialized value of given value.
   *
   * @param value Value to be casted.
   */
  unserialize(t) {
    if (t !== null && typeof t == "object" && t.lat && t.long)
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
    if (!e.lat || !e.long)
      return !1;
    const r = parseFloat(e.lat);
    if (isNaN(r) || r < -90 || r > 90)
      return !1;
    const a = parseFloat(e.long);
    return !(isNaN(a) || a < -180 || a > 180);
  }
  /**
   * Gets a formatted address string from the location data
   */
  getFormattedAddress() {
    if (!this._value)
      return "";
    const t = [];
    this._value.street && t.push(this._value.street), this._value.streetNumber && t.push(this._value.streetNumber);
    const e = [];
    return this._value.zip && e.push(this._value.zip), this._value.city && e.push(this._value.city), e.length > 0 && t.push(e.join(" ")), this._value.nation && t.push(this._value.nation), t.join(", ");
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
          long: s.lng.toString()
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
    return t.endsWith("_fk") ? new ka(t, e, r) : t === "_userID" ? new Ca(t, e, r) : e === "int" || ["_blitzstamp"].includes(t) ? new Te(t, "int", r) : e === "tinyint" ? new Ra(t, e, r) : e === "double" ? new $a(t, e, r) : e === "float" ? new Vt(t, e, r) : e === "percentage" ? new Ha(t, e, r) : e === "varchar" ? new Aa(t, e, r) : e === "text" ? new Ae(t, e, r) : e === "htmlText" ? new za(t, e, r) : e === "enum" ? new Na(t, e, r) : e === "json" ? new Ja(t, e, r) : e === "boolean" ? new Me(t, e, r) : e === "datetime" || ["_publishingdate", "_modified", "_expiration"].includes(t) ? new Ea(t, "datetime", r) : e === "date" ? new Pa(t, e, r) : e === "code" ? new La(t, e, r) : e === "email" ? new Ba(t, e, r) : e === "phone" ? new Ya(t, e, r) : e === "url" ? new qa(t, e, r) : e === "image" ? new Va(t, e, r) : e === "video" ? new Qa(t, e, r) : e === "file" ? new Xa(t, e, r) : e === "location" ? new Ka(t, e, r) : new lt(t, e, r);
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
    return t.endsWith("_mtm") ? new Wa(t, e, r) : new Ee(t, e, r);
  }
  /**
   * Unserializes given data to be used within library.
   *
   * @param attributes
   * @param data
   */
  static unserialize(t, e) {
    var s, i, o;
    const r = {}, a = [...Object.keys(t), ...Object.keys(e)].filter((u, c, l) => l.indexOf(u) === c);
    for (const u of a)
      Array.isArray((s = t[u]) == null ? void 0 : s.type) ? r[u] = H.createMany(u, ((i = t[u]) == null ? void 0 : i.type[0]) ?? "anonymous", e[u]) : r[u] = H.createType(
        u,
        ((o = t[u]) == null ? void 0 : o.type) ?? "anonymous",
        e[u]
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
class at {
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
      var c, l, d, h;
      const a = (l = (c = this.model) == null ? void 0 : c.getAttributeDetails(t)) == null ? void 0 : l.type, s = H.createType(t, a, e).serialize(), i = r ? H.createType(t, a, r).serialize() : this.getAttribute(t).serialize(), o = new $({
        action: "edit",
        data: {
          [t]: {
            prev: i,
            new: s
          }
        },
        model: this.model.getName(),
        blitzID: this.getAttribute("_blitzID").value
      }), u = await q.create().run([o]);
      if (u[0].status !== W.Success && u[0].status !== W.Notice)
        throw new Error(u[0].message ?? "Unknown Error! Please try again.");
      this._attributes[t].value = s;
      for (const f of this.getAttribute("_editURLs").value)
        await p.queue.addJob(f, o.toObject());
      (d = this.model) == null || d.memoryClient().emit(o), this.dispatchEvent("edit", o.data), (h = this.model) == null || h.setLastTransactionHash(o.hash);
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
    }), e = await q.create().run([t]);
    if (e[0].status !== W.Success)
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
      users: t.reduce((o, u) => ({ ...o, [`#${u.id}`]: u.permission }), {})
    }, a = new $({
      action: "addObjectUserPermission",
      model: this.model.getName(),
      blitzID: e,
      data: r,
      hash: ot(r)
    }), s = [];
    for (const o of this.getAttribute("_editURLs").value)
      s.push(
        await jt.send(
          { url: o, transaction: a.toObject() },
          F._globalHeaders
        )
      );
    const i = s.find((o) => o.status !== j.Success);
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
class Jt {
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
      level: "full"
    }, t.sync.level === "partial")
      throw new Error("Partial sync type not supported yet!");
    return t.sync.level === "cache" && (t.sync.ttl || (t.sync.ttl = 30 * 1e3)), t.sync.level === "full" && (t.sync.interval || (t.sync.interval = 30 * 1e3)), t.flush || (t.flush = {
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
const Ga = {
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
class ke {
  /**
   * Creates new BDObject with supplied type, model and attributes.
   *
   * @param type
   * @param model
   * @param data
   * @param updateMemory
   */
  static create(t, e, r) {
    const a = e.getAttributesDetails() ?? {}, s = H.unserialize(a, r), i = new Proxy(new t({
      model: e,
      attributes: s
    }), Ga);
    for (const o in s)
      s[o].withObject(i);
    return e.memoryClient().update(i);
  }
}
class Ce extends at {
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
m(Ce, "modelName");
const Ot = class Ot extends Ce {
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
    m(this, "returnType", at);
    this.clusterManager = p.clusterManager;
  }
  /**
   * Returns the model indexed db connection.
   */
  idbClient() {
    return new ur(this);
  }
  /**
   * Returns the model memory connection.
   */
  memoryClient() {
    return new _t(this);
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
      data: H.serialize(H.unserialize(s, e)),
      model: this.getName()
    }), o = await p.getCurrentUser(), u = i.clone();
    u.data = { ...u.data, _userID: o.id };
    const c = await q.create().run([u]);
    if (c[0].status !== W.Success)
      throw new Error(c[0].message ?? "Unknown Error! Please try again.");
    for (const l of a)
      for (const d of l.options.addURL)
        await p.queue.addJob(d, i.toObject());
    return this.memoryClient().emit(i), this.setLastTransactionHash(i.hash), ke.create(this.returnType, this, u.data);
  }
  /**
   * Finds an object by given blitz ID.
   *
   * @param blitzID - Blitz ID of the object.
   */
  async get(e) {
    const r = typeof e == "string" ? { blitzID: e } : e, s = (await st.create().model(this).clusters(this.resolveClusters(r.clusters ?? [])).raw(r.raw ?? !1).get(r.blitzID).query({
      returnType: this.returnType ?? at
    }).forceHttp(r.forceHttp ?? !1).forceLocal(r.forceLocal ?? !1).skipCacheUpdateIfFound(r.skipCacheUpdateIfFound ?? !1).signal(r.signal).getQuery(r.query ?? {}).perform())[0] ?? null;
    if (!s && this.returnType === Ot)
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
    return await st.create().model(this).clusters(this.resolveClusters(e.clusters ?? [])).raw(e.raw ?? !1).query({
      conditions: e.conditions,
      limit: e.limit,
      returnType: e.returnType ?? this.returnType ?? at,
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
    const s = st.create().model(this).clusters(this.resolveClusters(e.clusters ?? [])).raw(e.raw ?? !1).query({
      conditions: e.conditions,
      limit: e.limit,
      returnType: e.returnType ?? this.returnType ?? at,
      customSort: e.customSort,
      customSortDirection: e.customSortDirection,
      var: e.var,
      manyToMany: e.manyToMany
    }).forceHttp(e.forceHttp ?? !1).forceLocal(e.forceLocal ?? !1).skipCacheUpdateIfFound(e.skipCacheUpdateIfFound ?? !1).performSignal(a), i = s.subscribe(r, s.get() !== null), o = _t.channel.filterPipe((u) => u.model === this.getName()).subscribe((u) => {
      if (u.action === D.Add)
        this.list({ ...e, forceLocal: !0 }).then((c) => {
          const l = e.raw ? c.findIndex((d) => d._blitzID === u.blitzID) : c.findIndex((d) => d.getAttribute("_blitzID").value === u.blitzID);
          l > -1 && s.set({
            items: c,
            update: {
              action: D.Add,
              object: c[l],
              index: l
            }
          });
        });
      else if (u.action === D.Edit) {
        const c = s.get();
        if (!c)
          return;
        const l = e.raw ? c.items.findIndex((d) => d._blitzID === u.blitzID) : c.items.findIndex((d) => d.getAttribute("_blitzID").value === u.blitzID);
        l > -1 && this.list({ ...e, forceLocal: !0 }).then((d) => {
          const h = e.raw ? d.findIndex((f) => f._blitzID === u.blitzID) : d.findIndex((f) => f.getAttribute("_blitzID").value === u.blitzID);
          s.set({
            items: d,
            update: {
              action: D.Edit,
              object: h > -1 ? d[h] : c.items[l],
              index: h > -1 ? h : l
            }
          });
        });
      } else if (u.action === D.Delete) {
        const c = s.get();
        if (!c)
          return;
        if (e.raw) {
          const l = c.items.findIndex((d) => d._blitzID === u.blitzID);
          l > -1 && s.set({
            items: c.items.filter((d) => d._blitzID !== u.blitzID),
            update: {
              action: D.Delete,
              object: c.items[l],
              index: l
            }
          });
        } else {
          const l = c.items.findIndex((d) => d.getAttribute("_blitzID").value === u.blitzID);
          l > -1 && s.set({
            items: c.items.filter((d) => d.getAttribute("_blitzID").value !== u.blitzID),
            update: {
              action: D.Delete,
              object: c.items[l],
              index: l
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
      const r = Date.now() / 1e3, a = S.getLastSyncedAt(e) ?? 0, s = 30;
      r - a > s && await dt.create().run(e);
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
    this.clusterManager = new be();
    const r = Jt.transformClusterOptions(e);
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
m(Ot, "modelName", "_Model");
let R = Ot;
class Lt {
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
var We = { exports: {} }, Ue = { exports: {} };
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
  Ue.exports = t;
})();
var Za = Ue.exports, Nt = {
  // UTF-8 encoding
  utf8: {
    // Convert a string to a byte array
    stringToBytes: function(n) {
      return Nt.bin.stringToBytes(unescape(encodeURIComponent(n)));
    },
    // Convert a byte array to a string
    bytesToString: function(n) {
      return decodeURIComponent(escape(Nt.bin.bytesToString(n)));
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
}, le = Nt;
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
var ts = function(n) {
  return n != null && (je(n) || es(n) || !!n._isBuffer);
};
function je(n) {
  return !!n.constructor && typeof n.constructor.isBuffer == "function" && n.constructor.isBuffer(n);
}
function es(n) {
  return typeof n.readFloatLE == "function" && typeof n.slice == "function" && je(n.slice(0, 0));
}
(function() {
  var n = Za, t = le.utf8, e = ts, r = le.bin, a = function(s, i) {
    s.constructor == String ? i && i.encoding === "binary" ? s = r.stringToBytes(s) : s = t.stringToBytes(s) : e(s) ? s = Array.prototype.slice.call(s, 0) : !Array.isArray(s) && s.constructor !== Uint8Array && (s = s.toString());
    for (var o = n.bytesToWords(s), u = s.length * 8, c = 1732584193, l = -271733879, d = -1732584194, h = 271733878, f = 0; f < o.length; f++)
      o[f] = (o[f] << 8 | o[f] >>> 24) & 16711935 | (o[f] << 24 | o[f] >>> 8) & 4278255360;
    o[u >>> 5] |= 128 << u % 32, o[(u + 64 >>> 9 << 4) + 14] = u;
    for (var g = a._ff, v = a._gg, M = a._hh, P = a._ii, f = 0; f < o.length; f += 16) {
      var k = c, A = l, V = d, At = h;
      c = g(c, l, d, h, o[f + 0], 7, -680876936), h = g(h, c, l, d, o[f + 1], 12, -389564586), d = g(d, h, c, l, o[f + 2], 17, 606105819), l = g(l, d, h, c, o[f + 3], 22, -1044525330), c = g(c, l, d, h, o[f + 4], 7, -176418897), h = g(h, c, l, d, o[f + 5], 12, 1200080426), d = g(d, h, c, l, o[f + 6], 17, -1473231341), l = g(l, d, h, c, o[f + 7], 22, -45705983), c = g(c, l, d, h, o[f + 8], 7, 1770035416), h = g(h, c, l, d, o[f + 9], 12, -1958414417), d = g(d, h, c, l, o[f + 10], 17, -42063), l = g(l, d, h, c, o[f + 11], 22, -1990404162), c = g(c, l, d, h, o[f + 12], 7, 1804603682), h = g(h, c, l, d, o[f + 13], 12, -40341101), d = g(d, h, c, l, o[f + 14], 17, -1502002290), l = g(l, d, h, c, o[f + 15], 22, 1236535329), c = v(c, l, d, h, o[f + 1], 5, -165796510), h = v(h, c, l, d, o[f + 6], 9, -1069501632), d = v(d, h, c, l, o[f + 11], 14, 643717713), l = v(l, d, h, c, o[f + 0], 20, -373897302), c = v(c, l, d, h, o[f + 5], 5, -701558691), h = v(h, c, l, d, o[f + 10], 9, 38016083), d = v(d, h, c, l, o[f + 15], 14, -660478335), l = v(l, d, h, c, o[f + 4], 20, -405537848), c = v(c, l, d, h, o[f + 9], 5, 568446438), h = v(h, c, l, d, o[f + 14], 9, -1019803690), d = v(d, h, c, l, o[f + 3], 14, -187363961), l = v(l, d, h, c, o[f + 8], 20, 1163531501), c = v(c, l, d, h, o[f + 13], 5, -1444681467), h = v(h, c, l, d, o[f + 2], 9, -51403784), d = v(d, h, c, l, o[f + 7], 14, 1735328473), l = v(l, d, h, c, o[f + 12], 20, -1926607734), c = M(c, l, d, h, o[f + 5], 4, -378558), h = M(h, c, l, d, o[f + 8], 11, -2022574463), d = M(d, h, c, l, o[f + 11], 16, 1839030562), l = M(l, d, h, c, o[f + 14], 23, -35309556), c = M(c, l, d, h, o[f + 1], 4, -1530992060), h = M(h, c, l, d, o[f + 4], 11, 1272893353), d = M(d, h, c, l, o[f + 7], 16, -155497632), l = M(l, d, h, c, o[f + 10], 23, -1094730640), c = M(c, l, d, h, o[f + 13], 4, 681279174), h = M(h, c, l, d, o[f + 0], 11, -358537222), d = M(d, h, c, l, o[f + 3], 16, -722521979), l = M(l, d, h, c, o[f + 6], 23, 76029189), c = M(c, l, d, h, o[f + 9], 4, -640364487), h = M(h, c, l, d, o[f + 12], 11, -421815835), d = M(d, h, c, l, o[f + 15], 16, 530742520), l = M(l, d, h, c, o[f + 2], 23, -995338651), c = P(c, l, d, h, o[f + 0], 6, -198630844), h = P(h, c, l, d, o[f + 7], 10, 1126891415), d = P(d, h, c, l, o[f + 14], 15, -1416354905), l = P(l, d, h, c, o[f + 5], 21, -57434055), c = P(c, l, d, h, o[f + 12], 6, 1700485571), h = P(h, c, l, d, o[f + 3], 10, -1894986606), d = P(d, h, c, l, o[f + 10], 15, -1051523), l = P(l, d, h, c, o[f + 1], 21, -2054922799), c = P(c, l, d, h, o[f + 8], 6, 1873313359), h = P(h, c, l, d, o[f + 15], 10, -30611744), d = P(d, h, c, l, o[f + 6], 15, -1560198380), l = P(l, d, h, c, o[f + 13], 21, 1309151649), c = P(c, l, d, h, o[f + 4], 6, -145523070), h = P(h, c, l, d, o[f + 11], 10, -1120210379), d = P(d, h, c, l, o[f + 2], 15, 718787259), l = P(l, d, h, c, o[f + 9], 21, -343485551), c = c + k >>> 0, l = l + A >>> 0, d = d + V >>> 0, h = h + At >>> 0;
    }
    return n.endian([c, l, d, h]);
  };
  a._ff = function(s, i, o, u, c, l, d) {
    var h = s + (i & o | ~i & u) + (c >>> 0) + d;
    return (h << l | h >>> 32 - l) + i;
  }, a._gg = function(s, i, o, u, c, l, d) {
    var h = s + (i & u | o & ~u) + (c >>> 0) + d;
    return (h << l | h >>> 32 - l) + i;
  }, a._hh = function(s, i, o, u, c, l, d) {
    var h = s + (i ^ o ^ u) + (c >>> 0) + d;
    return (h << l | h >>> 32 - l) + i;
  }, a._ii = function(s, i, o, u, c, l, d) {
    var h = s + (o ^ (i | ~u)) + (c >>> 0) + d;
    return (h << l | h >>> 32 - l) + i;
  }, a._blocksize = 16, a._digestsize = 16, We.exports = function(s, i) {
    if (s == null)
      throw new Error("Illegal argument " + s);
    var o = n.wordsToBytes(a(s, i));
    return i && i.asBytes ? o : i && i.asString ? r.bytesToString(o) : n.bytesToHex(o);
  };
})();
var rs = We.exports;
const ns = /* @__PURE__ */ nr(rs), as = /^[v^~<>=]*?(\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+))?(?:-([\da-z\-]+(?:\.[\da-z\-]+)*))?(?:\+[\da-z\-]+(?:\.[\da-z\-]+)*)?)?)?$/i, de = (n) => {
  if (typeof n != "string")
    throw new TypeError("Invalid argument expected string");
  const t = n.match(as);
  if (!t)
    throw new Error(`Invalid argument not valid semver ('${n}' received)`);
  return t.shift(), t;
}, he = (n) => n === "*" || n === "x" || n === "X", fe = (n) => {
  const t = parseInt(n, 10);
  return isNaN(t) ? n : t;
}, ss = (n, t) => typeof n != typeof t ? [String(n), String(t)] : [n, t], is = (n, t) => {
  if (he(n) || he(t))
    return 0;
  const [e, r] = ss(fe(n), fe(t));
  return e > r ? 1 : e < r ? -1 : 0;
}, me = (n, t) => {
  for (let e = 0; e < Math.max(n.length, t.length); e++) {
    const r = is(n[e] || "0", t[e] || "0");
    if (r !== 0)
      return r;
  }
  return 0;
}, os = (n, t) => {
  const e = de(n), r = de(t), a = e.pop(), s = r.pop(), i = me(e, r);
  return i !== 0 ? i : a && s ? me(a.split("."), s.split(".")) : a || s ? a ? -1 : 1 : 0;
}, ge = (n, t, e) => {
  cs(e);
  const r = os(n, t);
  return Fe[e].includes(r);
}, Fe = {
  ">": [1],
  ">=": [0, 1],
  "=": [0],
  "<=": [-1, 0],
  "<": [-1],
  "!=": [-1, 1]
}, we = Object.keys(Fe), cs = (n) => {
  if (typeof n != "string")
    throw new TypeError(`Invalid operator type, expected string but got ${typeof n}`);
  if (we.indexOf(n) === -1)
    throw new Error(`Invalid operator, expected one of ${we.join("|")}`);
};
class Je {
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
      if (!t || ge(p.VERSION, t, ">")) {
        const e = p.VERSION.split(".")[1], r = t == null ? void 0 : t.split(".")[1];
        if (r && ge(e, r, ">")) {
          await this.flush(), S.setLastSyncedAt(Math.floor(Date.now() / 1e3)), S.set("version", p.VERSION);
          return;
        } else
          S.set("version", p.VERSION);
      }
    }
    if (this.options.type.includes("interval") && this.options.interval) {
      const t = S.get("lastFlush");
      if (!t)
        S.set("lastFlush", Date.now().toString());
      else if (Math.floor((Date.now() - parseInt(t)) / 864e5) >= this.options.interval) {
        await this.flush(), S.set("lastFlush", Date.now().toString()), S.setLastSyncedAt(Math.floor(Date.now() / 1e3)), S.set("version", p.VERSION);
        return;
      }
    }
    if (this.options.type.includes("size") && this.options.size && navigator.storage && navigator.storage.estimate)
      try {
        const t = await navigator.storage.estimate();
        if (t.usage && Math.floor(t.usage / 1e6) >= this.options.size) {
          await this.flush(), S.setLastSyncedAt(Math.floor(Date.now() / 1e3)), S.set("version", p.VERSION);
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
        ...S.getDatabases()
      ].filter((s, i, o) => !["_Model", "_Project", "0BAUsers"].includes(s) && o.findIndex((u) => u === s) === i), r = [
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
      ], a = t.find((s) => s.name === "_Model") ? await it("_Model", 1) : null;
      if (a) {
        for (const s of e)
          try {
            const i = (JSON.parse(S.get("model." + s) || "null") ?? {}).object;
            if (i) {
              const o = await a.get("objects", s);
              o && (!r.every((u) => i[u] === o[u]) || !Object.keys(i.attributes ?? []).every((u) => {
                var c, l, d, h, f, g, v, M;
                return (
                  // Check single enum and many enum attributes
                  i.attributes[u].type === "enum" || Array.isArray(i.attributes[u].type) && i.attributes[u].type[0] === "enum" ? (Array.isArray(i.attributes[u].type) ? (l = (c = o.attributes) == null ? void 0 : c[u]) == null ? void 0 : l.type[0] : (h = (d = o.attributes) == null ? void 0 : d[u]) == null ? void 0 : h.type) === "enum" && (i.attributes[u].options ?? []).every((P, k) => {
                    var A, V;
                    return P === ((V = (A = o.attributes) == null ? void 0 : A[u]) == null ? void 0 : V.options[k]);
                  }) : Array.isArray(i.attributes[u].type) ? i.attributes[u].type[0] === ((g = (f = o.attributes) == null ? void 0 : f[u]) == null ? void 0 : g.type[0]) : i.attributes[u].type === ((M = (v = o.attributes) == null ? void 0 : v[u]) == null ? void 0 : M.type)
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
      ...S.getDatabases(),
      "_Model",
      "_Project",
      "0BAUsers",
      "db_master"
    ].filter((a, s, i) => i.findIndex((o) => o === a) === s);
    for (const a of e)
      await $t(a);
    const r = t.find((a) => a.name === _.name) ? await it(_.name, 1) : null;
    r && (await r.clear(_.store), r.close()), S.clear();
  }
  /**
   * Updates model cache in local storage
   */
  static modelCacheUpdate(t, e) {
    if (p.options.flush.type.includes("model") && p.options.flush.modelCacheTTL && t && e !== null && typeof e == "object" && Object.hasOwn(e, "_blitzID"))
      try {
        const r = Date.now(), a = "model." + t.getName(), s = JSON.parse(S.get(a) || "null");
        (!s || r - s.lastFetchedAt >= p.options.flush.modelCacheTTL * 1e3) && S.set(
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
class st {
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
    return new st();
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
        s.length === 3 && e[i] !== void 0 && typeof e[i].type == "string" && (s[1] === "IN" && Array.isArray(s[2]) ? s[2] = s[2].map((o) => H.createType(
          i,
          e[i].type,
          o
        ).serialize()) : s[2] = H.createType(
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
      e.push(ke.create(((r = this._query) == null ? void 0 : r.returnType) ?? at, this._model, a));
    return e;
  }
  /**
   * Performs the list call.
   */
  async perform() {
    var e;
    let t = this._forceHttp && !this._forceLocal ? [] : await this.performIndexedDb();
    if (!this._forceLocal) {
      if (p.options.sync.level === "full" && t.length === 0)
        t = await this.filterQueuedObjects(this.mergeObjects(await this.performHttp())), t = await this.filterExpiredObjects(t), t.length > 0 && await this._model.idbClient().save(t);
      else if (p.options.sync.level === "cache") {
        const r = this._skipCacheUpdateIfFound && t.length > 0 ? !1 : this.shouldSendHttpRequest();
        if (r || t.length === 0) {
          const a = await this.filterQueuedObjects(this.mergeObjects(await this.performHttp()));
          (a.length > 0 || this._forceHttp) && (t = await this.filterExpiredObjects(a), t.length > 0 && await this._model.idbClient().save(t)), r && ((e = this._model) == null ? void 0 : e.getName()) !== "_Model" && S.setListCallLastTimeStamp(this.hash(), (/* @__PURE__ */ new Date()).getTime());
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
    const e = new ht(null);
    return (async () => {
      var i;
      if (!t) {
        e.set({
          items: await this.perform()
        });
        return;
      }
      const r = await this.performMemory();
      e.set({
        items: this._raw ? r : this.convertObjects(r),
        nextSource: "local database"
      });
      const a = await this.performIndexedDb();
      e.set({
        items: this._raw ? a : this.convertObjects(a),
        nextSource: "server"
      });
      let s = await this.filterQueuedObjects(this.mergeObjects(await this.performHttp()));
      s = await this.filterExpiredObjects(s), s.length > 0 && await ((i = this._model) == null ? void 0 : i.idbClient().save(s)), e.set({
        items: this._raw ? s : this.convertObjects(s)
      });
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
          o = await et.get({
            baseUrl: i,
            modelName: this._model.getName(),
            blitzID: this._get,
            query: this._getQuery
          }, this._signal);
        else {
          const u = await et.list({
            endpoint: {
              baseUrl: i,
              modelName: this._model.getName(),
              query: this._query
            }
          }, this._signal);
          o = u.items || [], Je.modelCacheUpdate(this._model, u.model);
        }
        for (const u of o) {
          u._clusters = [t.name], u._editURLs = JSON.parse(JSON.stringify(t.options.readURL));
          for (const c in u)
            if (c.endsWith("_fk") && u[c] !== null && typeof u[c] == "object" && u[c]._blitzID) {
              const l = (a = (r = this._model) == null ? void 0 : r.getAttributeDetails(c)) == null ? void 0 : a.type;
              if (l && l !== "_Model") {
                const d = await R.get(l);
                d && await d.idbClient().save([u[c]], !0);
              }
              u[c] = u[c]._blitzID;
            } else
              c.endsWith("_mtm") && Array.isArray(u[c]) && (u[c] = u[c].map((l, d) => ({
                _blitzID: typeof l == "string" ? l : l._blitzID,
                _mtmSort: typeof l == "string" ? (u[c].length - d) * 15 : l._mtmSort
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
    return ((await et.list({ fullUrl: t }, this._signal)).items || []).map((r) => (r.cluster = [], r._editURLs = [t], r));
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
    const e = this._urls ? this._urls.map((s) => Lt.extractConditions(s)).flat() : this._query.conditions;
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
    const e = this._urls ? this._urls.map((s) => Lt.extractConditions(s)).flat() : this._query.conditions;
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
        if (!e.find((i) => i.transaction.action === D.Edit && i.transaction.blitzID === s._blitzID && i.status !== y.Completed))
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
    const e = S.getCurrentUser();
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
            await ((a = this._model) == null ? void 0 : a.idbClient().delete(s._blitzID));
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
   * Decides whether to send http request or not.
   */
  shouldSendHttpRequest() {
    var e;
    if (p.options.sync.level !== "cache" || ((e = this._model) == null ? void 0 : e.getName()) === "_Model")
      return !1;
    const t = S.getListCallLastTimeStamp(this.hash());
    return t ? (/* @__PURE__ */ new Date()).getTime() - t > p.options.sync.ttl : !0;
  }
  /**
   * Calculates hash of the call.
   */
  hash() {
    var t, e;
    return ns(JSON.stringify({
      clusters: ((t = this._clusters) == null ? void 0 : t.map((r) => r.name)) ?? [],
      blitzId: this._get,
      urls: this._urls,
      modelName: (e = this._model) == null ? void 0 : e.getName(),
      listQuery: this._query,
      getQuery: this._getQuery
    }));
  }
}
const z = class z {
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
    return "1.4.16";
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
    const e = Jt.transformBlitzDataOptions(t);
    this.options = e, e.clusters && z.setClusters(e.clusters), await new Je(this.options.flush).perform(), await new Bt().ping(), this.queue = await new or().init(), z._Model = new R({
      model: void 0,
      attributes: {
        _blitzID: new lt("_blitzID", "string", "_Model"),
        searchable: new lt("searchable", "json", void 0),
        attributes: new lt("attributes", "json", {
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
        _editURLs: new lt("_editURLs", "json", []),
        haspublishingdate: new Me("haspublishingdate", "boolean", !1)
      }
    }), z._Model.setReturnType(R), t && typeof t != "string" && !Array.isArray(t) && t.uiManager && (this.ui = new t.uiManager(this, t.uiManagerSettings));
    try {
      await z.getCurrentUser();
    } catch (r) {
      console.error("Error fetching current user:", r.stack);
    }
    if (e.sync.level === "full") {
      const r = dt.create();
      await r.run(), r.runAtInterval(e.sync.interval);
    } else
      e.sync.level === "cache" && await dt.create().run(void 0, "delete");
  }
  /**
   * Registers clusters.
   */
  static setClusters(t) {
    t = Jt.transformClusterOptions(t);
    for (const e of Object.keys(t))
      z.clusterManager.register(e, t[e]);
  }
  /**
   * Performs a list call to the server by given URL.
   *
   * @param url
   */
  static async list(t) {
    const e = Lt.extractModelName(t);
    if (!await z._Model.exists(e))
      throw new Error(`Model "${e}" does not exist.`);
    return st.create().model(await z._Model.get(e)).urls([t]).query({}).perform();
  }
  /**
   * Performs an image upload
   *
   * @param file File to be uploaded.
   */
  static async uploader(t) {
    return await et.upload({
      baseUrl: z.clusterManager.toArray()[0].getNextReadURL(),
      image: t
    });
  }
  /**
   * Performs a video upload
   *
   * @param file File to be uploaded.
   */
  static async uploaderVideo(t) {
    return await et.uploadVideo({
      baseUrl: z.clusterManager.toArray()[0].getNextReadURL(),
      video: t
    });
  }
  /**
   * Performs a file upload
   *
   * @param file File to be uploaded.
   */
  static async uploaderFile(t) {
    return await et.uploadFile({
      baseUrl: z.clusterManager.toArray()[0].getNextReadURL(),
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
    const a = T.sanitizeBaseUrl(z.clusterManager.toArray()[0].getNextReadURL()), s = new URL(a).origin !== window.location.origin ? r.includes("?") ? "&enableCors=1" : "?enableCors=1" : "", i = F.create().url(a + r + s).method((e == null ? void 0 : e.method) ?? "GET").header("Accept", "application/json");
    e != null && e.headers && i.headers(e.headers), (e == null ? void 0 : e.body) !== void 0 && i.body(e.body), e != null && e.signal && i.signal(e.signal);
    const o = await i.send();
    if (o.error)
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
      const o = Date.now(), u = 864e5;
      if (o < e.lastSaved + u)
        return e.users;
    }
    const r = T.sanitizeBaseUrl(z.clusterManager.toArray()[0].getNextReadURL()), a = new URL(r).origin !== window.location.origin ? "?enableCors=1" : "", s = await F.create().url(r + `api/listProjectUsers/${t}.json${a}`).get();
    if (s.error)
      throw new Error(s.error);
    if (s.errors instanceof Array && s.errors.length > 0)
      throw new Error(s.errors.map((o) => o.message || o).join(" | "));
    const i = {
      lastSaved: Date.now(),
      users: (s.users || []).map((o) => ({ id: o._blitzID, username: o.username }))
    };
    return S.setProjectUsers(t, i), i.users;
  }
  /**
   * Get current user.
   */
  static async getCurrentUser() {
    var u;
    const t = S.getCurrentUser();
    if (t)
      return t;
    const e = T.sanitizeBaseUrl(z.clusterManager.toArray()[0].getNextReadURL()), r = new URL(e).origin !== window.location.origin ? "?enableCors=1" : "", a = await F.create().url(e + "api/ping.json" + r).get();
    if (a.error)
      throw new Error(a.error);
    if (!a.userhash) {
      const c = { id: "public", username: "Public" };
      return S.setCurrentUser(c), c;
    }
    const s = await R.get("0BAUsers"), i = await (s == null ? void 0 : s.get(a.userhash));
    if (!i || !((u = i.username) != null && u.value))
      throw new Error("Could not get user object!");
    const o = { id: a.userhash, username: i.username.value };
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
m(z, "clusterManager", new be()), /**
 * _Model instance.
 */
m(z, "_Model"), /**
* Cache of loaded objects (model => (blitzID => object)).
*/
m(z, "objects", /* @__PURE__ */ new Map()), /**
 * Options of the BlitzData.
 */
m(z, "options"), /**
* Queue instance.
*/
m(z, "queue"), /**
* UI manager instance.
*/
m(z, "ui"), /**
 * Event listeners.
 */
m(z, "listeners", /* @__PURE__ */ new Map()), /**
 * Whether library initialized or not.
 */
m(z, "initialized", !1);
let p = z;
export {
  Ce as BDCustomObject,
  R as BDModel,
  at as BDObject,
  p as BlitzData,
  E as DataType,
  F as HttpRequest,
  y as JobStatus,
  S as LocalStorageRepository,
  Wa as ManyForeignKeyType,
  Ee as ManyType,
  Ae as TextType,
  ot as blitzhash,
  rt as blitzstamp,
  ar as sleep
};
