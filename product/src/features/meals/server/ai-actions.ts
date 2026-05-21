'use server'

import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireSession } from "@/features/auth/server/session";
import { saveMeal } from "./actions";
import { MealType, MealRating } from "@/shared/types";

export async function analyzeMealImage(formData: FormData) {
  const apiKey = process.env.GEMINI_API_KEY;

  console.log("🚀 [AI-LOG] Starting analysis with Gemini 3.5...");
  
  if (!apiKey) {
    console.error("❌ [AI-LOG] GEMINI_API_KEY is missing in .env.local");
    return { error: "AI Key is missing. Please check your .env.local file." };
  }

  try {
    const session = await requireSession();
    if (!session) return { error: "Session expired. Please login again." };

    const image = formData.get("image") as File;
    const mealType = formData.get("mealType") as MealType;

    if (!image) return { error: "No image received." };

    // 1. Prepare Image
    const bytes = await image.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString("base64");

    // 2. Initialize Model (Using the model from your screenshot)
    const genAI = new GoogleGenerativeAI(apiKey);
    
    /**
     * MODEL CHOICE: 
     * Based on your screenshots, we are using 'gemini-3.5-flash'.
     * If this still 404s, we can try 'gemini-2.5-flash'.
     */
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const prompt = `
      Identify the Indian food items in this photo. 
      Estimate total calories.
      Rate as 'healthy', 'medium', or 'junk' based on Indian diet context.
      1-sentence feedback.
      
      Return ONLY a raw JSON object:
      {"food_name": "string", "rating": "healthy" | "medium" | "junk", "calories": number, "feedback": "string"}
    `;

    console.log(`📸 [AI-LOG] Sending to Google Gemini 3.5...`);

    // 3. Call Google Gemini
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType: image.type } }
    ]);

    const responseText = result.response.text();
    console.log("🤖 [AI-LOG] Gemini Raw Response:", responseText);

    // 4. Parse JSON safely
    const cleanedJson = responseText.replace(/```json|```/g, "").trim();
    const aiResult = JSON.parse(cleanedJson);

    // 5. Save using your existing Supabase logic
    console.log("💾 [AI-LOG] Saving to Database...");
    const saveResult = await saveMeal({
      meal_type: mealType,
      rating: aiResult.rating as MealRating,
      calories: aiResult.calories,
      note: `AI identified: ${aiResult.food_name}. ${aiResult.feedback}`,
      date: new Date().toISOString().split('T')[0]
    });

    if (saveResult?.error) {
      console.error("❌ [AI-LOG] saveMeal error:", saveResult.error);
      return { error: "AI read the photo, but database failed to save." };
    }

    console.log("✅ [AI-LOG] Successfully logged!");
    return { success: true, data: aiResult };

  } catch (error: any) {
    console.error("🔥 [AI-LOG] CRITICAL ERROR:", error);

    if (error.message?.includes("404")) {
      return { 
        error: "Model name mismatch. Please tell me if 'gemini-3.5-flash' failed so I can give you the next name from your list." 
      };
    }

    return { error: `AI Error: ${error.message || "Unable to read photo"}` };
  }
}