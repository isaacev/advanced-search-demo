export function unaryDebounce<A> (fn: (first: A) => void, wait: number, immediate: boolean = false) {
  let timeout: number | null = null
  return function (first: A) {
    const callNow = immediate && !timeout
    const later = () => {
      timeout = null
      fn.apply(null, [first])
    }
    window.clearTimeout(timeout as number)
    timeout = window.setTimeout(later, wait)
    if (callNow) {
      fn.apply(null, [first])
    }
  }
}
