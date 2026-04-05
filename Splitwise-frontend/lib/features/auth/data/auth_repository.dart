import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_result.dart';
import '../../../core/storage/secure_storage.dart';
import 'auth_api.dart';
import 'models/user_model.dart';

class AuthRepository {
  final AuthApi _api;

  AuthRepository({AuthApi? api}) : _api = api ?? AuthApi(ApiClient.dio);

  Future<ApiResult<UserModel>> loginWithGoogle(String idToken) async {
    try {
      final response = await _api.loginWithGoogle({'idToken': idToken});
      await SecureStorage.saveTokens(
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      );
      final user = await _api.getMe();
      return ApiSuccess(user);
    } on DioException catch (e) {
      return ApiError(ApiClient.handleDioException(e));
    }
  }

  Future<ApiResult<UserModel>> getMe() async {
    try {
      final user = await _api.getMe();
      return ApiSuccess(user);
    } on DioException catch (e) {
      return ApiError(ApiClient.handleDioException(e));
    }
  }

  Future<ApiResult<void>> logout() async {
    try {
      final deviceId = await SecureStorage.getDeviceId() ?? '';
      await _api.logout({'deviceId': deviceId});
      await SecureStorage.clearTokens();
      return const ApiSuccess(null);
    } catch (_) {
      await SecureStorage.clearTokens();
      return const ApiSuccess(null);
    }
  }
}
