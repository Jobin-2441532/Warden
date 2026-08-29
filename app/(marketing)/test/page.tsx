"use client";
import { useChat } from "@ai-sdk/react";
import { useState } from "react";
export default function Page() {
  const [local, setLocal] = useState("");
  const chat = useChat({ api: "/api/chat" });
  return (
    <div>
      <input id="test-input" value={local} onChange={e => setLocal(e.target.value)} />
      <button id="test-btn-1" onClick={() => chat.sendMessage({ content: local, role: 'user' })}>Send {`{ content }`}</button>
      <button id="test-btn-2" onClick={() => chat.sendMessage({ messages: [{role: 'user', content: local}] })}>Send {`{ messages }`}</button>
      <div id="status">{chat.status}</div>
      <div id="messages">{JSON.stringify(chat.messages)}</div>
    </div>
  );
}
