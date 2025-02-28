import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import axios from 'axios';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! How can I help you today?',
      isUser: false,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isUser: true,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    
    try {
      // Send request to backend
      const response = await axios.post("http://127.0.0.1:8000/query", { prompt: input });
      
      // Add bot response
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.data.response?.response || "No valid response received.",
        isUser: false,
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      // Safely handle the error without trying to log the entire error object
      console.error("Error fetching response:", error instanceof Error ? error.message : "Unknown error");
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Error fetching response. Please try again later.",
        isUser: false,
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    }
    
    setLoading(false);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-3 px-4 sm:px-6">
        <h1 className="text-xl font-semibold text-gray-800">Chat Interface</h1>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:px-6 md:px-8">
        <div className="max-w-3xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-6 ${message.isUser ? 'flex justify-end' : 'flex justify-start'}`}
            >
              <div
                className={`rounded-lg px-4 py-3 max-w-[85%] ${
                  message.isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              placeholder="Type a message..."
              className="w-full border border-gray-300 rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[56px] max-h-[200px]"
              rows={1}
              disabled={loading}
            />
            <button
              type="submit"
              className="absolute right-3 bottom-[13px] text-gray-400 hover:text-blue-600 focus:outline-none disabled:opacity-50"
              disabled={!input.trim() || loading}
            >
              <Send 
                size={20} 
                className={input.trim() && !loading ? "text-blue-600" : "text-gray-400"} 
              />
            </button>
          </form>
          {loading && (
            <div className="text-center mt-2">
              <span className="text-sm text-gray-500">Processing your request...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;