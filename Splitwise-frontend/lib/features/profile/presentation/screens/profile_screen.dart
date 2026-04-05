import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../../core/router/route_names.dart';
import '../../../../shared/widgets/app_avatar.dart';
import '../../../../shared/widgets/app_snackbar.dart';
import '../../../../shared/widgets/app_text_field.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _nameController = TextEditingController(text: 'Your Name');
  bool _isEditing = false;
  bool _isSaving = false;

  // Mock user
  final Map<String, dynamic> _user = {
    'name': 'Your Name',
    'email': 'you@example.com',
    'joinedDate': 'January 2024',
  };

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Log out'),
        content: const Text('Are you sure you want to log out?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Log out', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    // TODO: POST /api/v1/auth/logout
    await SecureStorage.clearAll();
    if (!mounted) return;
    context.go(RouteNames.login);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: const Text('Account', style: AppTextStyles.heading2),
        actions: [
          if (!_isEditing)
            IconButton(
              icon: const Icon(Icons.edit_outlined, color: AppColors.onSurface),
              onPressed: () => setState(() => _isEditing = true),
            ),
          if (_isEditing)
            TextButton(
              onPressed: _isSaving ? null : () async {
                setState(() => _isSaving = true);
                await Future.delayed(const Duration(seconds: 1)); // TODO: PATCH /api/v1/users/me
                if (!mounted) return;
                setState(() { _isSaving = false; _isEditing = false; });
                AppSnackbar.success(context, 'Profile updated!');
              },
              child: _isSaving
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary))
                  : const Text('Save', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Avatar
            Center(
              child: Stack(
                children: [
                  AppAvatar(name: _user['name'], radius: 48),
                  if (_isEditing)
                    Positioned(
                      bottom: 0, right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                        child: const Icon(Icons.camera_alt_rounded, size: 16, color: AppColors.onPrimary),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Name
            _isEditing
                ? AppTextField(
                    controller: _nameController,
                    labelText: 'Name',
                    prefixIcon: const Icon(Icons.person_outline_rounded, color: AppColors.onSurfaceMid),
                  )
                : Column(
                    children: [
                      Text(_user['name'], style: AppTextStyles.heading2),
                      const SizedBox(height: 4),
                      Text(_user['email'], style: AppTextStyles.bodyText2.copyWith(color: AppColors.onSurfaceMid)),
                    ],
                  ),

            const SizedBox(height: 32),

            // Settings tiles
            _SettingsSection(
              title: 'ACCOUNT',
              tiles: [
                _SettingsTile(
                  icon: Icons.email_outlined,
                  label: 'Email',
                  value: _user['email'],
                ),
                _SettingsTile(
                  icon: Icons.calendar_today_outlined,
                  label: 'Member since',
                  value: _user['joinedDate'],
                ),
              ],
            ),

            const SizedBox(height: 20),

            _SettingsSection(
              title: 'PREFERENCES',
              tiles: [
                _SettingsTile(
                  icon: Icons.notifications_outlined,
                  label: 'Notifications',
                  trailing: Switch(
                    value: true,
                    onChanged: (_) {},
                    activeColor: AppColors.primary,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),

            _SettingsSection(
              title: 'LEGAL',
              tiles: [
                _SettingsTile(icon: Icons.privacy_tip_outlined, label: 'Privacy Policy', onTap: () {}),
                _SettingsTile(icon: Icons.description_outlined, label: 'Terms of Service', onTap: () {}),
              ],
            ),

            const SizedBox(height: 32),

            // Log out button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _logout,
                icon: const Icon(Icons.logout_rounded, color: AppColors.error),
                label: const Text('Log out', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.bold)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.error),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  minimumSize: const Size(double.infinity, 50),
                ),
              ),
            ),

            const SizedBox(height: 12),

            // Danger zone
            TextButton(
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (_) => AlertDialog(
                    title: const Text('Delete Account'),
                    content: const Text('This action is permanent. All your data will be erased.'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
                      TextButton(
                        onPressed: () {
                          Navigator.pop(context);
                          // TODO: DELETE /api/v1/users/me
                        },
                        child: const Text('Delete', style: TextStyle(color: AppColors.error)),
                      ),
                    ],
                  ),
                );
              },
              child: const Text('Delete Account', style: TextStyle(color: AppColors.onSurfaceMid, fontSize: 13)),
            ),

            const SizedBox(height: 24),
            const Text('SplitPro v1.0.0', style: TextStyle(color: AppColors.onSurfaceMid, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}

class _SettingsSection extends StatelessWidget {
  final String title;
  final List<Widget> tiles;
  const _SettingsSection({required this.title, required this.tiles});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Text(title, style: AppTextStyles.caption.copyWith(
            color: AppColors.onSurfaceMid, letterSpacing: 1.4, fontWeight: FontWeight.bold,
          )),
        ),
        Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.outlineVariant.withOpacity(0.3)),
          ),
          child: Column(children: tiles),
        ),
      ],
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? value;
  final Widget? trailing;
  final VoidCallback? onTap;

  const _SettingsTile({required this.icon, required this.label, this.value, this.trailing, this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppColors.onSurfaceMid, size: 22),
      title: Text(label, style: AppTextStyles.bodyText1),
      subtitle: value != null ? Text(value!, style: AppTextStyles.caption.copyWith(color: AppColors.onSurfaceMid)) : null,
      trailing: trailing ?? (onTap != null ? const Icon(Icons.chevron_right_rounded, color: AppColors.onSurfaceMid) : null),
      onTap: onTap,
      dense: true,
    );
  }
}
