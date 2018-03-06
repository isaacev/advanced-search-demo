export function hasPrefix (pre: string, str: string) {
  if (str.substring(0, pre.length) === pre) {
    return true
  } else {
    return false
  }
}

export function anyHavePrefix (pre: string, ...strs: string[]) {
  for (let str of strs) {
    if (hasPrefix(pre, str)) {
      return true
    }
  }
  return false
}

export function thoseWithPrefix (pre: string, ...strs: string[]) {
  return strs.filter(str => hasPrefix(pre, str))
}
