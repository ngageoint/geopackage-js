"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Result {
    constructor(data) {
        this._data = data;
    }
    static Ok(data) {
        return new Result([true, data]);
    }
    static Err(err) {
        return new Result([false, err]);
    }
    expect(message) {
        if (this._data[0]) {
            return this._data[1];
        }
        throw new Error(message);
    }
    unwrap() {
        return this.expect('Tried to unwrap as Ok an Err.');
    }
    unwrapErr() {
        if (this._data[0]) {
            throw new Error('Tried to unwrap an Err as Ok.');
        }
        return this._data[1];
    }
    match(funcs) {
        if (this._data[0]) {
            return funcs.ok(this._data[1]);
        }
        return funcs.err(this._data[1]);
    }
    map(func) {
        return this.match({
            ok: data => Result.Ok(func(data)),
            err: err => Result.Err(err)
        });
    }
    mapErr(func) {
        return this.match({
            ok: data => Result.Ok(data),
            err: err => Result.Err(func(err))
        });
    }
    toString() {
        return `[${this._data[0] ? 'Ok' : 'Err'} ${this._data[1]}]`;
    }
}
exports.Result = Result;
exports.Ok = Result.Ok;
exports.Err = Result.Err;
//# sourceMappingURL=result.js.map