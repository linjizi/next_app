/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { Dispatcher } from "react-reconciler/src/ReactInternalTypes";
import type {
  ReactContext,
  StartTransitionOptions,
  Usable,
  Awaited,
} from "shared/ReactTypes";
import { REACT_CONSUMER_TYPE } from "shared/ReactSymbols";

import ReactSharedInternals from "shared/ReactSharedInternals";

type BasicStateAction<S> = ((S) => S) | S;
type Dispatch<A> = (A) => void;

function resolveDispatcher() {
  const dispatcher = ReactSharedInternals.H;
  // Will result in a null access error if accessed outside render phase. We
  // intentionally don't throw our own error because this is in a hot path.
  // Also helps ensure this is inlined.
  return ((dispatcher: any): Dispatcher);
}

export function getCacheForType<T>(resourceType: () => T): T {
  const dispatcher = ReactSharedInternals.A;
  if (!dispatcher) {
    // If there is no dispatcher, then we treat this as not being cached.
    return resourceType();
  }
  return dispatcher.getCacheForType(resourceType);
}

export function useContext<T>(Context: ReactContext<T>): T {
  const dispatcher = resolveDispatcher();
  return dispatcher.useContext(Context);
}

export function useState<S>(
  initialState: (() => S) | S
): [S, Dispatch<BasicStateAction<S>>] {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}

export function useReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: (I) => S
): [S, Dispatch<A>] {
  const dispatcher = resolveDispatcher();
  return dispatcher.useReducer(reducer, initialArg, init);
}

export function useRef<T>(initialValue: T): { current: T } {
  const dispatcher = resolveDispatcher();
  return dispatcher.useRef(initialValue);
}

export function useEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null
): void {
  const dispatcher = resolveDispatcher();
  return dispatcher.useEffect(create, deps);
}

export function useInsertionEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null
): void {
  const dispatcher = resolveDispatcher();
  return dispatcher.useInsertionEffect(create, deps);
}

export function useLayoutEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null
): void {
  const dispatcher = resolveDispatcher();
  return dispatcher.useLayoutEffect(create, deps);
}

export function useCallback<T>(
  callback: T,
  deps: Array<mixed> | void | null
): T {
  const dispatcher = resolveDispatcher();
  return dispatcher.useCallback(callback, deps);
}

export function useMemo<T>(
  create: () => T,
  deps: Array<mixed> | void | null
): T {
  const dispatcher = resolveDispatcher();
  return dispatcher.useMemo(create, deps);
}

export function useImperativeHandle<T>(
  ref: { current: T | null } | ((inst: T | null) => mixed) | null | void,
  create: () => T,
  deps: Array<mixed> | void | null
): void {
  const dispatcher = resolveDispatcher();
  return dispatcher.useImperativeHandle(ref, create, deps);
}

export function useDebugValue<T>(
  value: T,
  formatterFn: ?(value: T) => mixed
): void {
}

export function useTransition(): [
  boolean,
  (callback: () => void, options?: StartTransitionOptions) => void
] {
  const dispatcher = resolveDispatcher();
  return dispatcher.useTransition();
}

export function useDeferredValue<T>(value: T, initialValue?: T): T {
  const dispatcher = resolveDispatcher();
  return dispatcher.useDeferredValue(value, initialValue);
}

export function useId(): string {
  const dispatcher = resolveDispatcher();
  return dispatcher.useId();
}

export function useSyncExternalStore<T>(
  subscribe: (() => void) => () => void,
  getSnapshot: () => T,
  getServerSnapshot?: () => T
): T {
  const dispatcher = resolveDispatcher();
  return dispatcher.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
}

export function useCacheRefresh(): <T>(?() => T, ?T) => void {
  const dispatcher = resolveDispatcher();
  // $FlowFixMe[not-a-function] This is unstable, thus optional
  return dispatcher.useCacheRefresh();
}

export function use<T>(usable: Usable<T>): T {
  const dispatcher = resolveDispatcher();
  return dispatcher.use(usable);
}

export function useMemoCache(size: number): Array<mixed> {
  const dispatcher = resolveDispatcher();
  // $FlowFixMe[not-a-function] This is unstable, thus optional
  return dispatcher.useMemoCache(size);
}

export function useEffectEvent<Args, F: (...Array<Args>) => mixed>(
  callback: F
): F {
  const dispatcher = resolveDispatcher();
  // $FlowFixMe[not-a-function] This is unstable, thus optional
  return dispatcher.useEffectEvent(callback);
}

export function useOptimistic<S, A>(
  passthrough: S,
  reducer: ?(S, A) => S
): [S, (A) => void] {
  const dispatcher = resolveDispatcher();
  return dispatcher.useOptimistic(passthrough, reducer);
}

export function useActionState<S, P>(
  action: (Awaited<S>, P) => S,
  initialState: Awaited<S>,
  permalink?: string
): [Awaited<S>, (P) => void, boolean] {
  const dispatcher = resolveDispatcher();
  return dispatcher.useActionState(action, initialState, permalink);
}
