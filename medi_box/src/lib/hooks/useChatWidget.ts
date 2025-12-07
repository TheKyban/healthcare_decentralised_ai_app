"use client";

import { create } from 'zustand';

interface ChatWidgetState {
  isOpen: boolean;
  isMinimized: boolean;
  toggleChat: () => void;
  closeChat: () => void;
  openChat: () => void;
}

export const useChatWidget = create<ChatWidgetState>((set) => ({
  isOpen: false,
  isMinimized: true,
  toggleChat: () => set((state: ChatWidgetState) => ({ 
    isMinimized: !state.isMinimized,
    isOpen: state.isMinimized ? true : state.isOpen
  })),
  closeChat: () => set({ isOpen: false, isMinimized: true }),
  openChat: () => set({ isOpen: true, isMinimized: false }),
})); 