function getBinaryPath() {
  // Windows binaries end with .exe so we need to special case them.
  const binaryName = process.platform === 'win32' ? 'frontastic.exe' : 'frontastic'

  return require('path').join(__dirname, 'bin', binaryName)
}

// With `getBinaryPath()` could access the binary in you JavaScript code as follows
export const runBinary = function (...args) {
  require('child_process').execFileSync(getBinaryPath(), args, {
    stdio: 'inherit',
  })
}
