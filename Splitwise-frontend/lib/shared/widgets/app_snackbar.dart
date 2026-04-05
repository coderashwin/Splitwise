import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class AppSnackbar {
  static void showSuccess(BuildContext context, String message) {
    _showSnackbar(context, message, AppColors.success);
  }

  static void showError(BuildContext context, String message) {
    _showSnackbar(context, message, AppColors.error);
  }

  static void _showSnackbar(BuildContext context, String message, Color color) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: const TextStyle(color: Colors.white)),
        backgroundColor: color,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }
}
