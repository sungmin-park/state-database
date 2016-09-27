import fp from "lodash/fp";
import {combineReducers} from "redux";
import _ from "lodash";

export class StateDatabase {
    constructor(name, ...items) {
        this._name = name;
        this._items = fp.map(item => {
            if (item instanceof StateDocument) {
                return new StateDocument(item.name, item.INITIAL_STATE, this);
            }
            if (item instanceof StateTable) {
                return new StateTable(item.name, this);
            }
            throw new Error(`Cannot handle type of ${item}`);
        }, items);
        this.INITIAL_STATE = fp.fromPairs(fp.map(x => [x.name, x.INITIAL_STATE], this._items));
        _.assignIn(this, fp.keyBy('name', this._items));
        this.reducer = combineReducers(fp.fromPairs(fp.map(x => [x.name, x.reducer], this._items)));
    }
}

export class StateDocument {
    constructor(name, initialState = {}, database = null) {
        this.name = name;
        const prefix = database ? `${database._name}.` : '';
        this.TYPE_UPDATE = `${prefix}${this.name}.update`;
        this.TYPE_SET = `${prefix}${this.name}.set`;
        this.INITIAL_STATE = initialState;
        this.reducer = (state = this.INITIAL_STATE, action = {}) => {
            switch (action.type) {
                case this.TYPE_UPDATE:
                    return {...state, ...action.payload};
                case this.TYPE_SET:
                    return action.payload;
            }
            return state;
        }
    }

    update(payload) {
        return {type: this.TYPE_UPDATE, payload};
    }

    set(payload) {
        return {type: this.TYPE_SET, payload};
    }


}

export class StateTable {
    constructor(name, database = null) {
        this.name = name;
        const prefix = database ? `${database._name}.` : '';
        this.TYPE_INSERT = `${prefix}${this.name}.insert`;
        this.TYPE_UPDATE = `${prefix}${this.name}.update`;
        this.TYPE_SET = `${prefix}${this.name}.set`;
        this.TYPE_REMOVE = `${prefix}${this.name}.remove`;
        this.INITIAL_STATE = {keys: [], collection: {}, entries: []};
        this.reducer = (state, action)=> {
            const newState = this._dux(state, action);
            if (newState === state) {
                return state;
            }
            const entries = fp.sortBy(entry => newState.keys.indexOf(entry._key), fp.values(newState.collection));
            return {...newState, entries};
        }
    }

    insert(_key, entry) {
        return {type: this.TYPE_INSERT, payload: {_key, entry}};
    }

    update(_key, entry) {
        return {type: this.TYPE_UPDATE, payload: {_key, entry}};
    }

    remove(_key) {
        return {type: this.TYPE_REMOVE, payload: {_key}};
    }

    set(_key, entry) {
        return {type: this.TYPE_SET, payload: {_key, entry}};
    }

    _dux(state = this.INITIAL_STATE, action = {}) {
        switch (action.type) {
            case this.TYPE_INSERT: {
                const {_key, entry} = action.payload;
                if (state.collection[_key] !== undefined) {
                    throw new Error(`duplicated entry _key = ${_key} for ${this.name}`, _key);
                }
                const addKey = fp.update('keys', keys => [...keys, _key]);
                const addEntry = fp.set(`collection.${_key}`, {...entry, _key});
                return addKey(addEntry(state));
            }

            case this.TYPE_UPDATE: {
                const {_key, entry} = action.payload;
                if (state.collection[_key] === undefined) {
                    throw new Error(`not found entry _key = ${_key} for ${this.name}`, _key);
                }
                return fp.update(`collection.${_key}`, r => ({...r, ...entry}), state);
            }

            case this.TYPE_SET: {
                const {_key, entry} = action.payload;
                if (state.collection[_key] === undefined) {
                    throw new Error(`not found entry _key = ${_key} for ${this.name}`, _key);
                }
                return fp.set(`collection.${_key}`, {...entry, _key}, state);
            }

            case this.TYPE_REMOVE: {
                const {_key} = action.payload;
                const deleteKey = fp.update('keys', fp.filter(x => x !== _key));
                const deleteRow = fp.unset(`collection.${_key}`);
                return deleteKey(deleteRow(state));
            }
        }
        return state;
    }
}
