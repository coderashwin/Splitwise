import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/friends_repository.dart';

final friendDebtRepositoryProvider = Provider<FriendsRepository>((ref) => FriendsRepository());
