"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useEffect, Suspense, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getDefaultMerchantAndCreateSession, saveAgentTranscript } from "./actions";
import { useSearchParams } from "next/navigation";

function AgentChatContent() {
  const searchParams = useSearchParams();
  const m = searchParams.get('m');
  const [merchantId, setMerchantId] = useState<string | null>(m || null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      if (merchantId && sessionId) return; // Already initialized

      const data = await getDefaultMerchantAndCreateSession();
      if (data) {
        setMerchantId(data.merchantId);
        setSessionId(data.sessionId);
      }
    };
    init();
  }, [merchantId, sessionId]);

  const chatBody = useMemo(() => ({ data: { merchantId, sessionId } }), [merchantId, sessionId]);
  
  const [localInput, setLocalInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    // @ts-ignore: v4 removed body from UseChatOptions type but we pass it anyway
    body: chatBody,
    onFinish: () => {
      if (sessionId && messages.length > 0) {
        saveAgentTranscript(sessionId, messages);
      }
    }
  });

  const isLoading = status === "submitted" || status === "streaming";

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localInput.trim() || !sendMessage) return;
    // @ts-ignore
    sendMessage(
      // @ts-ignore
      { content: localInput, role: 'user' }, 
      { body: chatBody }
    );
    setLocalInput("");
  };

  if (!merchantId) return <div className="p-8 text-center">Loading Store...</div>;

  return (
    <div className="w-full max-w-2xl mb-4 text-center">
      <h1 className="text-3xl font-serif text-foreground">Commerce Agent</h1>
      <p className="text-muted">Chat to browse and buy instantly.</p>
      
      <Card className="w-full h-[700px] flex flex-col shadow-lg border-muted/20 text-left mt-8 mx-auto">
        <CardHeader className="border-b border-muted/10 bg-background flex flex-row items-center justify-between py-4">
          <CardTitle className="text-lg">Shopping Assistant</CardTitle>
          <Badge variant="approved" className="bg-accent text-foreground gap-1 items-center flex border border-accent/20">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Verified by Agent Gate
          </Badge>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-muted text-sm mt-12">
              Hi! I am your AI assistant. Tell me what you are looking for today.
            </div>
          )}
          
          {messages.map((m: any) => (
            <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div 
                className={`max-w-[80%] rounded-2xl p-4 text-sm ${
                  m.role === 'user' 
                    ? 'bg-accent text-foreground rounded-br-none' 
                    : 'bg-foreground text-background rounded-bl-none'
                }`}
              >
                {m.content}

                {m.toolInvocations?.map((tool: any) => {
                  if (tool.toolName === 'purchase') {
                    if (tool.state === 'result') {
                      const res = tool.result as any;
                      if (res.status === 'approved') {
                        return (
                          <div key={tool.toolCallId} className="mt-4 p-4 bg-background text-foreground rounded-xl border border-muted/20 text-center">
                            <CheckCircleIcon className="w-8 h-8 text-accent mx-auto mb-2" />
                            <h4 className="font-bold">Order Confirmed!</h4>
                            <p className="text-xs text-muted mb-2">Order ID: {res.orderId}</p>
                            <p className="text-xs text-muted">Amount: Rs {res.amount}</p>
                            <a href="/dashboard/control-tower" target="_blank" className="text-[10px] uppercase tracking-wide text-accent hover:underline mt-4 inline-block">
                              View in Control Tower -{">"}
                            </a>
                          </div>
                        );
                      } else if (res.status === 'denied' || res.status === 'failed') {
                        return (
                          <div key={tool.toolCallId} className="mt-4 p-3 bg-danger/10 border border-danger/30 rounded-xl flex items-start gap-2">
                            <span className="text-danger mt-0.5">X</span>
                            <div className="text-xs text-danger font-mono">
                              <strong>Gate System:</strong> {res.reason}
                            </div>
                          </div>
                        );
                      }
                    } else {
                      return (
                        <div key={tool.toolCallId} className="mt-4 p-3 bg-muted/20 rounded-xl text-xs flex items-center gap-2 animate-pulse">
                          <span>Processing payment via Agent Gate...</span>
                        </div>
                      );
                    }
                  }
                  return null;
                })}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start">
              <div className="bg-foreground text-background rounded-2xl rounded-bl-none p-4 text-sm opacity-50 flex gap-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-100">.</span>
                <span className="animate-bounce delay-200">.</span>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 border-t border-muted/10 bg-background">
          <form onSubmit={handleFormSubmit} className="flex w-full gap-2">
            <input
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
              placeholder="Ask for a product..."
              className="flex-1 p-3 rounded-full bg-background-alt border border-muted/20 text-sm focus:outline-none focus:ring-1 focus:ring-accent text-foreground"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" className="rounded-full w-12 h-12" disabled={isLoading || !localInput.trim()}>
              -{">"}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function CommerceAgentPage() {
  return (
    <div className="min-h-screen bg-background-alt flex flex-col items-center p-4 py-12">
      <Suspense fallback={<div className="p-8 text-center">Loading Store...</div>}>
        <AgentChatContent />
      </Suspense>
    </div>
  );
}

function CheckCircleIcon(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
