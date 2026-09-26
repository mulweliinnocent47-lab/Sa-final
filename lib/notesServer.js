import "server-only";

import { unstable_cache } from "next/cache";
import { createClient } from "@/utils/supabase/server";

const BUCKET = "SA student";

const FOLDERS = [
  // grade 7
  "grade-7-Geography",
  "grade-7-Life Orientation",
  "grade-7-Mathematics",
  "grade-7-History",
  "grade-7-EMS",
  "grade-7-English",
  "grade-7-Technology",
  "grade-7-Natural Science",
  "grade-7-Creative Arts",
  "grade-7-Afrikaans",

  // grade 8
  "grade-8-Geography",
  "grade-8-Life Orientation",
  "grade-8-Mathematics",
  "grade-8-History",
  "grade-8-EMS",
  "grade-8-English",
  "grade-8-Technology",
  "grade-8-Natural Science",
  "grade-8-Afrikaans",
];


// This function is cached for 15 minutes
const getCachedStorageFiles = unstable_cache(
  async () => {
    const supabase = await createClient();

    const allFiles = [];

    for (const folder of FOLDERS) {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list(folder, {
          limit: 100,
          sortBy: {
            column: "name",
            order: "asc",
          },
        });

      if (error) {
        console.error(
          `Could not list folder "${folder}":`,
          error
        );

        throw new Error("Could not load notes");
      }

      for (const file of data ?? []) {
        if (
          file?.name &&
          file.name.toLowerCase().endsWith(".txt")
        ) {
          allFiles.push({
            ...file,
            folder,
          });
        }
      }
    }

    return allFiles;
  },
  ["student-notes-storage"],
  {
    revalidate: 60 * 15, // 15 minutes
  }
);


export async function getServerNotes() {
  // Authentication is NOT cached
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return [];
  }

  // Get cached Supabase Storage data
  const allFiles = await getCachedStorageFiles();

  // Convert Storage files into note objects
  return allFiles.map((file) => {
    const slug = file.name;

    const title = file.name.replace(/\.txt$/i, "");

    const subject = file.folder.replace(
      /^grade-\d+-/,
      ""
    );

    const grade =
      file.folder.match(/^grade-(\d+)-/)?.[1];

    return {
      slug,
      title,

      folder: file.folder,

      storagePath: `${file.folder}/${file.name}`,

      subject,
      grade,

      minutes: Math.max(
        1,
        Math.round(
          (file.metadata?.size ?? 4000) / 400
        )
      ),

      summary: `Latest ${file.name}, free to download.`,

      src: `/api/notes/${encodeURIComponent(slug)}`,

      proOnly: false,
    };
  });
}


export async function getServerNote(slug) {
  const notes = await getServerNotes();

  const decodedSlug = decodeURIComponent(slug);

  console.log("Looking for note:", decodedSlug);

  const note =
    notes.find(
      (note) => note.slug === decodedSlug
    ) ?? null;

  console.log("Found note:", note);

  return note;
}
