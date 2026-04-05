import 'package:intl/intl.dart';

class CurrencyFormatter {
  static final NumberFormat _currencyFormat = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 2,
  );

  /// Formats paise (integer) to display string (e.g., "₹150.50")
  static String format(int paise) {
    if (paise == 0) return 'Settled up';
    final amount = paise / 100.0;
    return _currencyFormat.format(amount);
  }

  /// Converts a user-input string (e.g., "150.50") to paise integer
  static int? toPaise(String input) {
    if (input.isEmpty) return null;
    try {
      final double amount = double.parse(input);
      return (amount * 100).round();
    } catch (_) {
      return null;
    }
  }
}
