class ApiException implements Exception {
  final String message;
  final int? statusCode;

  const ApiException({required this.message, this.statusCode});

  factory ApiException.network() => const ApiException(message: 'No internet connection or timeout.');
  factory ApiException.unauthorized() => const ApiException(message: 'Unauthorized. Please login again.', statusCode: 401);
  factory ApiException.forbidden() => const ApiException(message: 'Forbidden action.', statusCode: 403);
  factory ApiException.notFound() => const ApiException(message: 'Resource not found.', statusCode: 404);
  factory ApiException.conflict() => const ApiException(message: 'Conflict occurred.', statusCode: 409);
  factory ApiException.server(String msg) => ApiException(message: msg, statusCode: 500);
  factory ApiException.unknown() => const ApiException(message: 'An unknown error occurred.');

  @override
  String toString() => message;
}
