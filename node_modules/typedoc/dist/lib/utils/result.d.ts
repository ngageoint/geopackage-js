export declare class Result<T, E> {
    static Ok<T, E = unknown>(data: T): Result<T, E>;
    static Err<E, T = unknown>(err: E): Result<T, E>;
    private _data;
    private constructor();
    expect(message: string): T;
    unwrap(): T;
    unwrapErr(): E;
    match<T2, E2>(funcs: {
        ok(data: T): T2;
        err(err: E): E2;
    }): T2 | E2;
    map<T2>(func: (data: T) => T2): Result<T2, E>;
    mapErr<E2>(func: (err: E) => E2): Result<T, E2>;
    toString(): string;
}
export declare const Ok: typeof Result.Ok;
export declare const Err: typeof Result.Err;
