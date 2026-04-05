import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_result.dart';
import 'settlements_api.dart';
import 'models/settlement_model.dart';

class SettlementsRepository {
  final SettlementsApi _api;
  SettlementsRepository({SettlementsApi? api}) : _api = api ?? SettlementsApi(ApiClient.dio);

  Future<ApiResult<SettlementModel>> createSettlement(Map<String, dynamic> data) async {
    try {
      final response = await _api.createSettlement(data);
      return ApiSuccess(response);
    } on DioException catch (e) {
      return ApiError(ApiClient.handleDioException(e));
    }
  }
}
