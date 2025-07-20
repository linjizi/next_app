/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { Fiber } from "./ReactInternalTypes";
import type { StackCursor } from "./ReactFiberStack";

import { ClassComponent, HostRoot } from "./ReactWorkTags";
import getComponentNameFromFiber from "react-reconciler/src/getComponentNameFromFiber";

import { createCursor, push, pop } from "./ReactFiberStack";

let warnedAboutMissingGetChildContext;

if (false) {
  warnedAboutMissingGetChildContext = ({}: { [string]: boolean });
}

export const emptyContextObject: {} = {};
if (false) {
  Object.freeze(emptyContextObject);
}

// A cursor to the current merged context object on the stack.
const contextStackCursor: StackCursor<Object> =
  createCursor(emptyContextObject);
// A cursor to a boolean indicating whether the context has changed.
const didPerformWorkStackCursor: StackCursor<boolean> = createCursor(false);
// Keep track of the previous context object that was on the stack.
// We use this to get access to the parent context after we have already
// pushed the next context provider, and now need to merge their contexts.
let previousContext: Object = emptyContextObject;

function getUnmaskedContext(
  workInProgress: Fiber,
  Component: Function,
  didPushOwnContextIfProvider: boolean
): Object {
  return emptyContextObject;
}

function cacheContext(
  workInProgress: Fiber,
  unmaskedContext: Object,
  maskedContext: Object
): void {
  return;
}

function getMaskedContext(
  workInProgress: Fiber,
  unmaskedContext: Object
): Object {
  return emptyContextObject;
}

function hasContextChanged(): boolean {
  return false;
}

function isContextProvider(type: Function): boolean {
  return false;
}

function popContext(fiber: Fiber): void {
  return;
}

function popTopLevelContextObject(fiber: Fiber): void {
  return;
}

function pushTopLevelContextObject(
  fiber: Fiber,
  context: Object,
  didChange: boolean
): void {
  return;
}

function processChildContext(
  fiber: Fiber,
  type: any,
  parentContext: Object
): Object {
  return parentContext;
}

function pushContextProvider(workInProgress: Fiber): boolean {
  return false;
}

function invalidateContextProvider(
  workInProgress: Fiber,
  type: any,
  didChange: boolean
): void {
  return;
}

function findCurrentUnmaskedContext(fiber: Fiber): Object {
  return emptyContextObject;
}

export {
  getUnmaskedContext,
  cacheContext,
  getMaskedContext,
  hasContextChanged,
  popContext,
  popTopLevelContextObject,
  pushTopLevelContextObject,
  processChildContext,
  isContextProvider,
  pushContextProvider,
  invalidateContextProvider,
  findCurrentUnmaskedContext,
};
