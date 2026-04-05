import 'group_member_model.dart';

class GroupModel {
  final String id;
  final String name;
  final String? avatarUrl;
  final List<GroupMemberModel> members;
  final String? createdAt;

  const GroupModel({required this.id, required this.name, this.avatarUrl, this.members = const [], this.createdAt});

  factory GroupModel.fromJson(Map<String, dynamic> json) {
    return GroupModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      avatarUrl: json['avatarUrl'],
      members: (json['members'] as List?)?.map((m) => GroupMemberModel.fromJson(m)).toList() ?? [],
      createdAt: json['createdAt'],
    );
  }
}
