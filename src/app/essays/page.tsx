
"use client";

import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, FileText, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Essay {
  id: string;
  university: string;
  prompt: string;
  content: string;
  lastSaved: string;
}

const initialEssays: Essay[] = [
  {
    id: "1",
    university: "Harvard University",
    prompt: "Your Intellectual Life: Please describe a topic, idea, or concept that you find so engaging that it makes you lose all track of time.",
    content: "When I first encountered the principles of quantum mechanics...",
    lastSaved: "2024-05-15"
  }
];

export default function EssaysPage() {
  const { toast } = useToast();
  const [essays, setEssays] = useState<Essay[]>(initialEssays);
  const [activeEssay, setActiveEssay] = useState<Essay | null>(null);

  const wordCount = activeEssay?.content.split(/\s+/).filter(Boolean).length || 0;

  const handleSave = () => {
    if (!activeEssay) return;
    toast({
      title: "에세이가 저장되었습니다.",
      description: `${activeEssay.university} 에세이가 안전하게 보관되었습니다.`
    });
    setEssays(prev => prev.map(e => e.id === activeEssay.id ? activeEssay : e));
    setActiveEssay(null);
  };

  const handleCreate = () => {
    const newEssay: Essay = {
      id: Date.now().toString(),
      university: "New University",
      prompt: "Enter the essay prompt here...",
      content: "",
      lastSaved: new Date().toISOString().split('T')[0]
    };
    setEssays([newEssay, ...essays]);
    setActiveEssay(newEssay);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="p-6 flex justify-between items-center">
        <div>
          <h1 className="font-headline text-2xl font-bold">에세이 관리</h1>
          <p className="text-sm text-muted-foreground">대학별 에세이를 작성하고 관리하세요.</p>
        </div>
        {!activeEssay && (
          <Button onClick={handleCreate} size="icon" className="rounded-full w-12 h-12">
            <Plus />
          </Button>
        )}
      </header>

      <div className="p-6">
        {activeEssay ? (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setActiveEssay(null)} className="p-0 hover:bg-transparent text-primary">← 목록으로</Button>
              <Button onClick={handleSave} className="gap-2 rounded-xl">
                <Save className="w-4 h-4" /> 저장하기
              </Button>
            </div>
            
            <Card className="border-none shadow-sm overflow-hidden">
              <div className="bg-primary/5 p-4 border-b border-primary/10">
                <Input 
                  value={activeEssay.university}
                  onChange={(e) => setActiveEssay({...activeEssay, university: e.target.value})}
                  className="bg-transparent border-none font-bold text-lg p-0 h-auto focus-visible:ring-0 shadow-none"
                />
              </div>
              <CardContent className="p-4 pt-4">
                <p className="text-xs text-muted-foreground mb-2">프롬프트</p>
                <Textarea 
                   value={activeEssay.prompt}
                   onChange={(e) => setActiveEssay({...activeEssay, prompt: e.target.value})}
                   className="text-xs italic bg-accent/20 border-none min-h-[60px]"
                />
              </CardContent>
            </Card>

            <div className="relative">
              <Textarea 
                value={activeEssay.content}
                onChange={(e) => setActiveEssay({...activeEssay, content: e.target.value})}
                placeholder="여기에 에세이를 작성하세요..."
                className="min-h-[400px] rounded-2xl p-6 text-sm leading-relaxed border-none shadow-sm focus-visible:ring-primary/20"
              />
              <div className="absolute bottom-4 right-4">
                <Badge variant="secondary" className="px-3 py-1">
                  {wordCount} 단어
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {essays.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>작성된 에세이가 없습니다.<br />새 에세이를 시작해보세요.</p>
              </div>
            ) : (
              essays.map((essay) => (
                <Card 
                  key={essay.id} 
                  className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => setActiveEssay(essay)}
                >
                  <CardContent className="p-6 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="font-bold">{essay.university}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{essay.prompt}</p>
                      <p className="text-[10px] text-primary font-medium pt-2">최종 수정: {essay.lastSaved}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

import { Input } from "@/components/ui/input";
