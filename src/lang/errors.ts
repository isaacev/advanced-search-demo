export function fatal (msg: string = 'unknown error'): Error {
  return new Error(msg)
}

export class SyntaxError extends Error {
  public start : number

  constructor (start: number, message: string) {
    super(message)
    this.start = start
  }
}
