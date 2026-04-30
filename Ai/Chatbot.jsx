import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Home } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// Initialize the Gemini API client
// Note: It's best practice to use environment variables for API keys
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', content: "Hello! I'm your AI assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const location = useLocation();
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Show tooltip on the landing page if chat is closed
    if (location.pathname === '/' && !isOpen) {
      const timer = setTimeout(() => setShowTooltip(true), 2000); // 2 second delay
      const hideTimer = setTimeout(() => setShowTooltip(false), 12000); // Hide after 12s
      return () => { clearTimeout(timer); clearTimeout(hideTimer); };
    } else {
      setShowTooltip(false);
    }
  }, [location.pathname, isOpen]);

  const toggleChat = () => setIsOpen(!isOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (!apiKey) {
         setMessages((prev) => [...prev, { 
             role: 'model', 
             content: "It looks like the Gemini API key is missing. Please set VITE_GEMINI_API_KEY in your frontend .env file." 
         }]);
         setIsLoading(false);
         return;
      }

      // Prepare chat history for context (skip the first greeting message)
      const systemPrompt = `You are Landmark Ai Assistant, the official AI support bot for the Ghar Nishchit platform. 
Ghar Nishchit is a property management platform for landlords and tenants. 
If asked how to log in, tell them to click the "Login" button at the top navigation bar, enter their email and password, and select their role (Tenant or Landlord).
Key features: Landlords can manage properties, tenants, maintenance, and payments. Tenants can pay rent, submit maintenance requests, and message landlords.
Always be polite, concise, and helpful!`;

      const model = genAI.getGenerativeModel({ 
        model: "gemini-flash-latest",
        systemInstruction: systemPrompt
      });
      
      const history = messages
        .slice(1)
        .filter(m => m.role !== 'system')
        .map(m => ({
            role: m.role,
            parts: [{ text: m.content }]
        }));

      const chat = model.startChat({
        history: history,
      });

      const result = await chat.sendMessage(userMessage.content);
      const response = await result.response;
      const text = response.text();

      setMessages((prev) => [...prev, { role: 'model', content: text }]);
    } catch (error) {
      console.error("Error communicating with Gemini API:", error);
      setMessages((prev) => [...prev, { 
          role: 'model', 
          content: `Error: ${error.message || "Something went wrong. Please try again."}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Toggle Button with Attractor Tooltip */}
      {!isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end">
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mb-4 relative bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 px-4 py-3 rounded-2xl shadow-xl border border-indigo-100 dark:border-indigo-900 font-medium text-sm flex items-center space-x-2 cursor-pointer hover:bg-gray-50"
                onClick={toggleChat}
              >
                <span className="animate-pulse">Hi! Need help?</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }} 
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  <X size={14} />
                </button>
                {/* Small triangle pointer */}
                <div className="absolute -bottom-2 right-5 w-4 h-4 bg-white dark:bg-gray-800 border-b border-r border-indigo-100 dark:border-indigo-900 transform rotate-45"></div>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button
            onClick={toggleChat}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            <Home size={24} />
          </motion.button>
        </div>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-44 right-6 w-96 h-[500px] max-h-[80vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Bot size={20} />
                <h3 className="font-semibold text-lg">Landmark Ai Assistant</h3>
              </div>
              <button onClick={toggleChat} className="text-white/80 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50 dark:bg-gray-900">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div
                      className={`p-3 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-none'
                          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-gray-700 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex flex-row items-end gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center shrink-0">
                      <Bot size={16} />
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 dark:border-gray-700 flex items-center">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
