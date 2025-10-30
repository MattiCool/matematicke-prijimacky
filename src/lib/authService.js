import { supabase } from "./supabase";

// Přihlášení
export async function loginUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { user: data.user, error: null };
  } catch (error) {
    console.error("❌ Login error:", error.message);
    return { user: null, error: error.message };
  }
}

// Registrace
export async function registerUser(email, password, fullName) {
  try {
    // 1. Vytvoření uživatele v auth.users
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    // 2. Vytvoření profilu v user_profiles (automaticky po registraci)
    if (data.user) {
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          id: data.user.id,
          user_id: data.user.id,
          current_grade: 9, // Výchozí hodnota
        });

      if (profileError) console.error("Profile creation error:", profileError);
    }

    return { user: data.user, error: null };
  } catch (error) {
    console.error("❌ Register error:", error.message);
    return { user: null, error: error.message };
  }
}

// Odhlášení
export async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("❌ Logout error:", error.message);
    return { error: error.message };
  }
}

// Získání aktuálního uživatele
export async function getCurrentUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error("❌ Get user error:", error.message);
    return null;
  }
}

// Sledování změn auth stavu
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
}
