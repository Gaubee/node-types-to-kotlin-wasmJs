@file:JsModule("node:events")

package org.node.events

import org.node.AbortSignal
import org.node.async_hooks.AsyncResource
import org.node.async_hooks.AsyncResourceOptions

open external class EventEmitterAsyncResource(options: EventEmitterAsyncResourceOptions) :
    EventEmitter {

  fun emitDestroy(): Unit /* void */

  val asyncId: Int

  val triggerAsyncId: Int

  val asyncResource: EventEmitterReferencingAsyncResource
}

external interface Abortable {
  var signal: AbortSignal?
}

external interface EventEmitterReferencingAsyncResource : AsyncResource {
  val eventEmitter: EventEmitterAsyncResource
}

external interface EventEmitterAsyncResourceOptions : AsyncResourceOptions, EventEmitterOptions {
  var name: String
}
