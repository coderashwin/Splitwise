import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_result.dart';
import 'groups_api.dart';
import 'models/group_model.dart';

class GroupsRepository {
  final GroupsApi _api;
  GroupsRepository({GroupsApi? api}) : _api = api ?? GroupsApi(ApiClient.dio);

  Future<ApiResult<List<GroupModel>>> getGroups() async {
    try {
      final response = await _api.getGroups();
      return ApiSuccess(response);
    } on DioException catch (e) {
      return ApiError(ApiClient.handleDioException(e));
    }
  }

  Future<ApiResult<GroupModel>> createGroup(Map<String, dynamic> data) async {
    try {
      final response = await _api.createGroup(data);
      return ApiSuccess(response);
    } on DioException catch (e) {
      return ApiError(ApiClient.handleDioException(e));
    }
  }

  Future<ApiResult<GroupModel>> getGroupDetail(String id) async {
    try {
      final response = await _api.getGroupDetail(id);
      return ApiSuccess(response);
    } on DioException catch (e) {
      return ApiError(ApiClient.handleDioException(e));
    }
  }

  Future<ApiResult<Map<String, dynamic>>> getGroupBalances(String id) async {
    try {
      final response = await _api.getGroupBalances(id);
      return ApiSuccess(response);
    } on DioException catch (e) {
      return ApiError(ApiClient.handleDioException(e));
    }
  }
}
