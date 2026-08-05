// packageGen.js — 压缩包自动解析 + 角色/地图定义生成器（支持 AI 智能分析）
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');
const https = require('https');

let HttpsProxyAgent;
try { HttpsProxyAgent = require('https-proxy-agent').HttpsProxyAgent; } catch (_) {}

// ─── 配置 ───
const AGNES_API_BASE = 'https://apihub.agnes-ai.com/v1';
const AGNES_MODEL = 'agnes-2.5-flash';

// ─── 动作关键词映射规则（本地回退）───
const ACTION_KEYWORDS = [
  { key: 'personality', pattern: /站立|静息|闲|待机|休憩|idle|stand/i },
  { key: 'run',         pattern: /跑|冲刺|疾行|奔跑|疾走|run/i },
  { key: 'etiquette',   pattern: /敬礼|挥手|致意|鞠躬|行礼|etiquette|greet|bow/i },
  { key: 'martial',     pattern: /瞄准|持枪|拔枪|防御|踢|拳|格斗|射击|警棍|电击|侧踢|破门|翻滚|蹲伏|隐蔽|追捕|martial|attack|fight|combat|kick|punch/i },
  { key: 'signature',   pattern: /画|速写|调制|作画|标识|制[作调]|写|绘|书法|弹奏|signature|draw|paint|sketch/i },
];

const ACTION_LABELS = {
  personality: '静息', run: '奔跑', etiquette: '礼仪', martial: '武术', signature: '招牌',
};

const STANDARD_INTERVALS = {
  personality: 3000, run: 105, etiquette: 220, martial: 110, signature: 180,
};

const STANDARD_LOOPS = {
  personality: true, run: true, etiquette: false, martial: false, signature: false,
};

// ─── 工具函数 ───

function createTempDir() {
  const dir = path.join(os.tmpdir(), `pkg-upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function removeDir(dir) {
  try { if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

function safeFileName(name) {
  return name.replace(/[/\\:*?"<>|]/g, '_').trim();
}

function snakeToKebab(str) {
  return str.replace(/_/g, '-');
}

function randomHexColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 65%, 50%)`;
}

/** 递归扫描目录，返回相对路径列表 */
function scanDirectory(dir, baseDir = dir, result = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      scanDirectory(fullPath, baseDir, result);
    } else {
      result.push(relPath);
    }
  }
  return result;
}

/** 递归查找所有 manifest.json */
function findAllManifests(dir, baseDir = dir, result = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findAllManifests(fullPath, baseDir, result);
    } else if (entry.name.toLowerCase() === 'manifest.json') {
      try {
        let raw = fs.readFileSync(fullPath, 'utf8');
        if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1); // 去除 UTF-8 BOM
        const content = JSON.parse(raw);
        result.push({ path: path.relative(baseDir, fullPath).replace(/\\/g, '/'), content });
      } catch (_) {}
    }
  }
  return result;
}

// ─── Zip 解压 ───

function extractZip(zipPath, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  const isWin = process.platform === 'win32';

  if (isWin) {
    // Windows: 直接使用 PowerShell Expand-Archive
    const psCmd = `Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${targetDir.replace(/'/g, "''")}' -Force`;
    try {
      execSync(`powershell -NoProfile -Command "${psCmd}"`, { stdio: ['pipe', 'pipe', 'pipe'], timeout: 120000 });
      console.log('[extractZip] PowerShell Expand-Archive success');
    } catch (e) {
      console.error('[extractZip] PowerShell failed:', e.message);
      throw new Error(`解压失败 (PowerShell): ${e.message}`);
    }
  } else {
    // Linux/macOS: 使用 unzip
    try {
      execSync(`unzip -o "${zipPath}" -d "${targetDir}"`, { stdio: ['pipe', 'pipe', 'pipe'], timeout: 120000 });
      console.log('[extractZip] unzip success');
    } catch (e) {
      console.error('[extractZip] unzip failed:', e.message);
      throw new Error(`解压失败 (unzip): ${e.message}`);
    }
  }
}

// ─── Agnes AI 分析 ───

function callAgnesAI(apiKey, messages, maxTokens = 2048, retryWithoutProxy = true) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ model: AGNES_MODEL, messages, max_tokens: maxTokens, temperature: 0.2 });
    const requestOptions = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: 120000, // 2-minute timeout for AI
    };

    // 代理支持：读取环境变量 + 已知本地代理地址
    let proxyUrl = process.env.https_proxy || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.HTTP_PROXY;
    // 如果读取不到环境变量，尝试默认本地代理（常见于公司网络）
    if (!proxyUrl) {
      const fallbackProxies = ['http://127.0.0.1:7890', 'http://127.0.0.1:10809', 'http://127.0.0.1:1080'];
      proxyUrl = fallbackProxies[0]; // 默认使用 7890（Clash/V2Ray 常见端口）
    }

    if (proxyUrl && HttpsProxyAgent) {
      requestOptions.agent = new HttpsProxyAgent(proxyUrl);
      console.log('[AI] using proxy:', proxyUrl);
    }

    const doRequest = () => {
      const req = https.request(`${AGNES_API_BASE}/chat/completions`, requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.error) return reject(new Error(json.error.message || 'AI API error'));
            resolve(json.choices?.[0]?.message?.content || '');
          } catch (e) { reject(new Error('AI 响应解析失败: ' + e.message)); }
        });
      });

      req.on('error', (e) => {
        if (retryWithoutProxy && requestOptions.agent) {
          console.log('[AI] proxy failed, retrying without proxy...');
          delete requestOptions.agent;
          doRequest();
        } else {
          reject(e);
        }
      });
      req.on('timeout', () => { req.destroy(); reject(new Error('AI 请求超时')); });
      req.write(payload);
      req.end();
    };

    doRequest();
  });
}

/**
 * 使用 Agnes AI 智能分析文件树
 * @returns {object} AI 分析结果
 */
async function analyzeWithAI(fileTree, manifests, apiKey) {
  if (!apiKey) return null;

  const manifestTexts = manifests.map(m => `--- ${m.path} ---\n${JSON.stringify(m.content, null, 2)}`).join('\n\n');

  const systemPrompt = `你是一个游戏资源包智能分析专家。请分析压缩包内容，判断是角色包还是地图包，提取角色信息和动作映射。
必须返回严格有效的 JSON，不要包含任何 markdown 代码块标记或其他说明文字。`;

  const userPrompt = `分析以下游戏资源包的文件结构：

【文件列表】（共 ${fileTree.length} 个文件）：
${fileTree.slice(0, 200).join('\n')}
${fileTree.length > 200 ? `\n... 还有 ${fileTree.length - 200} 个文件未列出` : ''}

【找到的 manifest.json】：
${manifestTexts || '(无)'}

请返回以下严格 JSON 格式：
{
  "packageType": "character" | "map" | "mixed" | "unknown",
  "confidence": 0.0-1.0,
  "characters": [
    {
      "id": "唯一标识符（英文小写，用-连接）",
      "name": "角色中文名",
      "dirName": "资源目录名",
      "actions": [
        {"dirName": "动作目录名", "mappedType": "personality|run|etiquette|martial|signature|custom", "frameCount": 4, "frameInterval": 260}
      ],
      "portraitPath": "头像/立绘文件相对路径（如有）",
      "baseSpritePath": "基础精灵图路径（如有）",
      "notes": "分析备注"
    }
  ],
  "maps": [
    {
      "key": "地图标识",
      "name": "地图中文名",
      "bgPath": "背景图路径",
      "thumbnailPath": "缩略图路径",
      "worldScale": 2,
      "worldSize": {"width": 1200, "height": 900},
      "notes": "分析备注"
    }
  ],
  "resourcePaths": {
    "framesRoot": "帧动画根目录",
    "portraitsDir": "头像目录",
    "mapsDir": "地图目录"
  },
  "warnings": ["可能的警告或建议"]
}`;

  try {
    const content = await callAgnesAI(apiKey, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], 4096);

    // 尝试从 AI 响应中提取 JSON
    let jsonStr = content.trim();
    // 去掉 markdown 代码块
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();
    // 找 JSON 对象
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    const result = JSON.parse(jsonStr);
    return result;
  } catch (e) {
    console.error('[AI分析] 失败:', e.message);
    return null;
  }
}

// ─── 本地智能解析 ───

// ─── 辅助：处理单个角色目录 ───
function processCharacterDir(charRoot, charDirName, tempDir, fileTree, warnings) {
  const actionDirs = new Set(['personality', 'run', 'etiquette', 'martial', 'signature', 'idle', 'walk', 'stand']);

  // 判断是「角色包裹目录」（内有 frames* 子目录）还是「帧目录本身」
  const subEntries = fs.readdirSync(charRoot, { withFileTypes: true });
  const subDirs = subEntries.filter(e => e.isDirectory());

  const isFramesDir = subDirs.some(e => actionDirs.has(e.name.toLowerCase()));
  const hasFramesSubdirs = subDirs.some(e => e.name.toLowerCase().startsWith('frames'));

  // 确定 frame 版本列表和 frameRoot 前缀
  let frameVersions = [];
  let baseDirName = charDirName; // fileTree 中的前缀

  if (hasFramesSubdirs) {
    // 角色包裹目录：charDirName/frames-xxx/
    frameVersions = subDirs
      .filter(e => e.name.toLowerCase().startsWith('frames'))
      .map(e => e.name)
      .sort((a, b) => {
        const aHas = fileTree.some(f => f.startsWith(`${charDirName}/${a}/personality/`));
        const bHas = fileTree.some(f => f.startsWith(`${charDirName}/${b}/personality/`));
        return bHas - aHas;
      });
  } else if (isFramesDir) {
    // 帧目录本身：charDirName/ 就是帧目录（如 frames-chibi20-approved/personality/...）
    frameVersions = [charDirName]; // 这一个目录就是帧版本
    // 需要把 charDirName 的父级作为 fileTree 前缀
    // 但 charDirName 可能是 ''（根目录），需要处理
    if (!charDirName) {
      // 根目录就是帧目录
      frameVersions = ['']; // 扫描根目录下的动作子目录
      baseDirName = '';
    }
  }

  if (frameVersions.length === 0) {
    // 检查是否有精灵图文件（非帧动画角色）
    const prefix = baseDirName ? baseDirName + '/' : '';
    const hasSprites = fileTree.some(f => f.startsWith(prefix) && /spritesheet|sprite/i.test(f));
    if (!hasSprites) {
      warnings.push(`[${charDirName || 'root'}] 未找到 frames 目录或精灵图`);
      return null;
    }
    frameVersions.push('');
  }

  // 选择最佳 frame 版本
  const bestFrameVersion = frameVersions[0] || '';
  const bestFrameRoot = bestFrameVersion
    ? (baseDirName ? `${baseDirName}/${bestFrameVersion}` : bestFrameVersion)
    : baseDirName;

  // 扫描动作
  const actions = [];
  const seenActions = new Set();
  const actionPaths = fileTree.filter(f => f.startsWith(bestFrameRoot + '/'));

  for (const f of actionPaths) {
    const rel = f.substring(bestFrameRoot.length + 1);
    const actionName = rel.split('/')[0];
    if (!actionName || seenActions.has(actionName)) continue;
    seenActions.add(actionName);

    const frameFiles = actionPaths.filter(p =>
      p.startsWith(`${bestFrameRoot}/${actionName}/`) && /\.(png|jpg|webp)$/i.test(p)
    );
    const frameCount = frameFiles.length;
    if (frameCount === 0) continue;

    let mappedType = mapActionName(actionName);

    actions.push({
      dirName: actionName,
      mappedType,
      frameCount,
      frameInterval: STANDARD_INTERVALS[mappedType] || 260,
    });
  }

  if (actions.length === 0) {
    warnings.push(`[${charDirName || 'root'}] 未找到任何动作帧文件`);
    return null;
  }

  // 找头像（从 baseDirName 前缀下搜索）
  let portraitPath = null;
  const searchPrefix = baseDirName ? baseDirName + '/' : '';
  const portraitCandidates = fileTree.filter(f =>
    f.startsWith(searchPrefix) && /(contact|portrait|avatar|face|head)/i.test(f) && /\.(png|jpg|webp)$/i.test(f)
  );
  if (portraitCandidates.length > 0) portraitPath = portraitCandidates[0];

  // 找基础精灵图
  let baseSpritePath = null;
  const spriteCandidates = fileTree.filter(f =>
    f.startsWith(searchPrefix) && /spritesheet.*transparent/i.test(f) && !/chroma/i.test(f)
  );
  if (spriteCandidates.length > 0) baseSpritePath = spriteCandidates[0];

  // 推断角色名
  let charName = baseDirName || 'character';
  for (const fv of frameVersions) {
    if (!fv) continue;
    const manifestPath = path.join(tempDir, baseDirName, fv, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        let raw = fs.readFileSync(manifestPath, 'utf8');
        if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
        const m = JSON.parse(raw);
        if (m.characterName) { charName = m.characterName; break; }
        if (m.name) { charName = m.name; break; }
      } catch (_) {}
    }
  }
  // 清理编号前缀
  charName = charName.replace(/^character[-_]?\d+[-_]?/i, '').replace(/[-_]/g, '');
  if (!charName) charName = baseDirName || 'character';

  return {
    id: snakeToKebab(baseDirName || 'character').toLowerCase(),
    name: charName,
    dirName: baseDirName || 'character',
    actions,
    portraitPath,
    baseSpritePath,
    frameRoot: bestFrameRoot,
    notes: `从目录结构推断，找到 ${actions.length} 个动作（版本: ${bestFrameVersion || 'default'}）`,
  };
}

/** 从目录结构推断角色信息 */
function inferCharactersFromTree(fileTree, tempDir, worldCategory) {
  const characters = [];
  const warnings = [];
  const actionDirs = new Set(['personality', 'run', 'etiquette', 'martial', 'signature', 'idle', 'walk', 'stand']);

  // 获取顶层条目
  const topEntries = fs.readdirSync(tempDir, { withFileTypes: true });
  const topDirs = topEntries.filter(e => e.isDirectory()).map(e => e.name);

  if (topDirs.length === 0) {
    // 所有文件在根目录，把根目录当作角色
    const result = processCharacterDir(tempDir, '', tempDir, fileTree, warnings);
    if (result) characters.push(result);
    return { characters, warnings };
  }

  // 检测"扁平帧目录"模式：顶层目录大部分是帧目录（含有 action 子目录）或有精灵图文件
  let flatFramesCount = 0;
  for (const d of topDirs) {
    try {
      const subs = fs.readdirSync(path.join(tempDir, d), { withFileTypes: true });
      if (subs.some(e => e.isDirectory() && actionDirs.has(e.name.toLowerCase()))) {
        flatFramesCount++;
      }
    } catch (_) {}
  }
  const hasRootSprites = topEntries.some(e => !e.isDirectory() && /spritesheet|sprite/i.test(e.name));

  if (flatFramesCount > 0 && (flatFramesCount >= topDirs.length * 0.5 || hasRootSprites)) {
    // 扁平结构：根目录就是角色，topDirs 里 frames* 的作为帧版本
    const result = processCharacterDir(tempDir, '', tempDir, fileTree, warnings);
    if (result) characters.push(result);
    return { characters, warnings };
  }

  // 传统模式：每个顶层目录可能是一个角色包裹
  for (const topDir of topDirs) {
    const charRoot = path.join(tempDir, topDir);
    const result = processCharacterDir(charRoot, topDir, tempDir, fileTree, warnings);
    if (result) characters.push(result);
  }

  return { characters, warnings };
}

/** 从目录结构推断地图信息 */
function inferMapsFromTree(fileTree, worldCategory) {
  const maps = [];
  const warnings = [];

  // 找地图背景图
  const bgPatterns = [/map.*\.(png|jpg|webp)$/i, /bg.*\.(png|jpg|webp)$/i, /world.*\.(png|jpg|webp)$/i];
  const bgFiles = fileTree.filter(f => bgPatterns.some(p => p.test(f)));

  for (const bgPath of bgFiles) {
    const dirName = path.dirname(bgPath).split('/')[0];
    const key = snakeToKebab(dirName).toLowerCase();
    const name = dirName.replace(/[-_]/g, '');

    maps.push({
      key,
      name: name || key,
      bgPath,
      thumbnailPath: bgPath,
      worldScale: 2,
      worldSize: { width: 1200, height: 900 },
      notes: '从背景图推断',
    });
  }

  return { maps, warnings };
}

// ─── 动作映射工具 ───

function mapActionName(actionName) {
  const lower = actionName.toLowerCase();
  if (['personality', 'run', 'etiquette', 'martial', 'signature'].includes(lower)) return lower;
  if (lower === 'idle' || lower === 'stand') return 'personality';
  if (lower === 'walk') return 'run';
  for (const rule of ACTION_KEYWORDS) {
    if (rule.pattern.test(actionName)) return rule.key;
  }
  return 'custom';
}

// ─── 角色定义生成 ───

function buildCharacterDefinition(charInfo, worldCategory, assetRoot, metadata = {}) {
  const prefix = worldCategory === 'poxiao' ? 'px-' : 'xj-';
  const defId = prefix + charInfo.id;
  const martial = parseInt(metadata.martial) || 5;
  const sect = metadata.sect || '未设定';

  const actions = {};
  const customActions = {};

  for (const act of (charInfo.actions || [])) {
    const mappedType = act.mappedType || mapActionName(act.dirName);
    const actionDef = {
      label: ACTION_LABELS[mappedType] || act.dirName,
      frameDir: act.dirName,
      frameCount: act.frameCount || 1,
      frameInterval: act.frameInterval || STANDARD_INTERVALS[mappedType] || 300,
      loop: STANDARD_LOOPS[mappedType] !== undefined ? STANDARD_LOOPS[mappedType] : false,
    };

    if (['personality', 'run', 'etiquette', 'martial', 'signature'].includes(mappedType)) {
      actions[mappedType] = actionDef;
    } else {
      customActions[`custom_${act.dirName}`] = actionDef;
    }
  }

  const allActions = { ...actions, ...customActions };

  const frameRoot = charInfo.frameRoot
    ? `${assetRoot}/${charInfo.frameRoot}`
    : `${assetRoot}/characters/actions/${charInfo.dirName}`;

  const portraitPath = charInfo.portraitPath
    ? `${assetRoot}/${charInfo.portraitPath}`
    : `${assetRoot}/characters/portraits/${charInfo.dirName}.png`;

  const baseStandPath = charInfo.baseSpritePath
    ? `${assetRoot}/${charInfo.baseSpritePath}`
    : portraitPath;

  return {
    id: defId,
    name: charInfo.name || defId,
    category: worldCategory,
    sect,
    dir: charInfo.dirName,
    martial,
    frameRoot,
    portraitPath,
    baseStandPath,
    collision: { width: 42, height: 34, offsetY: 34 },
    render: { width: 112, height: 112, nameplateOffsetY: 62 },
    baseStats: {
      maxHp: 100,
      martial,
      attack: 6 + martial * 2,
      defense: 4,
      speed: 1,
    },
    defaultItems: [],
    equipmentSlots: ['weapon', 'clothing', 'accessory'],
    actions: allActions,
    skills: {},
    _custom: true,
    _generatedFrom: charInfo.notes || 'auto',
  };
}

// ─── 地图定义生成 ───

function buildMapDefinition(mapInfo, worldCategory, assetRoot) {
  const prefix = worldCategory === 'poxiao' ? 'px-' : 'xj-';
  const key = prefix + mapInfo.key;

  return {
    key,
    name: mapInfo.name || key,
    category: worldCategory,
    bgPath: mapInfo.bgPath ? `${assetRoot}/${mapInfo.bgPath}` : '',
    bgThumbnailPath: mapInfo.thumbnailPath ? `${assetRoot}/${mapInfo.thumbnailPath}` : '',
    worldScale: mapInfo.worldScale || 2,
    worldSize: mapInfo.worldSize || { width: 1200, height: 900 },
    nodes: (mapInfo.nodes || []).map((n, i) => ({
      id: n.id || `${key}-node-${i}`,
      x: n.x ?? Math.floor(Math.random() * (mapInfo.worldSize?.width || 1200)),
      y: n.y ?? Math.floor(Math.random() * (mapInfo.worldSize?.height || 900)),
      name: n.name || `节点${i + 1}`,
      type: n.type || 'scene',
      radius: n.radius || 30,
      color: n.color || randomHexColor(),
    })),
    edges: mapInfo.edges || [],
    allowedCharacterIds: mapInfo.allowedCharacterIds || [],
    initialWorldItems: mapInfo.initialWorldItems || [],
    _custom: true,
  };
}

// ─── 资源复制 ───

function copyAssets(tempDir, fileTree, targetBase, charInfos = [], mapInfos = []) {
  const results = [];
  const copied = new Set();

  // 复制角色资源
  for (const char of charInfos) {
    const srcDir = path.join(tempDir, char.dirName);
    if (!fs.existsSync(srcDir)) continue;

    const destDir = path.join(targetBase, 'characters', 'actions', char.dirName);
    try {
      copyDir(srcDir, destDir);
      results.push({ type: 'character', source: char.dirName, dest: destDir, status: 'ok' });
      copied.add(char.dirName);
    } catch (e) {
      results.push({ type: 'character', source: char.dirName, error: e.message, status: 'error' });
    }
  }

  // 复制地图资源
  for (const map of mapInfos) {
    if (!map.bgPath) continue;
    const srcFile = path.join(tempDir, map.bgPath);
    if (!fs.existsSync(srcFile)) continue;

    const destFile = path.join(targetBase, path.basename(map.bgPath));
    try {
      fs.mkdirSync(path.dirname(destFile), { recursive: true });
      fs.copyFileSync(srcFile, destFile);
      results.push({ type: 'map', source: map.bgPath, dest: destFile, status: 'ok' });
    } catch (e) {
      results.push({ type: 'map', source: map.bgPath, error: e.message, status: 'error' });
    }
  }

  // 兜底：复制未被识别的目录
  for (const entry of fs.readdirSync(tempDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || copied.has(entry.name)) continue;
    const srcDir = path.join(tempDir, entry.name);
    const destDir = path.join(targetBase, entry.name);
    try {
      copyDir(srcDir, destDir);
      results.push({ type: 'unknown', source: entry.name, dest: destDir, status: 'copied' });
    } catch (e) {
      results.push({ type: 'unknown', source: entry.name, error: e.message, status: 'error' });
    }
  }

  return results;
}

// ─── 主处理函数 ───

/**
 * 处理上传的 zip 包
 * @param {string} zipPath - zip 文件路径
 * @param {string} worldCategory - 世界类别 (poxiao/xiejian)
 * @param {object} metadata - 用户填写的额外元数据
 * @param {object} options - { useAI: boolean, apiKey: string }
 */
async function processPackage(zipPath, worldCategory, metadata = {}, options = {}) {
  const tempDir = createTempDir();
  const warnings = [];

  try {
    // 1. 解压
    extractZip(zipPath, tempDir);

    // DEBUG: 检查解压结果
    try {
      const entries = fs.readdirSync(tempDir);
      console.log('[DEBUG] extractZip done, tempDir entries:', entries);
    } catch (e) { console.log('[DEBUG] readdir tempDir failed:', e.message); }

    // 2. 扫描文件树
    const fileTree = scanDirectory(tempDir);
    console.log('[DEBUG] scanDirectory found', fileTree.length, 'files');
    if (fileTree.length > 0) {
      console.log('[DEBUG] first 5 files:', fileTree.slice(0, 5));
    }
    if (fileTree.length === 0) {
      throw new Error('压缩包为空');
    }

    // 3. 查找所有 manifest.json
    const manifests = findAllManifests(tempDir);

    // 4. AI 智能分析（如果启用）
    let aiResult = null;
    if (options.useAI && options.apiKey) {
      aiResult = await analyzeWithAI(fileTree, manifests, options.apiKey);
      if (aiResult) {
        console.log('[AI分析] 结果:', JSON.stringify({
          packageType: aiResult.packageType,
          confidence: aiResult.confidence,
          characterCount: (aiResult.characters || []).length,
          mapCount: (aiResult.maps || []).length,
        }));
      }
    }

    // 5. 确定包类型和解析数据
    let packageType = 'unknown';
    let charInfos = [];
    let mapInfos = [];

    if (aiResult && aiResult.packageType && aiResult.packageType !== 'unknown') {
      packageType = aiResult.packageType;
      charInfos = aiResult.characters || [];
      mapInfos = aiResult.maps || [];
      warnings.push(...(aiResult.warnings || []));
    } else {
      // 本地解析
      const localChars = inferCharactersFromTree(fileTree, tempDir, worldCategory);
      const localMaps = inferMapsFromTree(fileTree, worldCategory);

      if (localChars.characters.length > 0) packageType = 'character';
      else if (localMaps.maps.length > 0) packageType = 'map';

      // 如果两种都有
      if (localChars.characters.length > 0 && localMaps.maps.length > 0) packageType = 'mixed';

      charInfos = localChars.characters;
      mapInfos = localMaps.maps;
      warnings.push(...localChars.warnings, ...localMaps.warnings);
    }

    if (packageType === 'unknown') {
      throw new Error('无法识别压缩包类型。请确保包含角色帧动画目录（frames/）或地图背景图。');
    }

    // 6. 确定资源根路径
    const assetRoot = worldCategory === 'poxiao' ? 'poxiao' : 'xiejian';
    const targetBase = path.resolve(__dirname, '..', 'sendbox', 'src', 'assets', assetRoot);

    // 7. 复制资源文件
    const copyResults = copyAssets(tempDir, fileTree, targetBase, charInfos, mapInfos);

    // 8. 生成游戏定义
    const characterDefs = {};
    const mapDefs = {};
    const routeGraphs = {};

    if (packageType === 'character' || packageType === 'mixed') {
      for (const charInfo of charInfos) {
        const def = buildCharacterDefinition(charInfo, worldCategory, assetRoot, metadata);
        characterDefs[def.id] = def;
      }
    }

    if (packageType === 'map' || packageType === 'mixed') {
      for (const mapInfo of mapInfos) {
        const def = buildMapDefinition(mapInfo, worldCategory, assetRoot);
        mapDefs[def.key] = def;

        // 生成 routeGraph
        if (def.nodes.length > 0) {
          const rgKey = worldCategory === 'poxiao' ? `poxiao-${mapInfo.key}` : mapInfo.key;
          routeGraphs[rgKey] = {
            nodes: def.nodes.map(n => ({
              id: n.id,
              name: n.name,
              x: n.x,
              y: n.y,
              type: n.type || 'scene',
              color: n.color,
            })),
            edges: def.edges || [],
          };
        }
      }
    }

    return {
      packageType,
      characters: characterDefs,
      characterCount: Object.keys(characterDefs).length,
      maps: mapDefs,
      mapCount: Object.keys(mapDefs).length,
      routeGraphs,
      copyResults,
      warnings,
      aiAnalysis: aiResult ? {
        confidence: aiResult.confidence,
        notes: aiResult.warnings || [],
      } : null,
      fileTreeSummary: {
        totalFiles: fileTree.length,
        manifestCount: manifests.length,
        topDirs: [...new Set(fileTree.map(f => f.split('/')[0]))].slice(0, 10),
      },
    };
  } finally {
    removeDir(tempDir);
  }
}

// ─── 导出 ───

module.exports = {
  processPackage,
  analyzeWithAI,
  extractZip,
  scanDirectory,
  findAllManifests,
  mapActionName,
  buildCharacterDefinition,
  buildMapDefinition,
};
