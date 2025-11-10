// src/lib/aiService.js

// const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;
// const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Vygeneruje AI vysvětlení pro matematický příklad
 * @param {Object} problem - Objekt s příkladem (question_text, options, atd.)
 * @param {Object} userAnswer - Odpověď uživatele (is_correct, selected_option_id)
 * @param {Number} attempt - Počet pokusů (1 = první vysvětlení, 2 = jednodušší)
 * @returns {String} - Vysvětlení v HTML formátu
 */
export async function generateExplanation(problem, userAnswer, attempt = 1) {
  // Najdi správnou odpověď
  const correctOption = problem.options.find((o) => o.is_correct);
  const selectedOption = problem.options.find(
    (o) => o.id === userAnswer.selected_option_id
  );

  // Vytvoř prompt pro AI
  const prompt = createPrompt(problem, correctOption, selectedOption, attempt);

  //   // Zvol AI poskytovatele (priorita: Claude > OpenAI > Gemini)
  //   if (CLAUDE_API_KEY) {
  //     return await callClaude(prompt);
  //   } else if (OPENAI_API_KEY) {
  //     return await callOpenAI(prompt);
  //   } else if (GEMINI_API_KEY) {
  //     return await callGemini(prompt);
  //   } else {
  //     throw new Error("Žádný AI API klíč není nastaven! Přidej do .env souboru.");
  //   }
  // }

  // ✅ VŽDY volej Claude serverless funkci (funguje i na Vercelu)
  try {
    return await callClaude(prompt);
  } catch (error) {
    console.error("Claude selhalo, fallback na Gemini:", error);
    // Fallback pouze pokud Claude úplně selže
    if (GEMINI_API_KEY) {
      return await callGemini(prompt);
    }
    throw new Error("Všechny AI služby selhaly");
  }
}

/**
 * Vytvoří prompt pro AI
 */
function createPrompt(problem, correctOption, selectedOption, attempt) {
  const isFirstAttempt = attempt === 1;

  const basePrompt = `Jsi pomocný učitel matematiky pro žáky připravující se na přijímací zkoušky.

**ZADÁNÍ:**
${problem.question_text}

**SPRÁVNÁ ODPOVĚĎ:** ${correctOption.option_letter}) ${
    correctOption.answer_text
  }
**ŽÁK ODPOVĚDĚL:** ${selectedOption.option_letter}) ${
    selectedOption.answer_text
  }

**ÚKOL:**
${
  isFirstAttempt
    ? `Vysvětli žákovi, proč je správná odpověď ${correctOption.option_letter}, a kde udělal chybu.`
    : `Žák stále nechápe. Vysvětli to JEŠTĚ JEDNODUŠEJI, krok za krokem, jako by měl 12 let.`
}

**STYL VYSVĚTLENÍ:**
- Piš v češtině, přátelsky, jako kamarád
- Používej jednoduché příklady
- Rozděl vysvětlení na kroky
- Používaj emojis pro zpříjemnění (✅, 💡, ⚠️)
${
  !isFirstAttempt
    ? "- Použij MAXIMÁLNĚ JEDNODUCHÉ VYSVĚTLENÍ, jako pro malé dítě"
    : ""
}

**FORMÁT ODPOVĚDI:**
1. Krátké shrnutí (1 věta)
2. Krok za krokem řešení
3. Vysvětlení chyby žáka
4. Tip, jak se chybě příště vyhnout

Odpověď:`;

  return basePrompt;
}

/**
 * Volání Claude API
 */
// async function callClaude(prompt) {
//   try {
//     // ✅ DEBUG (volitelné - odstraň později)
//     console.log("🔑 Claude API Key:", CLAUDE_API_KEY ? "Nastavený" : "CHYBÍ!");
//     const response = await fetch("https://api.anthropic.com/v1/messages", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "x-api-key": CLAUDE_API_KEY,
//         "anthropic-version": "2023-06-01",
//       },
//       body: JSON.stringify({
//         model: "claude-3-5-sonnet-20241022", // Nejnovější model
//         max_tokens: 1500,
//         messages: [
//           {
//             role: "user",
//             content: prompt,
//           },
//         ],
//       }),
//     });

//     if (!response.ok) {
//       const error = await response.json();
//       console.error("Claude API error:", error);
//       throw new Error(`Claude API: ${error.error?.message || "Neznámá chyba"}`);
//     }

//     const data = await response.json();
//     console.log(
//       "✅ Claude odpověděl:",
//       data.content[0].text.substring(0, 100) + "..."
//     ); // Debug
//     return data.content[0].text;
//   } catch (error) {
//     console.error("Chyba při volání Claude:", error);
//     throw error;
//   }
// }
/**
 * Volání Claude API přes Vercel serverless funkci
 */
async function callClaude(prompt) {
  try {
    console.log("🔵 Volám Claude přes /api/claude...");

    const response = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Claude API error:", error);
      throw new Error(error.error?.message || "Neznámá chyba");
    }

    const data = await response.json();
    console.log("✅ Claude odpověděl úspěšně");
    return data.text;
  } catch (error) {
    console.error("Chyba při volání Claude:", error);
    throw error;
  }
}

/**
 * Volání OpenAI API
 */
async function callOpenAI(prompt) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Levnější model
        messages: [
          {
            role: "system",
            content:
              "Jsi pomocný učitel matematiky pro žáky na základní škole.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error:", error);
      throw new Error(`OpenAI API: ${error.error?.message || "Neznámá chyba"}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Chyba při volání OpenAI:", error);
    throw error;
  }
}

/**
 * Volání Google Gemini API (FREE)
 */
async function callGemini(prompt) {
  try {
    // ✅ SPRÁVNÝ MODEL - gemini-2.0-flash (z tvého cURL)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Gemini API error:", error);
      throw new Error(`Gemini API: ${error.error?.message || "Neznámá chyba"}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Chyba při volání Gemini:", error);
    throw error;
  }
}
/**
 * Uloží AI vysvětlení do databáze (volitelné - pro cache)
 */
export async function saveExplanation(problemId, explanation, provider) {
  try {
    const { supabase } = await import("./supabase");

    const { error } = await supabase.from("ai_explanations").insert({
      problem_id: problemId,
      explanation: explanation,
      ai_provider: provider,
      generated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Chyba při ukládání vysvětlení:", error);
    }
  } catch (error) {
    console.error("Kritická chyba při ukládání vysvětlení:", error);
  }
}

/**
 * Načte uložené vysvětlení z databáze (pokud existuje)
 */
export async function getExplanation(problemId) {
  try {
    const { supabase } = await import("./supabase");

    const { data, error } = await supabase
      .from("ai_explanations")
      .select("*")
      .eq("problem_id", problemId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = not found
      console.error("Chyba při načítání vysvětlení:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Kritická chyba při načítání vysvětlení:", error);
    return null;
  }
}

// import { supabase } from "./supabase";

// // Generování AI vysvětlení pomocí Claude API (přes Supabase Edge Function)
// export async function generateExplanation(problem, userAnswer, attempt = 1) {
//   const correctOption = problem.options.find((o) => o.is_correct);
//   const selectedOption = problem.options.find(
//     (o) => o.id === userAnswer.selected_option_id
//   );

//   const systemPrompt =
//     attempt === 1
//       ? `Jsi laskavý učitel matematiky pro studenty základních škol připravující se na přijímací zkoušky.
// Vysvětli studentovi, proč jeho odpověď byla špatná a jak správně vyřešit úlohu.
// Používej jasný, srozumitelný jazyk a přidej odkazy na užitečné zdroje.`
//       : `Student stále nerozumí. Zkus to vysvětlit JINAK - použij praktický příklad, nakresli si to,
// nebo rozděl problém na menší kroky. Buď kreativní a pomoz studentovi to pochopit.`;

//   const userPrompt =
//     attempt === 1
//       ? `**Vysvětlení úlohy: ${problem.title}**

// **Zadání:** ${problem.question_text}

// **Student odpověděl:** ${selectedOption.option_letter}) ${selectedOption.answer_text}
// **Správná odpověď:** ${correctOption.option_letter}) ${correctOption.answer_text}

// Prosím vysvětli:
// 1. Co po nás úloha chce
// 2. Klíčové informace v zadání
// 3. Správný postup řešení krok za krokem
// 4. Proč je správná odpověď ${correctOption.option_letter})

// Na konci přidej 2-3 doporučené zdroje (odkazy na YouTube, Khan Academy, Matematika.cz).

// Formátuj odpověď v markdown s **tučným textem** pro důležité části.`
//       : `Student stále nechápe tuto úlohu:

// **${problem.title}**
// ${problem.question_text}

// Správná odpověď: ${correctOption.option_letter}) ${correctOption.answer_text}

// Zkus to vysvětlit ALTERNATIVNÍM ZPŮSOBEM - praktický příklad, vizualizace, nebo jinou metodou.`;

//   try {
//     // POZNÁMKA: Toto je mock implementace
//     // V produkci byste volali skutečné API přes Supabase Edge Function

//     // Simulace API volání
//     await new Promise((resolve) => setTimeout(resolve, 1500));

//     if (attempt === 1) {
//       return `**Vysvětlení úlohy: ${problem.title}**

// **Zadání:** ${problem.question_text}

// **Správná odpověď:** ${correctOption.option_letter}) ${
//         correctOption.answer_text
//       }

// **Postup řešení:**
// 1. Nejprve si rozebereme, co po nás úloha chce
// 2. Identifikujeme klíčové informace v zadání
// 3. Použijeme odpovídající matematický postup
// 4. Dojdeme ke správnému výsledku

// **Doporučené zdroje:**
// - [Video návod na podobné příklady](https://www.youtube.com/results?search_query=${encodeURIComponent(
//         problem.title
//       )})
// - [Khan Academy - Matematika](https://cs.khanacademy.org/math)
// - [Matematika.cz](https://www.matematika.cz/)

// Pokud ti to stále není jasné, klikni na "Pořád nechápu" a zkusím to vysvětlit jinak.`;
//     } else {
//       return `**Alternativní vysvětlení**

// Zkusme to jinak! Představ si tuto úlohu prakticky:

// **${problem.title}**

// Někdy pomáhá si úlohu nakreslit nebo si ji představit na reálném příkladu.

// **Krok za krokem:**
// - Začni tím, co už víš
// - Napiš si všechny dané informace
// - Zkus si problém rozdělit na menší části
// - Postupuj systematicky

// **Správná odpověď je:** ${correctOption.option_letter}) ${correctOption.answer_text}

// **Tip:** Zkus si podobné příklady procvičit na těchto stránkách:
// - [Umíme matematiku](https://www.umimematiku.cz/)
// - [Matematika pro každého](https://www.matweb.cz/)

// Pokud stále máš problémy s touto oblastí, doporučuji zopakovat si teorii nebo poprosit o pomoc učitele.`;
//     }
//   } catch (error) {
//     console.error("❌ Chyba při generování vysvětlení:", error);
//     return "Omlouváme se, vysvětlení se nepodařilo vygenerovat. Zkuste to prosím znovu.";
//   }
// }

// Pro budoucí produkční implementaci s reálným API:
/*
export async function generateExplanation(problem, userAnswer, attempt = 1) {
  try {
    const { data, error } = await supabase.functions.invoke('generate-explanation', {
      body: {
        problem,
        userAnswer,
        attempt
      }
    });
    
    if (error) throw error;
    return data.explanation;
  } catch (error) {
    console.error('❌ Chyba při generování vysvětlení:', error);
    throw error;
  }
}
*/
