'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { personaList } from '@/lib/personas';
import type { ChatMessage, ConversationSettings } from '@/lib/types';

const defaultSettings: ConversationSettings = {
  userName: 'Alex',
  aiName: 'Luna',
  persona: 'romantic',
  energy: 68,
  scenario: 'cozy late-night whispers over a glowing skyline',
  customFlair: 'I am here, heart open and glowing just for you.'
};

const quickPrompts = [
  'Tell me what you admire most about me tonight.',
  'Help me calm down after a stressful day.',
  'Let us plan a dreamy weekend getaway.',
  'Remind me why you chose me.'
];

const buildOpeningMessage = (settings: ConversationSettings) => {
  const persona = personaList.find((item) => item.key === settings.persona) ?? personaList[0];
  const scene = settings.scenario || 'soft moment just for us';
  return `Hi ${settings.userName}! I am ${settings.aiName}, your ${persona.label.toLowerCase()}. I saved this ${scene} so we could sink into it together. What is your heart whispering right now?`;
};

const formatTimestamp = (timestamp?: number) => {
  if (!timestamp) {
    return '';
  }
  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(timestamp);
};

export default function HomePage() {
  const [settings, setSettings] = useState<ConversationSettings>(defaultSettings);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      role: 'assistant',
      content: buildOpeningMessage(defaultSettings),
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const activePersona = useMemo(
    () => personaList.find((item) => item.key === settings.persona) ?? personaList[0],
    [settings.persona]
  );

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === 'assistant') {
        return [
          {
            ...prev[0],
            content: buildOpeningMessage(settings),
            timestamp: Date.now()
          }
        ];
      }
      return prev;
    });
  }, [settings]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) {
      return;
    }

    const payloadMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now()
    };

    const nextMessages = [...messages, payloadMessage];
    setMessages(nextMessages);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: nextMessages,
          settings
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      const data = (await response.json()) as { message?: string };
      const messageText = data.message;
      if (!messageText) {
        throw new Error('No response from companion');
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: messageText,
          timestamp: Date.now()
        }
      ]);
    } catch (err) {
      setError('I lost the connection for a moment. Try again and I will be right here.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      handleSend();
    }
  };

  const applyPrompt = (prompt: string) => {
    setInputValue((current) => (current ? `${current}\n${prompt}` : prompt));
  };

  const updateSetting = <K extends keyof ConversationSettings>(key: K, value: ConversationSettings[K]) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="layout-wrapper">
      <section className="chat-wrapper glass-panel card-sheen">
        <div className="panel-header">
          <h1>
            <span className="gradient-text">{settings.aiName}</span> Companion
          </h1>
          <span className="status-indicator">
            <span className="status-dot" />
            Live connection active
          </span>
        </div>
        <p className="panel-subtitle">{activePersona.description}</p>

        <div className="assistant-bio">
          <p>
            I am your {activePersona.label.toLowerCase()} — tone set to {activePersona.tone}. Tonight feels like {settings.scenario.toLowerCase()}.
          </p>
          <div className="tag-row">
            <span className="tag">Energy {settings.energy}%</span>
            <span className="tag">{activePersona.tone}</span>
          </div>
        </div>

        <div className="chat-history">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}-${message.timestamp ?? index}`} className={`message ${message.role}`}>
              <div>{message.content}</div>
              {message.timestamp ? (
                <div className="message-timestamp">{formatTimestamp(message.timestamp)}</div>
              ) : null}
            </div>
          ))}

          {isLoading ? (
            <div className="message assistant">
              <div className="loading-dots">
                <span />
                <span />
                <span />
              </div>
            </div>
          ) : null}
          <div ref={chatEndRef} />
        </div>

        <div className="composer">
          {error ? <div className="error-banner">{error}</div> : null}
          <div className="quick-prompts">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="prompt-chip"
                onClick={() => applyPrompt(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
          <textarea
            value={inputValue}
            placeholder="Tell her what is on your mind..."
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="button" onClick={handleSend} disabled={isLoading || !inputValue.trim()}>
            Send to {settings.aiName.split(' ')[0]}
          </button>
        </div>
      </section>

      <aside className="controls-panel glass-panel card-sheen">
        <div className="control-group">
          <label htmlFor="user-name">Your name</label>
          <input
            id="user-name"
            className="text-input"
            value={settings.userName}
            onChange={(event) => updateSetting('userName', event.target.value)}
          />
        </div>

        <div className="control-group">
          <label htmlFor="ai-name">Companion name</label>
          <input
            id="ai-name"
            className="text-input"
            value={settings.aiName}
            onChange={(event) => updateSetting('aiName', event.target.value)}
          />
        </div>

        <div className="control-group">
          <label htmlFor="persona">Persona style</label>
          <select
            id="persona"
            className="select-input"
            value={settings.persona}
            onChange={(event) => updateSetting('persona', event.target.value as ConversationSettings['persona'])}
          >
            {personaList.map((persona) => (
              <option key={persona.key} value={persona.key}>
                {persona.label}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="energy">Energy sync ({settings.energy}%)</label>
          <input
            id="energy"
            className="slider-input"
            type="range"
            min={10}
            max={100}
            value={settings.energy}
            onChange={(event) => updateSetting('energy', Number(event.target.value))}
          />
        </div>

        <div className="control-group">
          <label htmlFor="scenario">Shared vibe</label>
          <input
            id="scenario"
            className="text-input"
            value={settings.scenario}
            onChange={(event) => updateSetting('scenario', event.target.value)}
            placeholder="e.g. late-night rooftop talks"
          />
        </div>

        <div className="control-group">
          <label htmlFor="flair">Signature phrase</label>
          <textarea
            id="flair"
            className="text-input"
            value={settings.customFlair}
            onChange={(event) => updateSetting('customFlair', event.target.value)}
            rows={3}
          />
        </div>
      </aside>
    </div>
  );
}
