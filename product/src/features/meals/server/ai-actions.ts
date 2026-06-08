'use server'

import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireSession } from "@/features/auth/server/session";
import { saveMeal } from "./actions";
import { MealType, MealRating } from "@/shared/types";
import { format } from "date-fns";

export async function analyzeMealImage(formData: FormData) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return { error: "AI Key is missing. Please check your .env.local file." };
  }

  try {
    const session = await requireSession();
    if (!session) return { error: "Session expired. Please login again." };

    const image = formData.get("image") as File;
    const mealType = formData.get("mealType") as MealType;
    const date = (formData.get("date") as string | null) || format(new Date(), 'yyyy-MM-dd');

    if (!image) return { error: "No image received." };

    // 1. Prepare Image
    const bytes = await image.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString("base64");

    const genAI = new GoogleGenerativeAI(apiKey);
    const configuredModel = process.env.GEMINI_MODEL?.replace(/^models\//, "").trim();
    const modelName =
      configuredModel && configuredModel !== "gemini-1.5-flash"
        ? configuredModel
        : "gemini-2.5-flash";
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `
      Identify the Indian food items in this photo. 
      Estimate total calories.
      Rate as 'healthy', 'medium', or 'junk' based on Indian diet context.
      1-sentence feedback.
      
      Return ONLY a raw JSON object:
      {"food_name": "string", "rating": "healthy" | "medium" | "junk", "calories": number, "feedback": "string"}
    `;
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType: image.type } }
    ]);

    const responseText = result.response.text();

    const cleanedJson = responseText.replace(/```json|```/g, "").trim();
    const aiResult = JSON.parse(cleanedJson);

    const saveResult = await saveMeal({
      meal_type: mealType,
      rating: aiResult.rating as MealRating,
      calories: aiResult.calories,
      note: `AI identified: ${aiResult.food_name}. ${aiResult.feedback}`,
      date,
    });

    if (saveResult?.error) {
      return { error: "AI read the photo, but database failed to save." };
    }

    return { success: true, data: aiResult };

  } catch (error: any) {
    if (error.message?.includes("404")) {
      return { 
        error: "Gemini model configuration failed. Set GEMINI_MODEL to gemini-2.5-flash or leave it unset." 
      };
    }

    return { error: `AI Error: ${error.message || "Unable to read photo"}` };
  }
}
