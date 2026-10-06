/** Opens the system file chooser for a zip. (The chooser itself is the one native UI CSS can't reach.) */
export function pickZip(onFile: (file: File) => void) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.zip,application/zip'
  input.onchange = () => {
    const file = input.files?.[0]
    if (file) onFile(file)
  }
  input.click()
}
