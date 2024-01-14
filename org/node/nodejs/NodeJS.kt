package org.node.nodejs

import org.node.JsStringArray

external interface CallSite {
  fun getThis(): JsAny /* unknown */

  fun getTypeName(): String

  fun getFunction(): JsAny? /* Function */

  fun getFunctionName(): String

  fun getMethodName(): String

  fun getFileName(): String

  fun getLineNumber(): Int

  fun getColumnNumber(): Int

  fun getEvalOrigin(): String

  fun isToplevel(): Boolean

  fun isEval(): Boolean

  fun isNative(): Boolean

  fun isConstructor(): Boolean

  fun isAsync(): Boolean

  fun isPromiseAll(): Boolean

  fun getPromiseIndex(): Int

  fun getScriptNameOrSourceURL(): String

  fun getScriptHash(): String

  fun getEnclosingColumnNumber(): Int

  fun getEnclosingLineNumber(): Int

  fun getPosition(): Int
}

external interface ErrnoException : JsAny /* Error */ {
  var errno: Int

  var code: String

  var path: String

  var syscall: String
}

external interface ReadableStream : EventEmitter {
  var readable: Boolean

  fun read(size: Int): JsAny /* string | Buffer */

  fun setEncoding(encoding: JsAny /* BufferEncoding */): ReadableStream /* this */

  fun pause(): ReadableStream /* this */

  fun resume(): ReadableStream /* this */

  fun isPaused(): Boolean

  fun pipe(
      destination: JsAny /* T */,
      options: JsAny /* { end?: boolean | undefined } */
  ): JsAny /* T */

  fun unpipe(destination: WritableStream): ReadableStream /* this */

  fun unshift(
      chunk: JsAny /* string | Uint8Array */,
      encoding: JsAny /* BufferEncoding */
  ): Unit /* void */

  fun wrap(oldStream: ReadableStream): ReadableStream /* this */
}

external interface WritableStream : EventEmitter {
  var writable: Boolean

  fun write(
      buffer: JsAny /* Uint8Array | string */,
      cb: JsAny /* (err?: Error | null) => void */
  ): Boolean

  fun write(
      str: String,
      encoding: JsAny /* BufferEncoding */,
      cb: JsAny /* (err?: Error | null) => void */
  ): Boolean

  fun end(cb: JsAny /* () => void */): WritableStream /* this */

  fun end(
      data: JsAny /* string | Uint8Array */,
      cb: JsAny /* () => void */
  ): WritableStream /* this */

  fun end(
      str: String,
      encoding: JsAny /* BufferEncoding */,
      cb: JsAny /* () => void */
  ): WritableStream /* this */
}

external interface ReadWriteStream : ReadableStream, WritableStream {}

external interface RefCounted {
  fun ref(): RefCounted /* this */

  fun unref(): RefCounted /* this */
}

external interface Require {

  var resolve: RequireResolve

  var cache: JsAny /* Dict<NodeModule> */

  var extensions: RequireExtensions

  var main: Module?
}

external interface RequireResolve {

  fun paths(request: String): JsStringArray /* string[] */
}

external interface RequireExtensions : JsAny /* Dict<(m: Module, filename: string) => any> */ {}

external interface Module {
  var isPreloading: Boolean

  var exports: JsAny /* any */

  var require: Require

  var id: String

  var filename: String

  var loaded: Boolean

  var parent: JsAny? /* Module | null */

  var children: JsArray<*> /* Module[] */

  var path: String

  var paths: JsStringArray /* string[] */
}

external interface Dict {}

external interface ReadOnlyDict {}

external interface EventEmitter {

  fun addListener(
      eventName: JsAny /* string | symbol */,
      listener: JsAny /* (...args: any[]) => void */
  ): EventEmitter /* this */

  fun on(
      eventName: JsAny /* string | symbol */,
      listener: JsAny /* (...args: any[]) => void */
  ): EventEmitter /* this */

  fun once(
      eventName: JsAny /* string | symbol */,
      listener: JsAny /* (...args: any[]) => void */
  ): EventEmitter /* this */

  fun removeListener(
      eventName: JsAny /* string | symbol */,
      listener: JsAny /* (...args: any[]) => void */
  ): EventEmitter /* this */

  fun off(
      eventName: JsAny /* string | symbol */,
      listener: JsAny /* (...args: any[]) => void */
  ): EventEmitter /* this */

  fun removeAllListeners(event: JsAny /* string | symbol */): EventEmitter /* this */

  fun setMaxListeners(n: Int): EventEmitter /* this */

  fun getMaxListeners(): Int

  fun listeners(eventName: JsAny /* string | symbol */): JsArray<*> /* Function[] */

  fun rawListeners(eventName: JsAny /* string | symbol */): JsArray<*> /* Function[] */

  fun emit(eventName: JsAny /* string | symbol */, vararg args: JsAny): Boolean

  fun listenerCount(eventName: JsAny /* string | symbol */, listener: JsAny /* Function */): Int

  fun prependListener(
      eventName: JsAny /* string | symbol */,
      listener: JsAny /* (...args: any[]) => void */
  ): EventEmitter /* this */

  fun prependOnceListener(
      eventName: JsAny /* string | symbol */,
      listener: JsAny /* (...args: any[]) => void */
  ): EventEmitter /* this */

  fun eventNames(): JsArray<*> /* Array<string | symbol> */
}
