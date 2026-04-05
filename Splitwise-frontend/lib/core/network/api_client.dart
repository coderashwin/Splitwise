import 'package:dio/dio.dart';
import '../config/app_config.dart';
import 'auth_interceptor.dart';
import 'api_exception.dart';

class ApiClient {
  static late final Dio dio;

  static void init() {
    dio = Dio(BaseOptions(
      baseUrl: AppConfig.baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    dio.interceptors.add(AuthInterceptor(dio));
    dio.interceptors.add(LogInterceptor(
      requestBody: AppConfig.isDev,
      responseBody: AppConfig.isDev,
    ));
  }

  static ApiException handleDioException(DioException e) {
    if (e.type == DioExceptionType.connectionTimeout || e.type == DioExceptionType.receiveTimeout) {
      return ApiException.network();
    }
    if (e.response != null) {
      switch (e.response!.statusCode) {
        case 401:
          return ApiException.unauthorized();
        case 403:
          return ApiException.forbidden();
        case 404:
          return ApiException.notFound();
        case 409:
          return ApiException.conflict();
        case 500:
        case 502:
        case 503:
          return ApiException.server('Server error. Please try again later.');
        default:
          return ApiException(message: e.response?.data?['message'] ?? 'Unexpected error occurred.');
      }
    }
    return ApiException.unknown();
  }
}
