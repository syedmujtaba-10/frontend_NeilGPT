import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Volume2, Moon, Stars } from 'lucide-react';
import axios from 'axios';
// Import the STT functions from our Stt.jsx module
import { startRecording, stopRecording, setSTTResultCallback } from './Stt';
import { say } from './Tts';


function App() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      content:
        'Welcome to the cosmos! How can I assist you on your journey through the stars today?',
      isUser: false,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dots, setDots] = useState(''); // For animated dots while waiting for response
  const [recording, setRecording] = useState(false); // For STT recording state

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Animated dots for loading indicator
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
      }, 500);
    } else {
      setDots('');
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Callback when speech is recognized by STT module
  const handleSpeechResult = (text) => {
    console.log('Speech recognized:', text);
    // For example, update the input field with the recognized text.
    setInput(text);
  };

  // Set the STT result callback when the component mounts
  useEffect(() => {
    setSTTResultCallback(handleSpeechResult);
  }, []);

  // Handler for Mic button click: toggles recording on/off.
  const handleMicClick = () => {
    if (!recording) {
      startRecording();
      setRecording(true);
    } else {
      stopRecording();
      setRecording(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      content: input,
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      // Send request to backend
      const response = await axios.post('https://neilgpt.onrender.com/query', {
        prompt: input,
      });

      // Add bot response
      const botMessage = {
        id: (Date.now() + 1).toString(),
        content:
          response.data.response?.response || 'No valid response received.',
        isUser: false,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error(
        'Error fetching response:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      // Add error message
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Error fetching response. Please try again later.',
        isUser: false,
      };

      setMessages((prev) => [...prev, errorMessage]);
    }

    setLoading(false);
    setInput('');
  };

  const handleKeyDown = (e) => {
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
  const handleInput = (e) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
  };

  // Function to handle text-to-speech for bot messages
  /*const handleSpeakMessage = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    } else {
      console.log('Text-to-speech not supported in this browser');
      alert('Text-to-speech is not supported in your browser');
    }
  };*/
  const handleSpeakMessage = (text) => {
    say(text);
  };
  

  return (
    <div className="flex flex-col h-screen bg-[#0a0a1f] bg-[url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-fixed bg-blend-overlay">
      {/* Animated stars background */}
      <div className="stars-container absolute inset-0 overflow-hidden pointer-events-none">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
      </div>

      {/* Header */}
      <header className="bg-[#0f1642] bg-opacity-80 border-b border-indigo-900 py-4 px-4 sm:px-6 backdrop-blur-sm z-10 flex items-center">
        <Stars className="text-indigo-400 mr-2" />
        <h1 className="text-2xl font-bold text-white tracking-wider">NeilGPT</h1>
        <div className="ml-auto flex space-x-2">
          <Moon className="text-indigo-300" size={20} />
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:px-6 md:px-8 z-10">
        <div className="max-w-3xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-6 ${
                message.isUser ? 'flex justify-end' : 'flex justify-start flex-col'
              }`}
            >
              <div
                className={`rounded-lg px-4 py-3 max-w-[85%] backdrop-blur-sm ${
                  message.isUser
                    ? 'bg-indigo-600 bg-opacity-80 text-white border border-indigo-500'
                    : 'bg-[#1a1a3a] bg-opacity-80 text-indigo-100 border border-indigo-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>

              {/* Audio button for bot messages */}
              {!message.isUser && (
                <button
                  onClick={() => handleSpeakMessage(message.content)}
                  className="mt-2 ml-2 text-indigo-300 hover:text-indigo-100 focus:outline-none flex items-center text-sm transition-colors"
                >
                  <Volume2 size={16} className="mr-1" />
                  <span>Listen</span>
                </button>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-indigo-900 bg-[#0f1642] bg-opacity-80 p-4 sm:px-6 backdrop-blur-sm z-10">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              placeholder="Ask the cosmos..."
              className="w-full border border-indigo-800 rounded-lg pl-4 pr-24 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none min-h-[56px] max-h-[200px] bg-[#131836] bg-opacity-70 text-white placeholder-indigo-300"
              rows={1}
              disabled={loading}
            />
            {/* Mic Button with integrated STT functionality */}
            <button
              type="button"
              onClick={handleMicClick}
              className="absolute right-12 bottom-[13px] text-indigo-400 hover:text-indigo-200 focus:outline-none transition-colors"
              disabled={loading}
            >
              <Mic size={20} className="hover:text-indigo-200" />
              {recording ? (
                <span className="ml-1 text-sm">Stop</span>
              ) : (
                <span className="ml-1 text-sm">Record</span>
              )}
            </button>
            {/* Send Button */}
            <button
              type="submit"
              className="absolute right-3 bottom-[13px] text-indigo-400 hover:text-indigo-200 focus:outline-none disabled:opacity-50 transition-colors"
              disabled={!input.trim() || loading}
            >
              <Send
                size={20}
                className={
                  input.trim() && !loading ? 'text-indigo-300' : 'text-indigo-700'
                }
              />
            </button>
          </form>
          {loading && (
            <div className="text-center mt-2">
              <span className="text-sm text-indigo-300">
                Consulting the stars{dots}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
