import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../shared/widgets/app_avatar.dart';
import '../../../../shared/widgets/amount_text.dart';

class ExpenseDetailScreen extends ConsumerStatefulWidget {
  final String expenseId;

  const ExpenseDetailScreen({super.key, required this.expenseId});

  @override
  ConsumerState<ExpenseDetailScreen> createState() => _ExpenseDetailScreenState();
}

class _ExpenseDetailScreenState extends ConsumerState<ExpenseDetailScreen> {
  // Mock data representing a detailed expense
  final Map<String, dynamic> _mockExpense = {
    'id': '101',
    'description': "Dinner at Luigi's",
    'amount': 6500, // paise
    'date': 'Oct 2nd',
    'added_by': 'Alice Smith',
    'splits': [
      {'name': 'Alice Smith', 'paid': 6500, 'owes': 0},
      {'name': 'Bob', 'paid': 0, 'owes': 3250},
      {'name': 'Charlie', 'paid': 0, 'owes': 3250},
    ],
  };

  @override
  Widget build(BuildContext context) {
    final splits = _mockExpense['splits'] as List<dynamic>;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.onSurface),
          onPressed: () => context.pop(),
        ),
        title: const Text('Expense details', style: AppTextStyles.subtitle1),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined, color: AppColors.onSurface),
            onPressed: () {
              // Edit expense action
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header Section
            Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.primaryContainer.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.local_pizza_rounded, size: 48, color: AppColors.primary),
                ),
                const SizedBox(height: 16),
                Text(_mockExpense['description'], style: AppTextStyles.heading2),
                const SizedBox(height: 8),
                AmountText(
                  paise: _mockExpense['amount'],
                  style: AppTextStyles.heading1,
                ),
                const SizedBox(height: 8),
                Text(
                  'Added by ${_mockExpense['added_by']} on ${_mockExpense['date']}',
                  style: AppTextStyles.caption.copyWith(color: AppColors.onSurfaceMid),
                ),
              ],
            ),
            
            const SizedBox(height: 48),

            // Splits Breakdown Card
            Container(
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.outlineVariant, width: 1),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  )
                ],
              ),
              child: ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                itemCount: splits.length,
                separatorBuilder: (context, index) => const Divider(height: 32, color: AppColors.outlineVariant),
                itemBuilder: (context, index) {
                  final split = splits[index];
                  final bool paidPositive = split['paid'] > 0;
                  final int displayAmount = paidPositive ? split['paid'] : split['owes'];
                  final String actionText = paidPositive ? 'paid ' : 'owes ';
                  
                  return Row(
                    children: [
                      AppAvatar(name: split['name'], radius: 20),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Text(
                          split['name'],
                          style: AppTextStyles.bodyText1.copyWith(fontWeight: FontWeight.bold),
                        ),
                      ),
                      Text(actionText, style: AppTextStyles.bodyText2),
                      AmountText(
                        paise: displayAmount,
                        style: AppTextStyles.bodyText1.copyWith(
                          color: paidPositive ? AppColors.primary : AppColors.onSurface,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
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
