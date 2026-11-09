/** 包一層 localStorage：私密視窗或被封鎖時不會丟例外 */
export class SafeStorage {
  constructor(backend = globalThis.localStorage) { this.backend = backend; }
  get(key) { try { return this.backend.getItem(key); } catch { return null; } }
  set(key, value) { try { this.backend.setItem(key, value); } catch { /* 忽略 */ } }
  remove(key) { try { this.backend.removeItem(key); } catch { /* 忽略 */ } }
}

/** 使用者自訂影廳的存取 */
export class CustomHallRepository {
  constructor(storage, key = 'cinema-sim-custom-hall-v2') { this.storage = storage; this.key = key; }
  load() {
    const raw = this.storage.get(this.key);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }
  save(hall) { this.storage.set(this.key, JSON.stringify(hall)); }
  clear() { this.storage.remove(this.key); }
}
