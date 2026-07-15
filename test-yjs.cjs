const Y = require('yjs');
const doc = new Y.Doc();
const ytext = doc.getText('test');
ytext.insert(0, 'hello world');
const rel = Y.createRelativePositionFromTypeIndex(ytext, 0);
try {
  const enc = Y.encodeRelativePosition(rel);
  console.log("Encode success:", enc instanceof Uint8Array);
} catch (e) {
  console.error("Encode error:", e.message);
}
