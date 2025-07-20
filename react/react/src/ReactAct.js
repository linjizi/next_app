/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable} from 'shared/ReactTypes';
import type {RendererTask} from './ReactSharedInternalsClient';
import ReactSharedInternals from './ReactSharedInternalsClient';
import queueMacrotask from 'shared/enqueueTask';

import {disableLegacyMode} from 'shared/ReactFeatureFlags';

// `act` calls can be nested, so we track the depth. This represents the
// number of `act` scopes on the stack.
let actScopeDepth = 0;

// We only warn the first time you neglect to await an async `act` scope.
let didWarnNoAwaitAct = false;

function aggregateErrors(errors: Array<mixed>): mixed {
  if (errors.length > 1 && typeof AggregateError === 'function') {
    // eslint-disable-next-line no-undef
    return new AggregateError(errors);
  }
  return errors[0];
}

export function act<T>(callback: () => T | Thenable<T>): Thenable<T> {
  throw new Error('act(...) is not supported in production builds of React.');
}

let isFlushing = false;

// Some of our warnings attempt to detect if the `act` call is awaited by
// checking in an asynchronous task. Wait a few microtasks before checking. The
// only reason one isn't sufficient is we want to accommodate the case where an
// `act` call is returned from an async function without first being awaited,
// since that's a somewhat common pattern. If you do this too many times in a
// nested sequence, you might get a warning, but you can always fix by awaiting
// the call.
//
// A macrotask would also work (and is the fallback) but depending on the test
// environment it may cause the warning to fire too late.
