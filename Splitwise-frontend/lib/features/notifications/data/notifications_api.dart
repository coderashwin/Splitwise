import 'package:dio/dio.dart';

class NotificationsApi {
  final Dio _dio;
  NotificationsApi(this._dio);

  Future<Map<String, dynamic>> getNotifications({int limit = 20, String? cursor}) async {
    final response = await _dio.get('/notifications', queryParameters: {'limit': limit, if (cursor != null) 'cursor': cursor});
    return response.data;
  }

  Future<void> markAsRead(String id) async {
    await _dio.patch('/notifications/$id/read');
  }

  Future<void> markAllAsRead() async {
    await _dio.post('/notifications/read-all');
  }
}
