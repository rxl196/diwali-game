import { decode } from './encoding'
import { VALID_GUESSES } from './wordlist'

export const WORD_LENGTH = 5
export const MAX_GUESSES = 6

/** Base64 so the answer is not visible in the shipped bundle. */
const ENCODED_ANSWER = 'RElZQVM='

export const ANSWER = decode(ENCODED_ANSWER)

/** Shown after three guesses to keep the themed answer fair for everyone. */
export const HINT = 'Small clay oil lamps lit during Diwali.'

export const ANSWER_NOTE =
  'A diya is a small clay lamp filled with oil or ghee, lit to symbolise the triumph of light over darkness.'

export function isValidGuess(word: string): boolean {
  return VALID_GUESSES.has(word.toUpperCase())
}
