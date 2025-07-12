/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { createRoot, hydrateRoot, version } from "./src/client/ReactDOMClient";

const ReactDOMClient = { createRoot, hydrateRoot, version };

export { createRoot, hydrateRoot, version };

export default ReactDOMClient;
