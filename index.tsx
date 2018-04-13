// do char diff on raw text.
// should be possilbe to infer a source map from that.
// at least you can find out which ranges were deleted from
// the original text, and then map everything else

import * as React from "react"
import { render } from "react-dom"
import styled, { injectGlobal, css } from "styled-components"
import { Token, tokenize } from "./tokenize"

const WIDTH = 400
const HEIGHT = 300

const editorBox = css`
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: ${WIDTH}px;
  height: ${HEIGHT}px;
  max-width: ${WIDTH}px;
  max-height: ${HEIGHT}px;
  overflow: scroll;
  background: rgb(27, 43, 53);
  padding: 13px 20px;
  margin: 0;
`

const CodeUnderlay = styled.div`
  ${editorBox};
`

injectGlobal`
  * {
    box-sizing: border-box;
  }
  body {
    padding: 0;
    margin: 0;
    color: rgb(249,252,254);
    font-family: "Fira Code", "Menlo", "Source Sans Pro", monospace;
    line-height: 1.4em;
    font-size: 16px;
    background: #1a1d21;
  }
  textarea {
    ${editorBox};
    opacity: 0;
    border: 0;
    outline: 0;
    font-family: "Fira Code", "Menlo", "Source Sans Pro", monospace;
    line-height: 1.4em;
    font-size: 16px;
    border-radius: 0;
  }
  .selection {
    background: rgba(255,255,255,0.2);
  }
  @keyframes cusrorAnimation {
    from {
      opacity: 1;
    }
    
    45% {
      opacity: 1;
    }

    50% {
      opacity: 0;
    }

    95% {
      opacity: 0;
    }
    
    to {
      opacity: 1
    }
  }
  .cursor {
    animation: cusrorAnimation 0.9s linear infinite; 
    background: #ffffffa6;
    display: inline-block;
    position: absolute;
    width: 2px;
  }
  .error {
    background: #714a4a;
    color: red;
    &.selection {
      background: #8e6868;
    }
  }
  .function {
    color: hsla(53, 71%, 80%);
  }
  .punctuation {
    color: rgb(161, 177, 185);
  }
  .reserved {
    color: rgb(191, 132, 191);
  }
  .string {
    color: hsl(43, 76%, 49%);
  }
  .name {
    color: rgb(165, 227, 228);
  }
  .number {
    color: rgb(119, 186, 230);
  }
  .comment {
    color: #579249;
  }
`

const text = `function* banana() {
  yield banana();
  hahaha what() ?
  " this string is unfinished
}
`

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

const cursor = () => (
  <span className="cursor" key={key++}>
    &nbsp;
  </span>
)

function renderCode(
  text: string,
  tokens: Token[],
  selectionStart: number,
  selectionEnd: number,
) {
  const spans = [] as any

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
        spans.push(cursor())
      }
      spans.push(
        <span key={key++} className={type}>
          {token.value}
        </span>,
      )
    } else {
      if (selectionStart >= token.start && selectionEnd >= token.end) {
        // starts during this token
        if (selectionStart !== token.start) {
          spans.push(
            <span key={key++} className={type}>
              {text.slice(token.start, selectionStart)}
            </span>,
          )
        }
        spans.push(
          <span key={key++} className={type + " selection"}>
            {text.slice(selectionStart, token.end)}
          </span>,
        )
      } else if (selectionStart <= token.start && selectionEnd < token.end) {
        // ends during this token
        spans.push(
          <span key={key++} className={type + " selection"}>
            {text.slice(token.start, selectionEnd)}
          </span>,
        )
        if (token.end !== selectionEnd) {
          spans.push(
            <span key={key++} className={type}>
              {text.slice(selectionEnd, token.end)}
            </span>,
          )
        }
      } else if (selectionStart > token.start && selectionEnd < token.end) {
        // starts and ends during this token
        if (selectionStart !== token.start) {
          spans.push(
            <span key={key++} className={type}>
              {text.slice(token.start, selectionStart)}
            </span>,
          )
        }
        if (selectionStart === selectionEnd) {
          spans.push(cursor())
        } else {
          spans.push(
            <span key={key++} className={type + " selection"}>
              {text.slice(selectionStart, selectionEnd)}
            </span>,
          )
        }
        if (token.end !== selectionEnd) {
          spans.push(
            <span key={key++} className={type}>
              {text.slice(selectionEnd, token.end)}
            </span>,
          )
        }
      } else {
        // encompasses this token
        spans.push(
          <span key={key++} className={type + " selection"}>
            {token.value}
          </span>,
        )
      }
    }
  })

  return spans
}

class TextBox extends React.Component<
  { text: string },
  { text: string; selectionStart: number; selectionEnd: number }
> {
  state = { text: this.props.text, selectionStart: 1, selectionEnd: 3 }

  setNewText = (ev: React.FormEvent<HTMLTextAreaElement>) => {
    const text = ev.currentTarget.value
    this.setState({ text })
    this.handleSelectionChange()
  }

  textArea: HTMLTextAreaElement | null = null
  codeOverlay: HTMLDivElement | null = null

  handleSelectionChange = () => {
    if (this.textArea) {
      this.setState({
        selectionStart: this.textArea.selectionStart,
        selectionEnd: this.textArea.selectionEnd,
      })
    }
  }

  componentDidMount() {
    document.addEventListener("selectionchange", this.handleSelectionChange)
  }

  componentWillUnmount() {
    document.removeEventListener("selectionchange", this.handleSelectionChange)
  }

  render() {
    const { text, selectionStart, selectionEnd } = this.state

    const selectionMin = Math.min(selectionStart, selectionEnd)
    const selectionMax = Math.max(selectionStart, selectionEnd)

    return (
      <>
        <CodeUnderlay
          innerRef={ref => (this.codeOverlay = ref)}
          style={{
            whiteSpace: "pre-wrap",
            pointerEvents: "none",
            width: WIDTH + "px",
            height: HEIGHT + "px",
          }}
        >
          {renderCode(text, tokenize(text), selectionMin, selectionMax)}
        </CodeUnderlay>
        <textarea
          onInput={this.setNewText}
          defaultValue={text}
          ref={ref => {
            this.textArea = ref
            if (this.textArea) {
              this.textArea.onscroll = () => {
                if (this.codeOverlay && this.textArea) {
                  this.codeOverlay.scrollTop = this.textArea.scrollTop
                }
              }
            }
          }}
        />
      </>
    )
  }
}

render(<TextBox text={text} />, document.getElementById("main"))
