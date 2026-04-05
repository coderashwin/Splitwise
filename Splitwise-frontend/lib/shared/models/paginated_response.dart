class PaginatedResponse<T> {
  final List<T> data;
  final String? nextCursor;
  final int? total;

  const PaginatedResponse({required this.data, this.nextCursor, this.total});
}
