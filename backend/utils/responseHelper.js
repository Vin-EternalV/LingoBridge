exports.sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

exports.sendError = (res, message = 'Error', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};

exports.sendPaginated = (res, data, page, limit, total) => {
  return res.status(200).json({
    success: true,
    count: data.length,
    total,
    page,
    limit,
    data
  });
};
