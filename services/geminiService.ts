
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const solveProblem = async (imageBase64: string, mode: string) => {
  const model = ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageBase64.split(',')[1] || imageBase64
            }
          },
          {
            text: `Act as a world-class teacher. Solve this problem shown in the image. Mode: ${mode}.
            Provide the response in JSON format matching this schema:
            {
              "topic": "string",
              "subtopic": "string",
              "explanation": "string (short intro)",
              "steps": [{"title": "string", "description": "string", "math": "optional string", "icon": "material-symbol-name"}],
              "finalResult": "string"
            }`
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 }
    }
  });

  const response = await model;
  return JSON.parse(response.text || '{}');
};

export const chatWithSolution = async (history: { role: 'user' | 'model', parts: { text: string }[] }[], message: string) => {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: 'You are a helpful AI tutor. A student is asking follow-up questions about a solved problem. Keep explanations clear, concise, and educational.'
    }
  });

  const response = await chat.sendMessage({ message });
  return response.text;
};
