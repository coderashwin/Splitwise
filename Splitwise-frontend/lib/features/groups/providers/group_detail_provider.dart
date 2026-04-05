import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/groups_repository.dart';

final groupDetailRepositoryProvider = Provider<GroupsRepository>((ref) => GroupsRepository());
