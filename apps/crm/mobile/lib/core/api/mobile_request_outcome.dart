class MobileRequestOutcome<T> {
  const MobileRequestOutcome.success(this.value) : error = null;
  const MobileRequestOutcome.failure(this.error) : value = null;

  final T? value;
  final Object? error;

  bool get succeeded => error == null;
}

Future<MobileRequestOutcome<T>> captureMobileRequest<T>(
  Future<T> request,
) async {
  try {
    return MobileRequestOutcome<T>.success(await request);
  } on Object catch (error) {
    return MobileRequestOutcome<T>.failure(error);
  }
}
