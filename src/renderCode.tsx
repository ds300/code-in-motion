import * as React from "react"
import { Token } from "./tokenize"

function rangesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
) {
  return !(
    (startA <= startB && endA <= startB) ||
    (startB <= startA && endB <= startA)
  )
}

export interface Span {
  text: string
  className: string
}

const span = (className: string, text: string) => ({ className, text })

export function renderCode(tokens: Token[]) {
  const spans: Span[] = []

  tokens.forEach((token: Token, i, tokens) => {
    let type = token.type as Token["type"] | "function"
    switch (type) {
      case "name":
        if (tokens[i + 1] && tokens[i + 1].value === "(") {
          type = "function"
        }
    }

    spans.push(span(type, token.value))
  })

  return spans
}

export function renderSelection(
  code: string,
  selectionStart: number,
  selectionEnd: number,
) {
  const spans: Span[] = []

  {
    let i = 0
    while (i < selectionStart) {
      if (code[i] === "\n") {
        spans.push(span("space", "\n"))
        i++
      }
      let lineLength = 0
      while (i < selectionStart && code[i] !== "\n") {
        lineLength++
        i++
      }
      spans.push(span("punctution", " ".repeat(lineLength)))
    }
  }

  if (selectionStart === selectionEnd) {
    spans.push(span("cursor", " "))
  } else {
    {
      let i = selectionStart
      while (i < selectionEnd) {
        if (code[i] === "\n") {
          spans.push(span("space", "\n"))
          i++
        }
        let lineLength = 0
        while (i < selectionEnd && code[i] !== "\n") {
          lineLength++
          i++
        }
        spans.push(span("punctuation selection", " ".repeat(lineLength)))
      }
    }
  }

  return spans
}

export const renderSpan = ({ className, text }: Span) => (
  <span className={className}>{text}</span>
)
