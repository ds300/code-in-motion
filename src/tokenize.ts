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

const typeScriptDeclWords = {
  type: true,
  interface: true,
  enum: true,
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

  let braceLevelCountStack = []
  while (scanner.getToken() !== SyntaxKind.EndOfFileToken) {
    const value = scanner.getTokenText()
    const start = scanner.getStartPos()
    const end = start + value.length

    if (
      value in typeScriptDeclWords &&
      tokens.length &&
      tokens[tokens.length - 1].value.match(/\n/)
    ) {
      tokens.push({ type: "reserved", value, start, end })
    } else if (scanner.isReservedWord()) {
      tokens.push({ type: "reserved", value, start, end })
    } else if (scanner.isIdentifier()) {
      tokens.push({ type: "name", value, start, end })
    } else if (scanner.isUnterminated()) {
      tokens.push({ type: "error", value, start, end })
    } else if (value.match(/\n/)) {
      tokens.push({ type: "space", value, start, end })
    } else {
      switch (scanner.getToken()) {
        case SyntaxKind.TemplateHead:
        case SyntaxKind.TemplateMiddle:
          tokens.push({ type: "string", value, start, end })
          braceLevelCountStack.push(1)
          break
        case SyntaxKind.JSDocComment:
        case SyntaxKind.MultiLineCommentTrivia:
        case SyntaxKind.SingleLineCommentTrivia:
          tokens.push({ type: "comment", value, start, end })
          break
        case SyntaxKind.StringLiteral:
        case SyntaxKind.TemplateTail:
        case SyntaxKind.TemplateExpression:
        case SyntaxKind.TemplateSpan:
        case SyntaxKind.FirstTemplateToken:
        case SyntaxKind.TaggedTemplateExpression:
          tokens.push({ type: "string", value, start, end })
          break
        case SyntaxKind.NumericLiteral:
          tokens.push({ type: "number", value, start, end })
          break
        case SyntaxKind.CloseBraceToken:
          if (braceLevelCountStack.length > 0) {
            braceLevelCountStack[braceLevelCountStack.length - 1]--
            if (braceLevelCountStack[braceLevelCountStack.length - 1] === 0) {
              braceLevelCountStack.pop()
              scanner.reScanTemplateToken()
              continue
            }
          }
        case SyntaxKind.OpenBraceToken:
          if (braceLevelCountStack.length > 0) {
            braceLevelCountStack[braceLevelCountStack.length - 1]++
          }
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

  // return tokens
  const flattenedTokens = [] as Token[]

  for (const token of tokens) {
    if (
      token.type === "error" ||
      token.type === "string" ||
      token.type === "comment"
    ) {
      let lo = 0
      while (lo < token.value.length) {
        let hi = lo
        while (hi < token.value.length && token.value[hi++] !== " ") {}

        flattenedTokens.push({
          type: token.type,
          value: token.value.substring(lo, hi),
          start: token.start + lo,
          end: token.start + hi,
        })

        lo = hi
      }
    } else {
      flattenedTokens.push(token)
    }
  }

  return flattenedTokens
}
