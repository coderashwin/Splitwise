import 'package:dio/dio.dart';
import 'models/group_model.dart';

class GroupsApi {
  final Dio _dio;
  GroupsApi(this._dio);

  Future<List<GroupModel>> getGroups() async {
    final response = await _dio.get('/groups');
    return (response.data as List).map((g) => GroupModel.fromJson(g)).toList();
  }

  Future<GroupModel> createGroup(Map<String, dynamic> body) async {
    final response = await _dio.post('/groups', data: body);
    return GroupModel.fromJson(response.data);
  }

  Future<GroupModel> getGroupDetail(String id) async {
    final response = await _dio.get('/groups/$id');
    return GroupModel.fromJson(response.data);
  }

  Future<Map<String, dynamic>> getGroupBalances(String id) async {
    final response = await _dio.get('/groups/$id/balances');
    return response.data;
  }

  Future<void> deleteGroup(String id) async {
    await _dio.delete('/groups/$id');
  }
}
