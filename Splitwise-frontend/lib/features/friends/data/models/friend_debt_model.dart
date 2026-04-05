import '../../auth/data/models/user_model.dart';

class FriendDebtModel {
  final UserModel friend;
  final int balance;

  const FriendDebtModel({required this.friend, required this.balance});

  factory FriendDebtModel.fromJson(Map<String, dynamic> json) {
    return FriendDebtModel(
      friend: UserModel.fromJson(json['friend'] ?? {}),
      balance: json['balance'] ?? 0,
    );
  }
}
