import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/router/route_names.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../../shared/widgets/app_button.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  bool _isLoading = false;

  Future<void> _handleSimulatedLogin() async {
    setState(() => _isLoading = true);
    await Future.delayed(const Duration(seconds: 1)); // Simulate network
    
    // Save mock tokens to simulate login
    await SecureStorage.saveTokens(
      accessToken: 'mock_access_token_${DateTime.now().millisecondsSinceEpoch}',
      refreshToken: 'mock_refresh_token',
    );
    
    if (mounted) {
      setState(() => _isLoading = false);
      context.go(RouteNames.groups);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(flex: 2),
              
              // Logo
              Center(
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withOpacity(0.3),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      )
                    ],
                  ),
                  child: const Icon(
                    Icons.pie_chart_outline_rounded,
                    size: 40,
                    color: AppColors.surface,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              
              // Title & Subtitle
              const Text(
                'SplitPro',
                textAlign: TextAlign.center,
                style: AppTextStyles.heading2,
              ),
              const SizedBox(height: 8),
              const Text(
                'Split expenses with friends easily',
                textAlign: TextAlign.center,
                style: AppTextStyles.bodyText1,
              ),
              
              const Spacer(flex: 2),

              // Login Buttons
              OutlinedButton.icon(
                onPressed: _isLoading ? null : _handleSimulatedLogin,
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(56),
                  side: const BorderSide(color: AppColors.border),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  backgroundColor: AppColors.surface,
                ),
                icon: const Icon(Icons.g_mobiledata_rounded, size: 32, color: Colors.blue), // Placeholder for Google Logo
                label: const Text(
                  'Continue with Google',
                  style: TextStyle(fontSize: 16, color: AppColors.onSurface, fontWeight: FontWeight.bold),
                ),
              ),
              
              const SizedBox(height: 16),
              
              ElevatedButton.icon(
                onPressed: _isLoading ? null : _handleSimulatedLogin,
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(56),
                  backgroundColor: Colors.black, // Apple style
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                icon: const Icon(Icons.apple_rounded, size: 28),
                label: const Text(
                  'Continue with Apple',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
              
              if (_isLoading)
                 const Padding(
                   padding: EdgeInsets.only(top: 24.0),
                   child: Center(child: CircularProgressIndicator()),
                 ),

              const Spacer(),
              
              // Terms and conditions
              const Text(
                'By continuing you agree to our Terms & Conditions and Privacy Policy',
                textAlign: TextAlign.center,
                style: AppTextStyles.caption,
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
