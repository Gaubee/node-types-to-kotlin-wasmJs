@file:JsModule("node:events")

package org.node.events

import kotlin.js.Promise
import org.node.AbortSignal
import org.node.Disposable
import org.node.nodejs.EventEmitter as NodeJS_EventEmitter

open external class EventEmitter(options: EventEmitterOptions) {

  companion object {
    fun once(
        emitter: _NodeEventTarget,
        eventName: JsAny /* string | symbol */,
        options: StaticEventEmitterOptions
    ): Promise<*> /* Promise<any[]> */

    fun once(
        emitter: _DOMEventTarget,
        eventName: String,
        options: StaticEventEmitterOptions
    ): Promise<*> /* Promise<any[]> */

    fun on(
        emitter: NodeJS_EventEmitter,
        eventName: String,
        options: StaticEventEmitterOptions
    ): JsAny /* AsyncIterableIterator<any> */

    fun listenerCount(emitter: NodeJS_EventEmitter, eventName: JsAny /* string | symbol */): Int

    fun getEventListeners(
        emitter: JsAny /* _DOMEventTarget | NodeJS.EventEmitter */,
        name: JsAny /* string | symbol */
    ): JsArray<*> /* Function[] */

    fun getMaxListeners(emitter: JsAny /* _DOMEventTarget | NodeJS.EventEmitter */): Int

    fun setMaxListeners(n: Int, vararg eventTargets: JsAny): Unit /* void */

    fun addAbortListener(
        signal: AbortSignal,
        resource: JsAny /* (event: Event) => void */
    ): Disposable

    val errorMonitor: JsAny /* symbol */

    val captureRejectionSymbol: JsAny /* symbol */

    var captureRejections: Boolean

    var defaultMaxListeners: Int
  }

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

external interface EventEmitterOptions {
  var captureRejections: Boolean
}

external interface _NodeEventTarget {
  fun once(
      eventName: JsAny /* string | symbol */,
      listener: JsAny /* (...args: any[]) => void */
  ): _NodeEventTarget /* this */
}

external interface _DOMEventTarget {
  fun addEventListener(
      eventName: String,
      listener: JsAny /* (...args: any[]) => void */,
      opts: JsAny /* {
                once: boolean;
            } */
  ): JsAny /* any */
}

external interface StaticEventEmitterOptions {
  var signal: AbortSignal?
}
