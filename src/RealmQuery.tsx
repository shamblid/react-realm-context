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

import { IRealmContext } from '.';

export interface IValue<T> {
  results: Realm.Results<T>;
  realm: Realm;
}
export type QueryChild<T> = (value: IValue<T>) => React.ReactChild;

export type Filtering = string | any[];
export type Sorting = string | Realm.SortDescriptor | Realm.SortDescriptor[];

export interface IRealmQueryProps<T> {
  children: QueryChild<T>;
  type: string;
  filter?: Filtering;
  sort?: Sorting;
}

export const generateRealmQuery = (
  WrappedConsumer: React.Consumer<IRealmContext>,
): React.ComponentType<IRealmQueryProps<any>> => {
  class RealmQuery<T> extends React.Component<IRealmQueryProps<T>> {
    private realm?: Realm;
    private results?: Realm.Results<T>;

    private currentFilter: Filtering;
    private currentSort: Sorting;

    // TODO: Add propTypes for non-TypeScript users
    // TODO: Allow the query to take a custom consumer as a prop

    public componentWillUnmount() {
      this.forgetRealm();
    }

    public render() {
      return <WrappedConsumer>{this.renderContext}</WrappedConsumer>;
    }

    private renderContext = (value: IRealmContext) => {
      const realm = this.getRealm(value.realm);
      // The results are not available yet (or we just forgot them)
      const results = this.getResults(realm);
      // Calling the function passed as children with the derived context
      return this.props.children({ results, realm });
    };

    private forgetRealm() {
      if (this.realm && !this.realm.isClosed) {
        this.forgetResults();
        this.realm.close();
      }
      delete this.realm;
    }

    private forgetResults() {
      if (this.results) {
        this.results.removeAllListeners();
        delete this.results;
      }
    }

    private getRealm(realm: Realm) {
      if (realm !== this.realm) {
        if (this.realm) {
          // The Realm changed and it was set already
          this.forgetRealm();
        }
        // Hang on to the new realm
        this.realm = realm;
      }
      return this.realm;
    }

    private getResults(realm: Realm) {
      const { type, filter, sort } = this.props;
      // If the filter or sort changed since last time - regenerate the results
      if (this.currentFilter !== filter || this.currentSort !== sort) {
        this.forgetResults();
        this.currentFilter = filter;
        this.currentSort = sort;
      } else if (this.results) {
        return this.results;
      }

      // Start with the type
      let results = realm.objects<T>(type);
      // Filtering
      if (filter) {
        if (typeof filter === 'string') {
          results = results.filtered(filter);
        } else {
          const [query, ...args] = filter;
          results = results.filtered(query as string, ...args);
        }
      }
      // Sorting
      if (sort) {
        if (typeof sort === 'string') {
          results = results.sorted(sort);
        } else if (Array.isArray(sort)) {
          results =
            sort.length === 2 &&
            typeof sort[0] === 'string' &&
            typeof sort[1] === 'boolean'
              ? results.sorted(sort[0] as string, sort[1] as boolean)
              : results.sorted(sort as Realm.SortDescriptor[]);
        } else {
          // TODO: Implement sorting on multiple fields
          throw new Error(
            'Sorting reverse or on multiple properties are not implemented yet',
          );
        }
      }

      // TODO: Handle an invalid result
      // Register a listener
      results.addListener(this.resultsChanged);
      // Save this for later use
      this.results = results;

      // Return
      return results;
    }

    private resultsChanged: Realm.CollectionChangeCallback<T> = (
      collection,
      change,
    ) => {
      // This might fire although nothing changed
      const { deletions, insertions, modifications } = change;
      const changes =
        deletions.length + insertions.length + modifications.length;
      if (changes > 0) {
        this.forceUpdate();
      }
    };
  }

  return RealmQuery;
};