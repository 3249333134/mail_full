/* ========================================
   信笺 — 媒体处理模块
   ======================================== */

const MediaHandler = {
  recorder: null,
  audioChunks: [],
  recordingStartTime: null,
  recordingTimer: null,
  currentRecordingBlob: null,

  async loadImageFromFile(inputEl) {
    return new Promise((resolve) => {
      const file = inputEl.files[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({ src: e.target.result, name: file.name, type: 'image' });
      };
      reader.readAsDataURL(file);
    });
  },

  async loadVideoFromFile(inputEl) {
    return new Promise((resolve) => {
      const file = inputEl.files[0];
      if (!file) return resolve(null);
      const url = URL.createObjectURL(file);
      resolve({ src: url, name: file.name, type: 'video', blob: file });
    });
  },

  async loadAudioFromFile(inputEl) {
    return new Promise((resolve) => {
      const file = inputEl.files[0];
      if (!file) return resolve(null);
      const url = URL.createObjectURL(file);
      resolve({ src: url, name: file.name, type: 'audio', blob: file });
    });
  },

  startRecording(onUpdate) {
    return new Promise(async (resolve, reject) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.audioChunks = [];
        this.recorder = new MediaRecorder(stream);
        this.recordingStartTime = Date.now();

        this.recorder.ondataavailable = (e) => {
          if (e.data.size > 0) this.audioChunks.push(e.data);
        };

        this.recorder.onstop = () => {
          this.currentRecordingBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          stream.getTracks().forEach(t => t.stop());
          resolve(this.currentRecordingBlob);
        };

        this.recorder.start();

        // 计时器
        this.recordingTimer = setInterval(() => {
          const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
          const min = String(Math.floor(elapsed / 60)).padStart(2, '0');
          const sec = String(elapsed % 60).padStart(2, '0');
          onUpdate(`${min}:${sec}`);
        }, 1000);

        // 保存流以便停止
        this._currentStream = stream;
      } catch (e) {
        reject(new Error('无法访问麦克风: ' + e.message));
      }
    });
  },

  stopRecording() {
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
    }
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
  },

  isRecording() {
    return this.recorder && this.recorder.state === 'playing';
  },

  playVoice(src, duration) {
    const audio = new Audio(src);
    audio.play();
    return audio;
  },

  // 生成贴纸的 SVG
  generateStampSVG(type) {
    const stamps = {
      // 花朵植物类
      flower: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="8" fill="#c47"/>
        ${[0,45,90,135,180,225,270,315].map(a => {
          const rad = a * Math.PI / 180;
          const x = 50 + 25 * Math.cos(rad);
          const y = 50 + 25 * Math.sin(rad);
          return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="#f9b" opacity="0.7"/>`;
        }).join('')}
      </svg>`,
      leaf: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 15 Q80 40 50 85 Q20 40 50 15Z" fill="#8b8" opacity="0.6"/>
        <line x1="50" y1="20" x2="50" y2="80" stroke="#6a6" stroke-width="1.5"/>
      </svg>`,
      tulip: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M35 40 Q30 15 50 15 Q70 15 65 40 Q65 55 50 60 Q35 55 35 40Z" fill="#ff6b6b" opacity="0.7"/>
        <path d="M35 40 Q25 30 30 20" stroke="#ff6b6b" stroke-width="3" fill="none" opacity="0.7"/>
        <path d="M65 40 Q75 30 70 20" stroke="#ff6b6b" stroke-width="3" fill="none" opacity="0.7"/>
        <rect x="47" y="60" width="6" height="30" fill="#7cb342" opacity="0.6"/>
        <path d="M47 75 Q35 70 30 80" stroke="#7cb342" stroke-width="3" fill="none" opacity="0.6"/>
      </svg>`,
      cherry_blossom: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        ${[0,72,144,216,288].map(a => {
          const rad = a * Math.PI / 180;
          const x = 50 + 22 * Math.cos(rad);
          const y = 50 + 22 * Math.sin(rad);
          return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="15" ry="20" fill="#ffb7c5" opacity="0.6" transform="rotate(${a} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
        }).join('')}
        <circle cx="50" cy="50" r="8" fill="#ffd700" opacity="0.7"/>
      </svg>`,
      sunflower: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="15" fill="#8b4513" opacity="0.7"/>
        ${[0,30,60,90,120,150,180,210,240,270,300,330].map(a => {
          const rad = a * Math.PI / 180;
          const x = 50 + 30 * Math.cos(rad);
          const y = 50 + 30 * Math.sin(rad);
          return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="10" ry="18" fill="#ffd700" opacity="0.6" transform="rotate(${a} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
        }).join('')}
      </svg>`,

      // 星星心形类
      star: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,10 61,38 92,38 67,56 76,87 50,69 24,87 33,56 8,38 39,38" fill="#da5" opacity="0.7"/>
      </svg>`,
      heart: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 88 C25 65 5 50 5 32 C5 16 18 5 32 5 C41 5 47 10 50 16 C53 10 59 5 68 5 C82 5 95 16 95 32 C95 50 75 65 50 88Z" fill="#e77" opacity="0.7"/>
      </svg>`,
      sparkling_heart: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 75 C30 58 15 45 15 32 C15 20 25 12 35 12 C42 12 47 16 50 20 C53 16 58 12 65 12 C75 12 85 20 85 32 C85 45 70 58 50 75Z" fill="#ff6b9d" opacity="0.75"/>
        <circle cx="35" cy="30" r="4" fill="white" opacity="0.6"/>
        <polygon points="75,20 77,26 83,26 78,30 80,36 75,32 70,36 72,30 67,26 73,26" fill="#fff" opacity="0.5"/>
      </svg>`,

      // 天空自然类
      bird: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 55 Q35 30 50 45 Q65 30 80 55 Q65 50 50 60 Q35 50 20 55Z" fill="#7af" opacity="0.6"/>
        <circle cx="42" cy="42" r="2" fill="#333"/>
        <circle cx="58" cy="42" r="2" fill="#333"/>
      </svg>`,
      moon: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M60 10 A35 35 0 1 0 60 90 A25 25 0 1 1 60 10Z" fill="#fc5" opacity="0.6"/>
      </svg>`,
      cloud: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="35" cy="55" rx="25" ry="18" fill="#e0e0e0" opacity="0.7"/>
        <ellipse cx="55" cy="50" rx="22" ry="20" fill="#e8e8e8" opacity="0.7"/>
        <ellipse cx="70" cy="58" rx="18" ry="15" fill="#e0e0e0" opacity="0.7"/>
      </svg>`,
      rainbow: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 80 A40 40 0 0 1 90 80" stroke="#ff6b6b" stroke-width="6" fill="none" opacity="0.7"/>
        <path d="M16 80 A34 34 0 0 1 84 80" stroke="#ffa94d" stroke-width="6" fill="none" opacity="0.7"/>
        <path d="M22 80 A28 28 0 0 1 78 80" stroke="#ffd43b" stroke-width="6" fill="none" opacity="0.7"/>
        <path d="M28 80 A22 22 0 0 1 72 80" stroke="#69db7c" stroke-width="6" fill="none" opacity="0.7"/>
        <path d="M34 80 A16 16 0 0 1 66 80" stroke="#4dabf7" stroke-width="6" fill="none" opacity="0.7"/>
        <path d="M40 80 A10 10 0 0 1 60 80" stroke="#9775fa" stroke-width="6" fill="none" opacity="0.7"/>
      </svg>`,
      rain: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        ${[20,40,60,80].map(x => `<line x1="${x}" y1="15" x2="${x-5}" y2="35" stroke="#8bf" stroke-width="2" opacity="0.5"/>`).join('')}
        <path d="M15 45 Q30 30 50 40 Q70 30 85 45 L85 65 Q70 55 50 65 Q30 55 15 65Z" fill="#aac" opacity="0.4"/>
      </svg>`,
      snowflake: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#74c0fc" stroke-width="3" fill="none" opacity="0.7">
          <line x1="50" y1="10" x2="50" y2="90"/>
          <line x1="15" y1="30" x2="85" y2="70"/>
          <line x1="85" y1="30" x2="15" y2="70"/>
          <polyline points="45,15 50,10 55,15"/>
          <polyline points="45,85 50,90 55,85"/>
          <polyline points="20,33 15,30 18,25"/>
          <polyline points="80,67 85,70 82,75"/>
          <polyline points="80,33 85,30 82,25"/>
          <polyline points="20,67 15,70 18,75"/>
        </g>
      </svg>`,

      // 水果食物类
      cherry: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        ${[[30,30],[50,20],[70,35],[40,50],[60,55]].map(([cx,cy]) =>
          `<circle cx="${cx}" cy="${cy}" r="7" fill="#fbb" opacity="0.6"/>`
        ).join('')}
        <path d="M40 50 Q50 10 60 35" stroke="#8a8" fill="none" stroke-width="1.5"/>
      </svg>`,
      strawberry: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 25 L70 35 Q75 70 50 85 Q25 70 30 35 Z" fill="#ff6b6b" opacity="0.75"/>
        <path d="M30 35 Q50 20 70 35" stroke="#51cf66" stroke-width="6" fill="none" opacity="0.7"/>
        ${[[40,45],[55,50],[45,60],[60,65],[35,55],[50,70]].map(([x,y]) =>
          `<circle cx="${x}" cy="${y}" r="2" fill="#ffd43b" opacity="0.8"/>`
        ).join('')}
      </svg>`,
      apple: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 25 C30 25 20 45 25 65 C30 85 45 90 50 90 C55 90 70 85 75 65 C80 45 70 25 50 25Z" fill="#ff6b6b" opacity="0.7"/>
        <path d="M50 25 Q52 15 58 12" stroke="#8b4513" stroke-width="3" fill="none"/>
        <ellipse cx="62" cy="15" rx="8" ry="5" fill="#51cf66" opacity="0.6"/>
      </svg>`,

      // 文艺小物类
      envelope: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="25" width="80" height="55" fill="#fff5e6" stroke="#d4a574" stroke-width="2" opacity="0.8"/>
        <path d="M10 25 L50 55 L90 25" stroke="#d4a574" stroke-width="2" fill="none"/>
        <circle cx="50" cy="50" r="10" fill="#c92a2a" opacity="0.6"/>
      </svg>`,
      feather: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 10 Q70 30 75 55 Q70 80 50 90 Q30 80 25 55 Q30 30 50 10Z" fill="#e0e0e0" opacity="0.6"/>
        <line x1="50" y1="15" x2="50" y2="90" stroke="#bbb" stroke-width="1.5"/>
        ${Array.from({length: 8}, (_, i) => {
          const y = 20 + i * 8;
          return `<line x1="50" y1="${y}" x2="${65 - i}" y2="${y + 4}" stroke="#ccc" stroke-width="1" opacity="0.5"/>
                  <line x1="50" y1="${y}" x2="${35 + i}" y2="${y + 4}" stroke="#ccc" stroke-width="1" opacity="0.5"/>`;
        }).join('')}
      </svg>`,
      key: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="40" r="18" fill="none" stroke="#d4a574" stroke-width="5" opacity="0.7"/>
        <rect x="45" y="37" width="45" height="6" fill="#d4a574" opacity="0.7"/>
        <rect x="75" y="43" width="5" height="12" fill="#d4a574" opacity="0.7"/>
        <rect x="85" y="43" width="5" height="15" fill="#d4a574" opacity="0.7"/>
      </svg>`,
      coffee: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M25 35 L30 80 Q35 90 50 90 Q65 90 70 80 L75 35 Z" fill="#8b4513" opacity="0.5"/>
        <ellipse cx="50" cy="35" rx="25" ry="8" fill="#d4a574" opacity="0.6"/>
        <path d="M75 45 Q90 48 85 65 Q80 75 72 70" stroke="#d4a574" stroke-width="4" fill="none" opacity="0.6"/>
        <path d="M40 15 Q42 20 40 25" stroke="#aaa" stroke-width="2" fill="none" opacity="0.5"/>
        <path d="M50 12 Q52 18 50 23" stroke="#aaa" stroke-width="2" fill="none" opacity="0.5"/>
        <path d="M60 15 Q58 20 60 25" stroke="#aaa" stroke-width="2" fill="none" opacity="0.5"/>
      </svg>`,
      candle: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect x="40" y="40" width="20" height="45" fill="#ffd93d" opacity="0.7" rx="2"/>
        <rect x="35" y="80" width="30" height="10" fill="#8b4513" opacity="0.6" rx="2"/>
        <path d="M50 15 Q55 22 50 30 Q45 22 50 15" fill="#ff6b6b" opacity="0.8"/>
        <path d="M50 20 Q53 24 50 28 Q47 24 50 20" fill="#ffd43b" opacity="0.9"/>
        <line x1="50" y1="30" x2="50" y2="40" stroke="#333" stroke-width="1.5"/>
      </svg>`,

      // 文字装饰类
      ampersand: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <text x="50" y="70" text-anchor="middle" font-size="60" font-family="Georgia, serif" fill="#c92a2a" opacity="0.6">&amp;</text>
      </svg>`,
      arrow: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 50 L75 50 M60 35 L75 50 L60 65" stroke="#8b4513" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
      </svg>`,
      ribbon: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 30 L30 10 L35 35 L30 60 L50 40 Z" fill="#ff6b9d" opacity="0.6"/>
        <path d="M50 30 L70 10 L65 35 L70 60 L50 40 Z" fill="#ff8fab" opacity="0.6"/>
        <ellipse cx="50" cy="30" rx="6" ry="8" fill="#ffd700" opacity="0.7"/>
      </svg>`
    };
    return stamps[type] || stamps.flower;
  },

  getStampTypes() {
    return [
      'flower', 'cherry_blossom', 'sunflower', 'tulip', 'leaf',
      'heart', 'sparkling_heart', 'star',
      'moon', 'cloud', 'rainbow', 'rain', 'snowflake', 'bird',
      'strawberry', 'apple', 'cherry',
      'envelope', 'feather', 'key', 'coffee', 'candle',
      'arrow', 'ribbon', 'ampersand'
    ];
  }
};