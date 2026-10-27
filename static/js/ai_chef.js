/**
 * CookMate - AI Chef Voice Assistant Logic
 * Integrates Web Speech Recognition, Text-to-Speech, backend Flask AI API,
 * audio waveforms, and Three.js 3D Chef character animation states.
 */

class AIChefAssistant {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.isSpeaking = false;
    this.synth = window.speechSynthesis || null;
    this.currentUtterance = null;
    this.lastAnswerText = '';

    this.initElements();
    this.initSpeechRecognition();
    this.bindEvents();
  }

  initElements() {
    this.micBtn = document.getElementById('voice-mic-btn');
    this.stopBtn = document.getElementById('voice-stop-btn');
    this.statusText = document.getElementById('voice-status-text');
    this.leftWaveform = document.getElementById('waveform-left');
    this.rightWaveform = document.getElementById('waveform-right');
    this.chatStream = document.getElementById('ai-dialogue-stream');
    this.textInput = document.getElementById('ai-text-input');
    this.submitBtn = document.getElementById('ai-submit-btn');
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech API recognition not supported in this browser.');
      if (this.statusText) {
        this.statusText.textContent = 'Voice input not supported in this browser. Please use text input below.';
      }
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      this.updateUIState('listening');
      if (window.chef3D) window.chef3D.setState('listening');
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      this.handleVoiceInput(transcript);
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      this.updateUIState('idle');
      if (window.chef3D) window.chef3D.setState('idle');

      let errMessage = 'Could not recognize voice.';
      if (event.error === 'not-allowed') {
        errMessage = 'Microphone permission denied. Please allow microphone access.';
      } else if (event.error === 'no-speech') {
        errMessage = 'No speech detected. Please tap the mic and try again.';
      }
      showToast(errMessage, 'error');
      if (this.statusText) this.statusText.textContent = errMessage;
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (!this.isSpeaking && !this.isThinking) {
        this.updateUIState('idle');
        if (window.chef3D) window.chef3D.setState('idle');
      }
    };
  }

  bindEvents() {
    if (this.micBtn) {
      this.micBtn.addEventListener('click', () => {
        if (this.isListening) {
          this.stopListening();
        } else {
          this.startListening();
        }
      });
    }

    if (this.stopBtn) {
      this.stopBtn.addEventListener('click', () => {
        this.stopAll();
      });
    }

    if (this.submitBtn && this.textInput) {
      this.submitBtn.addEventListener('click', () => {
        const text = this.textInput.value.trim();
        if (text) {
          this.textInput.value = '';
          this.handleVoiceInput(text);
        }
      });

      this.textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const text = this.textInput.value.trim();
          if (text) {
            this.textInput.value = '';
            this.handleVoiceInput(text);
          }
        }
      });
    }

    // Quick prompt chips
    document.querySelectorAll('.quick-prompt-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.textContent.trim();
        this.handleVoiceInput(query);
      });
    });
  }

  startListening() {
    this.stopSpeaking();
    if (!this.recognition) {
      showToast('Speech recognition not available on this browser. Type your question below!', 'info');
      if (this.textInput) this.textInput.focus();
      return;
    }

    try {
      this.recognition.start();
    } catch (e) {
      console.warn('Recognition start exception:', e);
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
    this.isListening = false;
    this.updateUIState('idle');
    if (window.chef3D) window.chef3D.setState('idle');
  }

  stopSpeaking() {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
    this.updateUIState('idle');
    if (window.chef3D) window.chef3D.setState('idle');
  }

  stopAll() {
    this.stopListening();
    this.stopSpeaking();
    if (this.statusText) this.statusText.textContent = 'Stopped. Tap the microphone to ask again.';
  }

  updateUIState(state) {
    if (state === 'listening') {
      if (this.micBtn) this.micBtn.classList.add('listening');
      if (this.leftWaveform) this.leftWaveform.classList.add('active');
      if (this.rightWaveform) this.rightWaveform.classList.add('active');
      if (this.statusText) this.statusText.textContent = 'Listening... Speak your cooking question';
      if (this.stopBtn) this.stopBtn.style.display = 'inline-flex';
    } else if (state === 'thinking') {
      if (this.micBtn) this.micBtn.classList.remove('listening');
      if (this.leftWaveform) this.leftWaveform.classList.remove('active');
      if (this.rightWaveform) this.rightWaveform.classList.remove('active');
      if (this.statusText) this.statusText.textContent = 'Chef is thinking and preparing cooking advice...';
      if (this.stopBtn) this.stopBtn.style.display = 'inline-flex';
    } else if (state === 'speaking') {
      if (this.micBtn) this.micBtn.classList.remove('listening');
      if (this.leftWaveform) this.leftWaveform.classList.add('active');
      if (this.rightWaveform) this.rightWaveform.classList.add('active');
      if (this.statusText) this.statusText.textContent = 'Chef is speaking...';
      if (this.stopBtn) this.stopBtn.style.display = 'inline-flex';
    } else {
      // idle
      if (this.micBtn) this.micBtn.classList.remove('listening');
      if (this.leftWaveform) this.leftWaveform.classList.remove('active');
      if (this.rightWaveform) this.rightWaveform.classList.remove('active');
      if (this.statusText) this.statusText.textContent = 'Ready to assist! Tap the microphone or type below';
      if (this.stopBtn) this.stopBtn.style.display = 'none';
    }
  }

  async handleVoiceInput(query) {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    // Check for voice commands
    const lower = cleanQuery.toLowerCase();
    if (lower === 'stop speaking' || lower === 'stop') {
      this.stopSpeaking();
      return;
    }
    if (lower === 'repeat' || lower === 'repeat the instructions') {
      if (this.lastAnswerText) {
        this.speakResponse(this.lastAnswerText);
      }
      return;
    }

    // 1. Display User Message Card
    this.appendUserMessage(cleanQuery);

    // 2. Transition character & UI to THINKING
    this.isThinking = true;
    this.updateUIState('thinking');
    if (window.chef3D) window.chef3D.setState('thinking');

    try {
      // 3. Call backend Flask AI Chef API
      const res = await fetch('/api/ai-chef/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: cleanQuery })
      });

      const data = await res.json();
      this.isThinking = false;

      if (data.success && data.answer) {
        this.lastAnswerText = data.speech_text || data.answer;
        // 4. Display Chef Response Card
        this.appendChefResponse(data.answer, data.dish_image, data.suggestions);
        // 5. Speak response with TTS
        this.speakResponse(this.lastAnswerText);
      } else {
        const errorMsg = data.error || 'Sorry, I had trouble finding an answer. Please try again.';
        this.appendChefResponse(errorMsg);
        this.speakResponse('I encountered an issue preparing cooking advice. Please try asking again.');
      }
    } catch (err) {
      console.error('AI Chef network error:', err);
      this.isThinking = false;
      this.updateUIState('idle');
      if (window.chef3D) window.chef3D.setState('idle');
      const errText = 'Network connection problem. Please check your internet connection.';
      this.appendChefResponse(errText);
      showToast(errText, 'error');
    }
  }

  appendUserMessage(text) {
    if (!this.chatStream) return;
    const bubble = document.createElement('div');
    bubble.className = 'user-speech-bubble';
    bubble.innerHTML = `
      <div class="user-bubble-avatar">👤</div>
      <div class="user-bubble-text">${text}</div>
    `;
    this.chatStream.appendChild(bubble);
    this.chatStream.scrollTop = this.chatStream.scrollHeight;
  }

  appendChefResponse(text, dishImage = null, suggestions = []) {
    if (!this.chatStream) return;
    const card = document.createElement('div');
    card.className = 'chef-reply-card';

    // Format markdown-like bold and bullet points into HTML
    let formattedText = text
      .replace(/\n\n/g, '<br><br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    let imageHtml = '';
    if (dishImage) {
      imageHtml = `
        <div class="chef-dish-preview">
          <img src="${dishImage}" alt="Recipe Preview" onerror="this.src='/static/images/pasta-skillet.jpg'">
        </div>
      `;
    }

    let actionsHtml = `
      <div class="chef-reply-actions">
        <button class="chef-action-btn" onclick="window.aiChef.speakResponse(window.aiChef.lastAnswerText)">
          🔊 Listen Again
        </button>
        <button class="chef-action-btn" onclick="window.aiChef.stopSpeaking()">
          ⏹ Stop Speaking
        </button>
        <button class="chef-action-btn" onclick="window.aiChef.startListening()">
          🎤 Ask Another Question
        </button>
      </div>
    `;

    card.innerHTML = `
      <div class="chef-reply-header">
        <img src="/static/images/chef-avatar.jpg" alt="Chef Avatar" class="chef-avatar-mini" onerror="this.src='/static/images/pizza.jpg'">
        <span class="chef-reply-name">Chef CookMate</span>
        <span class="chef-speech-icon">👨‍🍳✨</span>
      </div>
      <div class="chef-reply-body">
        ${imageHtml}
        ${formattedText}
      </div>
      ${actionsHtml}
    `;

    this.chatStream.appendChild(card);
    this.chatStream.scrollTop = this.chatStream.scrollHeight;
  }

  speakResponse(text) {
    if (!this.synth) return;

    this.stopSpeaking();

    // Clean text of markdown characters for clean speech
    const cleanSpeech = text
      .replace(/\*\*/g, '')
      .replace(/#/g, '')
      .replace(/- /g, '')
      .replace(/\n/g, ' ')
      .trim();

    this.currentUtterance = new SpeechSynthesisUtterance(cleanSpeech);
    this.currentUtterance.rate = 1.0;
    this.currentUtterance.pitch = 1.05;

    // Pick warm natural English voice if available
    const voices = this.synth.getVoices();
    const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (naturalVoice) {
      this.currentUtterance.voice = naturalVoice;
    }

    this.currentUtterance.onstart = () => {
      this.isSpeaking = true;
      this.updateUIState('speaking');
      if (window.chef3D) window.chef3D.setState('speaking');
    };

    this.currentUtterance.onend = () => {
      this.isSpeaking = false;
      this.updateUIState('idle');
      if (window.chef3D) window.chef3D.setState('idle');
    };

    this.currentUtterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      this.isSpeaking = false;
      this.updateUIState('idle');
      if (window.chef3D) window.chef3D.setState('idle');
    };

    this.synth.speak(this.currentUtterance);
  }
}

// Global AI Chef instance
window.aiChef = null;

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('voice-mic-btn')) {
    window.aiChef = new AIChefAssistant();
  }
});
