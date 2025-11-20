/* //api/claude.js
export default async function handler(req, res) {
  // Pouze POST requesty
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CLAUDE_API_KEY, // ✅ process.env funguje ve Vercel funkcích
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json(error);
    }

    const data = await response.json();
    return res.status(200).json({ text: data.content[0].text });
  } catch (error) {
    console.error("Claude API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
} */

// api/claude.js

/**
 * Helper funkce pro exponenciální backoff
 */
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Volání Claude API s automatickým opakováním
 */
async function callClaudeWithRetry(prompt, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      // ✅ Pokud je server přetížený (529), zkus znovu
      if (response.status === 529) {
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
        console.log(
          `⏳ Claude přetížený, čekám ${waitTime}ms (pokus ${
            attempt + 1
          }/${maxRetries})`
        );

        if (attempt < maxRetries - 1) {
          await sleep(waitTime);
          continue; // Zkus znovu
        }
      }

      // ✅ Jiná chyba - vrať rovnou
      if (!response.ok) {
        const error = await response.json();
        return { success: false, status: response.status, error };
      }

      // ✅ Úspěch!
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error(`❌ Pokus ${attempt + 1} selhal:`, error);

      // Pokud není poslední pokus, zkus znovu
      if (attempt < maxRetries - 1) {
        await sleep(Math.pow(2, attempt) * 1000);
        continue;
      }

      // Poslední pokus selhal
      return { success: false, error: error.message };
    }
  }
}

export default async function handler(req, res) {
  // Pouze POST requesty
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt je povinný" });
  }

  // ✅ Zavolej Claude s retry logikou
  const result = await callClaudeWithRetry(prompt);

  if (!result.success) {
    return res.status(result.status || 500).json({
      error: result.error || "Internal server error",
    });
  }

  return res.status(200).json({
    text: result.data.content[0].text,
  });
}
