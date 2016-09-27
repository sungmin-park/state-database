import {suite, test} from "mocha";
import {StateDatabase, StateDocument, StateTable} from "../src/statedb";
import {assert} from "chai";

const {equal, deepEqual} = assert;

suite('Database', function () {
    test('creation', function () {
        const root = new StateDatabase('root');
        equal(root._name, 'root');
        deepEqual(root.INITIAL_STATE, {});
    });

    test('document', function () {
        const db = new StateDatabase('root', new StateDocument('info'));
        deepEqual(db.INITIAL_STATE, {info: {}});

        deepEqual(
            db.info.update('payload'), {type: 'root.info.update', payload: 'payload'}
        );
    });

    test('items', function () {
        const db = new StateDatabase(
            'root',
            new StateDocument('info'), new StateDocument('note', {todo: 'refactoring'}),
            new StateTable('user')
        );

        deepEqual(db.INITIAL_STATE, {
            info: {},
            note: {todo: 'refactoring'},
            user: {keys: [], collection: {}, entries: []}
        });

        deepEqual(db.info.update('payload'), {type: 'root.info.update', payload: 'payload'});
        deepEqual(db.note.set('payload'), {type: 'root.note.set', payload: 'payload'});
        deepEqual(
            db.user.insert('0', {name: 'john'}),
            {type: 'root.user.insert', payload: {_key: '0', entry: {name: 'john'}}}
        );
    });
});