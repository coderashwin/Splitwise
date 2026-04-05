import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../shared/widgets/loading_shimmer.dart';
import '../../../../shared/widgets/empty_state.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  bool _isLoading = false;

  final List<Map<String, dynamic>> _notifications = [
    {
      'id': '1',
      'type': 'expense_added',
      'title': 'Alice added an expense',
      'body': 'Alice added "Dinner at Luigi\'s" — Your share: ₹32.50',
      'isRead': false,
      'time': '2 min ago',
      'icon': Icons.receipt_rounded,
    },
    {
      'id': '2',
      'type': 'settlement',
      'title': 'Bob settled with you',
      'body': 'Bob paid you ₹15.00',
      'isRead': false,
      'time': '1 hour ago',
      'icon': Icons.handshake_outlined,
    },
    {
      'id': '3',
      'type': 'friend_request',
      'title': 'New friend request',
      'body': 'Charlie wants to be your friend.',
      'isRead': true,
      'time': 'Yesterday',
      'icon': Icons.person_add_alt_1_rounded,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.onSurface),
          onPressed: () => context.pop(),
        ),
        title: const Text('Notifications', style: AppTextStyles.heading2),
        actions: [
          TextButton(
            onPressed: () {
              setState(() {
                for (final n in _notifications) {
                  n['isRead'] = true;
                }
              });
            },
            child: const Text('Mark all read', style: TextStyle(color: AppColors.primary)),
          ),
        ],
      ),
      body: _isLoading
          ? const ShimmerList()
          : _notifications.isEmpty
              ? const EmptyState(
                  icon: Icons.notifications_none_rounded,
                  title: 'All caught up!',
                  subtitle: 'No new notifications.',
                )
              : RefreshIndicator(
                  onRefresh: () async {
                    setState(() => _isLoading = true);
                    await Future.delayed(const Duration(seconds: 1));
                    if (mounted) setState(() => _isLoading = false);
                  },
                  child: ListView.builder(
                    itemCount: _notifications.length,
                    itemBuilder: (_, i) {
                      final n = _notifications[i];
                      final isUnread = !(n['isRead'] as bool);
                      return InkWell(
                        onTap: () {
                          setState(() => n['isRead'] = true);
                          // TODO: navigate based on n['type'] and metadata
                        },
                        child: Container(
                          color: isUnread ? AppColors.primaryContainer.withOpacity(0.08) : Colors.transparent,
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: AppColors.surfaceContainerLow,
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(n['icon'], color: AppColors.primary, size: 20),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(child: Text(n['title'], style: AppTextStyles.bodyText1.copyWith(fontWeight: FontWeight.bold))),
                                        if (isUnread)
                                          Container(width: 8, height: 8, decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle)),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(n['body'], style: AppTextStyles.bodyText2.copyWith(color: AppColors.onSurfaceMid)),
                                    const SizedBox(height: 4),
                                    Text(n['time'], style: AppTextStyles.caption.copyWith(color: AppColors.onSurfaceMid)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
