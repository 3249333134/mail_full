/* Multiplayer synchronization for shared mailboxes and Xiejian. */
const MultiplayerSync = {
  currentUser: null,
  players: {},
  listeners: {},
  mode: 'default',
  selectedCharacterId: '',
  currentMapKey: '',
  accountKey: '',
  accountProfile: null,
  itemDefinitions: {},
  definitionsVersion: '',
  inventory: null,
  combatProfile: null,
  worldItems: [],
  occupiedCharacters: [],
  maxConnections: 11,
  _ws: null,
  _wsConnected: false,
  _wsUrl: '',
  _wsRoomId: '',
  _customServerUrl: '',
  _customRoomId: '',
  _useCustomRoom: false,
  _wsReconnectAttempts: 0,
  _wsMaxReconnectAttempts: 10,
  _wsReconnectDelay: 1000,
  _wsMessageQueue: [],
  _heartbeatInterval: null,
  _lastBroadcastTime: 0,
  _broadcastInterval: 50,
  _destroyed: false,

  init(mailboxId, currentUser, options = {}) {
    if (!mailboxId || !currentUser) return;

    this.currentUser = currentUser;
    this.accountKey = String(currentUser.username || currentUser.id || '').trim().toLocaleLowerCase('en-US');
    this.players = {};
    this.mode = options.mode === 'xiejian' ? 'xiejian' : 'default';
    this.selectedCharacterId = options.characterId || (this.mode === 'xiejian' ? '' : currentUser.role || '');
    this.currentMapKey = options.mapKey || '';
    this.occupiedCharacters = [];
    this.itemDefinitions = {};
    this.definitionsVersion = '';
    this.inventory = null;
    this.combatProfile = null;
    this.worldItems = [];
    this._wsRoomId = this._useCustomRoom ? this._customRoomId : mailboxId;
    this._destroyed = false;

    const savedServerUrl = localStorage.getItem('xinjian_ws_server_url');
    this._customServerUrl = this._customServerUrl || savedServerUrl || '';
    this._connectWebSocket();
    this._startHeartbeat();
  },

  setServerUrl(url) {
    this._customServerUrl = String(url || '').trim();
    if (this._customServerUrl) {
      localStorage.setItem('xinjian_ws_server_url', this._customServerUrl);
    } else {
      localStorage.removeItem('xinjian_ws_server_url');
    }
  },

  setRoomId(roomId) {
    this._customRoomId = String(roomId || '').trim();
    this._useCustomRoom = Boolean(this._customRoomId);
    if (this._customRoomId) this._wsRoomId = this._customRoomId;
  },

  getServerUrl() {
    return this._customServerUrl;
  },

  getRoomId() {
    return this._wsRoomId;
  },

  isConnected() {
    return this._wsConnected;
  },

  getOccupiedCharacters() {
    return [...this.occupiedCharacters];
  },

  _connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this._wsUrl = this._customServerUrl || `${protocol}//${window.location.hostname}:3000`;

    try {
      this._ws = new WebSocket(this._wsUrl);
      this._ws.onopen = () => {
        this._wsConnected = true;
        this._wsReconnectAttempts = 0;
        this._emit('connected', { serverUrl: this._wsUrl });
        this._sendJoin();
        this._flushQueue();
      };

      this._ws.onmessage = (event) => {
        try {
          this._handleMessage(JSON.parse(event.data));
        } catch (error) {
          console.error('[MultiplayerSync] Invalid message:', error);
        }
      };

      this._ws.onclose = () => {
        const wasConnected = this._wsConnected;
        this._wsConnected = false;
        if (wasConnected) this._emit('disconnected', {});
        if (!this._destroyed) this._tryReconnect();
      };

      this._ws.onerror = () => {
        this._wsConnected = false;
      };
    } catch (error) {
      console.warn('[MultiplayerSync] Connection failed:', error);
      this._tryReconnect();
    }
  },

  _tryReconnect() {
    if (this._destroyed || this._wsReconnectAttempts >= this._wsMaxReconnectAttempts) return;
    const delay = Math.min(this._wsReconnectDelay * Math.pow(1.5, this._wsReconnectAttempts), 10000);
    this._wsReconnectAttempts += 1;
    setTimeout(() => {
      if (!this._destroyed) this._connectWebSocket();
    }, delay);
  },

  _sendJoin() {
    const renderer = window.gameMapRenderer;
    this._wsSend({
      type: 'join',
      roomId: this._wsRoomId,
      userId: this.accountKey,
      accountKey: this.accountKey,
      username: this.currentUser.username || this.accountKey,
      displayName: this.currentUser.displayName || this.currentUser.username || this.accountKey,
      role: this.currentUser.role || 'user',
      mode: this.mode,
      characterId: this.selectedCharacterId,
      mapKey: this.currentMapKey,
      x: renderer?.player?.x || 200,
      y: renderer?.player?.y || 200,
      direction: renderer?.player?.direction || 'down',
      action: renderer?.player?.action || 'personality',
      frame: renderer?.player?.frame || 0,
      moving: false,
      timestamp: Date.now()
    });
  },

  _wsSend(message) {
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify(message));
      return true;
    }
    if (message.type !== 'state') this._wsMessageQueue.push(message);
    return false;
  },

  _flushQueue() {
    const queued = this._wsMessageQueue.splice(0);
    for (const message of queued) this._wsSend(message);
  },

  requestCharacter(characterId) {
    if (!characterId) return;
    this._wsSend({
      type: 'select_character',
      characterId,
      timestamp: Date.now()
    });
  },

  changeMap(mapKey, position = {}) {
    this.currentMapKey = mapKey || '';
    this._wsSend({
      type: 'map_change',
      mapKey: this.currentMapKey,
      x: Number(position.x) || 0,
      y: Number(position.y) || 0,
      timestamp: Date.now()
    });
  },

  broadcastState(state) {
    if (!this.currentUser || !this._wsConnected || !this.selectedCharacterId) return;
    const now = Date.now();
    if (now - this._lastBroadcastTime < this._broadcastInterval) return;
    this._lastBroadcastTime = now;

    this._wsSend({
      type: 'state',
      userId: this.accountKey,
      characterId: this.selectedCharacterId,
      mapKey: this.currentMapKey,
      x: Number(state.x) || 0,
      y: Number(state.y) || 0,
      direction: state.direction || 'down',
      action: state.action || 'personality',
      frame: Number(state.frame) || 0,
      moving: Boolean(state.moving),
      timestamp: now
    });
  },

  broadcastAction(action) {
    if (!this.currentUser || !this.selectedCharacterId) return;
    this._wsSend({ type: 'action', action, timestamp: Date.now() });
  },

  broadcastInteract(toUserId, actionType) {
    if (!this.currentUser || !toUserId) return;
    this._wsSend({
      type: 'interact',
      toUserId,
      actionType,
      timestamp: Date.now()
    });
  },

  broadcastChat(content, messageId) {
    if (!this.currentUser || !String(content || '').trim()) return;
    
    // Get display name and character info
    const currentUser = this.currentUser;
    const displayName = currentUser.displayName || currentUser.username || this.accountKey || '';
    const characterId = this.selectedCharacterId || '';
    let characterName = '';
    
    // Try to get character name from gameMapRenderer
    if (typeof window !== 'undefined' && window.gameMapRenderer?.getCharacterInfo) {
      const charInfo = window.gameMapRenderer.getCharacterInfo(characterId);
      if (charInfo) {
        characterName = charInfo.name || '';
      }
    }
    
    // Create sender name with character info
    const senderName = characterName 
      ? `${displayName}（${characterName}）`
      : displayName;
    
    // Add accountKey and messageId to help server identify the sender and for deduplication
    this._wsSend({
      type: 'chat',
      accountKey: this.accountKey,
      messageId: messageId || '',
      content: String(content).trim(),
      senderName: senderName,
      characterId: characterId,
      timestamp: Date.now()
    });
  },

  pickupItem(instanceId) {
    return this._wsSend({ type: 'item_pickup', instanceId, timestamp: Date.now() });
  },

  dropItem(instanceId) {
    return this._wsSend({ type: 'item_drop', instanceId, timestamp: Date.now() });
  },

  giftItem(instanceId, toAccountKey) {
    return this._wsSend({ type: 'item_gift', instanceId, toAccountKey, timestamp: Date.now() });
  },

  equipItem(instanceId) {
    return this._wsSend({ type: 'item_equip', instanceId, timestamp: Date.now() });
  },

  useItem(instanceId) {
    return this._wsSend({ type: 'item_use', instanceId, timestamp: Date.now() });
  },

  assignQuickSlot(instanceId, slotIndex) {
    return this._wsSend({ type: 'item_quick_assign', instanceId, slotIndex, timestamp: Date.now() });
  },

  attack(targetAccountKey) {
    return this._wsSend({ type: 'combat_attack', targetAccountKey, timestamp: Date.now() });
  },

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  },

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(item => item !== callback);
  },

  getPlayers() {
    return { ...this.players };
  },

  getOnlinePlayers() {
    const online = {};
    for (const [userId, player] of Object.entries(this.players)) {
      if (player.isOnline) online[userId] = player;
    }
    return online;
  },

  _emit(event, data) {
    for (const callback of this.listeners[event] || []) {
      try {
        callback(data);
      } catch (error) {
        console.error(`[MultiplayerSync] ${event} listener failed:`, error);
      }
    }
  },

  _handleMessage(message) {
    if (!message || !message.type) return;

    if (message.type === 'room_state') {
      this.maxConnections = message.maxConnections || 11;
      this._setOccupancy(message.occupiedCharacters || []);
      this.accountProfile = message.accountProfile || null;
      this.itemDefinitions = message.itemDefinitions || {};
      this.definitionsVersion = message.definitionsVersion || '';
      this.inventory = message.inventory || null;
      this.combatProfile = message.combatProfile || message.inventory?.combat || null;
      this.worldItems = message.worldItems || [];
      if (this.accountProfile?.xiejianCharacterId) {
        this.selectedCharacterId = this.accountProfile.xiejianCharacterId;
      }
      if (this.accountProfile?.lastXiejianMapKey) {
        this.currentMapKey = this.accountProfile.lastXiejianMapKey;
      }
      this.players = {};
      for (const [userId, player] of Object.entries(message.players || {})) {
        if (userId === this.accountKey) continue;
        this.players[userId] = { ...player, isOnline: true };
        this._emit('join', this.players[userId]);
        this._emit('update', this.players[userId]);
      }
      this._emit('roomState', message);
      this._emit('accountProfile', this.accountProfile || {});
      this._emit('inventory', this.inventory || {});
      this._emit('worldItems', { mapKey: this.currentMapKey, items: this.worldItems });
      return;
    }

    if (message.type === 'session_replaced') {
      this._destroyed = true;
      this._emit('sessionReplaced', message);
      if (this._ws) this._ws.close();
      return;
    }

    if (message.type === 'join_rejected') {
      this._emit('joinRejected', message);
      if (this._ws) this._ws.close();
      return;
    }

    if (message.type === 'character_occupancy') {
      this._setOccupancy(message.occupiedCharacters || []);
      return;
    }

    if (message.type === 'character_selected') {
      this.selectedCharacterId = message.characterId;
      this.currentMapKey = message.mapKey || this.currentMapKey || 'xj-jingyuan';
      this.accountProfile = {
        ...(this.accountProfile || {}),
        xiejianCharacterId: message.characterId,
        lastXiejianMapKey: this.currentMapKey
      };
      this._setOccupancy(message.occupiedCharacters || []);
      this._emit('characterSelected', message);
      return;
    }

    if (message.type === 'character_rejected') {
      this._emit('characterRejected', message);
      return;
    }

    if (message.type === 'join' || message.type === 'player_ready') {
      if (message.userId === this.accountKey) return;
      const existed = Boolean(this.players[message.userId]);
      this.players[message.userId] = {
        ...(this.players[message.userId] || {}),
        ...message,
        isOnline: true
      };
      if (!existed) this._emit('join', this.players[message.userId]);
      this._emit('update', this.players[message.userId]);
      return;
    }

    if (message.type === 'leave') {
      delete this.players[message.userId];
      this._emit('leave', message);
      return;
    }

    if (message.type === 'state' || message.type === 'map_change') {
      if (message.userId === this.accountKey) return;
      const existed = Boolean(this.players[message.userId]);
      this.players[message.userId] = {
        ...(this.players[message.userId] || { userId: message.userId }),
        ...message,
        isOnline: true,
        lastUpdate: message.timestamp || Date.now()
      };
      if (!existed) this._emit('join', this.players[message.userId]);
      this._emit(message.type === 'map_change' ? 'mapChange' : 'update', this.players[message.userId]);
      return;
    }

    if (message.type === 'action') {
      const player = this.players[message.userId];
      if (player) player.action = message.action;
      this._emit('action', message);
      return;
    }

    if (message.type === 'interact') {
      if (message.toUserId === this.accountKey) this._emit('interact', message);
      return;
    }

    if (message.type === 'interact_rejected') {
      this._emit('interactRejected', message);
      return;
    }

    if (message.type === 'chat') {
      // Strictly filter out messages from self using both userId and accountKey
      // This prevents any case where our own message gets treated as remote
      if (message.userId !== this.accountKey && message.accountKey !== this.accountKey) {
        this._emit('chat', message);
      }
      return;
    }

    if (message.type === 'inventory_state') {
      this.inventory = message.inventory || null;
      this.combatProfile = message.inventory?.combat || this.combatProfile;
      this._emit('inventory', this.inventory || {});
      return;
    }

    if (message.type === 'world_items') {
      this.worldItems = message.items || [];
      this._emit('worldItems', message);
      return;
    }

    if (message.type === 'world_item_spawned') {
      const instance = message.instance;
      if (instance && !this.worldItems.some(item => item.instanceId === instance.instanceId)) {
        this.worldItems.push(instance);
      }
      this._emit('worldItemSpawned', message);
      return;
    }

    if (message.type === 'world_item_removed') {
      this.worldItems = this.worldItems.filter(item => item.instanceId !== message.instanceId);
      this._emit('worldItemRemoved', message);
      return;
    }

    if (message.type === 'world_item_inspected') {
      this._emit('worldItemInspected', message);
      return;
    }

    if (message.type === 'item_action_rejected' || message.type === 'item_action_success') {
      this._emit(message.type === 'item_action_rejected' ? 'itemRejected' : 'itemSuccess', message);
      return;
    }

    if (message.type === 'combat_state') {
      if (message.userId === this.accountKey) this.combatProfile = message.combat;
      const player = this.players[message.userId];
      if (player) player.combat = message.combat;
      this._emit('combatState', message);
      return;
    }

    if (message.type === 'combat_hit') {
      if (message.targetAccountKey === this.accountKey) this.combatProfile = message.targetCombat;
      if (message.attackerAccountKey === this.accountKey && message.attackerCombat) {
        this.combatProfile = message.attackerCombat;
      }
      const target = this.players[message.targetAccountKey];
      if (target) target.combat = message.targetCombat;
      this._emit('combatHit', message);
      return;
    }

    if (message.type === 'player_defeated') {
      this._emit('playerDefeated', message);
    }
  },

  _setOccupancy(occupiedCharacters) {
    this.occupiedCharacters = [...new Set(occupiedCharacters)];
    this._emit('occupancy', {
      occupiedCharacters: this.getOccupiedCharacters()
    });
  },

  _startHeartbeat() {
    this._stopHeartbeat();
    this._heartbeatInterval = setInterval(() => {
      if (this._wsConnected) this._wsSend({ type: 'ping', timestamp: Date.now() });
    }, 4000);
  },

  _stopHeartbeat() {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = null;
    }
  },

  destroy() {
    this._destroyed = true;
    this._stopHeartbeat();
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._wsSend({ type: 'leave', timestamp: Date.now() });
      this._ws.close();
    }
    this._ws = null;
    this._wsConnected = false;
    this._wsMessageQueue = [];
    this.players = {};
    this.occupiedCharacters = [];
    this.selectedCharacterId = '';
    this.currentMapKey = '';
    this.accountKey = '';
    this.accountProfile = null;
    this.itemDefinitions = {};
    this.inventory = null;
    this.combatProfile = null;
    this.worldItems = [];
    this.listeners = {};
  }
};
