import 'package:dio/dio.dart';
import '../../auth/data/models/user_model.dart';

class ProfileApi {
  final Dio _dio;
  ProfileApi(this._dio);

  Future<UserModel> updateProfile(Map<String, dynamic> body) async {
    final response = await _dio.patch('/users/me', data: body);
    return UserModel.fromJson(response.data);
  }

  Future<void> deleteAccount() async {
    await _dio.delete('/users/me');
  }

  Future<Map<String, dynamic>> presignUpload(Map<String, dynamic> body) async {
    final response = await _dio.post('/uploads/presign', data: body);
    return response.data;
  }
}
