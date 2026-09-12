export const supabaseConfig = {
  url: "",
  anonKey: "",
  serviceKey: "",
  databaseUrl: "",
};

export function supabaseConfigured(): boolean {
  return Boolean(supabaseConfig.url && (supabaseConfig.serviceKey || supabaseConfig.anonKey));
}
