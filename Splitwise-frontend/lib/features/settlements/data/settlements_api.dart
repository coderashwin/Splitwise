import 'package:dio/dio.dart';
import 'models/settlement_model.dart';

class SettlementsApi {
  final Dio _dio;
  SettlementsApi(this._dio);

  Future<SettlementModel> createSettlement(Map<String, dynamic> body) async {
    final response = await _dio.post('/settlements', data: body);
    return SettlementModel.fromJson(response.data);
  }

  Future<Map<String, dynamic>> getSettlements({int limit = 20, String? cursor}) async {
    final response = await _dio.get('/settlements', queryParameters: {'limit': limit, if (cursor != null) 'cursor': cursor});
    return response.data;
  }

  Future<Map<String, dynamic>> getSimplifiedDebts(String groupId) async {
    final response = await _dio.get('/groups/$groupId/simplified-debts');
    return response.data;
  }
}
