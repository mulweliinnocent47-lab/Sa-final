import { createClient } from "@/utils/supabase/server";
import { getServerNote, BUCKET } from "@/lib/notesHelper";

export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy":
    "default-src 'none'; frame-ancestors 'none'",
  "X-Frame-Options": "DENY",
  "Cross-Origin-Resource-Policy": "same-origin",
};

export async function GET(request, { params }) {
  try {
    const supabase = await createClient();

    // Reading a note in the app is open to everyone.
    // Downloading the .txt file (?download=1) needs a signed-in user.
    const wantsDownload =
      new URL(request.url).searchParams.get("download") === "1";

    if (wantsDownload) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return new Response("Sign in to download", {
          status: 401,
          headers: noStoreHeaders,
        });
      }
    }

    // Get slug from URL
    const { slug } = await params;

    // Find the note and its actual storage path
    const note = await getServerNote(slug);

    if (!note) {
      return new Response("Note not found", {
        status: 404,
        headers: noStoreHeaders,
      });
    }

    if (!note.storagePath) {
      console.error(
        "Note has no storagePath:",
        note
      );

      return new Response("Note storage path missing", {
        status: 500,
        headers: noStoreHeaders,
      });
    }

    // Download the actual TXT file from Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(note.storagePath);

    if (error || !data) {
      console.error(
        "Could not download note:",
        error
      );

      return new Response("Could not load note", {
        status: 500,
        headers: noStoreHeaders,
      });
    }

    const headers = { ...noStoreHeaders };
    if (wantsDownload) {
      const safeName = note.title.replace(/[\r\n"\\/]/g, "_");
      headers["Content-Disposition"] = `attachment; filename="${safeName}.txt"`;
    }

    // Return the TXT contents
    return new Response(data, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error(
      "Notes API error:",
      error
    );

    return new Response("Internal server error", {
      status: 500,
      headers: noStoreHeaders,
    });
  }
}