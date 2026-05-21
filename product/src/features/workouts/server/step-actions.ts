'use server'

import { requireSession } from "@/features/auth/server/session";
import { createClient } from "@/server/supabase/server";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";

/**
 * 10X STEP SYNC ACTION
 * This saves steps from either the Manual input or the Native Health Connect bridge.
 */
export async function saveDailySteps(steps: number) {
  const session = await requireSession();
  const supabase = createClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  try {
    // 1. Update the daily_scores table (powers the dashboard)
    const { error: scoreError } = await supabase
      .from('daily_scores')
      .upsert({
        user_id: session.uid,
        date: today,
        steps: steps,
      }, { onConflict: 'user_id,date' });

    if (scoreError) {
      console.error("Supabase Score Error:", scoreError);
      throw new Error("Failed to update daily score steps");
    }

    revalidatePath('/dashboard');
    revalidatePath('/progress');
    
    return { success: true };
  } catch (error: any) {
    console.error("Step Saving CRITICAL Error:", error);
    return { error: error.message || "Database connection failed" };
  }
}