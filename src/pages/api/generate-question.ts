// pages/api/generate.ts
import { OpenAI } from "openai";
import type { NextApiRequest, NextApiResponse } from "next";
import dotenv from "dotenv";

dotenv.config();

interface GenerateRequestBody {
  examples: string[];
}

interface GenerateResponseBody {
  question: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateResponseBody | { error: string }>
) {
  try {
    // Ensure POST method
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Extract and validate request body
    const { examples } = req.body as GenerateRequestBody;
    if (!examples || !Array.isArray(examples) || examples.length === 0) {
      return res.status(400).json({ error: "Invalid examples" });
    }

    // Set up OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY?.trim(),
    });

    // Construct full system prompt
    const systemPrompt = `
Your job is to create a good meaningful question to spark conversation. 
A good question typically has one, or usually more, of the following key properties:

1. Nostalgia
2. Novelty
3. Emotion - positive and negative
4. An opinion/view
5. Self-reflection
6. Own perception of self
7. Others perception of self
8. Vulnerability

Attached below are some examples of good questions. Use these as reference, but do not overfit to these questions:

${examples.map((q, i) => `${i + 1}. ${q}`).join("\n")}

Respond with only the question, nothing else.
    `.trim();

    // Make the OpenAI API request
    const response = await openai.chat.completions.create({
      model: "gpt-4-0613",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate a question." },
      ],
      functions: [
        {
          name: "generate_question",
          description:
            "Generates a single, meaningful question to spark conversation.",
          parameters: {
            type: "object",
            properties: {
              question: {
                type: "string",
                description:
                  "A single, plain text question designed to spark meaningful conversation",
              },
            },
            required: ["question"],
          },
        },
      ],
      function_call: { name: "generate_question" },
    });

    // Extract and parse the response
    const message = response.choices[0].message;
    if (
      !message ||
      !message.function_call ||
      !message.function_call.arguments
    ) {
      return res.status(500).json({ error: "No valid response from OpenAI" });
    }

    let parsedOutput;
    try {
      const args = JSON.parse(message.function_call.arguments);
      parsedOutput = args.question.trim();
    } catch (err) {
      console.error("Error parsing function call arguments:", err);
      return res
        .status(500)
        .json({ error: "Failed to parse response from OpenAI" });
    }

    // Return the parsed question
    return res.status(200).json({ question: parsedOutput });
  } catch (error) {
    console.error("Error generating response:", error);
    return res.status(500).json({ error: "Failed to generate response" });
  }
}
