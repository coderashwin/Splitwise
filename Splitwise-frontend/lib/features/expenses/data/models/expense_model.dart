import '../../auth/data/models/user_model.dart';
import 'split_model.dart';

class ExpenseModel {
  final String id;
  final String description;
  final int totalAmount;
  final String splitType;
  final UserModel paidBy;
  final List<SplitModel> splits;
  final String category;
  final String date;
  final String? receiptUrl;
  final String? groupId;
  final String? createdAt;

  const ExpenseModel({
    required this.id,
    required this.description,
    required this.totalAmount,
    required this.splitType,
    required this.paidBy,
    required this.splits,
    required this.category,
    required this.date,
    this.receiptUrl,
    this.groupId,
    this.createdAt,
  });

  factory ExpenseModel.fromJson(Map<String, dynamic> json) {
    return ExpenseModel(
      id: json['_id'] ?? json['id'] ?? '',
      description: json['description'] ?? '',
      totalAmount: json['totalAmount'] ?? 0,
      splitType: json['splitType'] ?? 'equal',
      paidBy: UserModel.fromJson(json['paidBy'] ?? {}),
      splits: (json['splits'] as List?)?.map((s) => SplitModel.fromJson(s)).toList() ?? [],
      category: json['category'] ?? 'Other',
      date: json['date'] ?? '',
      receiptUrl: json['receiptUrl'],
      groupId: json['groupId'],
      createdAt: json['createdAt'],
    );
  }
}
