/* eslint-env worker */
/* eslint no-var: off, strict: off */

var parsersLoaded = {}

// "Polyfills" in order for all the code to run
/* eslint-disable */
self.global = self
self.util = {}
self.path = {}
self.path.resolve = self.path.join = self.path.dirname = function() {
  return ""
}
self.path.parse = function() {
  return { root: "" }
}
self.Buffer = {
  isBuffer: function() {
    return false
  },
}
self.constants = {}
module$1 = module = os = crypto = {}
self.fs = { readFile: function() {} }
os.homedir = function() {
  return "/home/prettier"
}
os.EOL = "\n"
self.process = {
  argv: [],
  env: { PRETTIER_DEBUG: true },
  version: "v8.5.0",
  binding: function() {
    return {}
  },
  cwd: function() {
    return ""
  },
}
self.assert = { ok: function() {}, strictEqual: function() {} }
self.require = function require(path) {
  if (path === "stream") {
    return { PassThrough() {} }
  }
  if (path === "./third-party") {
    return {}
  }

  if (~path.indexOf("parser-")) {
    var parser = path.replace(/.+-/, "")
    if (!parsersLoaded[parser]) {
      importScripts("lib/parser-" + parser + ".js")
      parsersLoaded[parser] = true
    }
    return self[parser]
  }

  return self[path]
}

/* eslint-enable */

var prettier
importScripts("lib/index.js")
if (typeof prettier === "undefined") {
  prettier = module.exports // eslint-disable-line
}
if (typeof prettier === "undefined") {
  prettier = index // eslint-disable-line
}

self.onmessage = function(message) {
  try {
    const { formatted, cursorOffset } = prettier.formatWithCursor(
      message.data.code,
      message.data.options,
    )
    console.log(JSON.stringify(formatted))
    self.postMessage({
      error: false,
      formatted,
      cursorOffset,
    })
  } catch (e) {
    self.postMessage({
      error: true,
      message: e.message,
      stack: e.stack,
    })
  }
}
