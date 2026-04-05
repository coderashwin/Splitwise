import 'package:dio/dio.dart';
import 'models/friend_debt_model.dart';
import 'models/friendship_model.dart';

class FriendsApi {
  final Dio _dio;
  FriendsApi(this._dio);

  Future<List<FriendDebtModel>> getFriendDebts() async {
    final response = await _dio.get('/friends/debts');
    return (response.data as List).map((f) => FriendDebtModel.fromJson(f)).toList();
  }

  Future<FriendDebtModel> getFriendDebtDetail(String id) async {
    final response = await _dio.get('/friends/$id/debt');
    return FriendDebtModel.fromJson(response.data);
  }

  Future<FriendshipModel> addFriend(Map<String, dynamic> body) async {
    final response = await _dio.post('/friends', data: body);
    return FriendshipModel.fromJson(response.data);
  }
}
