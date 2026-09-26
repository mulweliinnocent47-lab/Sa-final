import "../globals.css"
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {NoteProvider} from "@/components/Noteprovider.jsx"
import { getNotes } from "@/lib/notesHelper.js";
import Loading from "@/components/Loading.jsx"
import { GetPapers } from "@/lib/paperServer.js"

export default async function ProtectedLayout({ children }) {
  const NOTES = await getNotes()
  const PAPERS = await GetPapers()
  if(!NOTES || !PAPERS){
    return(<Loading />)
  }
  
  
  return(
       <NoteProvider PAPERS={PAPERS} NOTES={NOTES}>
        {children}
      </NoteProvider>
   )
}