import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/friends_repository.dart';

final friendsRepositoryProvider = Provider<FriendsRepository>((ref) => FriendsRepository());
