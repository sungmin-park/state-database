import {suite, test, setup} from "mocha";
import {assert} from "chai";
import {StateDocument} from "../src/statedb";

const {deepEqual} = assert;

suite("Document", function () {
    test("update", function () {
        const document = new StateDocument('document', {version: 0, revision: 0});
        let state = document.INITIAL_STATE;

        const action = document.update({version: 1});
        deepEqual(action, {type: 'document.update', payload: {version: 1}});
        state = document.dux(state, action);
        deepEqual(state, {version: 1, revision: 0});
    });

    test("set", function () {
        const document = new StateDocument('document', {version: 0, revision: 0});
        let state = document.INITIAL_STATE;
        const action = document.set({version: '1.0'});
        deepEqual(action, {type: 'document.set', payload: {version: '1.0'}});

        state = document.dux(state, action);
        deepEqual(state, {version: '1.0'});
    });
});
