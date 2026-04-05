import 'package:dio/dio.dart';
import '../storage/secure_storage.dart';
import '../config/app_config.dart';
import 'dart:async';

class AuthInterceptor extends Interceptor {
  final Dio _dio;
  bool _isRefreshing = false;
  Completer<void>? _completer;

  AuthInterceptor(this._dio);

  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await SecureStorage.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      if (_isRefreshing) {
        if (_completer != null) {
          await _completer!.future;
        }
        return _retry(err.requestOptions, handler);
      }
      
      _isRefreshing = true;
      _completer = Completer<void>();

      final refreshToken = await SecureStorage.getRefreshToken();
      if (refreshToken != null) {
        try {
          final response = await Dio().post(
            '${AppConfig.baseUrl}/auth/refresh',
            data: {'refreshToken': refreshToken, 'deviceId': await SecureStorage.getDeviceId()},
          );
          
          final newAccessToken = response.data['accessToken'];
          final newRefreshToken = response.data['refreshToken'];
          
          await SecureStorage.saveTokens(accessToken: newAccessToken, refreshToken: newRefreshToken);
          
          _completer!.complete();
          _isRefreshing = false;
          _completer = null;
          
          return _retry(err.requestOptions, handler);
        } catch (e) {
          await SecureStorage.clearTokens();
        }
      } else {
        await SecureStorage.clearTokens();
      }
      
      _completer?.completeError(err);
      _isRefreshing = false;
      _completer = null;
    }
    handler.next(err);
  }

  Future<void> _retry(RequestOptions requestOptions, ErrorInterceptorHandler handler) async {
    final token = await SecureStorage.getAccessToken();
    final options = Options(
      method: requestOptions.method,
      headers: {
        ...requestOptions.headers,
        'Authorization': 'Bearer $token',
      },
    );
    try {
      final response = await _dio.request<dynamic>(
        requestOptions.path,
        data: requestOptions.data,
        queryParameters: requestOptions.queryParameters,
        options: options,
      );
      handler.resolve(response);
    } on DioException catch (e) {
      handler.next(e);
    }
  }
}
