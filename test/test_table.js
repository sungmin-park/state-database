import {suite, test, setup} from "mocha";
import {assert} from "chai";
import {StateTable} from "../src/statedb";

const {deepEqual, throws} = assert;

suite("Table", function () {
    test("insert", function () {
        const table = new StateTable('user');
        const action = table.insert('0', {name: 'john'});
        deepEqual(action, {type: 'user.insert', payload: {_key: '0', entry: {name: 'john'}}});

        let state = table.reducer(table.INITIAL_STATE, action);
        deepEqual(state, {
                keys: ['0'],
                collection: {'0': {_key: '0', name: 'john'}},
                entries: [{_key: '0', name: 'john'}]
            }
        );

        throws(() => table.reducer(state, action), /duplicated entry/);
    });

    test('entries', function () {
        const table = new StateTable('user');
        let state = table.INITIAL_STATE;
        state = table.reducer(state, table.insert('0', {name: 'john'}));
        state = table.reducer(state, table.insert('2', {name: 'jack'}));
        state = table.reducer(state, table.insert('1', {name: 'jill'}));

        deepEqual(state.entries, [
            {_key: '0', name: 'john'},
            {_key: '2', name: 'jack'},
            {_key: '1', name: 'jill'}
        ]);
    });

    test("update", function () {
        const table = new StateTable('user');
        let state = table.INITIAL_STATE;
        state = table.reducer(state, table.insert('0', {name: 'jack', age: 10}));

        const action = table.update('0', {name: 'jack'});
        deepEqual(action, {type: 'user.update', payload: {_key: '0', entry: {name: 'jack'}}});

        state = table.reducer(state, action);
        deepEqual(
            state, {
                keys: ['0'], collection: {'0': {_key: '0', name: 'jack', age: 10}},
                entries: [{_key: '0', name: 'jack', age: 10}]
            }
        );

        throws(() => table.reducer(state, table.update('-1', {})), /not found/);
    });

    test("set", function () {
        const table = new StateTable('user');
        let state = table.INITIAL_STATE;
        state = table.reducer(state, table.insert('0', {name: 'jack', age: 10}));

        const action = table.set('0', {name: 'jack'});
        deepEqual(action, {type: 'user.set', payload: {_key: '0', entry: {name: 'jack'}}});

        state = table.reducer(state, action);
        deepEqual(state, {
            keys: ['0'],
            collection: {'0': {_key: '0', name: 'jack'}},
            entries: [{_key: '0', name: 'jack'}],
        });

        throws(() => table.reducer(state, table.set('-1', {})), /not found/);
    });

    test("remove", function () {
        const table = new StateTable('user');
        let state = table.INITIAL_STATE;
        state = table.reducer(state, table.insert('0', {name: 'john', age: 10}));
        state = table.reducer(state, table.insert('1', {name: 'jack', age: 20}));
        state = table.reducer(state, table.insert('2', {name: 'jill', age: 30}));

        const action = table.remove('1');
        deepEqual(action, {type: 'user.remove', payload: {_key: '1'}});

        state = table.reducer(state, action);
        deepEqual(state, {
            keys: ['0', '2'],
            collection: {'0': {_key: '0', name: 'john', age: 10}, '2': {_key: '2', name: 'jill', age: 30}},
            entries: [
                {_key: '0', name: 'john', age: 10},
                {_key: '2', name: 'jill', age: 30}
            ]
        });
    });
});
