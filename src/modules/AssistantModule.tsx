import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, RotateCcw } from 'lucide-react';
import type { AppData, ChatMessage } from '@/types';
import { uid, formatNumber, lastNDays } from '@/lib/format';
import {
  WATER_SAVING_TIPS,
  ENERGY_SAVING_TIPS,
  WASTE_CATEGORY_INFO,
} from '@/lib/constants';

interface AssistantModuleProps {
  data: AppData;
  onUpdate: (updater: (prev: AppData) => AppData) => void;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const SUGGESTED_PROMPTS = [
  'How can I reduce my water usage?',
  'What should I do with old batteries?',
  'How can I lower my electricity bill?',
  'Give me tips to reduce my carbon footprint',
  'How do I start composting?',
];

function generateRuleBasedResponse(query: string, data: AppData): string {
  const q = query.toLowerCase();
  const last7 = lastNDays(7);

  const waterTotal = data.waterRecords
    .filter((r) => last7.includes(r.date))
    .reduce((s, r) => s + r.liters, 0);
  const avgWater = waterTotal / 7;
  const energyTotal = data.energyRecords
    .filter((r) => last7.includes(r.date))
    .reduce((s, r) => s + r.kwh, 0);
  const totalCo2 = energyTotal * data.energySettings.emissionFactor;
  const wasteTotal = data.wasteRecords.reduce((s, r) => s + r.weightKg, 0);
  const recycledPct =
    wasteTotal > 0
      ? (data.wasteRecords
          .filter((r) => r.category === 'recyclable')
          .reduce((s, r) => s + r.weightKg, 0) /
          wasteTotal) *
        100
      : 0;

  // Water
  if (q.includes('water') || q.includes('shower') || q.includes('tap')) {
    const tips = WATER_SAVING_TIPS.slice(0, 3);
    let response = `Here are some practical ways to reduce your water usage:\n\n`;
    tips.forEach((t, i) => {
      response += `${i + 1}. ${t}\n`;
    });
    if (avgWater > 0) {
      response += `\nYour current average is ${formatNumber(avgWater, 0)} L/day. `;
      if (avgWater > data.waterGoal.dailyLitersGoal) {
        response += `That's above your goal of ${data.waterGoal.dailyLitersGoal} L/day. `;
        response += `Try reducing shower time by 2 minutes to save ~12 L per shower.`;
      } else {
        response += `Great job — you're within your goal of ${data.waterGoal.dailyLitersGoal} L/day!`;
      }
    } else {
      response += `\nStart tracking your water usage in the Water Conservation module to get personalized recommendations.`;
    }
    return response;
  }

  // Waste
  if (q.includes('waste') || q.includes('recycle') || q.includes('trash') || q.includes('compost') || q.includes('bin')) {
    if (q.includes('battery') || q.includes('batteries')) {
      return `Batteries are classified as hazardous waste. Here's what to do:\n\n1. Never throw batteries in the regular trash — they contain toxic chemicals.\n2. Collect used batteries in a non-conductive container.\n3. Drop them off at a local hazardous waste facility or battery recycling point.\n4. Many electronics stores offer battery recycling bins.\n5. Consider switching to rechargeable batteries to reduce waste.\n\nYou can log hazardous waste in the Smart Waste Management module.`;
    }
    if (q.includes('compost') || q.includes('organic')) {
      return `Starting a compost is one of the best ways to reduce organic waste:\n\n1. Get a compost bin — indoor or outdoor depending on your space.\n2. Add greens: fruit/veg scraps, coffee grounds, tea bags, eggshells.\n3. Add browns: dry leaves, paper, cardboard, twigs.\n4. Keep a 3:1 ratio of browns to greens for best results.\n5. Turn the pile every 1-2 weeks for aeration.\n6. Avoid meat, dairy, and oily foods — they attract pests.\n\nIn the Waste Management module, classify food scraps as "Organic" to track your composting.`;
    }
    let response = `Here's how to improve your waste management:\n\n`;
    Object.entries(WASTE_CATEGORY_INFO).forEach(([key, info]) => {
      response += `**${info.label}:** ${info.tips[0]}\n`;
    });
    if (recycledPct > 0) {
      response += `\nYour current recycling rate is ${formatNumber(recycledPct, 0)}%. `;
      response += recycledPct >= 50
        ? `That's above average — keep it up!`
        : `Try to sort more recyclables to reach at least 50%.`;
    }
    return response;
  }

  // Energy
  if (q.includes('energy') || q.includes('electric') || q.includes('electricity') || q.includes('bill') || q.includes('power')) {
    const tips = ENERGY_SAVING_TIPS.slice(0, 3);
    let response = `Here are practical ways to reduce your electricity consumption:\n\n`;
    tips.forEach((t, i) => {
      response += `${i + 1}. ${t}\n`;
    });
    if (energyTotal > 0) {
      response += `\nYou've used ${formatNumber(energyTotal, 1)} kWh in the last 7 days, producing an estimated ${formatNumber(totalCo2, 1)} kg of CO₂. `;
      const topAppliance = COMMON_APPLIANCE_USAGE(data);
      if (topAppliance) {
        response += `Your highest-consuming appliance is ${topAppliance}. Focus on reducing its usage for the biggest impact.`;
      }
    }
    return response;
  }

  // Carbon
  if (q.includes('carbon') || q.includes('co2') || q.includes('emission') || q.includes('footprint')) {
    let response = `To reduce your carbon footprint, focus on these key areas:\n\n`;
    response += `1. **Energy:** Switch to LED bulbs and unplug idle electronics. Your current energy-related CO₂ is ${formatNumber(totalCo2, 1)} kg/week.\n`;
    response += `2. **Transport:** Walk, bike, or use public transit for short trips.\n`;
    response += `3. **Diet:** Reduce red meat consumption — livestock is a major emissions source.\n`;
    response += `4. **Waste:** Recycle and compost to reduce landfill emissions. Your recycling rate is ${formatNumber(recycledPct, 0)}%.\n`;
    response += `5. **Water:** Saving water also saves the energy used to treat and pump it. You're using ${formatNumber(avgWater, 0)} L/day.\n`;
    response += `\nUse the Energy Tracker to adjust your emission factor for a more accurate carbon estimate.`;
    return response;
  }

  // General
  return `I'm your sustainability assistant. I can help with:\n\n• **Water conservation** — tips to reduce usage and track savings\n• **Waste management** — proper disposal and recycling guidance\n• **Energy efficiency** — reduce consumption and your electricity bill\n• **Carbon footprint** — understand and reduce your CO₂ emissions\n\nBased on your data:\n• Water: ${formatNumber(avgWater, 0)} L/day average\n• Energy: ${formatNumber(energyTotal, 1)} kWh this week\n• Waste: ${formatNumber(wasteTotal, 1)} kg tracked, ${formatNumber(recycledPct, 0)}% recycled\n\nAsk me about any of these topics, or try one of the suggested questions above.`;
}

function COMMON_APPLIANCE_USAGE(data: AppData): string | null {
  const usage: Record<string, number> = {};
  data.energyRecords.forEach((r) => {
    usage[r.appliance] = (usage[r.appliance] || 0) + r.kwh;
  });
  const sorted = Object.entries(usage).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : null;
}

export function AssistantModule({ data, onUpdate, onToast }: AssistantModuleProps) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = data.chatMessages;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = (text?: string) => {
    const content = (text || input).trim();
    if (!content) return;

    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    onUpdate((prev) => ({
      ...prev,
      chatMessages: [...prev.chatMessages, userMsg],
    }));
    setInput('');
    setIsTyping(true);

    // Simulate response with a short delay for UX
    setTimeout(() => {
      const response = generateRuleBasedResponse(content, data);
      const assistantMsg: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      onUpdate((prev) => ({
        ...prev,
        chatMessages: [...prev.chatMessages, assistantMsg],
      }));
      setIsTyping(false);
    }, 600);
  };

  const handleClear = () => {
    onUpdate((prev) => ({ ...prev, chatMessages: [] }));
    onToast('Chat history cleared.', 'success');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">AI Sustainability Assistant</h2>
          <p className="text-sm text-gray-500">
            Get personalized environmental recommendations based on your data.
          </p>
        </div>
        {messages.length > 0 && (
          <button onClick={handleClear} className="btn-secondary flex items-center gap-2">
            <RotateCcw size={16} /> Clear Chat
          </button>
        )}
      </div>

      {/* Info banner */}
      <div className="card p-4 flex items-start gap-3 bg-brand-50 border-brand-100">
        <Sparkles size={18} className="text-brand-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-brand-800">
          This assistant uses a <span className="font-semibold">rule-based system</span> that
          analyzes your tracked data to provide relevant sustainability tips. Recommendations
          are tailored to your actual water, energy, and waste records.
        </p>
      </div>

      {/* Chat area */}
      <div className="card overflow-hidden flex flex-col" style={{ height: '60vh', minHeight: '400px' }}>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && !isTyping && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="p-4 rounded-2xl bg-brand-50 mb-4">
                <Bot size={40} className="text-brand-600" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">Ask me anything about sustainability</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md">
                I'll analyze your data and give you personalized recommendations for reducing
                your environmental impact.
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="px-4 py-2 rounded-xl bg-gray-50 hover:bg-brand-50 text-sm text-gray-700 hover:text-brand-700 border border-gray-200 hover:border-brand-300 transition-all duration-200"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`flex-shrink-0 p-2 rounded-xl ${
                  msg.role === 'user'
                    ? 'bg-gray-100'
                    : 'bg-brand-50'
                }`}
              >
                {msg.role === 'user' ? (
                  <User size={18} className="text-gray-500" />
                ) : (
                  <Bot size={18} className="text-brand-600" />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-white border border-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm whitespace-pre-line leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 p-2 rounded-xl bg-brand-50">
                <Bot size={18} className="text-brand-600" />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 p-4">
          <div className="flex gap-2">
            <input
              className="input flex-1"
              type="text"
              placeholder="Ask about water, energy, waste, or carbon footprint..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              maxLength={500}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="btn-primary flex items-center gap-2 px-4"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
