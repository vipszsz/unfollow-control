// The single-file web build comes out as index.html; give it a name people recognize.
const fs = require('node:fs')
const { version } = require('../package.json')
fs.renameSync('release/web/index.html', `release/UnfollowControl-${version}.html`)
fs.rmSync('release/web', { recursive: true, force: true })
