import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_text_styles.dart';

class AppScaffold extends StatelessWidget {
  final Widget child;
  const AppScaffold({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final Map<String, int> routeToIndex = {
      RouteNames.groups: 0,
      RouteNames.friends: 1,
      '/activity': 2,
      RouteNames.profile: 3,
    };

    final location = GoRouterState.of(context).matchedLocation;
    final currentIndex = routeToIndex.entries
        .firstWhere((e) => location.startsWith(e.key), orElse: () => const MapEntry('', 0))
        .value;

    return Scaffold(
      body: child,
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'add_expense_fab',
        backgroundColor: AppColors.primary,
        onPressed: () => context.push(RouteNames.addExpense),
        icon: const Icon(Icons.add_rounded, color: AppColors.onPrimary),
        label: const Text('Add Expense', style: TextStyle(color: AppColors.onPrimary, fontWeight: FontWeight.bold)),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: (index) {
          switch (index) {
            case 0: context.go(RouteNames.groups); break;
            case 1: context.go(RouteNames.friends); break;
            case 2: context.go('/activity'); break;
            case 3: context.go(RouteNames.profile); break;
          }
        },
        backgroundColor: AppColors.surface,
        indicatorColor: AppColors.primaryContainer,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.group_outlined),
            selectedIcon: Icon(Icons.group_rounded),
            label: 'Groups',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline_rounded),
            selectedIcon: Icon(Icons.person_rounded),
            label: 'Friends',
          ),
          NavigationDestination(
            icon: Icon(Icons.notifications_none_rounded),
            selectedIcon: Icon(Icons.notifications_rounded),
            label: 'Activity',
          ),
          NavigationDestination(
            icon: Icon(Icons.account_circle_outlined),
            selectedIcon: Icon(Icons.account_circle_rounded),
            label: 'Account',
          ),
        ],
      ),
    );
  }
}
