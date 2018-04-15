import { Span } from "./renderCode"

function populateMatrix(a: Span[], b: Span[]): number[][] {
  let matrix: number[][] = []

  for (let i = 0; i < b.length; i++) {
    let row: number[] = []
    for (let j = 0; j < a.length; j++) {
      const rowPrev = row[j - 1] || 0
      const colPrev = i > 0 ? matrix[i - 1][j] : 0
      const best =
        Math.max(rowPrev, colPrev) + (a[j].text === b[i].text ? 1 : 0)

      row[j] = best
    }
    matrix.push(row)
  }

  return matrix
}

function backtrack(
  result: Span[],
  matrix: number[][],
  a: Span[],
  b: Span[],
  i: number,
  j: number,
) {
  if (i === -1 || j === -1) {
    return
  } else if (a[j].text === b[i].text) {
    result.unshift(a[j])
    backtrack(result, matrix, a, b, i - 1, j - 1)
  } else if ((i > 0 ? matrix[i - 1][j] : 0) > (j > 0 ? matrix[i][j - 1] : 0)) {
    backtrack(result, matrix, a, b, i - 1, j)
  } else {
    backtrack(result, matrix, a, b, i, j - 1)
  }
}

export function longestCommonSubsequence(a: Span[], b: Span[]): any[] {
  const result: Span[] = []
  backtrack(result, populateMatrix(a, b), a, b, b.length - 1, a.length - 1)
  return result
}
