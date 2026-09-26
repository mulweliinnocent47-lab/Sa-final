 import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const BUCKET = "SA PDF";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const path = searchParams.get("path");
    const filename =
      searchParams.get("filename") || "studyhub-paper.pdf";

    if (!path) {
      return NextResponse.json(
        { error: "Missing file path" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(path);

    if (error) {
      console.error("Supabase download error:", error);

      return NextResponse.json(
        {
          error: "Failed to download file",
          details: error.message,
        },
        { status: 500 }
      );
    }

    const arrayBuffer = await data.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(arrayBuffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Download route error:", error);

    return NextResponse.json(
      {
        error: "Download failed",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}