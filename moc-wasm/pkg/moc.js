
let wasm;

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachegetUint8Memory0 = null;
function getUint8Memory0() {
    if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== wasm.memory.buffer) {
        cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachegetUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

const heap = new Array(32).fill(undefined);

heap.push(undefined, null, true, false);

let heap_next = heap.length;

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function getObject(idx) { return heap[idx]; }

function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

let WASM_VECTOR_LEN = 0;

let cachedTextEncoder = new TextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length);
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len);

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3);
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachegetInt32Memory0 = null;
function getInt32Memory0() {
    if (cachegetInt32Memory0 === null || cachegetInt32Memory0.buffer !== wasm.memory.buffer) {
        cachegetInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachegetInt32Memory0;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_2.get(state.dtor)(a, state.b);

            } else {
                state.a = a;
            }
        }
    };
    real.original = state;

    return real;
}
function __wbg_adapter_22(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__he4d42117cd71b463(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_25(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hb0f8733f7e810fe6(arg0, arg1, addHeapObject(arg2));
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1);
    getUint8Memory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function getArrayU8FromWasm0(ptr, len) {
    return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
    return instance.ptr;
}

let cachegetFloat64Memory0 = null;
function getFloat64Memory0() {
    if (cachegetFloat64Memory0 === null || cachegetFloat64Memory0.buffer !== wasm.memory.buffer) {
        cachegetFloat64Memory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachegetFloat64Memory0;
}

function passArrayF64ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 8);
    getFloat64Memory0().set(arg, ptr / 8);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

let cachegetUint32Memory0 = null;
function getUint32Memory0() {
    if (cachegetUint32Memory0 === null || cachegetUint32Memory0.buffer !== wasm.memory.buffer) {
        cachegetUint32Memory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachegetUint32Memory0;
}

function getArrayJsValueFromWasm0(ptr, len) {
    const mem = getUint32Memory0();
    const slice = mem.subarray(ptr / 4, ptr / 4 + len);
    const result = [];
    for (let i = 0; i < slice.length; i++) {
        result.push(takeObject(slice[i]));
    }
    return result;
}
/**
* Activate debugging mode (Rust stacktrace)
*/
export function debugOn() {
    wasm.debugOn();
}

/**
*/
export function main_js() {
    wasm.main_js();
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_exn_store(addHeapObject(e));
    }
}
function __wbg_adapter_244(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen__convert__closures__invoke2_mut__haad44752cc83f873(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
}

/**
*/
export class FMOC {

    static __wrap(ptr) {
        const obj = Object.create(FMOC.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_fmoc_free(ptr);
    }
    /**
    * Returns the MOCs identifiers (names) currently in the store (MOCs loaded from local files)
    * @returns {Array<any>}
    */
    static listMocsLoadedFromLocalFile() {
        var ret = wasm.fmoc_listMocsLoadedFromLocalFile();
        return takeObject(ret);
    }
    /**
    * Get (and remove from the store) the MOC of given name loaded from a local file.
    * @param {string} name
    * @returns {FMOC}
    */
    static getMocLoadedFromLocalFile(name) {
        var ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.fmoc_getMocLoadedFromLocalFile(ptr0, len0);
        return FMOC.__wrap(ret);
    }
    /**
    * Creates a new empty F-MOC of given depth.
    * @param {number} depth
    * @returns {FMOC}
    */
    static newEmpty(depth) {
        var ret = wasm.fmoc_newEmpty(depth);
        return FMOC.__wrap(ret);
    }
    /**
    * Returns the type of the MOC.
    * @returns {any}
    */
    getType() {
        var ret = wasm.fmoc_getType(this.ptr);
        return takeObject(ret);
    }
    /**
    * Trigger a file dialog event and load the selected MOCs from selected file to a local storage.
    * You then have to use:
    * * `list_mocs_loaded_from_local_file`
    * * `get_moc_loaded_from_local_file`
    */
    static fromLocalFile() {
        wasm.fmoc_fromLocalFile();
    }
    /**
    * Create a MOC from its ASCII serialization
    *
    * # Arguments
    * * `data`: ASCII serialization
    * @param {string} data
    * @returns {FMOC}
    */
    static fromAscii(data) {
        var ptr0 = passStringToWasm0(data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.fmoc_fromAscii(ptr0, len0);
        return FMOC.__wrap(ret);
    }
    /**
    * WARNING: if this is not working, check e.g. with `wget -v -S ${url}` the the content type is
    * `Content-Type: text/plain`.
    * @param {string} url
    * @returns {Promise<FMOC>}
    */
    static fromAsciiUrl(url) {
        var ptr0 = passStringToWasm0(url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.fmoc_fromAsciiUrl(ptr0, len0);
        return takeObject(ret);
    }
    /**
    * Create a MOC from its JSON serialization
    *
    * # Arguments
    * * `data`: JSON serialization
    * @param {string} data
    * @returns {FMOC}
    */
    static fromJson(data) {
        var ptr0 = passStringToWasm0(data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.fmoc_fromJson(ptr0, len0);
        return FMOC.__wrap(ret);
    }
    /**
    * WARNING: if this i not working, check e.g. with `wget -v -S ${url}` the the content type is
    * `Content-Type: application/json`.
    * @param {string} url
    * @returns {Promise<FMOC>}
    */
    static fromJsonUrl(url) {
        var ptr0 = passStringToWasm0(url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.fmoc_fromJsonUrl(ptr0, len0);
        return takeObject(ret);
    }
    /**
    * Create a MOC from its FITS serialization
    *
    * # Arguments
    * * `data`: FITS serialization
    * @param {Uint8Array} data
    * @returns {FMOC}
    */
    static fromFits(data) {
        var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.fmoc_fromFits(ptr0, len0);
        return FMOC.__wrap(ret);
    }
    /**
    * # Arguments
    * * `url`: URL of the FITS file
    * * `accept_mime_types`: use `None` (Rust) or `null` (Javascript) to use the default `application/fits`
    * # WARNING
    *   If this is not working, check e.g. with `wget -v -S ${url}` the the content type is
    *   `Content-Type: application/fits`.
    *   Else use the `accept_mime_types` option to set the `Accept` HTTP request parameter, with e.g:
    *   * `application/fits` (default value)
    *   * `application/fits, application/octet-stream`
    * @param {string} url
    * @param {string | undefined} accept_mime_types
    * @returns {Promise<FMOC>}
    */
    static fromFitsUrl(url, accept_mime_types) {
        var ptr0 = passStringToWasm0(url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(accept_mime_types) ? 0 : passStringToWasm0(accept_mime_types, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        var ret = wasm.fmoc_fromFitsUrl(ptr0, len0, ptr1, len1);
        return takeObject(ret);
    }
    /**
    * Returns the MOC depth.
    * @returns {number}
    */
    getDepth() {
        var ret = wasm.fmoc_getDepth(this.ptr);
        return ret;
    }
    /**
    * @returns {number}
    */
    coveragePercentage() {
        var ret = wasm.fmoc_coveragePercentage(this.ptr);
        return ret;
    }
    /**
    * @returns {number}
    */
    nRanges() {
        var ret = wasm.fmoc_nRanges(this.ptr);
        return ret >>> 0;
    }
    /**
    * @returns {FMOC}
    */
    not() {
        var ret = wasm.fmoc_not(this.ptr);
        return FMOC.__wrap(ret);
    }
    /**
    * @returns {FMOC}
    */
    complement() {
        var ret = wasm.fmoc_complement(this.ptr);
        return FMOC.__wrap(ret);
    }
    /**
    * @param {number} new_depth
    * @returns {FMOC}
    */
    degrade(new_depth) {
        var ret = wasm.fmoc_degrade(this.ptr, new_depth);
        return FMOC.__wrap(ret);
    }
    /**
    * @param {FMOC} rhs
    * @returns {FMOC}
    */
    or(rhs) {
        _assertClass(rhs, FMOC);
        var ret = wasm.fmoc_or(this.ptr, rhs.ptr);
        return FMOC.__wrap(ret);
    }
    /**
    * @param {FMOC} rhs
    * @returns {FMOC}
    */
    union(rhs) {
        _assertClass(rhs, FMOC);
        var ret = wasm.fmoc_union(this.ptr, rhs.ptr);
        return FMOC.__wrap(ret);
    }
    /**
    * @param {FMOC} rhs
    * @returns {FMOC}
    */
    and(rhs) {
        _assertClass(rhs, FMOC);
        var ret = wasm.fmoc_and(this.ptr, rhs.ptr);
        return FMOC.__wrap(ret);
    }
    /**
    * @param {FMOC} rhs
    * @returns {FMOC}
    */
    intersection(rhs) {
        _assertClass(rhs, FMOC);
        var ret = wasm.fmoc_intersection(this.ptr, rhs.ptr);
        return FMOC.__wrap(ret);
    }
    /**
    * @param {FMOC} rhs
    * @returns {FMOC}
    */
    xor(rhs) {
        _assertClass(rhs, FMOC);
        var ret = wasm.fmoc_xor(this.ptr, rhs.ptr);
        return FMOC.__wrap(ret);
    }
    /**
    * @param {FMOC} rhs
    * @returns {FMOC}
    */
    symmetric_difference(rhs) {
        _assertClass(rhs, FMOC);
        var ret = wasm.fmoc_symmetric_difference(this.ptr, rhs.ptr);
        return FMOC.__wrap(ret);
    }
    /**
    * @param {FMOC} rhs
    * @returns {FMOC}
    */
    minus(rhs) {
        _assertClass(rhs, FMOC);
        var ret = wasm.fmoc_minus(this.ptr, rhs.ptr);
        return FMOC.__wrap(ret);
    }
    /**
    * @param {FMOC} rhs
    * @returns {FMOC}
    */
    difference(rhs) {
        _assertClass(rhs, FMOC);
        var ret = wasm.fmoc_difference(this.ptr, rhs.ptr);
        return FMOC.__wrap(ret);
    }
    /**
    * Create a new F-MOC from the given list of frequencies (Hz).
    *
    * # Arguments
    * * `depth` - F-MOC maximum depth in `[0, 59]`
    * * `freq` - array of frequencies in Hz (`f64`)
    * @param {number} depth
    * @param {Float64Array} freq
    * @returns {FMOC}
    */
    static fromHz(depth, freq) {
        var ptr0 = passArrayF64ToWasm0(freq, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.fmoc_fromHz(depth, ptr0, len0);
        return FMOC.__wrap(ret);
    }
    /**
    * Create a new F-MOC from the given list of frequencies (Hz).
    *
    * # Arguments
    * * `depth` - F-MOC maximum depth in `[0, 59]`
    * * `freq_ranges` - array of frequencies in Hz (`f64`)
    * @param {number} depth
    * @param {Float64Array} freq_ranges
    * @returns {FMOC}
    */
    static fromHzRanges(depth, freq_ranges) {
        var ptr0 = passArrayF64ToWasm0(freq_ranges, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.fmoc_fromHzRanges(depth, ptr0, len0);
        return FMOC.__wrap(ret);
    }
}
/**
*/
export class MOC {

    static __wrap(ptr) {
        const obj = Object.create(MOC.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_moc_free(ptr);
    }
    /**
    * Returns the MOCs identifiers (names) currently in the store (MOCs loaded from local files)
    * @returns {Array<any>}
    */
    static listMocsLoadedFromLocalFile() {
        var ret = wasm.moc_listMocsLoadedFromLocalFile();
        return takeObject(ret);
    }
    /**
    * Get (and remove from the store) the MOC of given name loaded from a local file.
    * @param {string} name
    * @returns {MOC}
    */
    static getMocLoadedFromLocalFile(name) {
        var ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.moc_getMocLoadedFromLocalFile(ptr0, len0);
        return MOC.__wrap(ret);
    }
    /**
    * Creates a new empty MOC of given depth.
    * @param {number} depth
    * @returns {MOC}
    */
    static newEmpty(depth) {
        var ret = wasm.moc_newEmpty(depth);
        return MOC.__wrap(ret);
    }
    /**
    * Returns the type of the MOC.
    * @returns {any}
    */
    getType() {
        var ret = wasm.moc_getType(this.ptr);
        return takeObject(ret);
    }
    /**
    * Trigger a file dialog event and load the selected MOCs from selected file to a local storage.
    * You then have to use:
    * * `list_mocs_loaded_from_local_file`
    * * `get_moc_loaded_from_local_file`
    */
    static fromLocalFile() {
        wasm.moc_fromLocalFile();
    }
    /**
    * Create a MOC from its ASCII serialization
    *
    * # Arguments
    * * `data`: ASCII serialization
    * @param {string} data
    * @returns {MOC}
    */
    static fromAscii(data) {
        var ptr0 = passStringToWasm0(data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.moc_fromAscii(ptr0, len0);
        return MOC.__wrap(ret);
    }
    /**
    * WARNING: if this is not working, check e.g. with `wget -v -S ${url}` the the content type is
    * `Content-Type: text/plain`.
    * @param {string} url
    * @returns {Promise<MOC>}
    */
    static fromAsciiUrl(url) {
        var ptr0 = passStringToWasm0(url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.moc_fromAsciiUrl(ptr0, len0);
        return takeObject(ret);
    }
    /**
    * Create a MOC from its JSON serialization
    *
    * # Arguments
    * * `data`: JSON serialization
    * @param {string} data
    * @returns {MOC}
    */
    static fromJson(data) {
        var ptr0 = passStringToWasm0(data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.moc_fromJson(ptr0, len0);
        return MOC.__wrap(ret);
    }
    /**
    * WARNING: if this i not working, check e.g. with `wget -v -S ${url}` the the content type is
    * `Content-Type: application/json`.
    * @param {string} url
    * @returns {Promise<MOC>}
    */
    static fromJsonUrl(url) {
        var ptr0 = passStringToWasm0(url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.moc_fromJsonUrl(ptr0, len0);
        return takeObject(ret);
    }
    /**
    * Create a MOC from its FITS serialization
    *
    * # Arguments
    * * `data`: FITS serialization
    * @param {Uint8Array} data
    * @returns {MOC}
    */
    static fromFits(data) {
        var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.moc_fromFits(ptr0, len0);
        return MOC.__wrap(ret);
    }
    /**
    * # Arguments
    * * `url`: URL of the FITS file
    * * `accept_mime_types`: use `None` (Rust) or `null` (Javascript) to use the default `application/fits`
    * # WARNING
    *   If this is not working, check e.g. with `wget -v -S ${url}` the the content type is
    *   `Content-Type: application/fits`.
    *   Else use the `accept_mime_types` option to set the `Accept` HTTP request parameter, with e.g:
    *   * `application/fits` (default value)
    *   * `application/fits, application/octet-stream`
    * @param {string} url
    * @param {string | undefined} accept_mime_types
    * @returns {Promise<MOC>}
    */
    static fromFitsUrl(url, accept_mime_types) {
        var ptr0 = passStringToWasm0(url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(accept_mime_types) ? 0 : passStringToWasm0(accept_mime_types, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        var ret = wasm.moc_fromFitsUrl(ptr0, len0, ptr1, len1);
        return takeObject(ret);
    }
    /**
    * Returns the ASCII serialization of the MOC.
    *
    * # Arguments
    * * `fold`: fold option to limit the width of the string
    * @param {number | undefined} fold
    * @returns {any}
    */
    toAscii(fold) {
        var ret = wasm.moc_toAscii(this.ptr, !isLikeNone(fold), isLikeNone(fold) ? 0 : fold);
        return takeObject(ret);
    }
    /**
    * Returns the JSON serialization of the MOC.
    *
    * # Arguments
    * * `fold`: fold option to limit the width of the string
    * @param {number | undefined} fold
    * @returns {any}
    */
    toJson(fold) {
        var ret = wasm.moc_toJson(this.ptr, !isLikeNone(fold), isLikeNone(fold) ? 0 : fold);
        return takeObject(ret);
    }
    /**
    * Returns in memory the FITS serialization of the MOC.
    *
    * # Arguments
    * * `force_v1_compatibility`: for S-MOCs, force compatibility with Version 1 of the MOC standard.
    * @param {boolean | undefined} force_v1_compatibility
    * @returns {Uint8Array}
    */
    toFits(force_v1_compatibility) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.moc_toFits(retptr, this.ptr, isLikeNone(force_v1_compatibility) ? 0xFFFFFF : force_v1_compatibility ? 1 : 0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v0 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Download the ASCII serialization of the MOC.
    *
    * # Arguments
    * * `fold`: fold option to limit the width of the string
    * @param {number | undefined} fold
    */
    toAsciiFile(fold) {
        wasm.moc_toAsciiFile(this.ptr, !isLikeNone(fold), isLikeNone(fold) ? 0 : fold);
    }
    /**
    * Download the JSON serialization of the MOC.
    *
    * # Arguments
    * * `fold`: fold option to limit the width of the string
    * @param {number | undefined} fold
    */
    toJsonFile(fold) {
        wasm.moc_toJsonFile(this.ptr, !isLikeNone(fold), isLikeNone(fold) ? 0 : fold);
    }
    /**
    * Download the FITS serialization of the MOC.
    *
    * # Arguments
    * * `force_v1_compatibility`: for S-MOCs, force compatibility with Version 1 of the MOC standard.
    * @param {boolean | undefined} force_v1_compatibility
    */
    toFitsFile(force_v1_compatibility) {
        wasm.moc_toFitsFile(this.ptr, isLikeNone(force_v1_compatibility) ? 0xFFFFFF : force_v1_compatibility ? 1 : 0);
    }
    /**
    * Returns the MOC depth.
    * @returns {number}
    */
    getDepth() {
        var ret = wasm.moc_getDepth(this.ptr);
        return ret;
    }
    /**
    * @returns {number}
    */
    coveragePercentage() {
        var ret = wasm.moc_coveragePercentage(this.ptr);
        return ret;
    }
    /**
    * @returns {number}
    */
    nRanges() {
        var ret = wasm.moc_nRanges(this.ptr);
        return ret >>> 0;
    }
    /**
    * @returns {MOC}
    */
    not() {
        var ret = wasm.moc_not(this.ptr);
        return MOC.__wrap(ret);
    }
    /**
    * @returns {MOC}
    */
    complement() {
        var ret = wasm.moc_complement(this.ptr);
        return MOC.__wrap(ret);
    }
    /**
    * @param {number} new_depth
    * @returns {MOC}
    */
    degrade(new_depth) {
        var ret = wasm.moc_degrade(this.ptr, new_depth);
        return MOC.__wrap(ret);
    }
    /**
    * @param {MOC} rhs
    * @returns {MOC}
    */
    or(rhs) {
        _assertClass(rhs, MOC);
        var ret = wasm.moc_or(this.ptr, rhs.ptr);
        return MOC.__wrap(ret);
    }
    /**
    * @param {MOC} rhs
    * @returns {MOC}
    */
    union(rhs) {
        _assertClass(rhs, MOC);
        var ret = wasm.moc_union(this.ptr, rhs.ptr);
        return MOC.__wrap(ret);
    }
    /**
    * @param {MOC} rhs
    * @returns {MOC}
    */
    and(rhs) {
        _assertClass(rhs, MOC);
        var ret = wasm.moc_and(this.ptr, rhs.ptr);
        return MOC.__wrap(ret);
    }
    /**
    * @param {MOC} rhs
    * @returns {MOC}
    */
    intersection(rhs) {
        _assertClass(rhs, MOC);
        var ret = wasm.moc_intersection(this.ptr, rhs.ptr);
        return MOC.__wrap(ret);
    }
    /**
    * @param {MOC} rhs
    * @returns {MOC}
    */
    xor(rhs) {
        _assertClass(rhs, MOC);
        var ret = wasm.moc_xor(this.ptr, rhs.ptr);
        return MOC.__wrap(ret);
    }
    /**
    * @param {MOC} rhs
    * @returns {MOC}
    */
    symmetric_difference(rhs) {
        _assertClass(rhs, MOC);
        var ret = wasm.moc_symmetric_difference(this.ptr, rhs.ptr);
        return MOC.__wrap(ret);
    }
    /**
    * @param {MOC} rhs
    * @returns {MOC}
    */
    minus(rhs) {
        _assertClass(rhs, MOC);
        var ret = wasm.moc_minus(this.ptr, rhs.ptr);
        return MOC.__wrap(ret);
    }
    /**
    * @param {MOC} rhs
    * @returns {MOC}
    */
    difference(rhs) {
        _assertClass(rhs, MOC);
        var ret = wasm.moc_difference(this.ptr, rhs.ptr);
        return MOC.__wrap(ret);
    }
    /**
    * Trigger a file dialog event and load the selected multi-order map file to a local storage.
    * You then have to use:
    * * `list_mocs_loaded_from_local_file`
    * * `get_moc_loaded_from_local_file`
    *
    * # Warning
    * Because of security restriction, the call to this method
    * **"needs to be triggered within a code block that was the handler of a user-initiated event"**
    * @param {number} from_threshold
    * @param {number} to_threshold
    * @param {boolean} asc
    * @param {boolean} not_strict
    * @param {boolean} split
    * @param {boolean} revese_recursive_descent
    */
    static fromLocalMultiOrderMap(from_threshold, to_threshold, asc, not_strict, split, revese_recursive_descent) {
        wasm.moc_fromLocalMultiOrderMap(from_threshold, to_threshold, asc, not_strict, split, revese_recursive_descent);
    }
    /**
    * Trigger a file dialog event and load the selected skymap file to a local storage.
    * You then have to use:
    * * `list_mocs_loaded_from_local_file`
    * * `get_moc_loaded_from_local_file`
    *
    * # Warning
    * Because of security restriction, the call to this method
    * **"needs to be triggered within a code block that was the handler of a user-initiated event"**
    * @param {number} skip_values_le
    * @param {number} from_threshold
    * @param {number} to_threshold
    * @param {boolean} asc
    * @param {boolean} not_strict
    * @param {boolean} split
    * @param {boolean} revese_recursive_descent
    */
    static fromLocalSkymap(skip_values_le, from_threshold, to_threshold, asc, not_strict, split, revese_recursive_descent) {
        wasm.moc_fromLocalSkymap(skip_values_le, from_threshold, to_threshold, asc, not_strict, split, revese_recursive_descent);
    }
    /**
    * Create a MOC from the given cone.
    *
    * # Arguments
    * * `depth` - the MOC depth
    * * `lon_deg` - the longitude of the center of the cone, in degrees
    * * `lat_deg` - the latitude of the center of the cone, in degrees
    * * `radius_deg` - the radius of the cone, in degrees
    * * `delta_depth` - the difference between the MOC depth and the depth at which the computations
    *   are made (should remain quite small, default = 2).
    * @param {number} depth
    * @param {number} lon_deg
    * @param {number} lat_deg
    * @param {number} radius_deg
    * @param {number | undefined} delta_depth
    * @returns {MOC}
    */
    static fromCone(depth, lon_deg, lat_deg, radius_deg, delta_depth) {
        var ret = wasm.moc_fromCone(depth, lon_deg, lat_deg, radius_deg, isLikeNone(delta_depth) ? 0xFFFFFF : delta_depth);
        return MOC.__wrap(ret);
    }
    /**
    * Create a MOC from the given STC-S string.
    *
    * # Arguments
    * * `depth` - the MOC depth
    * * `ascii_stcs` - the STC-S string (see the MOC Lib Rust README file for WARNINGs about discrepancies from the standard).
    * * `delta_depth` - the difference between the MOC depth and the depth at which the computations
    *   are made (should remain quite small, default = 2).
    * @param {number} depth
    * @param {string} ascii_stcs
    * @param {number | undefined} delta_depth
    * @returns {MOC}
    */
    static fromSTCS(depth, ascii_stcs, delta_depth) {
        var ptr0 = passStringToWasm0(ascii_stcs, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.moc_fromSTCS(depth, ptr0, len0, isLikeNone(delta_depth) ? 0xFFFFFF : delta_depth);
        return MOC.__wrap(ret);
    }
    /**
    * Create a MOC from the given ring.
    *
    * # Arguments
    * * `depth` - the MOC depth
    * * `lon_deg` - the longitude of the center of the ring, in degrees
    * * `lat_deg` - the latitude of the center of the ring, in degrees
    * * `internal_radius_deg` - the internal radius of the ring, in degrees
    * * `external_radius_deg` - the external radius of the ring, in degrees
    * * `delta_depth` - the difference between the MOC depth and the depth at which the computations
    *   are made (should remain quite small).
    * @param {number} depth
    * @param {number} lon_deg
    * @param {number} lat_deg
    * @param {number} internal_radius_deg
    * @param {number} external_radius_deg
    * @param {number | undefined} delta_depth
    * @returns {MOC}
    */
    static fromRing(depth, lon_deg, lat_deg, internal_radius_deg, external_radius_deg, delta_depth) {
        var ret = wasm.moc_fromRing(depth, lon_deg, lat_deg, internal_radius_deg, external_radius_deg, isLikeNone(delta_depth) ? 0xFFFFFF : delta_depth);
        return MOC.__wrap(ret);
    }
    /**
    * Create a MOC from the given elliptical cone.
    *
    * # Arguments
    * * `depth` - the MOC depth
    * * `lon_deg` - the longitude of the center of the elliptical cone, in degrees
    * * `lat_deg` - the latitude of the center of the elliptical cone, in degrees
    * * `a_deg` - the semi-major axis of the elliptical cone, in degrees
    * * `b_deg` - the semi-minor axis of the elliptical cone, in degrees
    * * `pa_deg` - the position angle (i.e. the angle between the north and the semi-major axis, east-of-north), in degrees
    * * `delta_depth` - the difference between the MOC depth and the depth at which the computations
    *   are made (should remain quite small).
    * @param {number} depth
    * @param {number} lon_deg
    * @param {number} lat_deg
    * @param {number} a_deg
    * @param {number} b_deg
    * @param {number} pa_deg
    * @param {number | undefined} delta_depth
    * @returns {MOC}
    */
    static fromEllipse(depth, lon_deg, lat_deg, a_deg, b_deg, pa_deg, delta_depth) {
        var ret = wasm.moc_fromEllipse(depth, lon_deg, lat_deg, a_deg, b_deg, pa_deg, isLikeNone(delta_depth) ? 0xFFFFFF : delta_depth);
        return MOC.__wrap(ret);
    }
    /**
    * Create a MOC from the given zone.
    *
    * # Arguments
    * * `depth` - the MOC depth
    * * `lon_deg_min` - the longitude of the bottom left corner, in degrees
    * * `lat_deg_min` - the latitude of the bottom left corner, in degrees
    * * `lon_deg_max` - the longitude of the upper left corner, in degrees
    * * `lat_deg_max` - the latitude of the upper left corner, in degrees
    *
    * # Remark
    * - If `lon_min > lon_max` then we consider that the zone crosses the primary meridian.
    * - The north pole is included only if `lon_min == 0 && lat_max == pi/2`
    * @param {number} depth
    * @param {number} lon_deg_min
    * @param {number} lat_deg_min
    * @param {number} lon_deg_max
    * @param {number} lat_deg_max
    * @returns {MOC}
    */
    static fromZone(depth, lon_deg_min, lat_deg_min, lon_deg_max, lat_deg_max) {
        var ret = wasm.moc_fromZone(depth, lon_deg_min, lat_deg_min, lon_deg_max, lat_deg_max);
        return MOC.__wrap(ret);
    }
    /**
    * Create a MOC from the given box.
    *
    * # Arguments
    * * `depth` - the MOC depth
    * * `lon_deg` - the longitude of the center of the box, in degrees
    * * `lat_deg` - the latitude of the center of the box, in degrees
    * * `a_deg` - the semi-major axis of the box (half the box width), in degrees
    * * `b_deg` - the semi-minor axis of the box (half the box height), in degrees
    * * `pa_deg` - the position angle (i.e. the angle between the north and the semi-major axis, east-of-north), in degrees
    * @param {number} depth
    * @param {number} lon_deg
    * @param {number} lat_deg
    * @param {number} a_deg
    * @param {number} b_deg
    * @param {number} pa_deg
    * @returns {MOC}
    */
    static fromBox(depth, lon_deg, lat_deg, a_deg, b_deg, pa_deg) {
        var ret = wasm.moc_fromBox(depth, lon_deg, lat_deg, a_deg, b_deg, pa_deg);
        return MOC.__wrap(ret);
    }
    /**
    * Create a new MOC from the given polygon vertices.
    *
    * # Arguments
    * * `depth` - MOC maximum depth in `[0, 29]`
    * * `vertices` - vertices coordinates, in degrees `[lon_v1, lat_v1, lon_v2, lat_v2, ..., lon_vn, lat_vn]`
    * * `complement` - reverse the default inside/outside of the polygon
    * @param {number} depth
    * @param {Float64Array} vertices_deg
    * @param {boolean} complement
    * @returns {MOC}
    */
    static fromPolygon(depth, vertices_deg, complement) {
        var ptr0 = passArrayF64ToWasm0(vertices_deg, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.moc_fromPolygon(depth, ptr0, len0, complement);
        return MOC.__wrap(ret);
    }
    /**
    * Create a new MOC from the given list of coordinates (assumed to be equatorial)
    *
    * # Arguments
    * * `depth` - MOC maximum depth in `[0, 29]`
    * * `coos_deg` - list of coordinates in degrees `[lon_1, lat_1, lon_2, lat_2, ..., lon_n, lat_n]`
    * @param {number} depth
    * @param {Float64Array} coos_deg
    * @returns {MOC}
    */
    static fromCoo(depth, coos_deg) {
        var ptr0 = passArrayF64ToWasm0(coos_deg, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.moc_fromCoo(depth, ptr0, len0);
        return MOC.__wrap(ret);
    }
    /**
    * Create a new MOC from the given list of cone centers and radii
    * Adapted for a large number of small cones (a few cells each).
    *
    * # Arguments
    * * `depth` - MOC maximum depth in `[0, 29]`
    * * `delta_depth` - the difference between the MOC depth and the depth at which the computations
    *   are made (should remain quite small).
    * * `coos_and_radius_deg` - list of coordinates and radii in degrees ``[lon_1, lat_1, rad_1, lon_2, lat_2, rad_2, ..., lon_n, lat_n, rad_n]``
    * @param {number} depth
    * @param {number} delta_depth
    * @param {Float64Array} coos_and_radius_deg
    * @returns {MOC}
    */
    static fromSmallCones(depth, delta_depth, coos_and_radius_deg) {
        var ptr0 = passArrayF64ToWasm0(coos_and_radius_deg, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.moc_fromSmallCones(depth, delta_depth, ptr0, len0);
        return MOC.__wrap(ret);
    }
    /**
    * Create a new MOC from the given list of cone centers and radii
    * Adapted for a reasonable number of possibly large cones.
    *
    * # Arguments
    * * `depth` - MOC maximum depth in `[0, 29]`
    * * `delta_depth` - the difference between the MOC depth and the depth at which the computations
    *   are made (should remain quite small).
    * * `coos_and_radius_deg` - list of coordinates and radii in degrees
    *   `[lon_1, lat_1, rad_1, lon_2, lat_2, rad_2, ..., lon_n, lat_n, rad_n]`
    * @param {number} depth
    * @param {number} delta_depth
    * @param {Float64Array} coos_and_radius_deg
    * @returns {MOC}
    */
    static fromLargeCones(depth, delta_depth, coos_and_radius_deg) {
        var ptr0 = passArrayF64ToWasm0(coos_and_radius_deg, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.moc_fromLargeCones(depth, delta_depth, ptr0, len0);
        return MOC.__wrap(ret);
    }
    /**
    * Create a new S-MOC from the given lists of UNIQ and Values.
    *
    * # Arguments
    * * `depth` - S-MOC maximum depth in `[0, 29]`, Must be >= largest input cells depth.
    * * `density` - Input values are densities, i.e. they are not proportional to the area of their associated cells.
    * * `from_threshold` - Cumulative value at which we start putting cells in he MOC (often = 0).
    * * `to_threshold` - Cumulative value at which we stop putting cells in the MOC.
    * * `asc` - Compute cumulative value from ascending density values instead of descending (often = false).
    * * `not_strict` - Cells overlapping with the upper or the lower cumulative bounds are not rejected (often = false).
    * * `split` - Split recursively the cells overlapping the upper or the lower cumulative bounds (often = false).
    * * `revese_recursive_descent` - Perform the recursive descent from the highest to the lowest sub-cell, only with option 'split' (set both flags to be compatibile with Aladin)
    * * `uniqs` - array of uniq HEALPix cells
    * * `values` - array of values associated to the HEALPix cells
    * @param {number} depth
    * @param {boolean} density
    * @param {number} from_threshold
    * @param {number} to_threshold
    * @param {boolean} asc
    * @param {boolean} not_strict
    * @param {boolean} split
    * @param {boolean} revese_recursive_descent
    * @param {Float64Array} uniqs
    * @param {Float64Array} values
    * @returns {MOC}
    */
    static fromValuedCells(depth, density, from_threshold, to_threshold, asc, not_strict, split, revese_recursive_descent, uniqs, values) {
        var ptr0 = passArrayF64ToWasm0(uniqs, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = passArrayF64ToWasm0(values, wasm.__wbindgen_malloc);
        var len1 = WASM_VECTOR_LEN;
        var ret = wasm.moc_fromValuedCells(depth, density, from_threshold, to_threshold, asc, not_strict, split, revese_recursive_descent, ptr0, len0, ptr1, len1);
        return MOC.__wrap(ret);
    }
    /**
    * Create o S-MOC from a FITS multi-order map plus other parameters.
    *
    * # Arguments
    * * `from_threshold`: Cumulative value at which we start putting cells in he MOC (often = 0).
    * * `to_threshold`: Cumulative value at which we stop putting cells in the MOC.
    * * `asc`: Compute cumulative value from ascending density values instead of descending (often = false).
    * * `not_strict`: Cells overlapping with the upper or the lower cumulative bounds are not rejected (often = false).
    * * `split`: Split recursively the cells overlapping the upper or the lower cumulative bounds (often = false).
    * * `revese_recursive_descent`: Perform the recursive descent from the highest to the lowest sub-cell, only with option 'split' (set both flags to be compatibile with Aladin)
    * @param {Uint8Array} data
    * @param {number} from_threshold
    * @param {number} to_threshold
    * @param {boolean} asc
    * @param {boolean} not_strict
    * @param {boolean} split
    * @param {boolean} revese_recursive_descent
    * @returns {MOC}
    */
    static fromFitsMultiOrderMap(data, from_threshold, to_threshold, asc, not_strict, split, revese_recursive_descent) {
        var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.moc_fromFitsMultiOrderMap(ptr0, len0, from_threshold, to_threshold, asc, not_strict, split, revese_recursive_descent);
        return MOC.__wrap(ret);
    }
    /**
    * # Arguments
    * * `name`: name used to store the loaded MOC
    * * `url`: URL of the FITS file
    * * `...`: same paramters as `fromFitsMultiOrderMap`
    * * `accept_mime_types`: use `None` (Rust) or `null` (Javascript) to use the default `application/fits`
    * # WARNING
    *   If this is not working, check e.g. with `wget -v -S ${url}` the the content type is
    *   `Content-Type: application/fits`.
    *   Else use the `accept_mime_types` option to set the `Accept` HTTP request parameter, with e.g:
    *   * `application/fits` (default value)
    *   * `application/fits, application/octet-stream`
    * @param {string} url
    * @param {number} from_threshold
    * @param {number} to_threshold
    * @param {boolean} asc
    * @param {boolean} not_strict
    * @param {boolean} split
    * @param {boolean} revese_recursive_descent
    * @param {string | undefined} accept_mime_types
    * @returns {Promise<MOC>}
    */
    static fromMultiOrderMapFitsUrl(url, from_threshold, to_threshold, asc, not_strict, split, revese_recursive_descent, accept_mime_types) {
        var ptr0 = passStringToWasm0(url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(accept_mime_types) ? 0 : passStringToWasm0(accept_mime_types, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        var ret = wasm.moc_fromMultiOrderMapFitsUrl(ptr0, len0, from_threshold, to_threshold, asc, not_strict, split, revese_recursive_descent, ptr1, len1);
        return takeObject(ret);
    }
    /**
    * Create o S-MOC from a FITS skymap plus other parameters.
    *
    * # Arguments
    * * `skip_values_le`: skip cells associated to values lower or equal to the given value
    * * `from_threshold`: Cumulative value at which we start putting cells in he MOC (often = 0).
    * * `to_threshold`: Cumulative value at which we stop putting cells in the MOC.
    * * `asc`: Compute cumulative value from ascending density values instead of descending (often = false).
    * * `not_strict`: Cells overlapping with the upper or the lower cumulative bounds are not rejected (often = false).
    * * `split`: Split recursively the cells overlapping the upper or the lower cumulative bounds (often = false).
    * * `revese_recursive_descent`: Perform the recursive descent from the highest to the lowest sub-cell, only with option 'split' (set both flags to be compatibile with Aladin)
    * @param {Uint8Array} data
    * @param {number} skip_values_le
    * @param {number} from_threshold
    * @param {number} to_threshold
    * @param {boolean} asc
    * @param {boolean} not_strict
    * @param {boolean} split
    * @param {boolean} revese_recursive_descent
    * @returns {MOC}
    */
    static fromFitsSkymap(data, skip_values_le, from_threshold, to_threshold, asc, not_strict, split, revese_recursive_descent) {
        var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.moc_fromFitsSkymap(ptr0, len0, skip_values_le, from_threshold, to_threshold, asc, not_strict, split, revese_recursive_descent);
        return MOC.__wrap(ret);
    }
    /**
    * # Arguments
    * * `url`: URL of the FITS file
    * * `...`: same paramters as `fromFitsMultiOrderMap`
    * * `accept_mime_types`: use `None` (Rust) or `null` (Javascript) to use the default `application/fits`
    *
    * # WARNING
    *   If this is not working, check e.g. with `wget -v -S ${url}` the the content type is
    *   `Content-Type: application/fits`.
    *   Else use the `accept_mime_types` option to set the `Accept` HTTP request parameter, with e.g:
    *   * `application/fits` (default value)
    *   * `application/fits, application/octet-stream`
    * @param {string} url
    * @param {number} skip_values_le
    * @param {number} from_threshold
    * @param {number} to_threshold
    * @param {boolean} asc
    * @param {boolean} not_strict
    * @param {boolean} split
    * @param {boolean} revese_recursive_descent
    * @param {string | undefined} accept_mime_types
    * @returns {Promise<MOC>}
    */
    static fromSkymapFitsUrl(url, skip_values_le, from_threshold, to_threshold, asc, not_strict, split, revese_recursive_descent, accept_mime_types) {
        var ptr0 = passStringToWasm0(url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(accept_mime_types) ? 0 : passStringToWasm0(accept_mime_types, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        var ret = wasm.moc_fromSkymapFitsUrl(ptr0, len0, skip_values_le, from_threshold, to_threshold, asc, not_strict, split, revese_recursive_descent, ptr1, len1);
        return takeObject(ret);
    }
    /**
    * Returns an array of boolean (u8 set to 1 or 0) telling if the pairs of coordinates
    * in the input array are in (true=1) or out of (false=0) the S-MOC of given name.
    *
    * # Arguments
    * * `coos_deg` - list of coordinates in degrees `[lon_1, lat_1, lon_2, lat_2, ..., lon_n, lat_n]`
    *
    * # Remarks
    * The size of the returned boolean (u8) array his half the size of the input array
    * (since the later contains pairs of coordinates).
    * @param {Float64Array} coos_deg
    * @returns {Uint8Array}
    */
    filterCoos(coos_deg) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passArrayF64ToWasm0(coos_deg, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.moc_filterCoos(retptr, this.ptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Split the given disjoint S-MOC int joint S-MOCs.
    * Split "direct", i.e. we consider 2 neighboring cells to be the same only if the share an edge.
    * WARNING: may create a lot of new MOCs, exec `splitCount` first!!
    * @returns {any[]}
    */
    split() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.moc_split(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v0 = getArrayJsValueFromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 4);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Count the number of joint S-MOC splitting ("direct") the given disjoint S-MOC.
    * @returns {number}
    */
    splitCount() {
        var ret = wasm.moc_splitCount(this.ptr);
        return ret >>> 0;
    }
    /**
    * Split the given disjoint S-MOC int joint S-MOCs.
    * Split "indirect", i.e. we consider 2 neighboring cells to be the same if the share an edge
    * or a vertex.
    * WARNING: may create a lot of new MOCs, exec `splitIndirectCount` first!!
    * @returns {any[]}
    */
    splitIndirect() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.moc_splitIndirect(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v0 = getArrayJsValueFromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 4);
            return v0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Count the number of joint S-MOC splitting ("indirect") the given disjoint S-MOC.
    * @returns {number}
    */
    splitIndirectCount() {
        var ret = wasm.moc_splitIndirectCount(this.ptr);
        return ret >>> 0;
    }
    /**
    * Returns a new MOC having an additional external border made of depth max cells.
    * @returns {MOC}
    */
    extend() {
        var ret = wasm.moc_extend(this.ptr);
        return MOC.__wrap(ret);
    }
    /**
    * Returns a new MOC removing the internal border made of depth max cells.
    * @returns {MOC}
    */
    contract() {
        var ret = wasm.moc_contract(this.ptr);
        return MOC.__wrap(ret);
    }
    /**
    * Returns the external border made of depth max cells.
    * @returns {MOC}
    */
    externalBorder() {
        var ret = wasm.moc_externalBorder(this.ptr);
        return MOC.__wrap(ret);
    }
    /**
    * Returns the internal border made of depth max cells.
    * @returns {MOC}
    */
    internalBorder() {
        var ret = wasm.moc_internalBorder(this.ptr);
        return MOC.__wrap(ret);
    }
}
/**
*/
export class STMOC {

    static __wrap(ptr) {
        const obj = Object.create(STMOC.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_stmoc_free(ptr);
    }
    /**
    * Returns the MOCs identifiers (names) currently in the store (MOCs loaded from local files)
    * @returns {Array<any>}
    */
    static listMocsLoadedFromLocalFile() {
        var ret = wasm.stmoc_listMocsLoadedFromLocalFile();
        return takeObject(ret);
    }
    /**
    * Get (and remove from the store) the MOC of given name loaded from a local file.
    * @param {string} name
    * @returns {STMOC}
    */
    static getMocLoadedFromLocalFile(name) {
        var ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.stmoc_getMocLoadedFromLocalFile(ptr0, len0);
        return STMOC.__wrap(ret);
    }
    /**
    * @returns {number}
    */
    depth_time() {
        var ret = wasm.stmoc_depth_time(this.ptr);
        return ret;
    }
    /**
    * @returns {number}
    */
    depth_space() {
        var ret = wasm.stmoc_depth_space(this.ptr);
        return ret;
    }
    /**
    * Returns the type of the MOC.
    * @returns {any}
    */
    getType() {
        var ret = wasm.stmoc_getType(this.ptr);
        return takeObject(ret);
    }
    /**
    * Trigger a file dialog event and load the selected MOCs from selected file to a local storage.
    * You then have to use:
    * * `list_mocs_loaded_from_local_file`
    * * `get_moc_loaded_from_local_file`
    */
    static fromLocalFile() {
        wasm.stmoc_fromLocalFile();
    }
    /**
    * Create a MOC from its ASCII serialization
    *
    * # Arguments
    * * `data`: ASCII serialization
    * @param {string} data
    * @returns {STMOC}
    */
    static fromAscii(data) {
        var ptr0 = passStringToWasm0(data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.stmoc_fromAscii(ptr0, len0);
        return STMOC.__wrap(ret);
    }
    /**
    * WARNING: if this is not working, check e.g. with `wget -v -S ${url}` the the content type is
    * `Content-Type: text/plain`.
    * @param {string} url
    * @returns {Promise<STMOC>}
    */
    static fromAsciiUrl(url) {
        var ptr0 = passStringToWasm0(url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.stmoc_fromAsciiUrl(ptr0, len0);
        return takeObject(ret);
    }
    /**
    * Create a MOC from its JSON serialization
    *
    * # Arguments
    * * `data`: JSON serialization
    * @param {string} data
    * @returns {STMOC}
    */
    static fromJson(data) {
        var ptr0 = passStringToWasm0(data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.stmoc_fromJson(ptr0, len0);
        return STMOC.__wrap(ret);
    }
    /**
    * WARNING: if this i not working, check e.g. with `wget -v -S ${url}` the the content type is
    * `Content-Type: application/json`.
    * @param {string} url
    * @returns {Promise<STMOC>}
    */
    static fromJsonUrl(url) {
        var ptr0 = passStringToWasm0(url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.stmoc_fromJsonUrl(ptr0, len0);
        return takeObject(ret);
    }
    /**
    * Create a MOC from its FITS serialization
    *
    * # Arguments
    * * `data`: FITS serialization
    * @param {Uint8Array} data
    * @returns {STMOC}
    */
    static fromFits(data) {
        var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.stmoc_fromFits(ptr0, len0);
        return STMOC.__wrap(ret);
    }
    /**
    * # Arguments
    * * `url`: URL of the FITS file
    * * `accept_mime_types`: use `None` (Rust) or `null` (Javascript) to use the default `application/fits`
    * # WARNING
    *   If this is not working, check e.g. with `wget -v -S ${url}` the the content type is
    *   `Content-Type: application/fits`.
    *   Else use the `accept_mime_types` option to set the `Accept` HTTP request parameter, with e.g:
    *   * `application/fits` (default value)
    *   * `application/fits, application/octet-stream`
    * @param {string} url
    * @param {string | undefined} accept_mime_types
    * @returns {Promise<STMOC>}
    */
    static fromFitsUrl(url, accept_mime_types) {
        var ptr0 = passStringToWasm0(url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(accept_mime_types) ? 0 : passStringToWasm0(accept_mime_types, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        var ret = wasm.stmoc_fromFitsUrl(ptr0, len0, ptr1, len1);
        return takeObject(ret);
    }
    /**
    * Returns the union of the S-MOCs associated to T-MOCs intersecting the given T-MOC.
    * @param {TMOC} time_moc
    * @returns {MOC}
    */
    timeFold(time_moc) {
        _assertClass(time_moc, TMOC);
        var ret = wasm.stmoc_timeFold(this.ptr, time_moc.ptr);
        return MOC.__wrap(ret);
    }
    /**
    * Returns the union of the T-MOCs associated to S-MOCs intersecting the given S-MOC.
    * @param {MOC} space_moc
    * @returns {TMOC}
    */
    spaceFold(space_moc) {
        _assertClass(space_moc, MOC);
        var ret = wasm.stmoc_spaceFold(this.ptr, space_moc.ptr);
        return TMOC.__wrap(ret);
    }
}
/**
*/
export class TMOC {

    static __wrap(ptr) {
        const obj = Object.create(TMOC.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_tmoc_free(ptr);
    }
    /**
    * Returns the MOCs identifiers (names) currently in the store (MOCs loaded from local files)
    * @returns {Array<any>}
    */
    static listMocsLoadedFromLocalFile() {
        var ret = wasm.tmoc_listMocsLoadedFromLocalFile();
        return takeObject(ret);
    }
    /**
    * Get (and remove from the store) the MOC of given name loaded from a local file.
    * @param {string} name
    * @returns {TMOC}
    */
    static getMocLoadedFromLocalFile(name) {
        var ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.tmoc_getMocLoadedFromLocalFile(ptr0, len0);
        return TMOC.__wrap(ret);
    }
    /**
    * Creates a new empty T-MOC of given depth.
    * @param {number} depth
    * @returns {TMOC}
    */
    static newEmpty(depth) {
        var ret = wasm.tmoc_newEmpty(depth);
        return TMOC.__wrap(ret);
    }
    /**
    * Returns the type of the MOC.
    * @returns {any}
    */
    getType() {
        var ret = wasm.tmoc_getType(this.ptr);
        return takeObject(ret);
    }
    /**
    * Trigger a file dialog event and load the selected MOCs from selected file to a local storage.
    * You then have to use:
    * * `list_mocs_loaded_from_local_file`
    * * `get_moc_loaded_from_local_file`
    */
    static fromLocalFile() {
        wasm.tmoc_fromLocalFile();
    }
    /**
    * Create a MOC from its ASCII serialization
    *
    * # Arguments
    * * `data`: ASCII serialization
    * @param {string} data
    * @returns {TMOC}
    */
    static fromAscii(data) {
        var ptr0 = passStringToWasm0(data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.tmoc_fromAscii(ptr0, len0);
        return TMOC.__wrap(ret);
    }
    /**
    * WARNING: if this is not working, check e.g. with `wget -v -S ${url}` the the content type is
    * `Content-Type: text/plain`.
    * @param {string} url
    * @returns {Promise<TMOC>}
    */
    static fromAsciiUrl(url) {
        var ptr0 = passStringToWasm0(url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.tmoc_fromAsciiUrl(ptr0, len0);
        return takeObject(ret);
    }
    /**
    * Create a MOC from its JSON serialization
    *
    * # Arguments
    * * `data`: JSON serialization
    * @param {string} data
    * @returns {TMOC}
    */
    static fromJson(data) {
        var ptr0 = passStringToWasm0(data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.tmoc_fromJson(ptr0, len0);
        return TMOC.__wrap(ret);
    }
    /**
    * WARNING: if this i not working, check e.g. with `wget -v -S ${url}` the the content type is
    * `Content-Type: application/json`.
    * @param {string} url
    * @returns {Promise<TMOC>}
    */
    static fromJsonUrl(url) {
        var ptr0 = passStringToWasm0(url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.tmoc_fromJsonUrl(ptr0, len0);
        return takeObject(ret);
    }
    /**
    * Create a MOC from its FITS serialization
    *
    * # Arguments
    * * `data`: FITS serialization
    * @param {Uint8Array} data
    * @returns {TMOC}
    */
    static fromFits(data) {
        var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.tmoc_fromFits(ptr0, len0);
        return TMOC.__wrap(ret);
    }
    /**
    * # Arguments
    * * `url`: URL of the FITS file
    * * `accept_mime_types`: use `None` (Rust) or `null` (Javascript) to use the default `application/fits`
    * # WARNING
    *   If this is not working, check e.g. with `wget -v -S ${url}` the the content type is
    *   `Content-Type: application/fits`.
    *   Else use the `accept_mime_types` option to set the `Accept` HTTP request parameter, with e.g:
    *   * `application/fits` (default value)
    *   * `application/fits, application/octet-stream`
    * @param {string} url
    * @param {string | undefined} accept_mime_types
    * @returns {Promise<TMOC>}
    */
    static fromFitsUrl(url, accept_mime_types) {
        var ptr0 = passStringToWasm0(url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(accept_mime_types) ? 0 : passStringToWasm0(accept_mime_types, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        var ret = wasm.tmoc_fromFitsUrl(ptr0, len0, ptr1, len1);
        return takeObject(ret);
    }
    /**
    * Returns the MOC depth.
    * @returns {number}
    */
    getDepth() {
        var ret = wasm.tmoc_getDepth(this.ptr);
        return ret;
    }
    /**
    * @returns {number}
    */
    coveragePercentage() {
        var ret = wasm.tmoc_coveragePercentage(this.ptr);
        return ret;
    }
    /**
    * @returns {number}
    */
    nRanges() {
        var ret = wasm.tmoc_nRanges(this.ptr);
        return ret >>> 0;
    }
    /**
    * @returns {TMOC}
    */
    not() {
        var ret = wasm.tmoc_not(this.ptr);
        return TMOC.__wrap(ret);
    }
    /**
    * @returns {TMOC}
    */
    complement() {
        var ret = wasm.tmoc_complement(this.ptr);
        return TMOC.__wrap(ret);
    }
    /**
    * @param {number} new_depth
    * @returns {TMOC}
    */
    degrade(new_depth) {
        var ret = wasm.tmoc_degrade(this.ptr, new_depth);
        return TMOC.__wrap(ret);
    }
    /**
    * @param {TMOC} rhs
    * @returns {TMOC}
    */
    or(rhs) {
        _assertClass(rhs, TMOC);
        var ret = wasm.tmoc_or(this.ptr, rhs.ptr);
        return TMOC.__wrap(ret);
    }
    /**
    * @param {TMOC} rhs
    * @returns {TMOC}
    */
    union(rhs) {
        _assertClass(rhs, TMOC);
        var ret = wasm.tmoc_union(this.ptr, rhs.ptr);
        return TMOC.__wrap(ret);
    }
    /**
    * @param {TMOC} rhs
    * @returns {TMOC}
    */
    and(rhs) {
        _assertClass(rhs, TMOC);
        var ret = wasm.tmoc_and(this.ptr, rhs.ptr);
        return TMOC.__wrap(ret);
    }
    /**
    * @param {TMOC} rhs
    * @returns {TMOC}
    */
    intersection(rhs) {
        _assertClass(rhs, TMOC);
        var ret = wasm.tmoc_intersection(this.ptr, rhs.ptr);
        return TMOC.__wrap(ret);
    }
    /**
    * @param {TMOC} rhs
    * @returns {TMOC}
    */
    xor(rhs) {
        _assertClass(rhs, TMOC);
        var ret = wasm.tmoc_xor(this.ptr, rhs.ptr);
        return TMOC.__wrap(ret);
    }
    /**
    * @param {TMOC} rhs
    * @returns {TMOC}
    */
    symmetric_difference(rhs) {
        _assertClass(rhs, TMOC);
        var ret = wasm.tmoc_symmetric_difference(this.ptr, rhs.ptr);
        return TMOC.__wrap(ret);
    }
    /**
    * @param {TMOC} rhs
    * @returns {TMOC}
    */
    minus(rhs) {
        _assertClass(rhs, TMOC);
        var ret = wasm.tmoc_minus(this.ptr, rhs.ptr);
        return TMOC.__wrap(ret);
    }
    /**
    * @param {TMOC} rhs
    * @returns {TMOC}
    */
    difference(rhs) {
        _assertClass(rhs, TMOC);
        var ret = wasm.tmoc_difference(this.ptr, rhs.ptr);
        return TMOC.__wrap(ret);
    }
    /**
    * Create a new T-MOC from the given list of decimal Julian Days (JD) times.
    *
    * # Arguments
    * * `depth` - T-MOC maximum depth in `[0, 61]`
    * * `jd` - array of decimal JD time (`f64`)
    *
    * # WARNING
    * Using decimal Julian Days stored on `f64`, the precision does not reach the microsecond
    * since JD=0.
    * In Javascript, there is no `u64` type (integers are stored on the mantissa of
    * a double -- a `f64` --, which is made of 52 bits).
    * The other approach is to use a couple of `f64`: one for the integer part of the JD, the
    * other for the fractional part of the JD.
    * We will add such a method later if required by users.
    * @param {number} depth
    * @param {Float64Array} jd
    * @returns {TMOC}
    */
    static fromDecimalJDs(depth, jd) {
        var ptr0 = passArrayF64ToWasm0(jd, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.tmoc_fromDecimalJDs(depth, ptr0, len0);
        return TMOC.__wrap(ret);
    }
    /**
    * Create a new T-MOC from the given list of decimal Julian Days (JD) ranges.
    *
    * # Arguments
    * * `depth` - T-MOC maximum depth in `[0, 61]`
    * * `jd_ranges` - array of decimal JD ranges (`f64`): `[jd_min_1, jd_max_2, ..., jd_min_n, jd_max_n]`
    *
    * # WARNING
    * Using decimal Julian Days stored on `f64`, the precision does not reach the microsecond
    * since JD=0.
    * In Javascript, there is no `u64` type (integers are stored on the mantissa of
    * a double -- a `f64` --, which is made of 52 bits).
    * The other approach is to use a couple of `f64`: one for the integer part of the JD, the
    * other for the fractional part of the JD.
    * We will add such a method later if required by users.
    * @param {number} depth
    * @param {Float64Array} jd_ranges
    * @returns {TMOC}
    */
    static fromDecimalJDRanges(depth, jd_ranges) {
        var ptr0 = passArrayF64ToWasm0(jd_ranges, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.tmoc_fromDecimalJDRanges(depth, ptr0, len0);
        return TMOC.__wrap(ret);
    }
    /**
    * Returns an array of boolean (u8 set to 1 or 0) telling if the time (in Julian Days)
    * in the input array are in (true=1) or out of (false=0) the T-MOC of given name.
    *
    * # Arguments
    * * `jds`: array of decimal JD time (`f64`)
    *
    * # Remarks
    * The size of the returned boolean (u8) array his the same as the size of the input array.
    * @param {Float64Array} jds
    * @returns {Uint8Array}
    */
    filterJDs(jds) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = passArrayF64ToWasm0(jds, wasm.__wbindgen_malloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.tmoc_filterJDs(retptr, this.ptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}

async function load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

async function init(input) {
    if (typeof input === 'undefined') {
        input = new URL('moc_bg.wasm', import.meta.url);
    }
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
        var ret = getStringFromWasm0(arg0, arg1);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_moc_new = function(arg0) {
        var ret = MOC.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_stmoc_new = function(arg0) {
        var ret = STMOC.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
        takeObject(arg0);
    };
    imports.wbg.__wbg_tmoc_new = function(arg0) {
        var ret = TMOC.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_fmoc_new = function(arg0) {
        var ret = FMOC.__wrap(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_cb_drop = function(arg0) {
        const obj = takeObject(arg0).original;
        if (obj.cnt-- == 1) {
            obj.a = 0;
            return true;
        }
        var ret = false;
        return ret;
    };
    imports.wbg.__wbg_log_e4abb036edaf3c6a = function(arg0, arg1) {
        console.log(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbindgen_string_get = function(arg0, arg1) {
        const obj = getObject(arg1);
        var ret = typeof(obj) === 'string' ? obj : undefined;
        var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbg_instanceof_Window_b99429ec408dcb8d = function(arg0) {
        var ret = getObject(arg0) instanceof Window;
        return ret;
    };
    imports.wbg.__wbg_document_6d5890b86bbf5b96 = function(arg0) {
        var ret = getObject(arg0).document;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_fetch_e621ebce5e840cc0 = function(arg0, arg1) {
        var ret = getObject(arg0).fetch(getObject(arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_setAttribute_c44888e5d6dd5133 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        getObject(arg0).setAttribute(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_referrer_48ce6f0386fa8141 = function(arg0, arg1) {
        var ret = getObject(arg1).referrer;
        var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbg_body_25dc44f3e329890b = function(arg0) {
        var ret = getObject(arg0).body;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_createElement_1959ce882284e011 = function() { return handleError(function (arg0, arg1, arg2) {
        var ret = getObject(arg0).createElement(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_click_99cae34f1b6a23eb = function(arg0) {
        getObject(arg0).click();
    };
    imports.wbg.__wbg_newwithu8arraysequenceandoptions_acf052889cc5ff45 = function() { return handleError(function (arg0, arg1) {
        var ret = new Blob(getObject(arg0), getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_appendChild_27974267a42a0def = function() { return handleError(function (arg0, arg1) {
        var ret = getObject(arg0).appendChild(getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_removeChild_73ae1495cb167dcd = function() { return handleError(function (arg0, arg1) {
        var ret = getObject(arg0).removeChild(getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbindgen_object_clone_ref = function(arg0) {
        var ret = getObject(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_instanceof_HtmlAnchorElement_6c23614a9eac121e = function(arg0) {
        var ret = getObject(arg0) instanceof HTMLAnchorElement;
        return ret;
    };
    imports.wbg.__wbg_setdownload_443b95b717f62f6d = function(arg0, arg1, arg2) {
        getObject(arg0).download = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_sethref_1db15b68656da69e = function(arg0, arg1, arg2) {
        getObject(arg0).href = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_instanceof_HtmlInputElement_a8acc6294a4325d1 = function(arg0) {
        var ret = getObject(arg0) instanceof HTMLInputElement;
        return ret;
    };
    imports.wbg.__wbg_files_bd0c448cfede922a = function(arg0) {
        var ret = getObject(arg0).files;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_settype_8c7f99d4688c6c4b = function(arg0, arg1, arg2) {
        getObject(arg0).type = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_name_106fcc6131ecf5cc = function(arg0, arg1) {
        var ret = getObject(arg1).name;
        var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbg_instanceof_FileReader_3c5827b385eb106c = function(arg0) {
        var ret = getObject(arg0) instanceof FileReader;
        return ret;
    };
    imports.wbg.__wbg_result_cacc06ea89bf96b5 = function() { return handleError(function (arg0) {
        var ret = getObject(arg0).result;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_setonload_758d4a6f5f501550 = function(arg0, arg1) {
        getObject(arg0).onload = getObject(arg1);
    };
    imports.wbg.__wbg_new_30069f0a03abb54d = function() { return handleError(function () {
        var ret = new FileReader();
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_readAsArrayBuffer_1bb204d5dd40b5cf = function() { return handleError(function (arg0, arg1) {
        getObject(arg0).readAsArrayBuffer(getObject(arg1));
    }, arguments) };
    imports.wbg.__wbg_set_964d50110840b2c1 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        getObject(arg0).set(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_headers_ef96011450ae1b3e = function(arg0) {
        var ret = getObject(arg0).headers;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_newwithstrandinit_d9d8ffa577544082 = function() { return handleError(function (arg0, arg1, arg2) {
        var ret = new Request(getStringFromWasm0(arg0, arg1), getObject(arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_instanceof_Response_1ab2f2852729fd69 = function(arg0) {
        var ret = getObject(arg0) instanceof Response;
        return ret;
    };
    imports.wbg.__wbg_arrayBuffer_2e68fe9113afe60a = function() { return handleError(function (arg0) {
        var ret = getObject(arg0).arrayBuffer();
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_target_b7015f4034f433c2 = function(arg0) {
        var ret = getObject(arg0).target;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_addEventListener_957c027f76736fd0 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        getObject(arg0).addEventListener(getStringFromWasm0(arg1, arg2), getObject(arg3));
    }, arguments) };
    imports.wbg.__wbg_length_c6badbea7cb6b2ce = function(arg0) {
        var ret = getObject(arg0).length;
        return ret;
    };
    imports.wbg.__wbg_get_345f358214f6703a = function(arg0, arg1) {
        var ret = getObject(arg0)[arg1 >>> 0];
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_createObjectURL_9469d5c6a2acd795 = function() { return handleError(function (arg0, arg1) {
        var ret = URL.createObjectURL(getObject(arg1));
        var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    }, arguments) };
    imports.wbg.__wbg_revokeObjectURL_2e8bb9f841242381 = function() { return handleError(function (arg0, arg1) {
        URL.revokeObjectURL(getStringFromWasm0(arg0, arg1));
    }, arguments) };
    imports.wbg.__wbg_new_949bbc1147195c4e = function() {
        var ret = new Array();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_newnoargs_be86524d73f67598 = function(arg0, arg1) {
        var ret = new Function(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_call_888d259a5fefc347 = function() { return handleError(function (arg0, arg1) {
        var ret = getObject(arg0).call(getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_new_0b83d3df67ecb33e = function() {
        var ret = new Object();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_self_c6fbdfc2918d5e58 = function() { return handleError(function () {
        var ret = self.self;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_window_baec038b5ab35c54 = function() { return handleError(function () {
        var ret = window.window;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_globalThis_3f735a5746d41fbd = function() { return handleError(function () {
        var ret = globalThis.globalThis;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_global_1bc0b39582740e95 = function() { return handleError(function () {
        var ret = global.global;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbindgen_is_undefined = function(arg0) {
        var ret = getObject(arg0) === undefined;
        return ret;
    };
    imports.wbg.__wbg_push_284486ca27c6aa8b = function(arg0, arg1) {
        var ret = getObject(arg0).push(getObject(arg1));
        return ret;
    };
    imports.wbg.__wbg_call_346669c262382ad7 = function() { return handleError(function (arg0, arg1, arg2) {
        var ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_new_b1d61b5687f5e73a = function(arg0, arg1) {
        try {
            var state0 = {a: arg0, b: arg1};
            var cb0 = (arg0, arg1) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_244(a, state0.b, arg0, arg1);
                } finally {
                    state0.a = a;
                }
            };
            var ret = new Promise(cb0);
            return addHeapObject(ret);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_resolve_d23068002f584f22 = function(arg0) {
        var ret = Promise.resolve(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_then_2fcac196782070cc = function(arg0, arg1) {
        var ret = getObject(arg0).then(getObject(arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_then_8c2d62e8ae5978f7 = function(arg0, arg1, arg2) {
        var ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_buffer_397eaa4d72ee94dd = function(arg0) {
        var ret = getObject(arg0).buffer;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_4b9b8c4e3f5adbff = function(arg0, arg1, arg2) {
        var ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_a7ce447f15ff496f = function(arg0) {
        var ret = new Uint8Array(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_set_969ad0a60e51d320 = function(arg0, arg1, arg2) {
        getObject(arg0).set(getObject(arg1), arg2 >>> 0);
    };
    imports.wbg.__wbg_length_1eb8fc608a0d4cdb = function(arg0) {
        var ret = getObject(arg0).length;
        return ret;
    };
    imports.wbg.__wbg_set_82a4e8a85e31ac42 = function() { return handleError(function (arg0, arg1, arg2) {
        var ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_693216e109162396 = function() {
        var ret = new Error();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_stack_0ddaca5d1abfb52f = function(arg0, arg1) {
        var ret = getObject(arg1).stack;
        var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbg_error_09919627ac0992f5 = function(arg0, arg1) {
        try {
            console.error(getStringFromWasm0(arg0, arg1));
        } finally {
            wasm.__wbindgen_free(arg0, arg1);
        }
    };
    imports.wbg.__wbindgen_debug_string = function(arg0, arg1) {
        var ret = debugString(getObject(arg1));
        var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len0;
        getInt32Memory0()[arg0 / 4 + 0] = ptr0;
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbindgen_rethrow = function(arg0) {
        throw takeObject(arg0);
    };
    imports.wbg.__wbindgen_memory = function() {
        var ret = wasm.memory;
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper338 = function(arg0, arg1, arg2) {
        var ret = makeMutClosure(arg0, arg1, 116, __wbg_adapter_22);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_closure_wrapper1723 = function(arg0, arg1, arg2) {
        var ret = makeMutClosure(arg0, arg1, 285, __wbg_adapter_25);
        return addHeapObject(ret);
    };

    if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
        input = fetch(input);
    }



    const { instance, module } = await load(await input, imports);

    wasm = instance.exports;
    init.__wbindgen_wasm_module = module;
    wasm.__wbindgen_start();
    return wasm;
}

export default init;

