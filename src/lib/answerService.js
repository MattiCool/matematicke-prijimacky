import { supabase } from "./supabase";

// Uložení odpovědi do databáze
export async function saveUserAnswer(
  userId,
  problemId,
  selectedOptionId,
  isCorrect,
  timeSpent
) {
  try {
    const { data, error } = await supabase
      .from("user_answers")
      .insert([
        {
          user_id: userId,
          problem_id: problemId,
          selected_option_id: selectedOptionId,
          is_correct: isCorrect,
          time_spent_seconds: timeSpent,
          answered_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    console.log("✅ Odpověď uložena:", data);
    return { data, error: null };
  } catch (error) {
    console.error("❌ Chyba při ukládání odpovědi:", error);
    return { data: null, error: error.message };
  }
}

// Získání všech odpovědí uživatele
export async function getUserAnswers(userId) {
  try {
    const { data, error } = await supabase
      .from("user_answers")
      .select(
        `
        *,
        problems (
          id,
          title,
          topic_area_id,
          difficulty_level
        )
      `
      )
      .eq("user_id", userId)
      .order("answered_at", { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("❌ Chyba při načítání odpovědí:", error);
    return { data: null, error: error.message };
  }
}

// Získání statistik uživatele podle oblasti
export async function getUserStatsByTopic(userId, topicAreaId = null) {
  try {
    let query = supabase
      .from("user_answers")
      .select(
        `
        is_correct,
        time_spent_seconds,
        problems!inner(topic_area_id)
      `
      )
      .eq("user_id", userId);

    if (topicAreaId) {
      query = query.eq("problems.topic_area_id", topicAreaId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Vypočítáme statistiky
    const total = data.length;
    const correct = data.filter((a) => a.is_correct).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const totalTime = data.reduce(
      (sum, a) => sum + (a.time_spent_seconds || 0),
      0
    );
    const avgTime = total > 0 ? (totalTime / total / 60).toFixed(1) : 0; // v minutách

    return {
      data: {
        totalProblems: total,
        correctAnswers: correct,
        accuracy,
        averageTime: parseFloat(avgTime),
        totalTimeSeconds: totalTime,
      },
      error: null,
    };
  } catch (error) {
    console.error("❌ Chyba při načítání statistik:", error);
    return { data: null, error: error.message };
  }
}

// Získání celkových statistik uživatele
export async function getUserOverallStats(userId) {
  try {
    const { data, error } = await getUserStatsByTopic(userId, null);

    if (error) throw error;

    // Můžeme přidat další metriky
    // Například výpočet "streak" (série po sobě jdoucích správných odpovědí)

    return { data: data.data, error: null };
  } catch (error) {
    console.error("❌ Chyba při načítání celkových statistik:", error);
    return { data: null, error: error.message };
  }
}

// Získání chybných odpovědí pro revizi
export async function getIncorrectAnswers(userId, topicAreaId = null) {
  try {
    let query = supabase
      .from("user_answers")
      .select(
        `
        *,
        problems (
          id,
          title,
          topic_area_id,
          question_text,
          difficulty_level,
          answer_options (*)
        )
      `
      )
      .eq("user_id", userId)
      .eq("is_correct", false)
      .order("answered_at", { ascending: false });

    if (topicAreaId) {
      query = query.eq("problems.topic_area_id", topicAreaId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("❌ Chyba při načítání chybných odpovědí:", error);
    return { data: null, error: error.message };
  }
}
