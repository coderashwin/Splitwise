class GroupMemberModel {
  final String userId;
  final String name;
  final String? avatarUrl;
  final String role;

  const GroupMemberModel({required this.userId, required this.name, this.avatarUrl, required this.role});

  factory GroupMemberModel.fromJson(Map<String, dynamic> json) {
    return GroupMemberModel(
      userId: json['userId'] ?? '',
      name: json['name'] ?? '',
      avatarUrl: json['avatarUrl'],
      role: json['role'] ?? 'member',
    );
  }
}
