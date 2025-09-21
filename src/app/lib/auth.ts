// lib/supabase/auth.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Kullanıcı oturumunu kontrol etme
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Oturum alınırken hata oluştu:', error);
    throw error;
  }
};

// Kullanıcının profilini getirme
export const getUserProfile = async (userId: string) => {
  try {
    const session = await getSession();
    if (!session) throw new Error('Kullanıcı oturumu yok');

    const authUid = session.user.id;

    // Admin mi kontrol et
    const { data: profileCheck, error: profileCheckError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUid)
      .single();

    if (profileCheckError) throw profileCheckError;

    const isAdminUser = profileCheck?.user_type === 'admin';

    // Eğer admin ise, istediği profili alabilir
    if (isAdminUser) {
      const { data: adminProfile, error: adminError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (adminError) throw adminError;
      return adminProfile;
    }

    // Normal kullanıcı, sadece kendi profilini görebilir
    if (authUid !== userId) {
      throw new Error('Yetkisiz erişim');
    }

    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUid)
      .single();

    if (userError) throw userError;

    return userProfile;
  } catch (error) {
    console.error('Kullanıcı profili getirme hatası:', error);
    throw error;
  }
};

// Kullanıcının admin olup olmadığını kontrol et
export const isAdmin = async (userId: string) => {
  try {
    const profile = await getUserProfile(userId);
    return profile.user_type === 'admin';
  } catch (error) {
    console.error('Admin yetki kontrol hatası:', error);
    return false;
  }
};

// Kullanıcının profilinin olup olmadığını kontrol et
export const checkUserProfileExists = async (userId: string) => {
  try {
    const session = await getSession();
    if (!session) throw new Error('Oturum yok');

    const authUid = session.user.id;
    if (authUid !== userId) return { exists: false, error: 'Yetkisiz' };

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authUid)
      .single();

    return { exists: !!data, error };
  } catch (error) {
    console.error('Profil var mı kontrol hatası:', error);
    return { exists: false, error };
  }
};
