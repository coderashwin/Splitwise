import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_result.dart';
import 'expenses_api.dart';
import 'models/expense_model.dart';

class ExpensesRepository {
  final ExpensesApi _api;
  ExpensesRepository({ExpensesApi? api}) : _api = api ?? ExpensesApi(ApiClient.dio);

  Future<ApiResult<List<ExpenseModel>>> getExpenses({String? groupId, String? friendId, int limit = 20, String? cursor}) async {
    try {
      final response = await _api.getExpenses(groupId: groupId, friendId: friendId, limit: limit, cursor: cursor);
      final list = (response['data'] as List?)?.map((e) => ExpenseModel.fromJson(e)).toList() ?? [];
      return ApiSuccess(list);
    } on DioException catch (e) {
      return ApiError(ApiClient.handleDioException(e));
    }
  }

  Future<ApiResult<ExpenseModel>> createExpense(Map<String, dynamic> data) async {
    try {
      final response = await _api.createExpense(data);
      return ApiSuccess(response);
    } on DioException catch (e) {
      return ApiError(ApiClient.handleDioException(e));
    }
  }

  Future<ApiResult<ExpenseModel>> getExpenseDetail(String id) async {
    try {
      final response = await _api.getExpenseDetail(id);
      return ApiSuccess(response);
    } on DioException catch (e) {
      return ApiError(ApiClient.handleDioException(e));
    }
  }

  Future<ApiResult<void>> deleteExpense(String id) async {
    try {
      await _api.deleteExpense(id);
      return const ApiSuccess(null);
    } on DioException catch (e) {
      return ApiError(ApiClient.handleDioException(e));
    }
  }
}
