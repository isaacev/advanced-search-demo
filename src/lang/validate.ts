import Compile from './compile'
import Grammar from './grammar'

export default class Validate {
  public static predicate (value: string, grammar: Grammar) {
    try {
      return Compile.predicate(value, grammar)
    } catch (err) {
      return false
    }
  }
}
