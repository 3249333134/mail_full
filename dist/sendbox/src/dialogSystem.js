export class DialogSystem {
  constructor() {
    this.npc = null;
    this.index = 0;
    this.text = '';
    this.charIndex = 0;
    this.typeTimer = 0;
    this.typeSpeed = 40;
    this.isActive = false;

    this.dialogBox = document.getElementById('dialog-box');
    this.dialogName = document.getElementById('dialog-name');
    this.dialogText = document.getElementById('dialog-text');
  }

  startDialog(npc) {
    this.npc = npc;
    this.index = 0;
    this.charIndex = 0;
    this.text = '';
    this.typeTimer = 0;
    this.isActive = true;

    this.dialogName.textContent = npc.name;
    this.dialogText.textContent = '';
    this.dialogBox.classList.remove('hidden');
  }

  advanceDialog() {
    if (!this.isActive || !this.npc) return;

    const fullText = this.npc.dialogs[this.index];

    if (this.charIndex < fullText.length) {
      this.charIndex = fullText.length;
      this.text = fullText;
      this.dialogText.textContent = this.text;
      return;
    }

    this.index++;
    if (this.index >= this.npc.dialogs.length) {
      this.endDialog();
      return;
    }

    this.charIndex = 0;
    this.text = '';
    this.dialogText.textContent = '';
  }

  endDialog() {
    this.isActive = false;
    this.npc = null;
    this.dialogBox.classList.add('hidden');
  }

  update(dt) {
    if (!this.isActive || !this.npc) return;

    const fullText = this.npc.dialogs[this.index];
    if (this.charIndex >= fullText.length) return;

    this.typeTimer += dt;
    while (this.typeTimer >= this.typeSpeed && this.charIndex < fullText.length) {
      this.typeTimer -= this.typeSpeed;
      this.charIndex++;
      this.text = fullText.substring(0, this.charIndex);
    }
    this.dialogText.textContent = this.text;
  }

  isDialogActive() {
    return this.isActive;
  }
}
