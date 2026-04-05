import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';

class AddExpenseScreen extends ConsumerStatefulWidget {
  const AddExpenseScreen({super.key});

  @override
  ConsumerState<AddExpenseScreen> createState() => _AddExpenseScreenState();
}

class _AddExpenseScreenState extends ConsumerState<AddExpenseScreen> {
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _descController = TextEditingController();

  String _paidBy = 'You';
  String _splitType = 'equally';

  @override
  void dispose() {
    _amountController.dispose();
    _descController.dispose();
    super.dispose();
  }

  void _saveExpense() {
    // TODO: Connect to Add Expense API
    // context.pop() when successful
    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: AppColors.onSurface),
          onPressed: () => context.pop(),
        ),
        title: const Text('Add an expense', style: AppTextStyles.heading2),
        centerTitle: true,
        actions: [
          TextButton(
            onPressed: _saveExpense,
            child: const Text('SAVE', style: TextStyle(
              color: AppColors.primary,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
            )),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Description Input
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.outlineVariant),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.receipt_long_rounded, color: AppColors.onSurfaceMid),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextField(
                        controller: _descController,
                        decoration: const InputDecoration(
                          hintText: 'Enter a description',
                          border: InputBorder.none,
                          hintStyle: TextStyle(color: AppColors.onSurfaceMid),
                        ),
                        style: AppTextStyles.bodyText1,
                      ),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 48),

              // Amount Input
              Center(
                child: IntrinsicWidth(
                  child: TextField(
                    controller: _amountController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    textAlign: TextAlign.center,
                    decoration: InputDecoration(
                      prefixText: '₹ ',
                      prefixStyle: const TextStyle(
                        color: AppColors.primary,
                        fontSize: 48,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Manrope',
                      ),
                      hintText: '0.00',
                      hintStyle: TextStyle(
                        color: AppColors.primary.withOpacity(0.5),
                        fontSize: 48,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Manrope',
                      ),
                      border: InputBorder.none,
                    ),
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 48,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Manrope',
                    ),
                  ),
                ),
              ),
              
              const SizedBox(height: 48),

              // Split Logic
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Paid by ', style: AppTextStyles.bodyText1),
                  ActionChip(
                    label: Text(_paidBy, style: const TextStyle(color: AppColors.onPrimary)),
                    backgroundColor: AppColors.primary,
                    side: BorderSide.none,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    onPressed: () {
                      // TODO: Open Paid By bottom sheet
                    },
                  ),
                  const Text(' and split ', style: AppTextStyles.bodyText1),
                  ActionChip(
                    label: Text(_splitType, style: const TextStyle(color: AppColors.onPrimary)),
                    backgroundColor: AppColors.primary,
                    side: BorderSide.none,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    onPressed: () {
                      // TODO: Open Split Type bottom sheet
                    },
                  ),
                ],
              ),
              
              const SizedBox(height: 48),

              // Date Picker
              InkWell(
                onTap: () {
                  // TODO: Open Date Picker
                },
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.outlineVariant),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.calendar_today_rounded, color: AppColors.onSurfaceMid, size: 20),
                      const SizedBox(width: 8),
                      Text('Today', style: AppTextStyles.bodyText1.copyWith(color: AppColors.onSurfaceMid)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
