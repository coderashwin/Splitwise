import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/expenses_repository.dart';

final expensesRepositoryProvider = Provider<ExpensesRepository>((ref) => ExpensesRepository());
