import { Span } from "./renderCode"
import { diffArrays } from "diff"

interface Move {
  oldIndex: number
  newIndex: number
}

const notWhitespace = ({ text }: { text: string }) => text.match(/\S+/)

export function movedSpans(a: Span[], b: Span[]): Move[] {
  const result = [] as Move[]
  const lcs = diffArrays(a.filter(notWhitespace), b.filter(notWhitespace), {
    comparator(a: Span, b: Span) {
      return a.text === b.text
    },
  } as any)
    .filter(part => !part.added && !part.removed)
    .reduce((a, b) => a.concat(b.value), [] as Span[])

  let i = 0
  let j = 0

  for (const { text } of lcs) {
    while (i < a.length && a[i].text !== text) {
      i++
    }

    while (j < b.length && b[j].text !== text) {
      j++
    }

    result.push({
      oldIndex: i,
      newIndex: j,
    })
  }

  return result
}
