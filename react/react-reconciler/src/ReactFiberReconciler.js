/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Fiber,
  FiberRoot,
  SuspenseHydrationCallbacks,
  TransitionTracingCallbacks,
} from './ReactInternalTypes';
import type {RootTag} from './ReactRootTags';
import type {
  Container,
  PublicInstance,
  RendererInspectionConfig,
} from './ReactFiberConfig';
import type {ReactNodeList, ReactFormState} from 'shared/ReactTypes';
import type {Lane} from './ReactFiberLane';
import type {ActivityState} from './ReactFiberActivityComponent';
import type {SuspenseState} from './ReactFiberSuspenseComponent';

import {LegacyRoot} from './ReactRootTags';
import {
  findCurrentHostFiber,
  findCurrentHostFiberWithNoPortals,
} from './ReactFiberTreeReflection';
import {get as getInstance} from 'shared/ReactInstanceMap';
import {
  HostComponent,
  HostSingleton,
  ClassComponent,
  HostRoot,
  SuspenseComponent,
  ActivityComponent,
} from './ReactWorkTags';
import getComponentNameFromFiber from 'react-reconciler/src/getComponentNameFromFiber';
import isArray from 'shared/isArray';
import {
  enableSchedulingProfiler,
  enableHydrationLaneScheduling,
  disableLegacyMode,
} from 'shared/ReactFeatureFlags';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import {
  getPublicInstance,
  rendererVersion,
  rendererPackageName,
  extraDevToolsConfig,
} from './ReactFiberConfig';
import {
  findCurrentUnmaskedContext,
  processChildContext,
  emptyContextObject,
  isContextProvider as isLegacyContextProvider,
} from './ReactFiberLegacyContext';
import {createFiberRoot} from './ReactFiberRoot';
import {isRootDehydrated} from './ReactFiberShellHydration';
import {
  injectInternals,
  markRenderScheduled,
  onScheduleRoot,
  injectProfilingHooks,
} from './ReactFiberDevToolsHook';
import {startUpdateTimerByLane} from './ReactProfilerTimer';
import {
  requestUpdateLane,
  scheduleUpdateOnFiber,
  scheduleInitialHydrationOnRoot,
  flushRoot,
  batchedUpdates,
  flushSyncFromReconciler,
  flushSyncWork,
  isAlreadyRendering,
  deferredUpdates,
  discreteUpdates,
  flushPendingEffects,
} from './ReactFiberWorkLoop';
import {enqueueConcurrentRenderForLane} from './ReactFiberConcurrentUpdates';
import {
  createUpdate,
  enqueueUpdate,
  entangleTransitions,
} from './ReactFiberClassUpdateQueue';
import {
  isRendering as ReactCurrentFiberIsRendering,
  current as ReactCurrentFiberCurrent,
  runWithFiberInDEV,
} from './ReactCurrentFiber';
import {StrictLegacyMode} from './ReactTypeOfMode';
import {
  SyncLane,
  SelectiveHydrationLane,
  getHighestPriorityPendingLanes,
  higherPriorityLane,
  getBumpedLaneForHydrationByLane,
} from './ReactFiberLane';
import {
  scheduleRefresh,
  scheduleRoot,
  setRefreshHandler,
} from './ReactFiberHotReloading';
import ReactVersion from 'shared/ReactVersion';
export {createPortal} from './ReactPortal';
export {
  createComponentSelector,
  createHasPseudoClassSelector,
  createRoleSelector,
  createTestNameSelector,
  createTextSelector,
  getFindAllNodesFailureDescription,
  findAllNodes,
  findBoundingRects,
  focusWithin,
  observeVisibleRects,
} from './ReactTestSelectors';
export {startHostTransition} from './ReactFiberHooks';
export {
  defaultOnUncaughtError,
  defaultOnCaughtError,
  defaultOnRecoverableError,
} from './ReactFiberErrorLogger';
import {getLabelForLane, TotalLanes} from 'react-reconciler/src/ReactFiberLane';
import {registerDefaultIndicator} from './ReactFiberAsyncAction';

type OpaqueRoot = FiberRoot;

let didWarnAboutNestedUpdates;
let didWarnAboutFindNodeInStrictMode;

function getContextForSubtree(
  parentComponent: ?React$Component<any, any>,
): Object {
  if (!parentComponent) {
    return emptyContextObject;
  }

  const fiber = getInstance(parentComponent);
  const parentContext = findCurrentUnmaskedContext(fiber);

  if (fiber.tag === ClassComponent) {
    const Component = fiber.type;
    if (isLegacyContextProvider(Component)) {
      return processChildContext(fiber, Component, parentContext);
    }
  }

  return parentContext;
}

function findHostInstance(component: Object): PublicInstance | null {
  const fiber = getInstance(component);
  if (fiber === undefined) {
    if (typeof component.render === 'function') {
      throw new Error('Unable to find node on an unmounted component.');
    } else {
      const keys = Object.keys(component).join(',');
      throw new Error(
        `Argument appears to not be a ReactComponent. Keys: ${keys}`,
      );
    }
  }
  const hostFiber = findCurrentHostFiber(fiber);
  if (hostFiber === null) {
    return null;
  }
  return getPublicInstance(hostFiber.stateNode);
}

function findHostInstanceWithWarning(
  component: Object,
  methodName: string,
): PublicInstance | null {
  return findHostInstance(component);
}

export function createContainer(
  containerInfo: Container,
  tag: RootTag,
  hydrationCallbacks: null | SuspenseHydrationCallbacks,
  isStrictMode: boolean,
  // TODO: Remove `concurrentUpdatesByDefaultOverride`. It is now ignored.
  concurrentUpdatesByDefaultOverride: null | boolean,
  identifierPrefix: string,
  onUncaughtError: (
    error: mixed,
    errorInfo: {+componentStack?: ?string},
  ) => void,
  onCaughtError: (
    error: mixed,
    errorInfo: {
      +componentStack?: ?string,
      +errorBoundary?: ?React$Component<any, any>,
    },
  ) => void,
  onRecoverableError: (
    error: mixed,
    errorInfo: {+componentStack?: ?string},
  ) => void,
  onDefaultTransitionIndicator: () => void | (() => void),
  transitionCallbacks: null | TransitionTracingCallbacks,
): OpaqueRoot {
  // 浏览器端渲染，hydrate标记为false
  const hydrate = false;
  const initialChildren = null;
  const root = createFiberRoot(
    containerInfo,
    tag,
    hydrate,
    initialChildren,
    hydrationCallbacks,
    isStrictMode,
    identifierPrefix,
    null,
    onUncaughtError,
    onCaughtError,
    onRecoverableError,
    onDefaultTransitionIndicator,
    transitionCallbacks,
  );
  registerDefaultIndicator(onDefaultTransitionIndicator);
  return root;
}

export function createHydrationContainer(
  initialChildren: ReactNodeList,
  // TODO: Remove `callback` when we delete legacy mode.
  callback: ?Function,
  containerInfo: Container,
  tag: RootTag,
  hydrationCallbacks: null | SuspenseHydrationCallbacks,
  isStrictMode: boolean,
  // TODO: Remove `concurrentUpdatesByDefaultOverride`. It is now ignored.
  concurrentUpdatesByDefaultOverride: null | boolean,
  identifierPrefix: string,
  onUncaughtError: (
    error: mixed,
    errorInfo: {+componentStack?: ?string},
  ) => void,
  onCaughtError: (
    error: mixed,
    errorInfo: {
      +componentStack?: ?string,
      +errorBoundary?: ?React$Component<any, any>,
    },
  ) => void,
  onRecoverableError: (
    error: mixed,
    errorInfo: {+componentStack?: ?string},
  ) => void,
  onDefaultTransitionIndicator: () => void | (() => void),
  transitionCallbacks: null | TransitionTracingCallbacks,
  formState: ReactFormState<any, any> | null,
): OpaqueRoot {
  const hydrate = true;
  const root = createFiberRoot(
    containerInfo,
    tag,
    hydrate,
    initialChildren,
    hydrationCallbacks,
    isStrictMode,
    identifierPrefix,
    formState,
    onUncaughtError,
    onCaughtError,
    onRecoverableError,
    onDefaultTransitionIndicator,
    transitionCallbacks,
  );

  registerDefaultIndicator(onDefaultTransitionIndicator);

  // TODO: Move this to FiberRoot constructor
  root.context = getContextForSubtree(null);

  // Schedule the initial render. In a hydration root, this is different from
  // a regular update because the initial render must match was was rendered
  // on the server.
  // NOTE: This update intentionally doesn't have a payload. We're only using
  // the update to schedule work on the root fiber (and, for legacy roots, to
  // enqueue the callback if one is provided).
  const current = root.current;
  let lane = requestUpdateLane(current);
  if (enableHydrationLaneScheduling) {
    lane = getBumpedLaneForHydrationByLane(lane);
  }
  const update = createUpdate(lane);
  update.callback =
    callback !== undefined && callback !== null ? callback : null;
  enqueueUpdate(current, update, lane);
  scheduleInitialHydrationOnRoot(root, lane);

  return root;
}

export function updateContainer(
  element: ReactNodeList,
  container: OpaqueRoot,
  parentComponent: ?React$Component<any, any>,
  callback: ?Function,
): Lane {
  const current = container.current;
  const lane = requestUpdateLane(current);
  updateContainerImpl(
    current,
    lane,
    element,
    container,
    parentComponent,
    callback,
  );
  return lane;
}

export function updateContainerSync(
  element: ReactNodeList,
  container: OpaqueRoot,
  parentComponent: ?React$Component<any, any>,
  callback: ?Function,
): Lane {
  if (!disableLegacyMode && container.tag === LegacyRoot) {
    flushPendingEffects();
  }
  const current = container.current;
  updateContainerImpl(
    current,
    SyncLane,
    element,
    container,
    parentComponent,
    callback,
  );
  return SyncLane;
}

function updateContainerImpl(
  rootFiber: Fiber,
  lane: Lane,
  element: ReactNodeList,
  container: OpaqueRoot,
  parentComponent: ?React$Component<any, any>,
  callback: ?Function,
): void {

  // enableSchedulingProfiler：false
  if (enableSchedulingProfiler) {
    markRenderScheduled(lane);
  }

  const context = getContextForSubtree(parentComponent);
  if (container.context === null) {
    container.context = context;
  } else {
    container.pendingContext = context;
  }

  const update = createUpdate(lane);
  // Caution: React DevTools currently depends on this property
  // being called "element".
  update.payload = {element};

  callback = callback === undefined ? null : callback;
  if (callback !== null) {
    update.callback = callback;
  }

  const root = enqueueUpdate(rootFiber, update, lane);
  if (root !== null) {
    startUpdateTimerByLane(lane, 'root.render()');
    // root.pendingLanes = 32 && firstScheduledRoot = lastScheduledRoot = root;
    scheduleUpdateOnFiber(root, rootFiber, lane);
    entangleTransitions(root, rootFiber, lane);
  }
}

export {
  batchedUpdates,
  deferredUpdates,
  discreteUpdates,
  flushSyncFromReconciler,
  flushSyncWork,
  isAlreadyRendering,
  flushPendingEffects as flushPassiveEffects,
};

export function getPublicRootInstance(
  container: OpaqueRoot,
): React$Component<any, any> | PublicInstance | null {
  const containerFiber = container.current;
  if (!containerFiber.child) {
    return null;
  }
  switch (containerFiber.child.tag) {
    case HostSingleton:
    case HostComponent:
      return getPublicInstance(containerFiber.child.stateNode);
    default:
      return containerFiber.child.stateNode;
  }
}

export function attemptSynchronousHydration(fiber: Fiber): void {
  switch (fiber.tag) {
    case HostRoot: {
      const root: FiberRoot = fiber.stateNode;
      if (isRootDehydrated(root)) {
        // Flush the first scheduled "update".
        const lanes = getHighestPriorityPendingLanes(root);
        flushRoot(root, lanes);
      }
      break;
    }
    case ActivityComponent:
    case SuspenseComponent: {
      const root = enqueueConcurrentRenderForLane(fiber, SyncLane);
      if (root !== null) {
        scheduleUpdateOnFiber(root, fiber, SyncLane);
      }
      flushSyncWork();
      // If we're still blocked after this, we need to increase
      // the priority of any promises resolving within this
      // boundary so that they next attempt also has higher pri.
      const retryLane = SyncLane;
      markRetryLaneIfNotHydrated(fiber, retryLane);
      break;
    }
  }
}

function markRetryLaneImpl(fiber: Fiber, retryLane: Lane) {
  const suspenseState: null | SuspenseState | ActivityState =
    fiber.memoizedState;
  if (suspenseState !== null && suspenseState.dehydrated !== null) {
    suspenseState.retryLane = higherPriorityLane(
      suspenseState.retryLane,
      retryLane,
    );
  }
}

// Increases the priority of thenables when they resolve within this boundary.
function markRetryLaneIfNotHydrated(fiber: Fiber, retryLane: Lane) {
  markRetryLaneImpl(fiber, retryLane);
  const alternate = fiber.alternate;
  if (alternate) {
    markRetryLaneImpl(alternate, retryLane);
  }
}

export function attemptContinuousHydration(fiber: Fiber): void {
  if (fiber.tag !== SuspenseComponent && fiber.tag !== ActivityComponent) {
    // We ignore HostRoots here because we can't increase
    // their priority and they should not suspend on I/O,
    // since you have to wrap anything that might suspend in
    // Suspense.
    return;
  }
  const lane = SelectiveHydrationLane;
  const root = enqueueConcurrentRenderForLane(fiber, lane);
  if (root !== null) {
    scheduleUpdateOnFiber(root, fiber, lane);
  }
  markRetryLaneIfNotHydrated(fiber, lane);
}

export function attemptHydrationAtCurrentPriority(fiber: Fiber): void {
  if (fiber.tag !== SuspenseComponent && fiber.tag !== ActivityComponent) {
    // We ignore HostRoots here because we can't increase
    // their priority other than synchronously flush it.
    return;
  }
  let lane = requestUpdateLane(fiber);
  if (enableHydrationLaneScheduling) {
    lane = getBumpedLaneForHydrationByLane(lane);
  }
  const root = enqueueConcurrentRenderForLane(fiber, lane);
  if (root !== null) {
    scheduleUpdateOnFiber(root, fiber, lane);
  }
  markRetryLaneIfNotHydrated(fiber, lane);
}

export {findHostInstance};

export {findHostInstanceWithWarning};

export function findHostInstanceWithNoPortals(
  fiber: Fiber,
): PublicInstance | null {
  const hostFiber = findCurrentHostFiberWithNoPortals(fiber);
  if (hostFiber === null) {
    return null;
  }
  return getPublicInstance(hostFiber.stateNode);
}

let shouldErrorImpl: Fiber => ?boolean = fiber => null;

export function shouldError(fiber: Fiber): ?boolean {
  return shouldErrorImpl(fiber);
}

let shouldSuspendImpl = (fiber: Fiber) => false;

export function shouldSuspend(fiber: Fiber): boolean {
  return shouldSuspendImpl(fiber);
}

let overrideHookState = null;
let overrideHookStateDeletePath = null;
let overrideHookStateRenamePath = null;
let overrideProps = null;
let overridePropsDeletePath = null;
let overridePropsRenamePath = null;
let scheduleUpdate = null;
let setErrorHandler = null;
let setSuspenseHandler = null;

function getCurrentFiberForDevTools() {
  return ReactCurrentFiberCurrent;
}

function getLaneLabelMap(): Map<Lane, string> | null {
  if (enableSchedulingProfiler) {
    const map: Map<Lane, string> = new Map();

    let lane = 1;
    for (let index = 0; index < TotalLanes; index++) {
      const label = ((getLabelForLane(lane): any): string);
      map.set(lane, label);
      lane *= 2;
    }

    return map;
  } else {
    return null;
  }
}

export function injectIntoDevTools(): boolean {
  const internals: Object = {
    bundleType: 0, // Might add PROFILE later.
    version: rendererVersion,
    rendererPackageName: rendererPackageName,
    currentDispatcherRef: ReactSharedInternals,
    // Enables DevTools to detect reconciler version rather than renderer version
    // which may not match for third party renderers.
    reconcilerVersion: ReactVersion,
  };
  if (extraDevToolsConfig !== null) {
    internals.rendererConfig = (extraDevToolsConfig: RendererInspectionConfig);
  }
  if (enableSchedulingProfiler) {
    // Conditionally inject these hooks only if Timeline profiler is supported by this build.
    // This gives DevTools a way to feature detect that isn't tied to version number
    // (since profiling and timeline are controlled by different feature flags).
    internals.getLaneLabelMap = getLaneLabelMap;
    internals.injectProfilingHooks = injectProfilingHooks;
  }
  return injectInternals(internals);
}
