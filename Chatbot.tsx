import { useState, useEffect, useRef } from "react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Input } from "./input";
import { generateBotResponse, getChatHistory, saveChatMessage, ChatMessage } from "./chatbot";
import { Mic, MicOff, Volume2 } from "lucide-react";
import "./chatbot.css";

// Type declaration for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("lally-voice") : null
  );

  const userId = localStorage.getItem("current-user") || "default";

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");

        if (transcript.trim()) {
          setInputValue(transcript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };
    }

    // Initialize speech synthesis
    if ("speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
      const pickPreferredVoice = () => {
        if (!synthRef.current) return;
        const voices = synthRef.current.getVoices();
        if (!voices || voices.length === 0) return;
        setAvailableVoices(voices);

        // If user selected a voice previously, prefer it
        if (selectedVoice) {
          const sv = voices.find((v) => v.name === selectedVoice || v.voiceURI === selectedVoice);
          if (sv) {
            voiceRef.current = sv;
            return;
          }
        }

        const preferredNames = [
          "Female",
          "Samantha",
          "Google UK English Female",
          "Google US English",
          "Zira",
          "Amy",
          "Emma",
          "Joanna",
          "Ivy",
          "Kendra",
          "Nicole",
          "Olivia"
        ];

        // Try to find a matching preferred voice by name
        for (const name of preferredNames) {
          const v = voices.find((x) => x.name.includes(name));
          if (v) {
            voiceRef.current = v;
            return;
          }
        }

        // Fallback: prefer any English voice
        const en = voices.find((x) => x.lang && x.lang.toLowerCase().startsWith("en"));
        voiceRef.current = en || voices[0];
      };

      // Populate initially and when available voices change
      pickPreferredVoice();
      try {
        window.speechSynthesis.onvoiceschanged = pickPreferredVoice;
      } catch (e) {
        // ignore if not supported
      }
    }

    // load voices initially (some browsers require a small delay)
    const loadVoicesOnce = () => {
      if (!synthRef.current) return;
      const vs = synthRef.current.getVoices();
      if (vs && vs.length > 0) {
        setAvailableVoices(vs);
      }
    };
    setTimeout(loadVoicesOnce, 200);

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);


  useEffect(() => {
    if (isOpen) {
      const history = getChatHistory(userId);
      setMessages(history);
    } else {
      // Stop any ongoing speech and reset
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      setIsSpeaking(false);
    }
  }, [isOpen, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      message: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    saveChatMessage(userId, userMessage);
    setInputValue("");
    setIsLoading(true);

    // Simulate bot thinking time
    setTimeout(() => {
      const botResponse = generateBotResponse(inputValue);
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        message: botResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      saveChatMessage(userId, botMessage);
      setIsLoading(false);
      
      // Speak the bot's response
      speakText(botResponse);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
    }
  };

  const speakText = (text: string) => {
    if (!synthRef.current) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (voiceRef.current) {
      utterance.voice = voiceRef.current;
    }
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    synthRef.current.speak(utterance);
  };


  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 p-0 shadow-lg hover:shadow-xl transition-shadow"
        title="Chat with NutriPlan Assistant"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] h-[600px] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between w-full">
              <DialogTitle>🥗 Lally - Your Nutrition Bot</DialogTitle>
              <div className="ml-3">
                <label className="text-xs text-gray-500 mr-2">Voice</label>
                <select
                  className="text-sm px-2 py-1 border rounded"
                  value={selectedVoice ?? ""}
                  onChange={(e) => {
                    const name = e.target.value || null;
                    setSelectedVoice(name);
                    try {
                      if (name) localStorage.setItem("lally-voice", name);
                      else localStorage.removeItem("lally-voice");
                    } catch (err) {}

                    if (synthRef.current) {
                      const v = synthRef.current.getVoices().find((x) => x.name === name || x.voiceURI === name);
                      if (v) voiceRef.current = v;
                    }
                  }}
                >
                  <option value="">Auto</option>
                  {availableVoices.map((v) => (
                    <option key={v.voiceURI || v.name} value={v.name}>
                      {v.name} {v.lang ? `(${v.lang})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 rounded-lg space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <p className="text-lg mb-2">👋 Hi! I'm Lally!</p>
                <p className="text-sm">
                  Ask me anything about nutrition, diet plans, or fitness!
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.type === "user"
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 border border-gray-200 px-4 py-2 rounded-lg rounded-bl-none">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2 pt-4">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about diet, nutrition, exercise..."
              disabled={isLoading || isListening}
              className="flex-1"
            />
            <Button
              onClick={handleVoiceInput}
              disabled={isLoading}
              variant={isListening ? "default" : "outline"}
              className={`px-3 ${isListening ? "bg-red-500 hover:bg-red-600 text-white" : ""}`}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="px-4"
            >
              Send
            </Button>
          </div>

          {(isListening || isSpeaking) && (
            <div className="text-xs text-center text-gray-500 mt-2">
              {isListening && (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span>Listening...</span>
                </div>
              )}
              {isSpeaking && (
                <div className="flex items-center justify-center gap-2">
                  <Volume2 className="w-4 h-4 text-green-500" />
                  <span>Speaking...</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
