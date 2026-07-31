/* Shared image-frame catalog for editor, reader, preview, and export DOM. */
(function exposeImageFrames(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ImageFrames = api;
})(typeof window !== 'undefined' ? window : globalThis, function createImageFrames() {
  const styles = [
    { id: 'none', name: '无边框' },
    { id: 'thin-white', name: '细白框' },
    { id: 'classic-black', name: '经典黑框' },
    { id: 'polaroid', name: '拍立得' },
    { id: 'stamp', name: '邮票齿孔' },
    { id: 'film', name: '胶片' },
    { id: 'gold', name: '金色画框' },
    { id: 'mahogany', name: '红木相框' },
    { id: 'floral', name: '花蔓' },
    { id: 'lace', name: '蕾丝' },
    { id: 'washi', name: '和纸撕边' },
    { id: 'tape', name: '胶带相册' }
  ];
  const ids = new Set(styles.map(style => style.id));

  function normalize(value) {
    return ids.has(value) ? value : 'thin-white';
  }

  function className(value) {
    return `image-frame image-frame-${normalize(value)}`;
  }

  return { styles, normalize, className };
});
