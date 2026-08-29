"use client";
import { useChat } from "@ai-sdk/react";
import { useState } from "react";
export default function Page() {
  const [local, setLocal] = useState("");
  const chat = useChat({ api: "/api/chat" });
  return (
    <div>
      <input id="test-input" value={local} onChange={e => setLocal(e.target.value)} />
      <button id="test-btn-3" onClick={() => chat.sendMessage({ content: local, role: 'user' }, { body: { data: { extra: 123 } } })}>Send with body options</button>
      <button id="test-btn-4" onClick={() => chat.sendMessage({ content: local, role: 'user' }, { data: { extra: 123 } })}>Send with data options</button>
    </div>
  );
}
