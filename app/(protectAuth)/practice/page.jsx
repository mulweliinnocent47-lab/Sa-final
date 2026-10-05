"use client";
import { useEffect, useRef, useState } from "react";
import { Lightbulb, PenLine, Send, Sparkles, User } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TestYourself } from "@/components/TestYourself";
import { SUBJECTS } from "@/lib/study-data";

import { createClient } from "@/utils/supabase/client";
import { genId } from "@/lib/id";
import { useNotes } from "@/components/Noteprovider";
import { SignInPrompt } from "@/components/SignInPrompt";
import { guestLimitReached, recordGuestAiUse } from "@/lib/guestLimit";

const STARTERS=["Explain photosynthesis like I'm in Grade 10","Quiz me on trigonometry identities","Help me brainstorm an essay on load shedding","Give me a 5-step study plan for this weekend"];
const MODES=["Brainstorm","Explain","Quiz me","Mark my answer"];

export default function PracticePage(){
 const { isLoggedIn } = useNotes() ?? {};
 const [showSignIn,setShowSignIn]=useState(false);
 const [view,setView]=useState("chat"); // "chat" | "test"
 const [mode,setMode]=useState(MODES[0]); const [subject,setSubject]=useState(SUBJECTS[0]); const [input,setInput]=useState(""); const [thinking,setThinking]=useState(false);
 const [messages,setMessages]=useState([{id:"welcome",role:"ai",text:"Hi 👋 I'm your practice partner. Pick a mode and a subject, then ask me anything — or throw a half-formed idea at me and we'll shape it together."}]);
 const endRef=useRef(null);

 useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"})},[messages,thinking]);

 async function sendToAI(){
   const value = input.trim();
   if(!value || thinking) return;

   // Guests get 3 free messages, then must sign in.
   if(!isLoggedIn && guestLimitReached()){
     setShowSignIn(true);
     return;
   }
   if(!isLoggedIn) recordGuestAiUse();

   const priorHistory = messages;
   const userMessage = { id: genId(), role: "user", text: value };
   setMessages((prev) => [...prev, userMessage]);
   setInput("");
   setThinking(true);

   try {
     const supabase = createClient();
     const { data, error } = await supabase.functions.invoke(
       "PROAI-PROCTICE",
       { body: { message: value, history: priorHistory, mode, subject } }
     );
     if (error) throw error;
     setMessages((prev) => [...prev, { id: genId(), role: "ai", text: data.content }]);
   } catch (err) {
     console.error(err);
     setMessages((prev) => [...prev, { id: genId(), role: "ai", text: "Sorry, I couldn't reach the AI just now. Please try again." }]);
   } finally {
     setThinking(false);
   }
}

 return <AppShell>
  <SignInPrompt open={showSignIn} reason="ai" onClose={()=>setShowSignIn(false)} />
  <div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-bold tracking-tight md:text-3xl">Practice AI</h1><span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-1 text-xs font-medium text-primary"><Sparkles className="size-3"/> UI preview</span></div>
  <p className="mt-2 text-sm text-muted-foreground">Brainstorm ideas, ask questions, get quizzed.</p>

  <div className="mt-4 inline-flex rounded-full border border-border bg-muted p-1">
   <button onClick={()=>setView("chat")} className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium ${view==="chat"?"bg-card shadow-sm text-foreground":"text-muted-foreground"}`}><Sparkles className="size-4"/> Chat</button>
   <button onClick={()=>setView("test")} className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium ${view==="test"?"bg-card shadow-sm text-foreground":"text-muted-foreground"}`}><PenLine className="size-4"/> Test yourself</button>
  </div>

  {view==="test" ? (
   <div className="mt-5">
    <TestYourself />
   </div>
  ) : (
  <div className="mt-5 grid gap-4 lg:grid-cols-[220px_1fr]">
   <aside className="space-y-4">
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mode</p><div className="mt-3 flex flex-wrap gap-2">{MODES.map(m=><button key={m} onClick={()=>setMode(m)} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${mode===m?"border-primary bg-brand-soft text-primary":"border-border text-muted-foreground"}`}>{m}</button>)}</div></div>
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject</p><select value={subject} onChange={e=>setSubject(e.target.value)} className="mt-3 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">{SUBJECTS.map(s=><option key={s}>{s}</option>)}</select></div>
    <div className="rounded-2xl border border-border bg-gold-soft p-4 text-xs text-muted-foreground shadow-sm"><Lightbulb className="size-4 text-gold"/><p className="mt-2">Free includes 10 messages a day. Go and Pro remove the cap and keep your sessions.</p></div>
   </aside>
   <section className="flex min-h-[60vh] flex-col rounded-2xl border border-border bg-card shadow-sm">
    <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
     {messages.map(m=><div key={m.id} className={`flex gap-3 ${m.role==="user"?"flex-row-reverse":""}`}><span className={`grid size-8 shrink-0 place-items-center rounded-full ${m.role==="ai"?"bg-hero text-primary-foreground":"bg-muted text-foreground"}`}>{m.role==="ai"?<Sparkles className="size-4"/>:<User className="size-4"/>}</span><div className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm ${m.role==="ai"?"bg-muted text-foreground":"bg-primary text-primary-foreground"}`}>{m.text}</div></div>)}
     {thinking&&<div className="flex gap-3"><span className="grid size-8 place-items-center rounded-full bg-hero text-primary-foreground"><Sparkles className="size-4"/></span><div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">{[0,150,300].map(d=><span key={d} className="size-2 animate-bounce rounded-full bg-muted-foreground/60" style={{animationDelay:`${d}ms`}}/>)}</div></div>}
     <div ref={endRef}/>
    </div>
    <div className="border-t border-border p-3 md:p-4">
     <div className="flex gap-2 overflow-x-auto pb-2">{STARTERS.map(s=><button key={s} onClick={()=> setInput(s)} className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">{s}</button>)}</div>
     <div className="flex items-end gap-2"><textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendToAI()}}} rows={2} disabled={thinking} placeholder={`${mode} · ${subject} — ask anything…`} className="min-h-[52px] flex-1 resize-none rounded-lg border border-input bg-background px-3 py-3 text-sm disabled:opacity-60"/><button onClick={()=>sendToAI()} disabled={thinking || !input.trim()} className="grid size-[52px] shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"><Send className="size-4"/></button></div>
    </div>
   </section>
  </div>
  )}
 </AppShell>
}