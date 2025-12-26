import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertTriangle, Move, Loader2 } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BudgetAlert, Transaction, Budget } from '../types/database';

interface Message {
  log_id: number;
  user_id: number;
  message_text: string;
  sender: 'User' | 'Bot';
  timestamp: Date;
}

interface ChatbotProps {
  onClose: () => void;
  budgetAlerts: BudgetAlert[];
  transactions: Transaction[];
  budgets: Budget[];
}

export function Chatbot({ onClose, budgetAlerts, transactions, budgets }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Dragging logic state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const alertsProcessed = useRef<Set<number>>(new Set());
  const chatbotRef = useRef<HTMLDivElement>(null);

  // --- 1. INITIALIZE GEMINI ---
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
  if (!apiKey) {
    console.warn("⚠️ VITE_GEMINI_API_KEY is missing in .env file");
  }
  const genAI = new GoogleGenerativeAI(apiKey);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // --- 2. DATABASE SYNC FUNCTIONS (NEW) ---

  // A. Save a single message to the database
  const saveMessageToDB = async (msg: Message) => {
    try {
        await fetch('http://localhost:5000/api/save-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: msg.user_id,
                message_text: msg.message_text,
                sender: msg.sender,
                timestamp: msg.timestamp 
            })
        });
    } catch (error) {
        console.error("Failed to save message to DB:", error);
    }
  };

  // B. Fetch old chat history when component loads
  const fetchChatHistory = async () => {
    try {
      // Hardcoded user_id=1 for this prototype
      // Change 3000 to 5000
      const response = await fetch('http://localhost:5000/api/chat-history/1');
      
      if (response.ok) {
        const history: any[] = await response.json();
        
        if (history.length > 0) {
            // Convert SQL timestamp strings back to Date objects
            const formattedHistory: Message[] = history.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
            }));
            setMessages(formattedHistory);
        } else {
            // If DB is empty, set the default Welcome Message
            const welcomeMessage: Message = {
                log_id: Date.now(),
                user_id: 1,
                message_text: "Hello! I'm powered by Gemini AI. I can see all your transactions and budgets. Ask me anything about your finances!",
                sender: 'Bot',
                timestamp: new Date(),
            };
            setMessages([welcomeMessage]);
        }
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
      // Fallback to welcome message on error
      const welcomeMessage: Message = {
        log_id: Date.now(),
        user_id: 1,
        message_text: "Hello! I'm powered by Gemini AI. (Offline Mode)",
        sender: 'Bot',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  };

  // --- 3. EFFECTS ---

  // Load History on Mount OR show Welcome Message if DB is empty
  useEffect(() => {
    // Attempt to fetch history from DB first
    fetchChatHistory().then(() => {
        // We check messages.length inside a setMessages update to ensure we have the latest state
        setMessages(prev => {
            // If previous state is empty (meaning DB returned nothing), add welcome message
            if (prev.length === 0) {
                const welcomeMessage: Message = {
                    log_id: Date.now(),
                    user_id: 1,
                    message_text: "Hello! I'm powered by Gemini AI. I can see all your transactions and budgets. Ask me anything about your finances!",
                    sender: 'Bot',
                    timestamp: new Date(),
                };
                return [welcomeMessage];
            }
            // If DB had data, leave it alone
            return prev;
        });
    });
  }, []);

  // Monitor budget alerts
  useEffect(() => {
    budgetAlerts.forEach((alert) => {
      if (!alertsProcessed.current.has(alert.budget_id)) {
        alertsProcessed.current.add(alert.budget_id);
        
        let alertMessage = '';
        if (alert.severity === 'critical') {
          alertMessage = `🚨 BUDGET ALERT: You've exceeded your ${alert.category} budget! Used ${alert.percentage.toFixed(0)}%.`;
        } else {
          alertMessage = `⚠️ WARNING: You're approaching your ${alert.category} budget limit (${alert.percentage.toFixed(0)}%).`;
        }

        const alertMsg: Message = {
          log_id: Date.now() + alert.budget_id,
          user_id: 1,
          message_text: alertMessage,
          sender: 'Bot',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, alertMsg]);
      }
    });
  }, [budgetAlerts]);

  // Handle Dragging Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // --- 4. CORE AI LOGIC ---

  const generateSystemPrompt = () => {
    if (!transactions || !budgets) { 
        return "System: Financial data is currently loading..."; 
    }

    const simplifiedTransactions = transactions.map(t => {
        const dateStr = new Date(t.date_time).toLocaleDateString();
        const descStr = t.merchant || t.raw_text || 'Unknown Merchant';
        const catStr = typeof t.category === 'string' ? t.category : t.category?.name || 'Uncategorized';
        return `${dateStr}: $${t.amount} on ${catStr} (${descStr})`;
    }).join('\n');

    const simplifiedBudgets = budgets.map(b => {
        const budgetCat = typeof b.category === 'string' ? b.category : b.category?.name || 'General';
        return `Category: ${budgetCat}, Limit: $${b.limit_amount}`;
    }).join('\n');

    return `
      You are a helpful financial assistant named SpendWise.
      Here is the user's current financial data:
      
      --- BUDGETS ---
      ${simplifiedBudgets}
      
      --- RECENT TRANSACTIONS ---
      ${simplifiedTransactions}
      
      INSTRUCTIONS:
      1. Answer the user's question based strictly on the data above.
      2. If they ask about savings, calculate (Total Income - Total Expenses).
      3. Be concise, friendly, and encouraging.
      4. If the data doesn't answer the question, say you don't see that info in their recent records.
    `;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // 1. Create User Message object
    const userMessage: Message = {
      log_id: Date.now(),
      user_id: 1,
      message_text: inputValue,
      sender: 'User',
      timestamp: new Date(),
    };

    // 2. Update UI & Save to DB
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    // 🔥 Fire and forget save to DB
    saveMessageToDB(userMessage);

    try {
      // 3. Prepare Model (Using standard gemini-2.5-flash)
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const systemContext = generateSystemPrompt();
      const chatHistory = messages.slice(-5).map(m => `${m.sender}: ${m.message_text}`).join('\n');
      
      const fullPrompt = `
        ${systemContext}
        
        --- CONVERSATION HISTORY ---
        ${chatHistory}
        
        User: ${userMessage.message_text}
        Bot:
      `;

      // 4. Call API
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      // 5. Create Bot Message object
      const botMessage: Message = {
        log_id: Date.now() + 1,
        user_id: 1,
        message_text: text,
        sender: 'Bot',
        timestamp: new Date(),
      };

      // 6. Update UI & Save to DB
      setMessages((prev) => [...prev, botMessage]);
      saveMessageToDB(botMessage);

    } catch (error) {
      console.error("Gemini Error:", error);
      const errorMessage: Message = {
        log_id: Date.now() + 1,
        user_id: 1,
        message_text: "Sorry, I'm having trouble connecting to my brain right now.",
        sender: 'Bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      ref={chatbotRef}
      className="fixed w-96 max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-30 overflow-hidden"
      style={{
        bottom: position.y === 0 ? '6rem' : 'auto',
        right: position.x === 0 ? '2rem' : 'auto',
        top: position.y !== 0 ? `${position.y}px` : 'auto',
        left: position.x !== 0 ? `${position.x}px` : 'auto',
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      {/* Header - Draggable */}
      <div 
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center gap-3 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <Bot className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3>Financial Assistant</h3>
          <p className="text-sm text-blue-100">
            {isLoading ? 'Analyzing...' : 'Powered by Gemini'}
          </p>
        </div>
        <div className="cursor-pointer hover:bg-white/20 p-1 rounded" onClick={onClose}>
             <Move className="w-5 h-5 text-white/60" />
        </div>
      </div>

      {/* Budget Alerts Banner */}
      {budgetAlerts.length > 0 && (
        <div className="bg-orange-50 border-b border-orange-200 p-3 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-orange-900">
              {budgetAlerts.length} budget warning(s) active
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((message) => (
          <div
            key={message.log_id}
            className={`flex gap-3 ${
              message.sender === 'User' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.sender === 'User'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {message.sender === 'User' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                message.sender === 'User'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : message.message_text.includes('🚨')
                  ? 'bg-orange-50 text-orange-900 rounded-tl-sm border border-orange-200'
                  : 'bg-white text-slate-900 rounded-tl-sm border border-slate-200 shadow-sm'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.message_text}</p>
              <p className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center animate-pulse">
                    <Bot className="w-5 h-5 text-slate-500" />
                 </div>
                 <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm border border-slate-200 shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm text-slate-500">Thinking...</span>
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            placeholder={isLoading ? "Please wait..." : "Ask me anything..."}
            className="flex-1 px-4 py-2 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}