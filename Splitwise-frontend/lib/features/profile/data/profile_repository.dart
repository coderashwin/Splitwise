import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_result.dart';
import '../../auth/data/models/user_model.dart';
import 'profile_api.dart';

class ProfileRepository {
  final ProfileApi _api;
  ProfileRepository({ProfileApi? api}) : _api = api ?? ProfileApi(ApiClient.dio);

  Future<ApiResult<UserModel>> updateProfile(Map<String, dynamic> data) async {
    try {
      final response = await _api.updateProfile(data);
      return ApiSuccess(response);
    } on DioException catch (e) {
      return ApiError(ApiClient.handleDioException(e));
    }
  }

  Future<ApiResult<void>> deleteAccount() async {
    try {
      await _api.deleteAccount();
      return const ApiSuccess(null);
    } on DioException catch (e) {
      return ApiError(ApiClient.handleDioException(e));
    }
  }
}
