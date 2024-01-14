package org.node

import kotlin.js.Promise
import org.node.nodejs.Module as NodeJS_Module
import org.node.nodejs.Require as NodeJS_Require
import org.node.nodejs.RequireResolve as NodeJS_RequireResolve

external fun structuredClone(
    value: JsAny /* T */,
    transfer: JsAny /* { transfer: ReadonlyArray<import("worker_threads").TransferListItem> } */
): JsAny /* T */

external fun fetch(
    input: JsAny /* string | URL | Request */,
    init: RequestInit
): Promise<Response> /* Promise<Response> */

external interface ErrorConstructor {
  fun captureStackTrace(
      targetObject: JsAny /* object */,
      constructorOpt: JsAny /* Function */
  ): Unit /* void */

  var prepareStackTrace: JsAny? /* ((err: Error, stackTraces: NodeJS.CallSite[]) => any) */

  var stackTraceLimit: Int
}

external interface NodeRequire : NodeJS_Require {}

external interface RequireResolve : NodeJS_RequireResolve {}

external interface NodeModule : NodeJS_Module {}

external interface AbortController {
  val signal: AbortSignal

  fun abort(reason: JsAny /* any */): Unit /* void */
}

external interface AbortSignal : JsAny /* EventTarget */ {
  val aborted: Boolean

  val reason: JsAny /* any */

  var onabort: JsAny /* null | ((this: AbortSignal, event: Event) => any) */

  fun throwIfAborted(): Unit /* void */
}

external interface SymbolConstructor {
  val dispose: JsAny /* symbol */

  val asyncDispose: JsAny /* symbol */
}

external interface Disposable {}

external interface AsyncDisposable {}

external interface RelativeIndexable {
  fun at(index: Int): JsAny? /* T */
}

external interface String : JsAny /* RelativeIndexable<string> */ {}

external interface Array : JsAny /* RelativeIndexable<T> */ {}

external interface ReadonlyArray : JsAny /* RelativeIndexable<T> */ {}

external interface Int8Array : JsAny /* RelativeIndexable<number> */ {}

external interface Uint8Array : JsAny /* RelativeIndexable<number> */ {}

external interface Uint8ClampedArray : JsAny /* RelativeIndexable<number> */ {}

external interface Int16Array : JsAny /* RelativeIndexable<number> */ {}

external interface Uint16Array : JsAny /* RelativeIndexable<number> */ {}

external interface Int32Array : JsAny /* RelativeIndexable<number> */ {}

external interface Uint32Array : JsAny /* RelativeIndexable<number> */ {}

external interface Float32Array : JsAny /* RelativeIndexable<number> */ {}

external interface Float64Array : JsAny /* RelativeIndexable<number> */ {}

external interface BigInt64Array : JsAny /* RelativeIndexable<bigint> */ {}

external interface BigUint64Array : JsAny /* RelativeIndexable<bigint> */ {}

external interface RequestInit : JsAny /* _RequestInit */ {}

external interface Request : JsAny /* _Request */ {}

external interface ResponseInit : JsAny /* _ResponseInit */ {}

external interface Response : JsAny /* _Response */ {}

external interface FormData : JsAny /* _FormData */ {}

external interface Headers : JsAny /* _Headers */ {}

external interface File : JsAny /* _File */ {}
