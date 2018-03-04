export function fatal (msg: string = 'unknown error'): Error {
  return new Error(msg)
}

export class SyntaxError extends Error {
  constructor (start: number, message: string) {
    super(`(at ${start + 1}) ${message}`)
  }
}
