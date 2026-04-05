import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'route_names.dart';
import '../../features/auth/presentation/screens/splash_screen.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/home/presentation/screens/app_scaffold.dart';
import '../../features/groups/presentation/screens/groups_list_screen.dart';
import '../../features/groups/presentation/screens/group_detail_screen.dart';
import '../../features/groups/presentation/screens/create_group_screen.dart';
import '../../features/friends/presentation/screens/friends_list_screen.dart';
import '../../features/friends/presentation/screens/friend_detail_screen.dart';
import '../../features/expenses/presentation/screens/add_expense_screen.dart';
import '../../features/expenses/presentation/screens/expense_detail_screen.dart';
import '../../features/notifications/presentation/screens/notifications_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>();
final GlobalKey<NavigatorState> _shellNavigatorKey = GlobalKey<NavigatorState>();

final GoRouter appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: RouteNames.splash,
  routes: [
    // --- Auth routes ---
    GoRoute(
      path: RouteNames.splash,
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: RouteNames.login,
      builder: (context, state) => const LoginScreen(),
    ),

    // --- Full-screen modal routes (no bottom nav) ---
    GoRoute(
      path: RouteNames.addExpense,
      builder: (context, state) => const AddExpenseScreen(),
    ),
    GoRoute(
      path: '${RouteNames.expenseDetail}/:id',
      builder: (context, state) => ExpenseDetailScreen(
        expenseId: state.pathParameters['id'] ?? '',
      ),
    ),
    GoRoute(
      path: RouteNames.createGroup,
      builder: (context, state) => const CreateGroupScreen(),
    ),
    GoRoute(
      path: '${RouteNames.groupDetail}/:id',
      builder: (context, state) => GroupDetailScreen(
        groupId: state.pathParameters['id'] ?? '',
      ),
    ),
    GoRoute(
      path: '${RouteNames.friendDetail}/:id',
      builder: (context, state) => FriendDetailScreen(
        friendId: state.pathParameters['id'] ?? '',
      ),
    ),
    GoRoute(
      path: RouteNames.notifications,
      builder: (context, state) => const NotificationsScreen(),
    ),

    // --- Shell routes (with bottom nav) ---
    ShellRoute(
      navigatorKey: _shellNavigatorKey,
      builder: (context, state, child) => AppScaffold(child: child),
      routes: [
        GoRoute(
          path: RouteNames.groups,
          builder: (context, state) => const GroupsListScreen(),
        ),
        GoRoute(
          path: RouteNames.friends,
          builder: (context, state) => const FriendsListScreen(),
        ),
        GoRoute(
          path: '/activity',
          builder: (context, state) => const NotificationsScreen(),
        ),
        GoRoute(
          path: RouteNames.profile,
          builder: (context, state) => const ProfileScreen(),
        ),
      ],
    ),
  ],
);
