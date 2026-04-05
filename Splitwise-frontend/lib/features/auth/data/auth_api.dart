import 'package:dio/dio.dart';
import 'models/token_response.dart';
import 'models/user_model.dart';

class AuthApi {
  final Dio _dio;

  AuthApi(this._dio);

  Future<TokenResponse> loginWithGoogle(Map<String, dynamic> body) async {
    final response = await _dio.post('/auth/google', data: body);
    return TokenResponse.fromJson(response.data);
  }

  Future<TokenResponse> loginWithApple(Map<String, dynamic> body) async {
    final response = await _dio.post('/auth/apple', data: body);
    return TokenResponse.fromJson(response.data);
  }

  Future<UserModel> getMe() async {
    final response = await _dio.get('/auth/me');
    return UserModel.fromJson(response.data);
  }

  Future<void> logout(Map<String, dynamic> body) async {
    await _dio.post('/auth/logout', data: body);
  }
}
