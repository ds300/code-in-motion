import { createScanner } from "./ts/scanner"
import { ScriptTarget, LanguageVariant, SyntaxKind } from "./ts/types"

export interface Token {
  type:
    | "name"
    | "number"
    | "punctuation"
    | "reserved"
    | "string"
    | "space"
    | "comment"
    | "error"
    | "eof"
  value: string
  start: number
  end: number
}

export function tokenize(code: string): Token[] {
  const scanner = createScanner(
    ScriptTarget.Latest,
    false,
    LanguageVariant.JSX,
    code,
  )
  const tokens: Token[] = []
  scanner.scan()
  while (scanner.getToken() !== SyntaxKind.EndOfFileToken) {
    const value = scanner.getTokenText()
    const start = scanner.getStartPos()
    const end = start + value.length

    if (scanner.isReservedWord()) {
      tokens.push({ type: "reserved", value, start, end })
    } else if (scanner.isIdentifier()) {
      tokens.push({ type: "name", value, start, end })
    } else if (scanner.isUnterminated()) {
      tokens.push({ type: "error", value, start, end })
    } else {
      switch (scanner.getToken()) {
        case SyntaxKind.JSDocComment:
        case SyntaxKind.MultiLineCommentTrivia:
        case SyntaxKind.SingleLineCommentTrivia:
          tokens.push({ type: "comment", value, start, end })
          break
        case SyntaxKind.StringLiteral:
          tokens.push({ type: "string", value, start, end })
          break
        case SyntaxKind.NumericLiteral:
          tokens.push({ type: "number", value, start, end })
          break
        default:
          tokens.push({ type: "punctuation", value, start, end })
          break
      }
    }
    scanner.scan()
  }
  tokens.push({
    type: "eof",
    value: "",
    start: code.length,
    end: code.length,
  })

  return tokens
}
