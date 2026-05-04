// middlewares/globalErrorHandler.js

const globalErrorHandler = (err, req, res, next) => {
	// Log error to console (optional, only in dev)
	// if (process.env.NODE_ENV === "development") {
	//   console.error(err.stack);
	// }

	const statusCode = err.statuscode || 500;
	const message = err.message || 'Internal Server Error';

	res.status(statusCode).json({
		success: false,
		message,
		// Include stack trace in dev mode only
		stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
	});
};

export default globalErrorHandler;
