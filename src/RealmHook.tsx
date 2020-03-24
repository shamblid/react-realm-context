import * as React from 'react';
import * as Realm from 'realm';
import { IRealmContext } from '.';


// Returning a new object reference guarantees that a before-and-after
//   equivalence check will always be false, resulting in a re-render, even
//   when multiple calls to forceUpdate are batched.

export default function useForceUpdate(): () => void {
  const [ , dispatch ] = React.useState<{}>(Object.create(null));

  // Turn dispatch(required_parameter) into dispatch().
  const memoizedDispatch = React.useCallback(
    (): void => {
      dispatch(Object.create(null));
    },
    [ dispatch ],
  );
  return memoizedDispatch;
}

export const generateRealmHooks = (RealmContext: React.Context<IRealmContext>) => {
    const useRealm = () => {
        const value = React.useContext(RealmContext);

        if (value === null) {
            throw new Error('Component must be wrapped with <Container.Provider>');
        }

        const realm = value.realm;

        const forceUpdate = useForceUpdate();

        const onRealmChange = () => forceUpdate();

        const forgetRealm = () => {
            if (realm && !realm.isClosed) {
                realm.removeListener('change', onRealmChange);
                realm.removeListener('schema', onRealmChange);
              }
        }

        React.useEffect(() => {
            realm.addListener('change', onRealmChange);
            realm.addListener('schema', onRealmChange);
            return forgetRealm();
        }, [])

        return value;
    }

    return { useRealm }
}