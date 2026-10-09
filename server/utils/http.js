export const httpError = (status, message) => Object.assign(new Error(message), { status });
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
