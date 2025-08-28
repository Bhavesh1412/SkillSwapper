//error handling globally 
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log to console for development
    console.log("Error:",err);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = `Resource not found with id of ${err.value}`;
        error = new Error(message);
        error.statusCode = 404;
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = { message, statusCode: 400 };
    }

    //MySQL duplicat eentry
    if (err.code === 'ER_DUP_ENTRY') {
        const message = 'Mail  already exists';
        error = { message, statusCode: 409 };
    }

    //MySQL connection errors
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
        const message = 'Database connection failed';
        error = { message, statusCode: 401};
    }


}