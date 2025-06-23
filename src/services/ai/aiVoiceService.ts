export class AIVoiceService {
  private recognition: any;
  private synthesis: SpeechSynthesisUtterance;
  private isListening = false;

  constructor() {
    // Speech Recognition initialisieren
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'de-DE';
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
    }

    // Speech Synthesis initialisieren
    this.synthesis = new SpeechSynthesisUtterance();
    this.synthesis.lang = 'de-DE';
    this.synthesis.rate = 1.0;
    this.synthesis.pitch = 1.0;
  }

  async startListening(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Spracherkennung wird nicht unterstützt'));
        return;
      }

      if (this.isListening) {
        reject(new Error('Bereits am Zuhören'));
        return;
      }

      this.isListening = true;
      let finalTranscript = '';

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        resolve(finalTranscript);
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        reject(new Error(`Spracherkennungsfehler: ${event.error}`));
      };

      this.recognition.start();
    });
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  async speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Sprachausgabe wird nicht unterstützt'));
        return;
      }

      // Stoppe vorherige Ausgabe
      window.speechSynthesis.cancel();

      this.synthesis.text = text;
      
      this.synthesis.onend = () => {
        resolve();
      };

      this.synthesis.onerror = (event) => {
        reject(new Error(`Sprachausgabe-Fehler: ${event.error}`));
      };

      // Wähle deutsche Stimme wenn verfügbar
      const voices = window.speechSynthesis.getVoices();
      const germanVoice = voices.find(voice => 
        voice.lang.startsWith('de') && voice.localService
      );
      
      if (germanVoice) {
        this.synthesis.voice = germanVoice;
      }

      window.speechSynthesis.speak(this.synthesis);
    });
  }

  isSupported(): boolean {
    return 'webkitSpeechRecognition' in window && 'speechSynthesis' in window;
  }

  // Konvertiere Audio-Blob zu Base64 für Transkription
  async audioToBase64(audioBlob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
  }

  // Transkribiere Audio über OpenAI Whisper API
  async transcribeAudio(audioBase64: string, apiKey: string): Promise<string> {
    try {
      // Konvertiere Base64 zu Blob
      const byteCharacters = atob(audioBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const audioBlob = new Blob([byteArray], { type: 'audio/webm' });

      // Erstelle FormData für Whisper API
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'de');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Transkription fehlgeschlagen: ${response.statusText}`);
      }

      const result = await response.json();
      return result.text;
    } catch (error) {
      console.error('Fehler bei Audio-Transkription:', error);
      throw error;
    }
  }
}