@file:JsModule("node:async_hooks")

package org.node.async_hooks

external fun executionAsyncId(): Int

external fun executionAsyncResource(): JsAny /* object */

external fun triggerAsyncId(): Int

external fun createHook(callbacks: HookCallbacks): AsyncHook

open external class AsyncResource(
    type: String,
    triggerAsyncId: JsAny /* number | AsyncResourceOptions */
) {

  companion object {
    fun bind(fn: JsAny /* Func */, type: String, thisArg: JsAny /* ThisArg */): JsAny /* Func */
  }

  fun bind(fn: JsAny /* Func */): JsAny /* Func */

  fun runInAsyncScope(
      fn: JsAny /* (this: This, ...args: any[]) => Result */,
      thisArg: JsAny /* This */,
      vararg args: JsAny
  ): JsAny /* Result */

  fun emitDestroy(): AsyncResource /* this */

  fun asyncId(): Int

  fun triggerAsyncId(): Int
}

open external class AsyncLocalStorage() {

  companion object {
    fun bind(fn: JsAny /* Func */): JsAny /* Func */

    fun snapshot():
        JsAny /* <R, TArgs extends any[]>(fn: (...args: TArgs) => R, ...args: TArgs) => R */
  }

  fun disable(): Unit /* void */

  fun getStore(): JsAny? /* T */

  fun run(store: JsAny /* T */, callback: JsAny /* () => R */): JsAny /* R */

  fun run(
      store: JsAny /* T */,
      callback: JsAny /* (...args: TArgs) => R */,
      vararg args: JsAny
  ): JsAny /* R */

  fun exit(callback: JsAny /* (...args: TArgs) => R */, vararg args: JsAny): JsAny /* R */

  fun enterWith(store: JsAny /* T */): Unit /* void */
}

external interface HookCallbacks {
  val init:
      ((
          asyncId: Int,
          type: String,
          triggerAsyncId: Int,
          resource: JsAny /* object */) -> Unit /* void */)?

  val before: ((asyncId: Int) -> Unit /* void */)?

  val after: ((asyncId: Int) -> Unit /* void */)?

  val promiseResolve: ((asyncId: Int) -> Unit /* void */)?

  val destroy: ((asyncId: Int) -> Unit /* void */)?
}

external interface AsyncHook {
  fun enable(): AsyncHook /* this */

  fun disable(): AsyncHook /* this */
}

external interface AsyncResourceOptions {
  var triggerAsyncId: Int

  var requireManualDestroy: Boolean
}
