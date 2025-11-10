// api/claude.js
// export default async function handler(req, res) {
//   // Pouze POST requesty
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Method not allowed" });
//   }

//   const { prompt } = req.body;

//   try {
//     const response = await fetch("https://api.anthropic.com/v1/messages", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "x-api-key": process.env.CLAUDE_API_KEY, // ✅ process.env funguje ve Vercel funkcích
//         "anthropic-version": "2023-06-01",
//       },
//       body: JSON.stringify({
//         model: "claude-sonnet-4-20250514",
//         max_tokens: 1500,
//         messages: [{ role: "user", content: prompt }],
//       }),
//     });

//     if (!response.ok) {
//       const error = await response.json();
//       return res.status(response.status).json(error);
//     }

//     const data = await response.json();
//     return res.status(200).json({ text: data.content[0].text });
//   } catch (error) {
//     console.error("Claude API error:", error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// }
