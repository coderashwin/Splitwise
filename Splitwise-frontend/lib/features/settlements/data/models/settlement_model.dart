class SettlementModel {
  final String id;
  final String payerId;
  final String payeeId;
  final int amount;
  final String? groupId;
  final String? note;
  final String? createdAt;

  const SettlementModel({required this.id, required this.payerId, required this.payeeId, required this.amount, this.groupId, this.note, this.createdAt});

  factory SettlementModel.fromJson(Map<String, dynamic> json) {
    return SettlementModel(
      id: json['_id'] ?? json['id'] ?? '',
      payerId: json['payerId'] ?? '',
      payeeId: json['payeeId'] ?? '',
      amount: json['amount'] ?? 0,
      groupId: json['groupId'],
      note: json['note'],
      createdAt: json['createdAt'],
    );
  }
}
