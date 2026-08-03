// Character 工厂（fromLocal / fromRemote / fromJSON）
import { Character } from './Character.js';

export const CharacterFactory = {
  fromDef(def, opts) {
    return new Character(def, opts);
  },
  fromJSON(saved, def, opts) {
    const ch = new Character(def, opts);
    if (saved?.baseStats) ch.baseStats = { ...ch.baseStats, ...saved.baseStats };
    if (saved?.flags) ch.runtimeFlags = { ...saved.flags };
    if (saved?.questLog) ch.questLog = saved.questLog;
    return ch;
  },
};

export default CharacterFactory;
