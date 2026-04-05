import '../../auth/data/models/user_model.dart';

class FriendshipModel {
  final String id;
  final UserModel friend;
  final String? status;
  final String? createdAt;

  const FriendshipModel({required this.id, required this.friend, this.status, this.createdAt});

  factory FriendshipModel.fromJson(Map<String, dynamic> json) {
    return FriendshipModel(
      id: json['_id'] ?? json['id'] ?? '',
      friend: UserModel.fromJson(json['friend'] ?? {}),
      status: json['status'],
      createdAt: json['createdAt'],
    );
  }
}
