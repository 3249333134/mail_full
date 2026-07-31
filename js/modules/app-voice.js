/* ========================================
   App - Voice Recording
   ======================================== */

Object.assign(App, {
  toggleRecord() {
    const recordBtn = document.getElementById('record-btn');
    if (!recordBtn) return;

    if (this._isRecording) {
      this._stopRecording();
    } else {
      this._startRecording();
    }
  },

  async _startRecording() {
    if (!this._currentRecordLetterId) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this._mediaRecorder = new MediaRecorder(stream);
      this._recordChunks = [];
      this._recordStartTime = Date.now();
      this._isRecording = true;

      this._mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this._recordChunks.push(e.data);
        }
      };

      this._mediaRecorder.onstop = () => {
        const blob = new Blob(this._recordChunks, { type: 'audio/webm' });
        this._recordBlob = blob;
        this._recordDuration = Math.floor((Date.now() - this._recordStartTime) / 1000);
        this._isRecording = false;

        // 保存录音
        STORAGE.saveMedia(`record_${this._currentRecordLetterId}`, 'audio', blob);

        // 更新信件记录时长
        this._saveRecordDuration(this._currentRecordLetterId, this._recordDuration);

        // 更新UI
        const recordBtn = document.getElementById('record-btn');
        const recordPlayer = document.getElementById('record-player');
        const recordDuration = document.getElementById('record-duration');
        if (recordBtn) {
          recordBtn.textContent = '🎤 录音';
          recordBtn.classList.remove('recording');
        }
        if (recordPlayer) recordPlayer.style.display = 'flex';
        if (recordDuration) recordDuration.textContent = this._formatDuration(this._recordDuration);

        // 停止所有轨道
        stream.getTracks().forEach(track => track.stop());
      };

      this._mediaRecorder.start(100);

      // 更新UI
      const recordBtn = document.getElementById('record-btn');
      if (recordBtn) {
        recordBtn.textContent = '⏹ 停止';
        recordBtn.classList.add('recording');
      }

      // 计时器
      const recordDuration = document.getElementById('record-duration');
      this._recordTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this._recordStartTime) / 1000);
        if (recordDuration) recordDuration.textContent = this._formatDuration(elapsed);
      }, 1000);

    } catch (err) {
      console.error('录音失败:', err);
      alert('无法访问麦克风，请检查权限设置');
      this._isRecording = false;
    }
  },

  _stopRecording() {
    if (this._mediaRecorder && this._mediaRecorder.state !== 'inactive') {
      this._mediaRecorder.stop();
    }
    if (this._recordTimer) {
      clearInterval(this._recordTimer);
      this._recordTimer = null;
    }
  },

  async _saveRecordDuration(letterId, duration) {
    const letter = await STORAGE.loadLetter(letterId);
    if (letter) {
      letter.recordDuration = duration;
      const letters = STORAGE.loadLetters();
      const idx = letters.findIndex(l => l.id === letterId);
      if (idx !== -1) {
        letters[idx] = letter;
        localStorage.setItem(STORAGE.LETTERS_KEY, JSON.stringify(letters));
      }
    }
  },

  playRecord() {
    if (!this._recordBlob) return;

    const playBtn = document.getElementById('record-play-btn');
    const waveform = document.getElementById('record-waveform');

    if (this._recordAudio && !this._recordAudio.paused) {
      this._recordAudio.pause();
      this._restoreBgmVolume();
      this._recordAudio = null;
      if (playBtn) playBtn.textContent = '▶';
      if (playBtn) playBtn.classList.remove('playing');
      if (waveform) waveform.classList.remove('playing');
      return;
    }

    // 降低BGM音量
    this._lowerBgmVolume();

    const url = this._recordUrl || URL.createObjectURL(this._recordBlob);
    const audio = new Audio(url);
    audio.volume = 1.0;
    this._recordAudio = audio;

    audio.onerror = (e) => {
      console.error('[录音] 音频加载错误:', audio.error);
      this._recordAudio = null;
      this._restoreBgmVolume();
      if (playBtn) playBtn.textContent = '▶';
      if (playBtn) playBtn.classList.remove('playing');
      if (waveform) waveform.classList.remove('playing');
      if (!this._recordUrl) URL.revokeObjectURL(url);
      alert('音频格式不支持或文件损坏，请重新录音');
    };

    audio.onended = () => {
      this._recordAudio = null;
      this._restoreBgmVolume();
      if (playBtn) playBtn.textContent = '▶';
      if (playBtn) playBtn.classList.remove('playing');
      if (waveform) waveform.classList.remove('playing');
      if (!this._recordUrl) URL.revokeObjectURL(url);
    };

    audio.onpause = () => {
      this._restoreBgmVolume();
      if (playBtn) playBtn.textContent = '▶';
      if (playBtn) playBtn.classList.remove('playing');
      if (waveform) waveform.classList.remove('playing');
    };

    audio.play().then(() => {
      if (playBtn) playBtn.textContent = '⏸';
      if (playBtn) playBtn.classList.add('playing');
      if (waveform) waveform.classList.add('playing');
      console.log('[录音] 开始播放，URL:', url);
    }).catch((err) => {
      console.error('[录音] 播放失败:', err);
      this._recordAudio = null;
      this._restoreBgmVolume();
      if (playBtn) playBtn.textContent = '▶';
    });
  },

  _lowerBgmVolume() {
    if (this._mailboxBgmAudio && this._mailboxBgmPlaying) {
      this._originalBgmVolume = this._mailboxBgmAudio.volume;
      this._mailboxBgmAudio.volume = 0.15;
    }
  },

  _restoreBgmVolume() {
    if (this._mailboxBgmAudio) {
      this._mailboxBgmAudio.volume = this._originalBgmVolume || 0.4;
    }
  },

  rerecord() {
    if (!this._currentRecordLetterId) return;

    if (!confirm('确定要重新录音吗？')) return;

    // 停止当前播放的录音
    if (this._recordAudio) {
      this._recordAudio.pause();
      this._recordAudio = null;
    }

    // 删除旧录音
    STORAGE.deleteMedia(`record_${this._currentRecordLetterId}`);
    this._recordBlob = null;
    this._recordDuration = 0;

    const recordPlayer = document.getElementById('record-player');
    const recordDuration = document.getElementById('record-duration');
    const playBtn = document.getElementById('record-play-btn');
    const waveform = document.getElementById('record-waveform');
    if (recordPlayer) recordPlayer.style.display = 'none';
    if (recordDuration) recordDuration.textContent = '00:00';
    if (playBtn) {
      playBtn.textContent = '▶';
      playBtn.classList.remove('playing');
    }
    if (waveform) waveform.classList.remove('playing');

    // 清除信件中的录音时长
    this._saveRecordDuration(this._currentRecordLetterId, 0);

    // 开始新录音
    this._startRecording();
  },

  deleteRecord() {
    if (!this._currentRecordLetterId) return;

    if (!confirm('确定要删除这条录音吗？')) return;

    STORAGE.deleteMedia(`record_${this._currentRecordLetterId}`);

    // 清除信件中的录音时长
    this._saveRecordDuration(this._currentRecordLetterId, 0);

    this._recordBlob = null;
    this._recordDuration = 0;

    const recordPlayer = document.getElementById('record-player');
    const recordDuration = document.getElementById('record-duration');
    if (recordPlayer) recordPlayer.style.display = 'none';
    if (recordDuration) recordDuration.textContent = '00:00';

    if (this._recordAudio) {
      this._recordAudio.pause();
      this._recordAudio = null;
    }
  },

  /* ========================================
     信箱弹窗（新增/编辑）
     ======================================== */

  _mailboxFormData: {
    id: null,
    name: '',
    desc: '',
    icon: '📫',
    accent: '#8b4513',
    bgGradient: 'linear-gradient(135deg, #faf5f0, #f5efe5)'
  },

});
