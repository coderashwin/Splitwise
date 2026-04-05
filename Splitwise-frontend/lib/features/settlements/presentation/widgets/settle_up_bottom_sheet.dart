import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../shared/widgets/amount_text.dart';
import '../../../../shared/widgets/app_avatar.dart';
import '../../../../shared/widgets/app_bottom_sheet.dart';
import '../../../../shared/widgets/app_snackbar.dart';

class SettleUpBottomSheet extends ConsumerStatefulWidget {
  final String friendName;
  final int amount; // paise
  final bool friendOwes;

  const SettleUpBottomSheet({
    super.key,
    required this.friendName,
    required this.amount,
    required this.friendOwes,
  });

  static Future<void> show(
    BuildContext context, {
    required String friendName,
    required int amount,
    required bool friendOwes,
  }) {
    return AppBottomSheet.show(
      context: context,
      title: 'Settle Up',
      initialSize: 0.55,
      child: SettleUpBottomSheet(
        friendName: friendName,
        amount: amount,
        friendOwes: friendOwes,
      ),
    );
  }

  @override
  ConsumerState<SettleUpBottomSheet> createState() => _SettleUpBottomSheetState();
}

class _SettleUpBottomSheetState extends ConsumerState<SettleUpBottomSheet> {
  late final TextEditingController _amountController;
  bool _isSettling = false;

  @override
  void initState() {
    super.initState();
    final rupees = widget.amount / 100.0;
    _amountController = TextEditingController(text: rupees.toStringAsFixed(2));
  }

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _settle() async {
    setState(() => _isSettling = true);
    await Future.delayed(const Duration(seconds: 1)); // TODO: POST /api/v1/settlements
    if (!mounted) return;
    setState(() => _isSettling = false);
    Navigator.pop(context);
    AppSnackbar.success(context, 'Settlement recorded!');
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AppAvatar(name: widget.friendName, radius: 36),
          const SizedBox(height: 16),
          Text(
            widget.friendOwes
                ? '${widget.friendName} owes you'
                : 'You owe ${widget.friendName}',
            style: AppTextStyles.bodyText2.copyWith(color: AppColors.onSurfaceMid),
          ),
          const SizedBox(height: 8),
          AmountText(
            paise: widget.amount,
            owes: !widget.friendOwes,
            style: AppTextStyles.heading1,
          ),
          const SizedBox(height: 24),

          // Amount override input
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: AppColors.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Text('₹', style: TextStyle(fontSize: 24, color: AppColors.primary, fontWeight: FontWeight.bold)),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _amountController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(border: InputBorder.none),
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.onSurface),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _isSettling ? null : _settle,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: _isSettling
                  ? const CircularProgressIndicator(color: AppColors.onPrimary, strokeWidth: 2)
                  : Text(
                      widget.friendOwes ? 'Record ${widget.friendName}\'s Payment' : 'Record your Payment',
                      style: const TextStyle(color: AppColors.onPrimary, fontWeight: FontWeight.bold, fontSize: 16),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
