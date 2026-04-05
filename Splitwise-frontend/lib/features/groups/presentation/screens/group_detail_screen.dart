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

class GroupDetailScreen extends ConsumerStatefulWidget {
  final String groupId;
  const GroupDetailScreen({super.key, required this.groupId});

  @override
  ConsumerState<GroupDetailScreen> createState() => _GroupDetailScreenState();
}

class _GroupDetailScreenState extends ConsumerState<GroupDetailScreen> {
  bool _isLoading = false;

  // Mock data
  final Map<String, dynamic> _group = {
    'name': 'Trip to Bali',
    'icon': Icons.beach_access_rounded,
    'members': [
      {'name': 'Alice Smith', 'balance': 3000, 'owes': false},
      {'name': 'Bob Jones', 'balance': 1200, 'owes': true},
      {'name': 'You', 'balance': 1800, 'owes': false},
    ],
    'expenses': [
      {'id': '1', 'description': 'Hotel stay', 'amount': 8000, 'paidBy': 'Alice Smith', 'date': 'Oct 5'},
      {'id': '2', 'description': 'Scuba diving', 'amount': 3000, 'paidBy': 'You', 'date': 'Oct 6'},
      {'id': '3', 'description': 'Dinner at Luigi\'s', 'amount': 2500, 'paidBy': 'Bob Jones', 'date': 'Oct 7'},
    ],
  };

  @override
  Widget build(BuildContext context) {
    final members = _group['members'] as List<dynamic>;
    final expenses = _group['expenses'] as List<dynamic>;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.onSurface),
          onPressed: () => context.pop(),
        ),
        title: Text(_group['name'], style: AppTextStyles.heading2),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined, color: AppColors.onSurface),
            onPressed: () {},
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.primary,
        onPressed: () => context.push(RouteNames.addExpense),
        icon: const Icon(Icons.add_rounded, color: AppColors.onPrimary),
        label: const Text('Add Expense', style: TextStyle(color: AppColors.onPrimary, fontWeight: FontWeight.bold)),
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
                  // Members balance chips
                  SliverToBoxAdapter(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                          child: Text('BALANCES', style: AppTextStyles.caption.copyWith(
                            color: AppColors.onSurfaceMid, letterSpacing: 1.4, fontWeight: FontWeight.bold,
                          )),
                        ),
                        SizedBox(
                          height: 90,
                          child: ListView.separated(
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            scrollDirection: Axis.horizontal,
                            itemCount: members.length,
                            separatorBuilder: (_, __) => const SizedBox(width: 12),
                            itemBuilder: (_, i) {
                              final m = members[i];
                              return Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                decoration: BoxDecoration(
                                  color: AppColors.surface,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: AppColors.outlineVariant.withOpacity(0.4)),
                                ),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    AppAvatar(name: m['name'], radius: 18),
                                    const SizedBox(height: 6),
                                    AmountText(
                                      paise: m['balance'],
                                      owes: m['owes'],
                                      style: AppTextStyles.caption.copyWith(fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                        ),

                        // Settle up button
                        Padding(
                          padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                          child: OutlinedButton.icon(
                            onPressed: () {}, // TODO: SettleUpBottomSheet
                            icon: const Icon(Icons.handshake_outlined, color: AppColors.primary),
                            label: const Text('Settle Up', style: TextStyle(color: AppColors.primary)),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: AppColors.primary),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              minimumSize: const Size(double.infinity, 48),
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(20, 24, 20, 8),
                          child: Text('EXPENSES', style: AppTextStyles.caption.copyWith(
                            color: AppColors.onSurfaceMid, letterSpacing: 1.4, fontWeight: FontWeight.bold,
                          )),
                        ),
                      ],
                    ),
                  ),

                  // Expenses list
                  expenses.isEmpty
                      ? const SliverFillRemaining(
                          child: EmptyState(
                            icon: Icons.receipt_long_outlined,
                            title: 'No expenses yet',
                            subtitle: 'Add the first expense with the button below.',
                          ),
                        )
                      : SliverList(
                          delegate: SliverChildBuilderDelegate(
                            (ctx, i) {
                              final exp = expenses[i];
                              return InkWell(
                                onTap: () => context.push('${RouteNames.expenseDetail}/${exp['id']}'),
                                child: Padding(
                                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                                  child: Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(10),
                                        decoration: BoxDecoration(
                                          color: AppColors.primaryContainer.withOpacity(0.15),
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: const Icon(Icons.receipt_rounded, color: AppColors.primary, size: 20),
                                      ),
                                      const SizedBox(width: 14),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(exp['description'], style: AppTextStyles.bodyText1.copyWith(fontWeight: FontWeight.w600)),
                                            Text('${exp['paidBy']} paid · ${exp['date']}', style: AppTextStyles.caption.copyWith(color: AppColors.onSurfaceMid)),
                                          ],
                                        ),
                                      ),
                                      AmountText(paise: exp['amount'], style: AppTextStyles.bodyText1.copyWith(fontWeight: FontWeight.bold)),
                                    ],
                                  ),
                                ),
                              );
                            },
                            childCount: expenses.length,
                          ),
                        ),
                ],
              ),
            ),
    );
  }
}
