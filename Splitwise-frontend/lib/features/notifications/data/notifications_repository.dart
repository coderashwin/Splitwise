import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_result.dart';
import 'notifications_api.dart';

class NotificationsRepository {
  final NotificationsApi _api;
  NotificationsRepository({NotificationsApi? api}) : _api = api ?? NotificationsApi(ApiClient.dio);

  Future<ApiResult<void>> markAllAsRead() async {
    try {
      await _api.markAllAsRead();
      return const ApiSuccess(null);
    } on DioException catch (e) {
      return ApiError(ApiClient.handleDioException(e));
    }
  }
}
