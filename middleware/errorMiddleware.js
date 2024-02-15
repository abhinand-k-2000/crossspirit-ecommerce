
module.exports = (error, req, res, next) => {
    error.statusCode = error.statusCode || 500;
    error.status = error.status || 'error';

    // Redirect to an error page
    res.status(error.statusCode).render('500', {
        status: error.statusCode,
        message: error.message
    });
};

