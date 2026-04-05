import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../shared/widgets/app_snackbar.dart';
import '../../../../shared/widgets/app_text_field.dart';

class CreateGroupScreen extends ConsumerStatefulWidget {
  const CreateGroupScreen({super.key});

  @override
  ConsumerState<CreateGroupScreen> createState() => _CreateGroupScreenState();
}

class _CreateGroupScreenState extends ConsumerState<CreateGroupScreen> {
  final _nameController = TextEditingController();
  final _addPersonController = TextEditingController();
  String _selectedType = 'Trip';
  bool _isSaving = false;

  final List<String> _groupTypes = ['Trip', 'Home', 'Couple', 'Other'];
  final List<String> _members = ['You'];

  static const Map<String, IconData> _typeIcons = {
    'Trip': Icons.flight_takeoff_rounded,
    'Home': Icons.home_rounded,
    'Couple': Icons.favorite_rounded,
    'Other': Icons.group_rounded,
  };

  @override
  void dispose() {
    _nameController.dispose();
    _addPersonController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_nameController.text.trim().isEmpty) {
      AppSnackbar.error(context, 'Please enter a group name.');
      return;
    }
    setState(() => _isSaving = true);
    await Future.delayed(const Duration(seconds: 1)); // TODO: POST /api/v1/groups
    if (!mounted) return;
    setState(() => _isSaving = false);
    AppSnackbar.success(context, 'Group created!');
    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.onSurface),
          onPressed: () => context.pop(),
        ),
        title: const Text('Create a group', style: AppTextStyles.heading2),
        centerTitle: true,
        actions: [
          TextButton(
            onPressed: _isSaving ? null : _save,
            child: _isSaving
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary))
                : const Text('SAVE', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Group avatar + name row
            Row(
              children: [
                InkWell(
                  onTap: () {}, // TODO: image picker
                  borderRadius: BorderRadius.circular(40),
                  child: Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: AppColors.surfaceContainerLow,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.camera_alt_rounded, color: AppColors.onSurfaceMid, size: 28),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: AppTextField(
                    controller: _nameController,
                    hintText: 'Group name',
                    keyboardType: TextInputType.text,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),

            // Type
            Text('TYPE', style: AppTextStyles.caption.copyWith(
              color: AppColors.onSurfaceMid,
              letterSpacing: 1.4,
              fontWeight: FontWeight.bold,
            )),
            const SizedBox(height: 12),
            Wrap(
              spacing: 10,
              children: _groupTypes.map((type) {
                final selected = _selectedType == type;
                return ChoiceChip(
                  avatar: Icon(_typeIcons[type], size: 16,
                      color: selected ? AppColors.onPrimary : AppColors.onSurfaceMid),
                  label: Text(type, style: TextStyle(
                    color: selected ? AppColors.onPrimary : AppColors.onSurface,
                    fontWeight: selected ? FontWeight.bold : FontWeight.normal,
                  )),
                  selected: selected,
                  selectedColor: AppColors.primary,
                  backgroundColor: AppColors.surfaceContainerLow,
                  side: BorderSide.none,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  onSelected: (_) => setState(() => _selectedType = type),
                );
              }).toList(),
            ),
            const SizedBox(height: 32),

            // Members
            Text('GROUP MEMBERS', style: AppTextStyles.caption.copyWith(
              color: AppColors.onSurfaceMid,
              letterSpacing: 1.4,
              fontWeight: FontWeight.bold,
            )),
            const SizedBox(height: 12),
            ..._members.map((m) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: AppColors.primaryContainer.withOpacity(0.2),
                    child: Text(m[0], style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(width: 14),
                  Text(m, style: AppTextStyles.bodyText1),
                ],
              ),
            )),
            const SizedBox(height: 8),
            // Add person row
            Row(
              children: [
                Expanded(
                  child: AppTextField(
                    controller: _addPersonController,
                    hintText: 'Add a person by name or email',
                    prefixIcon: const Icon(Icons.person_search_rounded, color: AppColors.onSurfaceMid),
                  ),
                ),
                const SizedBox(width: 10),
                InkWell(
                  onTap: () {
                    final name = _addPersonController.text.trim();
                    if (name.isEmpty) return;
                    setState(() {
                      _members.add(name);
                      _addPersonController.clear();
                    });
                  },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.add_rounded, color: AppColors.onPrimary),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
