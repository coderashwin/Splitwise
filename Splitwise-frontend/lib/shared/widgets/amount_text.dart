import 'package:flutter/material.dart';
import '../../core/utils/currency_formatter.dart';
import '../../core/theme/app_colors.dart';

class AmountText extends StatelessWidget {
  final int paise;
  final bool owes;
  final TextStyle? style;

  const AmountText({
    super.key,
    required this.paise,
    this.owes = false,
    this.style,
  });

  @override
  Widget build(BuildContext context) {
    if (paise == 0) {
      return Text(
        'Settled up',
        style: style?.copyWith(color: AppColors.onSurfaceMid) ??
            const TextStyle(color: AppColors.onSurfaceMid),
      );
    }

    final formattedAmount = CurrencyFormatter.format(paise);
    final color = owes ? AppColors.error : AppColors.success;

    return Text(
      formattedAmount,
      style: style?.copyWith(color: color) ?? TextStyle(color: color),
    );
  }
}
