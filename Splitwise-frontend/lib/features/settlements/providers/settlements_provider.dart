import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/settlements_repository.dart';

final settlementsRepositoryProvider = Provider<SettlementsRepository>((ref) => SettlementsRepository());
