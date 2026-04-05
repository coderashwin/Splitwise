import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/groups_repository.dart';

final groupsRepositoryProvider = Provider<GroupsRepository>((ref) => GroupsRepository());
