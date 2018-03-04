export function prefixedBy (prefix: string, ...whole: string[]) {
  for (let w of whole) {
    if (w.substring(0, prefix.length) === prefix) {
      return true
    }
  }
  return false
}
