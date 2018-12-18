////////////////////////////////////////////////////////////////////////////
//
// Copyright 2018 Realm Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
////////////////////////////////////////////////////////////////////////////

import * as React from 'react';
import * as Realm from 'realm';

export type RealmRenderer = (context: IRealmContext) => React.ReactNode;

import { generateRealmConnection } from './RealmConnection';
import { generateRealmConsumer, IRealmConsumerProps } from './RealmConsumer';
import {
  generateRealmInitializer,
  IRealmInitializerProps,
} from './RealmInitializer';
import { generateRealmProvider, IRealmProviderProps } from './RealmProvider';
import { generateRealmQuery, IRealmQueryProps, Sorting } from './RealmQuery';
import { generateWithRealm } from './withRealm';

export {
  IRealmConsumerProps,
  IRealmInitializerProps,
  IRealmProviderProps,
  IRealmQueryProps,
};

export interface IRealmContext {
  realm: Realm;
}

const createRealmContext = () => {
  const context = React.createContext<IRealmContext>(null);
  const Provider = generateRealmProvider(context.Provider);
  const Consumer = generateRealmConsumer(context.Consumer);
  const Query = generateRealmQuery(Consumer);
  const Initializer = generateRealmInitializer(Consumer);
  const Connection = generateRealmConnection(Consumer);
  const withRealmHOC = generateWithRealm(Consumer);
  return {
    RealmProvider: Provider,
    RealmConsumer: Consumer,
    RealmQuery: Query,
    RealmInitializer: Initializer,
    RealmConnection: Connection,
    withRealm: withRealmHOC,
  };
};

// Export a function that creates Realm contexts
export { createRealmContext, Sorting as RealmSorting };

// Create and export default RealmProvider and RealmConsumer
const {
  RealmProvider,
  RealmConsumer,
  RealmQuery,
  RealmInitializer,
  RealmConnection,
  withRealm,
} = createRealmContext();

export {
  RealmProvider,
  RealmConsumer,
  RealmQuery,
  RealmInitializer,
  RealmConnection,
  withRealm,
};