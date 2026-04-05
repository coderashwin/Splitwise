class NotificationModel {
  final String id;
  final String title;
  final String body;
  final String type;
  final bool read;
  final String? referenceId;
  final String? createdAt;

  const NotificationModel({required this.id, required this.title, required this.body, required this.type, required this.read, this.referenceId, this.createdAt});

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? '',
      body: json['body'] ?? '',
      type: json['type'] ?? '',
      read: json['read'] ?? false,
      referenceId: json['referenceId'],
      createdAt: json['createdAt'],
    );
  }
}
