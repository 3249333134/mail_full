/* ========================================
   信笺 — 多人同步管理器
   ======================================== */

const MultiplayerSync = {
  channel: null,
  channelName: '',
  currentUser: null,
  players: {},
  listeners: { join: [], leave: [], update: [], action: [], interact: [], chat: [] },
  _heartbeatInterval: null,
  _pollingInterval: null,
  _storageKey: '',
  _offlineTimeout: 5000,
  _removeTimeout: 8000,
  _useBroadcastChannel: true,
  _useWebSocket: false,
  _ws: null,
  _wsConnected: false,
  _wsReconnectAttempts: 0,
  _wsMaxReconnectAttempts: 10,
  _wsReconnectDelay: 1000,
  _wsUrl: '',
  _wsRoomId: '',
  _lastBroadcastTime: 0,
  _broadcastInterval: 50,
  _wsMessageQueue: [],
  _serverHost: '',
  _customServerUrl: '',
  _customRoomId: '',
  _useCustomRoom: false,

  init(mailboxId, currentUser) {
    if (!mailboxId || !currentUser) return;

    this.channelName = `xinjian_multiplayer_${mailboxId}`;
    this._storageKey = `xinjian_multiplayer_${mailboxId}`;
    this.currentUser = currentUser;
    this.players = {};

    // 房间号：支持自定义房间号，否则使用 mailboxId
    this._wsRoomId = this._useCustomRoom ? this._customRoomId : mailboxId;

    // 服务器地址：支持自定义，否则使用当前 hostname:3000
    this._serverHost = window.location.hostname;
    const savedServerUrl = localStorage.getItem('xinjian_ws_server_url');
    this._customServerUrl = this._customServerUrl || savedServerUrl || '';

    this._initWebSocket();

    this._useBroadcastChannel = typeof BroadcastChannel !== 'undefined' && !this._useWebSocket;

    if (this._useBroadcastChannel) {
      try {
        this.channel = new BroadcastChannel(this.channelName);
        this.channel.onmessage = (event) => this._handleMessage(event.data);
        this.channel.onmessageerror = () => {};
      } catch (e) {
        this._useBroadcastChannel = false;
        this.channel = null;
      }
    }

    this._loadFromStorage();

    if (!this._useWebSocket) {
      this._broadcastJoin();
    }

    this._startHeartbeat();

    if (!this._useBroadcastChannel && !this._useWebSocket) {
      this._startPolling();
    }

    this._storageHandler = (e) => this._onStorageChange(e);
    window.addEventListener('storage', this._storageHandler);
  },

  setServerUrl(url) {
    this._customServerUrl = url;
    if (url) {
      localStorage.setItem('xinjian_ws_server_url', url);
    } else {
      localStorage.removeItem('xinjian_ws_server_url');
    }
  },

  setRoomId(roomId) {
    this._customRoomId = roomId;
    this._useCustomRoom = !!roomId;
    if (roomId) {
      this._wsRoomId = roomId;
    }
  },

  getServerUrl() {
    return this._customServerUrl || '';
  },

  getRoomId() {
    return this._wsRoomId || '';
  },

  isConnected() {
    return this._wsConnected;
  },

  _initWebSocket() {
    // 支持自定义服务器地址
    if (this._customServerUrl) {
      this._wsUrl = this._customServerUrl;
    } else {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this._wsUrl = `${wsProtocol}//${this._serverHost}:3000`;
    }

    try {
      this._ws = new WebSocket(this._wsUrl);

      this._ws.onopen = () => {
        console.log('[MultiplayerSync] WebSocket 已连接');
        this._wsConnected = true;
        this._useWebSocket = true;
        this._wsReconnectAttempts = 0;
        this._wsMessageQueue = [];

        if (this.currentUser) {
          const gameMapRenderer = window.gameMapRenderer;
          const playerX = gameMapRenderer?.player?.x || 200;
          const playerY = gameMapRenderer?.player?.y || 200;

          this._wsSend({
            type: 'join',
            roomId: this._wsRoomId,
            userId: this.currentUser.id,
            characterId: this.currentUser.role || '',
            x: playerX,
            y: playerY,
            direction: 'down',
            action: 'personality',
            frame: 0,
            moving: false,
            timestamp: Date.now()
          });
        }
      };

      this._ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this._handleMessage(message);
        } catch (e) {
          console.error('[MultiplayerSync] WebSocket 消息解析失败:', e);
        }
      };

      this._ws.onclose = () => {
        console.log('[MultiplayerSync] WebSocket 已断开');
        this._wsConnected = false;
        this._useWebSocket = false;
        this._tryReconnect();
      };

      this._ws.onerror = (err) => {
        console.warn('[MultiplayerSync] WebSocket 错误:', err);
        this._wsConnected = false;
        this._useWebSocket = false;
      };
    } catch (e) {
      console.warn('[MultiplayerSync] WebSocket 初始化失败:', e);
      this._useWebSocket = false;
    }
  },

  _tryReconnect() {
    if (this._wsReconnectAttempts >= this._wsMaxReconnectAttempts) {
      console.log('[MultiplayerSync] WebSocket 重连次数已达上限，降级为本地同步');
      this._useBroadcastChannel = typeof BroadcastChannel !== 'undefined';
      if (this._useBroadcastChannel) {
        this.channel = new BroadcastChannel(this.channelName);
        this.channel.onmessage = (event) => this._handleMessage(event.data);
        this._broadcastJoin();
      } else {
        this._startPolling();
      }
      return;
    }

    this._wsReconnectAttempts++;
    const delay = this._wsReconnectDelay * Math.pow(2, this._wsReconnectAttempts - 1);
    console.log(`[MultiplayerSync] 尝试重连 (${this._wsReconnectAttempts}/${this._wsMaxReconnectAttempts})...`);

    setTimeout(() => {
      if (this.currentUser) {
        this._initWebSocket();
      }
    }, delay);
  },

  _wsSend(message) {
    if (this._wsConnected && this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify(message));
    } else {
      this._wsMessageQueue.push(message);
    }
  },

  destroy() {
    this._broadcastLeave();

    this._stopHeartbeat();
    this._stopPolling();

    if (this.channel) {
      try {
        this.channel.close();
      } catch (e) {}
      this.channel = null;
    }

    if (this._ws) {
      try {
        this._ws.close();
      } catch (e) {}
      this._ws = null;
      this._wsConnected = false;
    }

    if (this._storageHandler) {
      window.removeEventListener('storage', this._storageHandler);
      this._storageHandler = null;
    }

    this.players = {};
    this.currentUser = null;
    this.channelName = '';
    this._storageKey = '';
    this._wsMessageQueue = [];

    // 清空所有事件监听器，防止重复绑定
    this.listeners = { join: [], leave: [], update: [], action: [], interact: [], chat: [] };
  },

  broadcastState(state) {
    if (!this.currentUser) return;

    const now = Date.now();
    if (now - this._lastBroadcastTime < this._broadcastInterval) return;
    this._lastBroadcastTime = now;

    const message = {
      type: 'state',
      userId: this.currentUser.id,
      characterId: state.characterId || '',
      x: state.x || 0,
      y: state.y || 0,
      direction: state.direction || 'down',
      action: state.action || 'idle',
      frame: state.frame || 0,
      moving: state.moving || false,
      timestamp: Date.now()
    };

    this._sendMessage(message);
    this._updatePlayerState(message);
    this._saveToStorage();
  },

  broadcastAction(action) {
    if (!this.currentUser) return;

    const message = {
      type: 'action',
      userId: this.currentUser.id,
      action: action,
      timestamp: Date.now()
    };

    this._sendMessage(message);
  },

  broadcastChat(content) {
    if (!this.currentUser) return;

    const message = {
      type: 'chat',
      userId: this.currentUser.id,
      content: content,
      timestamp: Date.now()
    };

    this._sendMessage(message);
  },

  broadcastInteract(toUserId, actionType) {
    if (!this.currentUser) return;

    const message = {
      type: 'interact',
      fromUserId: this.currentUser.id,
      toUserId: toUserId,
      actionType: actionType,
      timestamp: Date.now()
    };

    this._sendMessage(message);
  },

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  },

  off(event, callback) {
    if (!this.listeners[event]) return;
    const idx = this.listeners[event].indexOf(callback);
    if (idx !== -1) {
      this.listeners[event].splice(idx, 1);
    }
  },

  getPlayers() {
    return { ...this.players };
  },

  getOnlinePlayers() {
    const result = {};
    for (const [userId, player] of Object.entries(this.players)) {
      if (player.isOnline) {
        result[userId] = player;
      }
    }
    return result;
  },

  _emit(event, data) {
    if (!this.listeners[event]) return;
    for (const callback of this.listeners[event]) {
      try {
        callback(data);
      } catch (e) {
        console.error('MultiplayerSync listener error:', e);
      }
    }
  },

  _sendMessage(message) {
    if (this._useWebSocket && this._wsConnected) {
      this._wsSend(message);
      return;
    }

    if (this._useBroadcastChannel && this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (e) {
        console.warn('BroadcastChannel send failed:', e);
      }
    }
  },

  _handleMessage(message) {
    if (!message || !message.type) return;

    if (message.type === 'room_state') {
      this._handleRoomState(message);
      return;
    }

    switch (message.type) {
      case 'join':
        this._handleJoin(message);
        break;
      case 'leave':
        this._handleLeave(message);
        break;
      case 'state':
        this._handleState(message);
        break;
      case 'action':
        this._handleAction(message);
        break;
      case 'interact':
        this._handleInteract(message);
        break;
      case 'chat':
        this._handleChat(message);
        break;
    }
  },

  _handleRoomState(message) {
    if (!message.players) return;

    for (const [userId, player] of Object.entries(message.players)) {
      if (userId === this.currentUser?.id) continue;
      this.players[userId] = { ...player, isOnline: true };
      this._emit('join', this.players[userId]);
      this._emit('update', this.players[userId]);
    }
  },

  _handleJoin(message) {
    if (message.userId === this.currentUser?.id) return;

    const player = {
      userId: message.userId,
      characterId: message.characterId || '',
      x: message.x || 0,
      y: message.y || 0,
      direction: 'down',
      action: 'personality',
      frame: 0,
      moving: false,
      lastUpdate: message.timestamp || Date.now(),
      isOnline: true
    };

    this.players[message.userId] = player;
    this._saveToStorage();
    this._emit('join', player);

    if (!this._useWebSocket) {
      this._broadcastStateSelf();
    }
  },

  _handleLeave(message) {
    if (message.userId === this.currentUser?.id) return;

    const player = this.players[message.userId];
    if (player) {
      delete this.players[message.userId];
      this._saveToStorage();
      this._emit('leave', { userId: message.userId });
    }
  },

  _handleState(message) {
    if (message.userId === this.currentUser?.id) return;

    this._updatePlayerState(message);
    this._saveToStorage();
    this._emit('update', this.players[message.userId]);
  },

  _handleAction(message) {
    if (message.userId === this.currentUser?.id) return;

    const player = this.players[message.userId];
    if (player) {
      player.action = message.action;
      player.lastUpdate = message.timestamp || Date.now();
      this._emit('action', {
        userId: message.userId,
        action: message.action,
        timestamp: message.timestamp
      });
    }
  },

  _handleInteract(message) {
    if (message.toUserId !== this.currentUser?.id) return;
    this._emit('interact', message);
  },

  _handleChat(message) {
    if (message.userId === this.currentUser?.id) return;
    this._emit('chat', message);
  },

  _updatePlayerState(message) {
    if (!message.userId) return;

    let player = this.players[message.userId];
    if (!player) {
      player = {
        userId: message.userId,
        characterId: message.characterId || '',
        x: 0,
        y: 0,
        direction: 'down',
        action: 'personality',
        frame: 0,
        moving: false,
        lastUpdate: 0,
        isOnline: true
      };
      this.players[message.userId] = player;
    }

    if (message.characterId !== undefined) player.characterId = message.characterId;
    if (message.x !== undefined) player.x = message.x;
    if (message.y !== undefined) player.y = message.y;
    if (message.direction !== undefined) player.direction = message.direction;
    if (message.action !== undefined) player.action = message.action;
    if (message.frame !== undefined) player.frame = message.frame;
    if (message.moving !== undefined) player.moving = message.moving;
    player.lastUpdate = message.timestamp || Date.now();
    player.isOnline = true;
  },

  _broadcastJoin() {
    if (!this.currentUser) return;

    const gameMapRenderer = window.gameMapRenderer;
    const playerX = gameMapRenderer?.player?.x || 200;
    const playerY = gameMapRenderer?.player?.y || 200;

    const message = {
      type: 'join',
      userId: this.currentUser.id,
      characterId: this.currentUser.role || '',
      x: playerX,
      y: playerY,
      moving: false,
      timestamp: Date.now()
    };

    this._sendMessage(message);

    this.players[this.currentUser.id] = {
      userId: this.currentUser.id,
      characterId: this.currentUser.role || '',
      x: playerX,
      y: playerY,
      direction: 'down',
      action: 'personality',
      frame: 0,
      moving: false,
      lastUpdate: Date.now(),
      isOnline: true
    };
  },

  _broadcastLeave() {
    if (!this.currentUser) return;

    const message = {
      type: 'leave',
      userId: this.currentUser.id,
      timestamp: Date.now()
    };

    this._sendMessage(message);
  },

  _broadcastStateSelf() {
    if (!this.currentUser) return;

    const gameMapRenderer = window.gameMapRenderer;
    if (!gameMapRenderer) return;

    const player = gameMapRenderer.player;
    const message = {
      type: 'state',
      userId: this.currentUser.id,
      characterId: this.currentUser.role || gameMapRenderer.selectedCharacter,
      x: player.x,
      y: player.y,
      direction: player.direction,
      action: player.action,
      frame: player.frame,
      moving: player.moving,
      timestamp: Date.now()
    };

    this._sendMessage(message);
    this._updatePlayerState(message);
    this._saveToStorage();
  },

  _saveToStorage() {
    if (!this._storageKey) return;

    try {
      const data = {
        players: this.players,
        updatedAt: Date.now()
      };
      localStorage.setItem(this._storageKey, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save multiplayer state to localStorage:', e);
    }
  },

  _loadFromStorage() {
    if (!this._storageKey) return;

    try {
      const data = localStorage.getItem(this._storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.players) {
          const now = Date.now();
          for (const [userId, player] of Object.entries(parsed.players)) {
            if (userId === this.currentUser?.id) continue;
            const timeDiff = now - (player.lastUpdate || 0);
            if (timeDiff < this._removeTimeout) {
              player.isOnline = timeDiff < this._offlineTimeout;
              this.players[userId] = player;
              this._emit('update', player);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load multiplayer state from localStorage:', e);
    }
  },

  _onStorageChange(event) {
    if (event.key !== this._storageKey) return;
    if (!event.newValue) return;

    try {
      const parsed = JSON.parse(event.newValue);
      if (parsed.players) {
        const now = Date.now();
        for (const [userId, player] of Object.entries(parsed.players)) {
          if (userId === this.currentUser?.id) continue;

          const existing = this.players[userId];
          const lastUpdate = player.lastUpdate || 0;
          const existingUpdate = existing?.lastUpdate || 0;

          if (lastUpdate > existingUpdate) {
            const timeDiff = now - lastUpdate;
            player.isOnline = timeDiff < this._offlineTimeout;

            if (!existing) {
              this.players[userId] = player;
              this._emit('join', player);
            } else {
              this.players[userId] = player;
              this._emit('update', player);
            }
          }
        }

        for (const userId of Object.keys(this.players)) {
          if (userId === this.currentUser?.id) continue;
          if (!parsed.players[userId]) {
            delete this.players[userId];
            this._emit('leave', { userId });
          }
        }
      }
    } catch (e) {}
  },

  _startHeartbeat() {
    this._stopHeartbeat();
    this._heartbeatInterval = setInterval(() => {
      this._checkHeartbeat();
    }, 2000);
  },

  _stopHeartbeat() {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = null;
    }
  },

  _checkHeartbeat() {
    const now = Date.now();
    let changed = false;

    for (const [userId, player] of Object.entries(this.players)) {
      if (userId === this.currentUser?.id) continue;

      const timeDiff = now - (player.lastUpdate || 0);

      if (player.isOnline && timeDiff >= this._offlineTimeout) {
        player.isOnline = false;
        changed = true;
        this._emit('update', player);
      }

      if (timeDiff >= this._removeTimeout) {
        delete this.players[userId];
        changed = true;
        this._emit('leave', { userId });
      }
    }

    if (this.currentUser && this.players[this.currentUser.id]) {
      this.players[this.currentUser.id].lastUpdate = now;
      changed = true;
    }

    if (changed) {
      this._saveToStorage();
    }
  },

  _startPolling() {
    this._stopPolling();
    this._pollingInterval = setInterval(() => {
      this._loadFromStorage();
    }, 2000);
  },

  _stopPolling() {
    if (this._pollingInterval) {
      clearInterval(this._pollingInterval);
      this._pollingInterval = null;
    }
  }
};
