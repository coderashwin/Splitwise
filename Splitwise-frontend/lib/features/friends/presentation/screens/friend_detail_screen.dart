import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/router/route_names.dart';
import '../../../../shared/widgets/amount_text.dart';
import '../../../../shared/widgets/app_avatar.dart';
import '../../../../shared/widgets/loading_shimmer.dart';
import '../../../../shared/widgets/empty_state.dart';

class FriendDetailScreen extends ConsumerStatefulWidget {
  final String friendId;
  const FriendDetailScreen({super.key, required this.friendId});

  @override
  ConsumerState<FriendDetailScreen> createState() => _FriendDetailScreenState();
}

class _FriendDetailScreenState extends ConsumerState<FriendDetailScreen> {
  bool _isLoading = false;

  final Map<String, dynamic> _friend = {
    'name': 'Alice Smith',
    'balance': 2500,
    'owes': false, // They owe you
  };

  final List<Map<String, dynamic>> _activity = [
    {'type': 'expense', 'id': '1', 'description': 'Dinner at Luigi\'s', 'amount': 6500, 'yourShare': 3250, 'paidBy': 'Alice Smith', 'date': 'Oct 2'},
    {'type': 'expense', 'id': '2', 'description': 'Movie tickets', 'amount': 1200, 'yourShare': 600, 'paidBy': 'You', 'date': 'Sep 28'},
    {'type': 'settlement', 'id': 's1', 'description': 'Settlement', 'amount': 1500, 'paidBy': 'Alice Smith', 'date': 'Sep 20'},
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
        title: Text(_friend['name'], style: AppTextStyles.heading2),
      ),
      body: _isLoading
          ? const ShimmerList()
          : RefreshIndicator(
              onRefresh: () async {
                setState(() => _isLoading = true);
                await Future.delayed(const Duration(seconds: 1));
                if (mounted) setState(() => _isLoading = false);
              },
              child: CustomScrollView(
                slivers: [
                  // Profile header / debt summary
                  SliverToBoxAdapter(
                    child: Container(
                      margin: const EdgeInsets.all(20),
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.outlineVariant.withOpacity(0.3)),
                      ),
                      child: Column(
                        children: [
                          AppAvatar(name: _friend['name'], radius: 36),
                          const SizedBox(height: 12),
                          Text(_friend['name'], style: AppTextStyles.heading2),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                _friend['owes'] ? 'You owe ' : 'Owes you ',
                                style: AppTextStyles.bodyText2.copyWith(color: AppColors.onSurfaceMid),
                              ),
                              AmountText(
                                paise: _friend['balance'],
                                owes: _friend['owes'],
                                style: AppTextStyles.heading2,
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            onPressed: () {}, // TODO: SettleUpBottomSheet
                            icon: const Icon(Icons.handshake_outlined, color: AppColors.onPrimary),
                            label: const Text('Settle Up', style: TextStyle(color: AppColors.onPrimary, fontWeight: FontWeight.bold)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              minimumSize: const Size(180, 44),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
                      child: Text('ACTIVITY', style: AppTextStyles.caption.copyWith(
                        color: AppColors.onSurfaceMid, letterSpacing: 1.4, fontWeight: FontWeight.bold,
                      )),
                    ),
                  ),

                  _activity.isEmpty
                      ? const SliverFillRemaining(
                          child: EmptyState(
                            icon: Icons.receipt_long_outlined,
                            title: 'No shared expenses yet',
                            subtitle: 'Add an expense to get started.',
                          ),
                        )
                      : SliverList(
                          delegate: SliverChildBuilderDelegate(
                            (ctx, i) {
                              final item = _activity[i];
                              final isSettlement = item['type'] == 'settlement';
                              return InkWell(
                                onTap: () {
                                  if (!isSettlement) {
                                    context.push('${RouteNames.expenseDetail}/${item['id']}');
                                  }
                                },
                                child: Padding(
                                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                                  child: Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(10),
                                        decoration: BoxDecoration(
                                          color: isSettlement
                                              ? AppColors.primaryContainer.withOpacity(0.2)
                                              : AppColors.surfaceContainerLow,
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: Icon(
                                          isSettlement ? Icons.handshake_outlined : Icons.receipt_rounded,
                                          color: AppColors.primary,
                                          size: 20,
                                        ),
                                      ),
                                      const SizedBox(width: 14),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(item['description'], style: AppTextStyles.bodyText1.copyWith(fontWeight: FontWeight.w600)),
                                            Text('${item['paidBy']} · ${item['date']}', style: AppTextStyles.caption.copyWith(color: AppColors.onSurfaceMid)),
                                          ],
                                        ),
                                      ),
                                      AmountText(
                                        paise: isSettlement ? item['amount'] : item['yourShare'],
                                        style: AppTextStyles.bodyText1.copyWith(fontWeight: FontWeight.bold),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                            childCount: _activity.length,
                          ),
                        ),
                ],
              ),
            ),
    );
  }
}
