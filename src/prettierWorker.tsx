var worker = new Worker("/worker.js")

worker.onmessage = () => {}

worker.postMessage({ code: "", options: {} })

interface Result {
  error: false
  formatted: string
  cursorOffset: number
}

interface Failure {
  error: true
  message: string
  stack: string
}

type Response = Result | Failure

export function formatCode(code: string, cursorOffset: number) {
  return new Promise<Result>((resolve, reject) => {
    worker.onmessage = message => {
      const response: Response = message.data
      worker.onmessage = null
      if (response.error) {
        console.error(response.message)
        console.error(response.stack)
        reject(response)
      } else {
        resolve(response)
      }
    }
    worker.postMessage({
      code,
      options: {
        parser: "typescript",
        cursorOffset,
        semi: false,
        printWidth: 38,
      },
    })
  })
}
