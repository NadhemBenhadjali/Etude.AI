export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  time: string;
}

export interface SuggestedPlan {
  description: string;
  items: string[];
}
