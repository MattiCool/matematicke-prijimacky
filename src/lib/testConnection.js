import { supabase } from "./supabase";

export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from("topic_areas")
      .select("*")
      .limit(1);

    if (error) {
      console.error("❌ Chyba připojení:", error);
      return false;
    }

    console.log("✅ Supabase připojeno!", data);
    return true;
  } catch (err) {
    console.error("❌ Kritická chyba:", err);
    return false;
  }
}
