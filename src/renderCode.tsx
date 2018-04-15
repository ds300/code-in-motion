import * as React from "react"
import { Token } from "./tokenize"

let key = 0

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
const cursor = span("cursor", " ")

export function renderCode(
  text: string,
  tokens: Token[],
  selectionStart: number,
  selectionEnd: number,
) {
  const spans: Span[] = []

  tokens.forEach((token: Token, i, tokens) => {
    let type = token.type as Token["type"] | "function"
    switch (type) {
      case "name":
        if (tokens[i + 1] && tokens[i + 1].value === "(") {
          type = "function"
        }
    }

    if (!rangesOverlap(token.start, token.end, selectionStart, selectionEnd)) {
      if (selectionStart === selectionEnd && selectionStart === token.start) {
        spans.push(cursor)
      }
      spans.push(span(type, token.value))
    } else {
      if (selectionStart >= token.start && selectionEnd >= token.end) {
        // starts during this token
        if (selectionStart !== token.start) {
          spans.push(span(type, text.slice(token.start, selectionStart)))
        }
        spans.push(
          span(type + " selection", text.slice(selectionStart, token.end)),
        )
      } else if (selectionStart <= token.start && selectionEnd < token.end) {
        // ends during this token
        spans.push(
          span(type + " selection", text.slice(token.start, selectionEnd)),
        )
        if (token.end !== selectionEnd) {
          spans.push(span(type, text.slice(selectionEnd, token.end)))
        }
      } else if (selectionStart > token.start && selectionEnd < token.end) {
        // starts and ends during this token
        if (selectionStart !== token.start) {
          spans.push(span(type, text.slice(token.start, selectionStart)))
        }
        if (selectionStart === selectionEnd) {
          spans.push(cursor)
        } else {
          spans.push(
            span(type + " selection", text.slice(selectionStart, selectionEnd)),
          )
        }
        if (token.end !== selectionEnd) {
          spans.push(span(type, text.slice(selectionEnd, token.end)))
        }
      } else {
        // encompasses this token
        spans.push(span(type + " selection", token.value))
      }
    }
  })

  return spans
}

export const renderSpan = ({ className, text }: Span) => (
  <span className={className}>{text}</span>
)
