import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertTriangle, Move } from 'lucide-react';
import { BudgetAlert, Transaction, Budget, ChatLog } from '../types/database';

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

const botResponses = [
  "Based on your spending patterns, you're doing great with your food budget! You're 17% under budget this month.",
  "Your transportation costs are very consistent. You're averaging $170/week, which is well within your budget.",
  "Great news! You've saved $400 this month compared to last month. Keep up the good work!",
  "I can help you create a savings plan. What's your target amount and timeframe?",
  "Let me analyze your recent transactions to find potential savings opportunities.",
];

export function Chatbot({ onClose, budgetAlerts, transactions, budgets }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const alertsProcessed = useRef<Set<number>>(new Set());
  const chatbotRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      log_id: Date.now(),
      user_id: 1,
      message_text: "Hello! I'm your personal financial assistant. I can help you analyze your spending, create budgets, and answer questions about your finances. How can I help you today?",
      sender: 'Bot',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  // Monitor budget alerts and send notifications
  useEffect(() => {
    budgetAlerts.forEach((alert) => {
      // Only send alert message if we haven't processed this budget_id yet
      if (!alertsProcessed.current.has(alert.budget_id)) {
        alertsProcessed.current.add(alert.budget_id);
        
        let alertMessage = '';
        if (alert.severity === 'critical') {
          alertMessage = `🚨 BUDGET ALERT: You've exceeded your ${alert.category} budget! You've spent $${alert.spent.toFixed(2)} of your $${alert.limit.toFixed(2)} limit (${alert.percentage.toFixed(0)}%). Consider reducing spending in this category.`;
        } else {
          alertMessage = `⚠️ WARNING: You're approaching your ${alert.category} budget limit. You've used ${alert.percentage.toFixed(0)}% ($${alert.spent.toFixed(2)} of $${alert.limit.toFixed(2)}). You have $${(alert.limit - alert.spent).toFixed(2)} remaining.`;
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

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      log_id: Date.now(),
      user_id: 1,
      message_text: inputValue,
      sender: 'User',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userQuery = inputValue.toLowerCase();
    setInputValue('');

    // Simulate bot response based on query
    setTimeout(() => {
      let botResponseText = '';

      // Context-aware responses based on actual data
      if (userQuery.includes('food') || userQuery.includes('dining')) {
        const foodBudget = budgets.find(b => b.category === 'Food & Dining');
        const foodSpent = transactions
          .filter(t => t.category === 'Food & Dining')
          .reduce((sum, t) => sum + t.amount, 0);
        
        if (foodBudget) {
          const percentage = ((foodSpent / foodBudget.limit_amount) * 100).toFixed(0);
          botResponseText = `You've spent $${foodSpent.toFixed(2)} on Food & Dining this month, which is ${percentage}% of your $${foodBudget.limit_amount.toFixed(2)} budget. You have $${(foodBudget.limit_amount - foodSpent).toFixed(2)} remaining.`;
        }
      } else if (userQuery.includes('budget') || userQuery.includes('over')) {
        const overBudget = budgetAlerts.filter(a => a.severity === 'critical');
        const warning = budgetAlerts.filter(a => a.severity === 'warning');
        
        if (overBudget.length > 0) {
          botResponseText = `You currently have ${overBudget.length} categor${overBudget.length === 1 ? 'y' : 'ies'} over budget: ${overBudget.map(a => a.category).join(', ')}. `;
        }
        if (warning.length > 0) {
          botResponseText += `${warning.length} categor${warning.length === 1 ? 'y is' : 'ies are'} approaching the limit (${'>'}90%): ${warning.map(a => a.category).join(', ')}.`;
        }
        if (overBudget.length === 0 && warning.length === 0) {
          botResponseText = "Good news! All your budgets are looking healthy. You're staying within your limits across all categories.";
        }
      } else if (userQuery.includes('savings') || userQuery.includes('save')) {
        const totalBudget = budgets.reduce((sum, b) => sum + b.limit_amount, 0);
        const totalSpent = transactions
          .filter(t => t.category !== 'Income')
          .reduce((sum, t) => sum + t.amount, 0);
        botResponseText = `You've saved $${(totalBudget - totalSpent).toFixed(2)} this month! To save more, I recommend: 1) Reduce dining out expenses, 2) Look for subscription services you're not using, 3) Set up automatic transfers to a savings account.`;
      } else if (userQuery.includes('total') || userQuery.includes('spent')) {
        const totalSpent = transactions
          .filter(t => t.category !== 'Income')
          .reduce((sum, t) => sum + t.amount, 0);
        botResponseText = `Your total spending this month is $${totalSpent.toFixed(2)} across ${transactions.filter(t => t.category !== 'Income').length} transactions.`;
      } else {
        // Random helpful response
        botResponseText = botResponses[Math.floor(Math.random() * botResponses.length)];
      }

      const botMessage: Message = {
        log_id: Date.now() + 1,
        user_id: 1,
        message_text: botResponseText,
        sender: 'Bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
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
            {budgetAlerts.length > 0 ? `${budgetAlerts.length} Active Alert${budgetAlerts.length > 1 ? 's' : ''}` : 'Online'}
          </p>
        </div>
        <Move className="w-5 h-5 text-white/60" />
      </div>

      {/* Budget Alerts Banner */}
      {budgetAlerts.length > 0 && (
        <div className="bg-orange-50 border-b border-orange-200 p-3 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-orange-900">
              {budgetAlerts.filter(a => a.severity === 'critical').length > 0 
                ? `${budgetAlerts.filter(a => a.severity === 'critical').length} budget(s) exceeded`
                : `${budgetAlerts.length} budget warning(s)`}
            </p>
            <p className="text-xs text-orange-700">Check messages for details</p>
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
              {message.sender === 'User' ? (
                <User className="w-5 h-5" />
              ) : (
                <Bot className="w-5 h-5" />
              )}
            </div>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                message.sender === 'User'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : message.message_text.includes('🚨') || message.message_text.includes('⚠️')
                  ? 'bg-orange-50 text-orange-900 rounded-tl-sm border border-orange-200'
                  : 'bg-white text-slate-900 rounded-tl-sm border border-slate-200'
              }`}
            >
              <p className="text-sm">{message.message_text}</p>
              <p
                className={`text-xs mt-1 ${
                  message.sender === 'User' ? 'text-blue-100' : 
                  message.message_text.includes('🚨') || message.message_text.includes('⚠️')
                    ? 'text-orange-700'
                    : 'text-slate-500'
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      <div className="px-4 py-2 border-t border-slate-200 bg-white">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setInputValue('How much did I spend on food this month?')}
            className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm whitespace-nowrap hover:bg-slate-200 transition-colors"
          >
            Food spending?
          </button>
          <button
            onClick={() => setInputValue('Am I over budget?')}
            className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm whitespace-nowrap hover:bg-slate-200 transition-colors"
          >
            Budget status?
          </button>
          <button
            onClick={() => setInputValue('Give me savings tips')}
            className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm whitespace-nowrap hover:bg-slate-200 transition-colors"
          >
            Savings tips
          </button>
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-2 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}