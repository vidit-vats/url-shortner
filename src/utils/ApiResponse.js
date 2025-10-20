class ApiResponse {
	constructor(statuscode, message, data = null) {
		this.statuscode = statuscode;
		this.message = message;
		this.data = data;
	}
}

export { ApiResponse };
