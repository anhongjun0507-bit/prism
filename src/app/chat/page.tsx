
"use client";

import { useState, useRef, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { aiCounselingChat } from "@/ai/flows/ai-counseling-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, Loader2, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "ai";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "안녕하세요! 저는 PRISM의 AI 입시 카운슬러입니다. 미국 대학 입시와 관련해 궁금한 점이 있으신가요? 무엇이든 물어보세요." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await aiCounselingChat({ message: userMessage });
      setMessages(prev => [...prev, { role: "ai", content: response.response }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: "ai", content: "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-6 bg-white border-b border-border flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-headline font-bold text-lg">AI 카운슬러</h1>
            <p className="text-[10px] text-green-500 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> 실시간 상담 중
            </p>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 p-6 pb-32">
        <div className="space-y-6">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                m.role === "ai" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              )}>
                {m.role === "ai" ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className={cn(
                "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
                m.role === "ai" 
                  ? "bg-white border-none shadow-sm text-foreground rounded-tl-none" 
                  : "bg-primary text-white rounded-tr-none"
              )}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div className="bg-white p-4 rounded-2xl text-sm rounded-tl-none shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                AI가 생각 중입니다...
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-6 bg-transparent absolute bottom-20 left-0 right-0 z-10 max-w-md mx-auto">
        <div className="glass-card p-2 rounded-2xl flex gap-2 shadow-xl border border-white/50">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="상담하고 싶은 내용을 입력하세요..."
            className="border-none bg-transparent focus-visible:ring-0 text-sm h-12"
          />
          <Button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-12 h-12 rounded-xl shrink-0 p-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
