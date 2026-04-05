import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/router/route_names.dart';
import '../../../../shared/widgets/amount_text.dart';

class GroupsListScreen extends ConsumerStatefulWidget {
  const GroupsListScreen({super.key});

  @override
  ConsumerState<GroupsListScreen> createState() => _GroupsListScreenState();
}

class _GroupsListScreenState extends ConsumerState<GroupsListScreen> {
  // Mock data to match the UI design provided by Stitch
  final List<Map<String, dynamic>> _mockGroups = [
    {
      'id': '1',
      'name': 'Trip to Bali',
      'icon': Icons.beach_access_rounded,
      'balance': 1200, // paise => $12.00
      'owes': true,
    },
    {
      'id': '2',
      'name': 'Home Sweet Home',
      'icon': Icons.home_rounded,
      'balance': 5700, 
      'owes': false,
    },
    {
      'id': '3',
      'name': 'Friday Night In',
      'icon': Icons.local_pizza_rounded,
      'balance': 0, 
      'owes': false,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Groups', style: AppTextStyles.heading2),
        backgroundColor: AppColors.surface,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_rounded, color: AppColors.primary, size: 28),
            onPressed: () {
              context.push(RouteNames.createGroup);
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
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    )
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Overall Balance', style: AppTextStyles.bodyText2),
                    const SizedBox(height: 8),
                    const Text('You are owed ₹45.00', style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppColors.success,
                    )),
                  ],
                ),
              ),
            ),
            
            // Groups List
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _mockGroups.length,
                separatorBuilder: (context, index) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final group = _mockGroups[index];
                  return InkWell(
                    onTap: () {
                      context.push('${RouteNames.groupDetail}/${group['id']}');
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border, width: 1),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppColors.primaryContainer.withOpacity(0.2),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(group['icon'], color: AppColors.primary),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(group['name'], style: AppTextStyles.subtitle1),
                                const SizedBox(height: 4),
                                if (group['balance'] == 0)
                                  const Text('Settled', style: AppTextStyles.caption)
                                else
                                  Row(
                                    children: [
                                      Text(group['owes'] ? 'You owe ' : 'You are owed ',
                                          style: AppTextStyles.caption),
                                      AmountText(
                                        paise: group['balance'],
                                        owes: group['owes'],
                                        style: AppTextStyles.caption.copyWith(fontWeight: FontWeight.bold),
                                      ),
                                    ],
                                  ),
                              ],
                            ),
                          ),
                          const Icon(Icons.chevron_right_rounded, color: AppColors.onSurfaceMid),
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
