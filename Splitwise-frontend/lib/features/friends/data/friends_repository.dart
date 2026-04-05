import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_result.dart';
import 'friends_api.dart';
import 'models/friend_debt_model.dart';
import 'models/friendship_model.dart';

class FriendsRepository {
  final FriendsApi _api;
  FriendsRepository({FriendsApi? api}) : _api = api ?? FriendsApi(ApiClient.dio);

  Future<ApiResult<List<FriendDebtModel>>> getFriendDebts() async {
    try {
      final response = await _api.getFriendDebts();
      return ApiSuccess(response);
    } on DioException catch (e) {
      return ApiError(ApiClient.handleDioException(e));
    }
  }

  Future<ApiResult<FriendDebtModel>> getFriendDebtDetail(String id) async {
    try {
      final response = await _api.getFriendDebtDetail(id);
      return ApiSuccess(response);
    } on DioException catch (e) {
      return ApiError(ApiClient.handleDioException(e));
    }
  }

  Future<ApiResult<FriendshipModel>> addFriend(String email) async {
    try {
      final response = await _api.addFriend({'email': email});
      return ApiSuccess(response);
    } on DioException catch (e) {
      return ApiError(ApiClient.handleDioException(e));
    }
  }
}
