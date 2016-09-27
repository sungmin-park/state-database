import fp from "lodash/fp";

export function createDocument(name, state) {
    return {db: new Document(name), state};
}

export function createTable(name) {
    return {table: new Table(name), state: {keys: [], collection: {}, entries: []}};
}

class Document {
    constructor(name) {
        this.name = name;
        this.TYPE_UPDATE = `${this.name}.update`;
        this.TYPE_SET = `${this.name}.set`;
    }

    update(payload) {
        return {type: this.TYPE_UPDATE, payload};
    }

    set(payload) {
        return {type: this.TYPE_SET, payload};
    }

    dux(state, action) {
        switch (action.type) {
            case this.TYPE_UPDATE:
                return {...state, ...action.payload};
            case this.TYPE_SET:
                return action.payload;
        }
        return state;
    }
}

class Table {
    constructor(name) {
        this.name = name;
        this.TYPE_INSERT = `${this.name}.insert`;
        this.TYPE_UPDATE = `${this.name}.update`;
        this.TYPE_SET = `${this.name}.set`;
        this.TYPE_REMOVE = `${this.name}.remove`;
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

    _dux(state, action) {
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

    dux(state, action) {
        const newState = this._dux(state, action);
        if (newState === state) {
            return state;
        }
        const entries = fp.sortBy(entry => newState.keys.indexOf(entry._key), fp.values(newState.collection));
        return {...newState, entries};
    }
}
