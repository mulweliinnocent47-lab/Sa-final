"use client";

import { createContext, useContext } from "react";

const NoteContext = createContext(null);

export function NoteProvider({ NOTES,PAPERS,  children }) {
  return (
    <NoteContext.Provider value={{ NOTES, PAPERS }}>
      {children}
    </NoteContext.Provider>
  );
}

export function useNotes() {
  return useContext(NoteContext);
}