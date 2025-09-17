'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Bot, User, CornerDownLeft, Loader2 } from 'lucide-react';
import { chat } from '@/ai/flows/chatbot-flow';
import type { Device, Alert } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';

type Message = {
  role: 'user' | 'model';
  content: string;
};

export function Chatbot({ devices, alerts }: { devices: Device[]; alerts: Alert[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);
  
  const handleToggle = () => {
    setIsOpen(!isOpen);
     if (!isOpen && messages.length === 0) {
      setMessages([
        { role: 'model', content: "Hello! I'm the EnviroWatch assistant. How can I help you today?" }
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const deviceData = devices.map(d => ({ id: d.id, name: d.name, location: d.location, status: d.status, coLevel: d.coLevel }));
      const alertData = alerts.map(a => ({ id: a.id, deviceName: a.deviceName, message: a.message, severity: a.severity, timestamp: a.timestamp }));

      const result = await chat({
        history: messages,
        message: input,
        deviceData,
        alertData,
      });
      const modelMessage: Message = { role: 'model', content: result.response };
      setMessages((prev) => [...prev, modelMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: Message = { role: 'model', content: "Sorry, I'm having trouble connecting right now. Please try again later." };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50"
        aria-label="Toggle Chatbot"
      >
        <MessageSquare size={32} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-full max-w-md z-50"
          >
            <Card className="flex flex-col h-[60vh] shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bot />
                  EnviroWatch Assistant
                </CardTitle>
                 <Button variant="ghost" size="icon" onClick={handleToggle}>
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full" ref={scrollAreaRef}>
                   <div className="p-4 space-y-4">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-3 ${
                          msg.role === 'user' ? 'justify-end' : ''
                        }`}
                      >
                        {msg.role === 'model' && <Bot className="flex-shrink-0" />}
                        <div
                          className={`rounded-lg px-3 py-2 text-sm ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {msg.content}
                        </div>
                        {msg.role === 'user' && <User className="flex-shrink-0" />}
                      </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3">
                            <Bot className="flex-shrink-0" />
                            <div className="rounded-lg px-3 py-2 text-sm bg-muted flex items-center gap-2">
                               <Loader2 className="h-4 w-4 animate-spin" />
                               <span>Thinking...</span>
                            </div>
                        </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about devices, alerts, or CO levels..."
                    disabled={isLoading}
                  />
                  <Button type="submit" disabled={isLoading}>
                    <CornerDownLeft className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
