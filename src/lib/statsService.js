import { supabase } from "./supabase";

// Získání statistik pro všechny oblasti
export async function getStatsByAllTopics(userId) {
  try {
    const { data: topicAreas, error: topicsError } = await supabase
      .from("topic_areas")
      .select("id, name, code, order_index")
      .eq("is_active", true)
      .order("order_index", { ascending: true });

    if (topicsError) throw topicsError;

    // Pro každou oblast získáme statistiky
    const statsPromises = topicAreas.map(async (topic) => {
      const { data: answers, error: answersError } = await supabase
        .from("user_answers")
        .select(
          `
          is_correct,
          time_spent_seconds,
          problems!inner(topic_area_id)
        `
        )
        .eq("user_id", userId)
        .eq("problems.topic_area_id", topic.id);

      if (answersError) throw answersError;

      const total = answers.length;
      const correct = answers.filter((a) => a.is_correct).length;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

      return {
        topic_id: topic.id,
        topic_name: topic.name,
        topic_code: topic.code,
        total_problems: total,
        correct_answers: correct,
        accuracy,
      };
    });

    const stats = await Promise.all(statsPromises);

    return { data: stats, error: null };
  } catch (error) {
    console.error("❌ Chyba při načítání statistik podle oblastí:", error);
    return { data: null, error: error.message };
  }
}

// Získání celkových statistik
export async function getOverallStats(userId) {
  try {
    const { data: answers, error } = await supabase
      .from("user_answers")
      .select("is_correct, time_spent_seconds, answered_at")
      .eq("user_id", userId)
      .order("answered_at", { ascending: true });

    if (error) throw error;

    const total = answers.length;
    const correct = answers.filter((a) => a.is_correct).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const totalTime = answers.reduce(
      (sum, a) => sum + (a.time_spent_seconds || 0),
      0
    );
    const avgTime = total > 0 ? (totalTime / total / 60).toFixed(1) : 0;

    // Výpočet série (streak) - počet po sobě jdoucích správných odpovědí
    let currentStreak = 0;
    let maxStreak = 0;

    for (const answer of [...answers].reverse()) {
      if (answer.is_correct) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    // Pokrok za poslední měsíc
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const lastMonthAnswers = answers.filter(
      (a) => new Date(a.answered_at) >= oneMonthAgo
    );

    const lastMonthTotal = lastMonthAnswers.length;
    const lastMonthCorrect = lastMonthAnswers.filter(
      (a) => a.is_correct
    ).length;
    const lastMonthAccuracy =
      lastMonthTotal > 0
        ? Math.round((lastMonthCorrect / lastMonthTotal) * 100)
        : 0;

    // Změna oproti předchozímu měsíci (zjednodušená verze)
    const accuracyChange = lastMonthAccuracy - accuracy;

    return {
      data: {
        totalProblems: total,
        correctAnswers: correct,
        accuracy,
        averageTime: parseFloat(avgTime),
        streak: currentStreak,
        maxStreak,
        lastMonthTotal,
        lastMonthAccuracy,
        accuracyChange:
          accuracyChange >= 0 ? `+${accuracyChange}%` : `${accuracyChange}%`,
      },
      error: null,
    };
  } catch (error) {
    console.error("❌ Chyba při načítání celkových statistik:", error);
    return { data: null, error: error.message };
  }
}

// Získání dat pro graf pokroku v čase (poslední týden)
export async function getProgressChartData(userId) {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: answers, error } = await supabase
      .from("user_answers")
      .select("is_correct, answered_at")
      .eq("user_id", userId)
      .gte("answered_at", oneWeekAgo.toISOString())
      .order("answered_at", { ascending: true });

    if (error) throw error;

    // Seskupení podle dne
    const dailyStats = {};

    answers.forEach((answer) => {
      const date = new Date(answer.answered_at).toLocaleDateString("cs-CZ");

      if (!dailyStats[date]) {
        dailyStats[date] = { total: 0, correct: 0 };
      }

      dailyStats[date].total++;
      if (answer.is_correct) {
        dailyStats[date].correct++;
      }
    });

    // Převod na formát pro graf
    const chartData = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      accuracy:
        stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      total: stats.total,
    }));

    return { data: chartData, error: null };
  } catch (error) {
    console.error("❌ Chyba při načítání dat pro graf:", error);
    return { data: null, error: error.message };
  }
}
