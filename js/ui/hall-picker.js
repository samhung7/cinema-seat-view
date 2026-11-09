/** 上方的影廳切換列 */
export class HallPicker {
  /** @param {HTMLElement} root @param {(key:string)=>void} onPick */
  constructor(root, onPick) {
    this.root = root;
    root.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b) onPick(b.dataset.key);
    });
  }

  /** @param {{key:string,label:string}[]} options @param {string} activeKey */
  render(options, activeKey) {
    const signature = `${activeKey}|${options.map((o) => o.key).join(',')}`;
    if (signature === this.signature) return;
    this.signature = signature;
    this.root.innerHTML = options
      .map((o) => `<button data-key="${o.key}" class="${o.key === activeKey ? 'on' : ''}">${o.label}</button>`)
      .join('');
    this.root.querySelector('.on')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }
}
