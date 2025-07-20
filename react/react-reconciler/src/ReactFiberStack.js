/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { Fiber } from "./ReactInternalTypes";

export type StackCursor<T> = { current: T };

const valueStack: Array<any> = [];

let fiberStack: Array<Fiber | null>;

if (false) {
  fiberStack = [];
}

let index = -1;

function createCursor<T>(defaultValue: T): StackCursor<T> {
  return {
    current: defaultValue,
  };
}

function pop<T>(cursor: StackCursor<T>, fiber: Fiber): void {
  if (index < 0) {
    if (false) {
      console.error("Unexpected pop.");
    }
    return;
  }

  if (false) {
    if (fiber !== fiberStack[index]) {
      console.error("Unexpected Fiber popped.");
    }
  }

  cursor.current = valueStack[index];

  valueStack[index] = null;

  if (false) {
    fiberStack[index] = null;
  }

  index--;
}

function push<T>(cursor: StackCursor<T>, value: T, fiber: Fiber): void {
  index++;

  valueStack[index] = cursor.current;

  if (false) {
    fiberStack[index] = fiber;
  }

  cursor.current = value;
}
export { createCursor, pop, push };
