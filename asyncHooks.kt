@file:JsModule("async_hooks")

package org.node.asyncHooks

fun executionAsyncId(): Double

fun executionAsyncResource(): JsAny

fun triggerAsyncId(): Double

external interface HookCallbacks {}

external interface AsyncHook {}

fun createHook(callbacks: JsAny)

external interface AsyncResourceOptions {
  var triggerAsyncId: JsAny

  var requireManualDestroy: JsAny
}

external interface HookCallbacks {}

external interface AsyncHook {}

external interface AsyncResourceOptions {
  var triggerAsyncId: JsAny

  var requireManualDestroy: JsAny
}
