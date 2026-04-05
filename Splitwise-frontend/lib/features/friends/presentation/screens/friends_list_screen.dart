import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/router/route_names.dart';
import '../../../../shared/widgets/amount_text.dart';
import '../../../../shared/widgets/app_avatar.dart';

class FriendsListScreen extends ConsumerStatefulWidget {
  const FriendsListScreen({super.key});

  @override
  ConsumerState<FriendsListScreen> createState() => _FriendsListScreenState();
}

class _FriendsListScreenState extends ConsumerState<FriendsListScreen> {
  // Mock data to match the UI design
  final List<Map<String, dynamic>> _mockFriends = [
    {
      'id': '1',
      'name': 'Alice Smith',
      'balance': 1000, 
      'owes': true, // warning red
    },
    {
      'id': '2',
      'name': 'John Doe',
      'balance': 2500, 
      'owes': false, // success green
    },
    {
      'id': '3',
      'name': 'Sarah Miller',
      'balance': 0, 
      'owes': false, // neutral
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Friends', style: AppTextStyles.heading2),
        backgroundColor: AppColors.surface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.sort_rounded, color: AppColors.onSurface),
          onPressed: () {}, // Filter or sort placeholder
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add_alt_1_rounded, color: AppColors.primary, size: 28),
            onPressed: () {
              // Add friend route
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Overall Balance Card
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.error.withOpacity(0.08), // Light red warning state
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.error.withOpacity(0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Overall friend balance', style: AppTextStyles.bodyText2.copyWith(color: AppColors.error)),
                    const SizedBox(height: 8),
                    const Text('You owe ₹10.00', style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppColors.error,
                    )),
                  ],
                ),
              ),
            ),
            
            // Friends List
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _mockFriends.length,
                separatorBuilder: (context, index) => const Divider(height: 1, color: AppColors.border),
                itemBuilder: (context, index) {
                  final friend = _mockFriends[index];
                  return InkWell(
                    onTap: () {
                      context.push('${RouteNames.friendDetail}/${friend['id']}');
                    },
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      child: Row(
                        children: [
                          AppAvatar(name: friend['name'], radius: 24),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Text(friend['name'], style: AppTextStyles.subtitle1),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              if (friend['balance'] == 0)
                                const Text('Settled', style: AppTextStyles.caption)
                              else
                                Text(friend['owes'] ? 'You owe' : 'Owes you',
                                    style: AppTextStyles.caption),
                              if (friend['balance'] != 0)
                                AmountText(
                                  paise: friend['balance'],
                                  owes: friend['owes'],
                                  style: AppTextStyles.bodyText1.copyWith(fontWeight: FontWeight.bold),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
