// The single-file web build comes out as index.html; give it a name people recognize.
const fs = require('node:fs')
fs.renameSync('release/web/index.html', 'release/Unfollow Control.html')
fs.rmSync('release/web', { recursive: true, force: true })
