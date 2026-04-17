class AppConfig {
  static const merchantName = 'GigSuraksha';
  static const merchantTagline = 'Weekly income protection';
  static const paymentCurrency = 'INR';
  static const razorpayKeyId = String.fromEnvironment(
    'RAZORPAY_KEY_ID',
    defaultValue: 'rzp_test_Sc8CBrnQuB0Tt5',
  );

  static bool get isRazorpayConfigured => razorpayKeyId.trim().isNotEmpty;
}
