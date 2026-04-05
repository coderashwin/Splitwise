import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/auth_repository.dart';
import '../data/models/user_model.dart';
import '../../../core/network/api_result.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) => AuthRepository());

final authNotifierProvider = StateNotifierProvider<AuthNotifier, AsyncValue<UserModel?>>((ref) {
  return AuthNotifier(ref.read(authRepositoryProvider));
});

class AuthNotifier extends StateNotifier<AsyncValue<UserModel?>> {
  final AuthRepository _repo;
  AuthNotifier(this._repo) : super(const AsyncValue.data(null));

  Future<void> initAuth() async {
    state = const AsyncValue.loading();
    final result = await _repo.getMe();
    if (result is ApiSuccess<UserModel>) {
      state = AsyncValue.data(result.data);
    } else {
      state = const AsyncValue.data(null);
    }
  }

  Future<bool> loginWithGoogle(String idToken) async {
    state = const AsyncValue.loading();
    final result = await _repo.loginWithGoogle(idToken);
    if (result is ApiSuccess<UserModel>) {
      state = AsyncValue.data(result.data);
      return true;
    }
    state = const AsyncValue.data(null);
    return false;
  }

  Future<void> logout() async {
    await _repo.logout();
    state = const AsyncValue.data(null);
  }
}
