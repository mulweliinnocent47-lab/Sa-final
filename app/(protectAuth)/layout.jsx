import { createClient } from "@/utils/supabase/server";
import { NoteProvider } from "@/components/Noteprovider.jsx";
import { getNotes } from "@/lib/notesHelper.js";
import { GetPapers } from "@/lib/paperServer.js";

// The app is open to guests. Signing in is only required for AI messages
// after the free limit and for downloads (see SignInPrompt).
export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [NOTES, PAPERS] = await Promise.all([getNotes(), GetPapers()]);

  return (
    <NoteProvider PAPERS={PAPERS} NOTES={NOTES} isLoggedIn={!!user}>
      {children}
    </NoteProvider>
  );
}
