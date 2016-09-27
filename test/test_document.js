import {suite, test, setup} from "mocha";
import {assert} from "chai";
import {createDocument} from "../src/statedb";

const {deepEqual} = assert;

suite("Document", function () {
    suite("query", function () {
        setup(function () {
            const {db, state} = createDocument('document', {version: 0, revision: 0});
            this.db = db;
            this.state = state;
        });

        test("update", function () {
            const action = this.db.update({version: 1});
            deepEqual(action, {type: 'document.update', payload: {version: 1}});

            this.state = this.db.dux(this.state, action);
            deepEqual(this.state, {version: 1, revision: 0});
        });

        test("set", function () {
            const action = this.db.set({version: '1.0'});
            deepEqual(action, {type: 'document.set', payload: {version: '1.0'}});

            this.state = this.db.dux(this.state, action);
            deepEqual(this.state, {version: '1.0'});
        });
    });
});
