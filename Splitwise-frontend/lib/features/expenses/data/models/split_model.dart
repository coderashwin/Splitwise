import '../../auth/data/models/user_model.dart';

class SplitModel {
  final UserModel user;
  final int? amount;
  final double? percentage;
  final int? shares;
  final bool settled;

  const SplitModel({
    required this.user,
    this.amount,
    this.percentage,
    this.shares,
    this.settled = false,
  });

  factory SplitModel.fromJson(Map<String, dynamic> json) {
    return SplitModel(
      user: UserModel.fromJson(json['user'] ?? {}),
      amount: json['amount'],
      percentage: (json['percentage'] as num?)?.toDouble(),
      shares: json['shares'],
      settled: json['settled'] ?? false,
    );
  }
}
