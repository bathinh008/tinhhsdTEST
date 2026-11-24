// CHỈ thông tin công khai: URL Supabase Edge Function + hCaptcha Site Key.
// KHÔNG đặt OPENAI_API_KEY, HCAPTCHA_SECRET hoặc Supabase secret/service_role key ở đây.
window.HSD_CONFIG = {
  functionUrl: 'https://THAY_PROJECT_REF.supabase.co/functions/v1/read-expiry-date',
  captchaSiteKey: 'THAY_HCAPTCHA_SITE_KEY'
};
