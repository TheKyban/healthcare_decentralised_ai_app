"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FloatingChatButton() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Show button after a short delay for better UX
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleClick = () => {
    router.push('/patient/chat');
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button 
        onClick={handleClick}
        className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center bg-primary hover:bg-primary/90"
        aria-label="Chat with AI"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
      <span className="absolute -top-10 right-0 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
        Chat with AI
      </span>
    </div>
  );
} 