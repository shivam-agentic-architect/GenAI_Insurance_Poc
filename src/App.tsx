import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  Bot, 
  User, 
  Shield, 
  BarChart3, 
  Building2, 
  Info, 
  ChevronRight,
  Sparkles,
  RefreshCcw,
  Plus,
  X,
  ArrowLeftRight,
  File,
  Upload,
  Loader2,
  CheckCircle2,
  LogOut
} from "lucide-react";
import { chat, getInsuranceData } from "./lib/gemini";

interface Message {
  role: "user" | "model";
  text: string;
  timestamp: Date;
}

interface Product {
  id: string;
  bankId: string;
  category: string;
  name: string;
  coverage: string;
  bankName?: string;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [modelType, setModelType] = useState<"gemini" | "gpt">("gemini");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "Hello! I am your GenAI Insurance Intelligence Assistant. How can I help you today? You can ask me about bank partners, insurance products, or policy details.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        setIsLoggedIn(true);
        setLoginError("");
      } else {
        const data = await response.json();
        setLoginError(data.error || "Invalid username or password");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setLoginError("An error occurred during login. Please try again.");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isLoggedIn) {
      scrollToBottom();
    }
  }, [messages, isLoggedIn]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["text/plain", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setUploadStatus({ type: "error", message: "Only .txt and .pdf files are supported." });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadStatus({ type: "success", message: `Successfully uploaded ${file.name}. ${data.chunks} chunks added to context.` });
          
          setMessages(prev => [...prev, {
            role: "model",
            text: `I've processed your document: **${file.name}**. I can now answer questions based on its content using the GPT (RAG) model.`,
            timestamp: new Date()
          }]);
        } else {
          setUploadStatus({ type: "error", message: data.error || "Upload failed" });
        }
      } catch (e) {
        setUploadStatus({ type: "error", message: "Failed to parse server response" });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    xhr.onerror = () => {
      setUploadStatus({ type: "error", message: "Network error occurred during upload." });
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    xhr.open("POST", "/api/upload");
    xhr.send(formData);
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    setIsLoading(true);
    setMessages((prev) => [...prev, userMessage]);
    if (!overrideInput) setInput("");

    try {
      let modelText = "";
      
      if (modelType === "gemini") {
        const history = messages.map((m) => ({
          role: m.role,
          parts: [{ text: m.text }],
        }));

        const response = await chat(textToSend, history);
        modelText = response.text || "I'm sorry, I couldn't process that request.";
      } else {
        // Call Python GPT API via Express proxy
        const response = await fetch(`/api/gpt/ask?q=${encodeURIComponent(textToSend)}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || `GPT service error (${response.status})`);
        }
        
        modelText = data.response || "I'm sorry, I couldn't process that request from the GPT service.";
      }

      const modelMessage: Message = {
        role: "model",
        text: modelText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (error: any) {
      console.error("Chat error details:", error);
      let errorMessage = "I encountered an error while processing your request. Please check your connection and try again.";
      
      if (error?.message?.includes("quota") || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.message?.includes("429")) {
        errorMessage = "I'm currently experiencing high traffic. Please wait a moment and try again.";
      }
      
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: errorMessage,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQueries = [
    "How many banks provide health insurance?",
    "Which banks offer car insurance in Karnataka?",
    "What is the claim process for life insurance?",
    "What is a No Claim Bonus (NCB)?",
    "Tell me about Zero Depreciation add-on.",
  ];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="p-3 bg-blue-600 rounded-xl mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
            <p className="text-slate-500 text-sm mt-1">GenAI POC - Shivam Charan</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                placeholder="Enter password"
                required
              />
            </div>

            {loginError && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-xs font-medium"
              >
                {loginError}
              </motion.p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
            >
              Sign In
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-400 mt-8 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" /> Developed by Shivam • Secure Access
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div id="app-container" className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside id="sidebar" className="hidden lg:flex flex-col w-80 bg-white border-r border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-bold text-lg leading-tight tracking-tight">
            Insurance<br />
            <span className="text-blue-600">Intelligence</span>
          </h1>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-thin">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Capabilities</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-3 text-sm text-slate-600 p-2 rounded-md hover:bg-slate-50 transition-colors">
                <Bot className="w-4 h-4" /> Conversational AI
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600 p-2 rounded-md hover:bg-slate-50 transition-colors">
                <BarChart3 className="w-4 h-4" /> Real-time Insights
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Sample Queries</p>
            <div className="space-y-2">
              {sampleQueries.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className="w-full text-left text-xs text-slate-500 p-2 rounded-md border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                >
                  {q}
                  <ChevronRight className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Knowledge Base</p>
            
            <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-700 leading-tight">
              <Info className="w-3 h-3 inline-block mr-1 mb-0.5" />
              <strong>Warning:</strong> Do not upload any personal information. Its POC and demo pupose only.
            </div>

            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden" 
              accept=".txt,.pdf"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isUploading ? "PROCESSING..." : "UPLOAD DOCUMENT"}
            </button>

            {isUploading && (
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>{uploadProgress < 100 ? "Uploading..." : "Processing..."}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-blue-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {uploadStatus && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-2 p-2 rounded-lg text-[10px] flex items-start gap-2 ${
                  uploadStatus.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}
              >
                {uploadStatus.type === "success" ? <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5" /> : <X className="w-3 h-3 shrink-0 mt-0.5" />}
                <span>{uploadStatus.message}</span>
                <button onClick={() => setUploadStatus(null)} className="ml-auto">
                  <X className="w-2.5 h-2.5" />
                </button>
              </motion.div>
            )}
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
              POC
            </div>
            <div>
              <p className="text-xs font-medium">v1.2.0-dual-model</p>
              <p className="text-[10px] text-slate-400">GenAI Assistant</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main id="main-content" className="flex-1 flex flex-col min-w-0 bg-slate-50 relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2">
            <div className="lg:hidden p-1.5 bg-blue-600 rounded-md mr-2">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-semibold text-slate-800">GenAI POC - Shivam Charan</h2>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">Active</span>
            
            <div className="ml-4 flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setModelType("gemini")}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                  modelType === "gemini" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                GEMINI
              </button>
              <button 
                onClick={() => setModelType("gpt")}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                  modelType === "gpt" ? "bg-white text-green-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                GPT (RAG)
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setMessages([{
                  role: "model",
                  text: "Chat history cleared. How can I help you now?",
                  timestamp: new Date(),
                }]);
              }}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                setIsLoggedIn(false);
                setUsername("");
                setPassword("");
              }}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300"></div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex max-w-[85%] gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    m.role === "user" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-blue-600"
                  }`}>
                    {m.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div className={`p-4 rounded-2xl shadow-sm ${
                    m.role === "user" 
                      ? "bg-blue-600 text-white rounded-tr-none" 
                      : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                  }`}>
                    <div className={`text-sm leading-relaxed whitespace-pre-wrap ${m.role === "model" ? "prose prose-slate prose-sm max-w-none" : ""}`}>
                      {m.text}
                    </div>
                    <p className={`text-[10px] mt-2 ${m.role === "user" ? "text-blue-100" : "text-slate-400"}`}>
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-slate-200">
          <div className="max-w-4xl mx-auto relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about insurance partners, products, or policies..."
              className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-3 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" /> Developed by Shivam • Data is for POC purposes only
          </p>
        </div>
      </main>
    </div>
  );
}
