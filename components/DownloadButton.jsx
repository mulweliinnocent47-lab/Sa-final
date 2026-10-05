"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useNotes } from "@/components/Noteprovider";
import { SignInPrompt } from "@/components/SignInPrompt";

// Guests see the sign-in prompt instead of a download.
export function DownloadButton({ href, className = "", children = "Download" }) {
  const { isLoggedIn } = useNotes() ?? {};
  const [showSignIn, setShowSignIn] = useState(false);

  function handleClick() {
    if (!isLoggedIn) {
      setShowSignIn(true);
      return;
    }
    window.location.href = href;
  }

  return (
    <>
      <SignInPrompt
        open={showSignIn}
        reason="download"
        onClose={() => setShowSignIn(false)}
      />
      <button type="button" onClick={handleClick} className={className}>
        <Download className="size-4" />
        {children}
      </button>
    </>
  );
}
