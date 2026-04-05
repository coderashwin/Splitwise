import 'package:dio/dio.dart';
import 'models/expense_model.dart';

class ExpensesApi {
  final Dio _dio;
  ExpensesApi(this._dio);

  Future<Map<String, dynamic>> getExpenses({String? groupId, String? friendId, int limit = 20, String? cursor}) async {
    final response = await _dio.get('/expenses', queryParameters: {
      if (groupId != null) 'groupId': groupId,
      if (friendId != null) 'friendId': friendId,
      'limit': limit,
      if (cursor != null) 'cursor': cursor,
    });
    return response.data;
  }

  Future<ExpenseModel> createExpense(Map<String, dynamic> body) async {
    final response = await _dio.post('/expenses', data: body);
    return ExpenseModel.fromJson(response.data['expense'] ?? response.data);
  }

  Future<ExpenseModel> getExpenseDetail(String id) async {
    final response = await _dio.get('/expenses/$id');
    return ExpenseModel.fromJson(response.data);
  }

  Future<void> deleteExpense(String id) async {
    await _dio.delete('/expenses/$id');
  }
}
