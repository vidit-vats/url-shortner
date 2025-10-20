class ApiError extends Error {
	constructor(statuscode, message) {
		super(message);
		this.statuscode = statuscode;
		this.data = null;

		Error.captureStackTrace(this, this.constructor);
	}
}

export { ApiError };
