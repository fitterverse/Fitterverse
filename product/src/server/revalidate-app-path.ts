import { revalidatePath } from 'next/cache'

export type AppPagePath = '/dashboard' | '/diet' | '/progress' | '/workout' | '/streak'

export function revalidateAppPage(path: AppPagePath) {
  revalidatePath(path)
  revalidatePath(`/(app)${path}`)
}
