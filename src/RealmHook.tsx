import React from 'react';
import Realm from 'realm';
import useForceUpdate from 'use-force-update';
import { IRealmContext } from '.';

const generateRealmHooks = (RealmContext: IRealmContext) => {
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