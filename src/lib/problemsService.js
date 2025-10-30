import { supabase } from "./supabase";

// Načtení příkladů podle tematické oblasti (s limitem a náhodným výběrem)
export async function getProblemsByTopic(topicAreaId, limit = 10) {
  try {
    // Nejdřív zjistíme celkový počet příkladů v dané oblasti
    const { count, error: countError } = await supabase
      .from("problems")
      .select("*", { count: "exact", head: true })
      .eq("topic_area_id", topicAreaId)
      .eq("is_active", true);

    if (countError) throw countError;

    // Pokud je příkladů méně než limit, načteme všechny
    const actualLimit = Math.min(limit, count || 0);

    // Načtení náhodných příkladů pomocí PostgreSQL funkce random()
    const { data: problems, error } = await supabase
      .from("problems")
      .select(
        `
        *,
        answer_options (
          id,
          option_letter,
          answer_text,
          answer_image_url,
          is_correct
        )
        `
      )
      .eq("topic_area_id", topicAreaId)
      .eq("is_active", true)
      .order("id", { ascending: false })
      .limit(actualLimit);

    if (error) throw error;

    // Zamíchání příkladů
    const shuffledProblems = problems
      .sort(() => Math.random() - 0.5)
      .slice(0, actualLimit);

    // ✅ KLÍČOVÁ OPRAVA: Přejmenuj answer_options → options
    const problemsWithOptions = shuffledProblems.map((problem) => ({
      ...problem,
      options: problem.answer_options || [],
    }));

    console.log(
      `✅ Načteno ${problemsWithOptions.length} náhodných příkladů z oblasti ${topicAreaId}`
    );

    return problemsWithOptions; // ✅ Vrať opravená data
  } catch (error) {
    console.error("❌ Chyba při načítání příkladů podle oblasti:", error);
    return [];
  }
}

// Načtení všech příkladů (mix test) - limit 10 náhodných
export async function getAllProblems(limit = 10) {
  try {
    const { count, error: countError } = await supabase
      .from("problems")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    if (countError) throw countError;

    const actualLimit = Math.min(limit, count || 0);

    const { data: problems, error } = await supabase
      .from("problems")
      .select(
        `
        *,
        answer_options (
          id,
          option_letter,
          answer_text,
          answer_image_url,
          is_correct
        )
        `
      )
      .eq("is_active", true)
      .order("id", { ascending: false })
      .limit(actualLimit * 2);

    if (error) throw error;

    // Zamíchání a omezení
    const shuffledProblems = problems
      .sort(() => Math.random() - 0.5)
      .slice(0, actualLimit);

    // ✅ KLÍČOVÁ OPRAVA: Přejmenuj answer_options → options
    const problemsWithOptions = shuffledProblems.map((problem) => ({
      ...problem,
      options: problem.answer_options || [],
    }));

    console.log(
      `✅ Načteno ${problemsWithOptions.length} náhodných příkladů (mix test)`
    );

    return problemsWithOptions; // ✅ Vrať opravená data
  } catch (error) {
    console.error("❌ Chyba při načítání všech příkladů:", error);
    return [];
  }
}

// Načtení konkrétního příkladu podle ID
export async function getProblemById(problemId) {
  try {
    const { data, error } = await supabase
      .from("problems")
      .select(
        `
        *,
        answer_options (
          id,
          option_letter,
          answer_text,
          answer_image_url,
          is_correct
        )
        `
      )
      .eq("id", problemId)
      .single();

    if (error) throw error;

    // ✅ KLÍČOVÁ OPRAVA: Přejmenuj answer_options → options
    const problemWithOptions = {
      ...data,
      options: data.answer_options || [],
    };

    return problemWithOptions; // ✅ Vrať opravená data
  } catch (error) {
    console.error("❌ Chyba při načítání příkladu:", error);
    return null;
  }
}
