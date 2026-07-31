const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ImageFrames = require('../js/imageFrames');

const expected = [
  'none',
  'thin-white',
  'classic-black',
  'polaroid',
  'stamp',
  'film',
  'gold',
  'mahogany',
  'floral',
  'lace',
  'washi',
  'tape'
];

assert.deepStrictEqual(ImageFrames.styles.map(style => style.id), expected);
assert.strictEqual(ImageFrames.normalize('unknown-old-value'), 'thin-white');

const editor = fs.readFileSync(path.join(__dirname, '..', 'js', 'editor.js'), 'utf8');
const reader = fs.readFileSync(path.join(__dirname, '..', 'js', 'modules', 'app-reader.js'), 'utf8');
assert.match(editor, /ImageFrames\.className\(elem\.frameStyle\)/);
assert.match(reader, /ImageFrames\.className\(elem\.frameStyle\)/);

console.log('image frame catalog tests passed');
