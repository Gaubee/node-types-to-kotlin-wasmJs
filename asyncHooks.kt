@file:JsModule("node:async_hooks")

package org.node.asyncHooks

external fun executionAsyncId(): Int /* number */

external fun executionAsyncResource(): JsAny /* object */

external fun triggerAsyncId(): Int /* number */

external interface HookCallbacks {
  val init:
      ((
          asyncId: Int /* number */,
          type: String /* string */,
          triggerAsyncId: Int /* number */,
          resource: JsAny /* object */) -> Unit /* void */)?

  val before: ((asyncId: Int /* number */) -> Unit /* void */)?

  val after: ((asyncId: Int /* number */) -> Unit /* void */)?

  val promiseResolve: ((asyncId: Int /* number */) -> Unit /* void */)?

  val destroy: ((asyncId: Int /* number */) -> Unit /* void */)?
}

external interface AsyncHook {
  fun enable(): JsAny /* this */

  fun disable(): JsAny /* this */
}

external fun createHook(callbacks: HookCallbacks /* HookCallbacks */): AsyncHook /* AsyncHook */

external interface AsyncResourceOptions {
  var triggerAsyncId: JsAny /* any */

  var requireManualDestroy: JsAny /* any */
}

external class AsyncResource(
    type: String /* string */,
    triggerAsyncId: JsAny /* number | AsyncResourceOptions */
) {

  companion object {
    fun bind(
        fn: JsAny /* Func */,
        type: String /* string */,
        thisArg: JsAny /* ThisArg */
    ): JsAny /* Func */
  }

  fun bind(fn: JsAny /* Func */): JsAny /* Func */

  fun runInAsyncScope(
      fn: JsAny /* (this: This, ...args: any[]) => Result */,
      thisArg: JsAny /* This */,
      vararg args: JsAny
  ): JsAny /* Result */

  fun emitDestroy(): JsAny /* this */

  fun asyncId(): Int /* number */

  fun triggerAsyncId(): Int /* number */
}

external class AsyncLocalStorage() {

  companion object {
    fun bind(fn: JsAny /* Func */): JsAny /* Func */

    fun snapshot():
        JsAny /* <R, TArgs extends any[]>(fn: (...args: TArgs) => R, ...args: TArgs) => R */
  }

  fun disable(): Unit /* void */

  fun getStore(): JsAny? /* T | undefined */

  fun run(store: JsAny /* T */, callback: JsAny /* () => R */): JsAny /* R */

  fun run(
      store: JsAny /* T */,
      callback: JsAny /* (...args: TArgs) => R */,
      vararg args: JsAny
  ): JsAny /* R */

  fun exit(callback: JsAny /* (...args: TArgs) => R */, vararg args: JsAny): JsAny /* R */

  fun enterWith(store: JsAny /* T */): Unit /* void */
}
