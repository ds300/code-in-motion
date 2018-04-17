import * as React from "react"

import styled, { css } from "styled-components"
import { tokenize } from "./tokenize"
import { PrettierActivitiyIndicator } from "./PrettierActivityIndicator"
import * as colors from "./colors"
import { formatCode } from "./prettierWorker"
import { renderCode, renderSpan, Span, renderSelection } from "./renderCode"
import { movedSpans } from "./movedSpans"

const WIDTH = 500
const HEIGHT = 300
const H_PADDING = 20

const editorBox = css`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: ${WIDTH}px;
  height: ${HEIGHT}px;
  max-width: ${WIDTH}px;
  max-height: ${HEIGHT}px;
  overflow: scroll;
  padding: 20px ${H_PADDING}px;
  margin: 0;
  white-space: pre-wrap;
  font-family: "Fira Code", "Menlo", "Source Code Pro", "Monaco", "Consolas",
    monospace;
  font-weight: 500;
`

const EditorBoxWrapper = styled.div`
  position: relative;
  background: ${colors.editorBackground};
  width: ${WIDTH}px;
  height: ${HEIGHT}px;
  max-width: ${WIDTH}px;
  max-height: ${HEIGHT}px;
  overflow: scroll;
  margin-bottom: 50px;
`

const CodeUnderlay = styled.div`
  ${editorBox};
  pointer-events: none;
  box-shadow: 0 3px 6px 2px rgba(0, 0, 0, 0.1);
  span {
    display: inline-block;
    white-space: pre;
  }
`

const SelectionUnderlay = CodeUnderlay.extend`
  span {
    color: rgba(0, 0, 0, 0);
  }
`

const EditorWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

const ActivityIndicatorWrapper = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
`

const ActivityIndicatorInnerWrapper = styled.div`
  background: ${colors.editorBackground};
  display: inline-block;
  line-height: 0px;
  padding: 8px;
`

const TextArea = styled.textarea`
  ${editorBox};
  opacity: 0;
  border: 0;
  outline: 0;
  line-height: 1.4em;
  font-size: 16px;
  border-radius: 0;
`

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

export class Editor extends React.Component<
  { text: string },
  {
    text: string
    selectionStart: number
    selectionEnd: number
    pretty: boolean
  }
> {
  state = {
    text: this.props.text,
    selectionStart: 0,
    selectionEnd: 0,
    pretty: true,
  }

  timeout = null as NodeJS.Timer | null

  setNewText = (ev: React.FormEvent<HTMLTextAreaElement>) => {
    let text = ev.currentTarget.value
    if (!text.endsWith("\n")) {
      text = text + "\n"
    }
    this.setState({ text })
    this.handleSelectionChange()
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
    this.timeout = setTimeout(async () => {
      if (this.textArea) {
        try {
          const { formatted } = await formatCode(
            text,
            this.textArea.selectionStart,
            this.getPrintWidth(),
          )
          this.setState({ pretty: formatted === text })
        } catch {}
      }
    }, 100)
  }

  textArea: HTMLTextAreaElement | null = null
  codeUnderlay: HTMLDivElement | null = null
  selectionUnderlay: HTMLDivElement | null = null

  handleSelectionChange = () => {
    if (this.textArea) {
      this.setState({
        selectionStart: this.textArea.selectionStart,
        selectionEnd: this.textArea.selectionEnd,
      })
    }
  }

  getPrintWidth = () => {
    if (!this.codeUnderlay) {
      return 50
    }

    const elem = this.codeUnderlay.children[0]

    if (!elem) {
      return 50
    }

    if (!elem.textContent) {
      console.error("child element has no text content")
      return 50
    }

    const textAreaWidth = WIDTH - 2 * H_PADDING

    const charWidth =
      elem.getBoundingClientRect().width / elem.textContent.length

    return Math.floor(textAreaWidth / charWidth)
  }

  moves: Array<{
    newIndex: number
    oldBoundingBox: ClientRect
    text: string
  }> | null = null

  transitionTimeout: NodeJS.Timer | null = null

  componentDidUpdate() {
    if (this.moves && this.codeUnderlay) {
      const moves = this.moves
      this.moves = null

      for (const { newIndex, text, oldBoundingBox } of moves) {
        const child = this.codeUnderlay.children[newIndex] as HTMLSpanElement

        if (!child) {
          console.error("what! Things don't line up :(")
          return
        }

        if (child.textContent !== text) {
          console.error(
            "wut!? text dont match :(",
            JSON.stringify({ textContent: child.textContent, text }),
          )
          return
        }

        if (!(child instanceof HTMLSpanElement)) {
          console.error("wut!? child not a span :(")
          return
        }

        const { top, left } = diffBoundingBoxes(
          oldBoundingBox,
          child.getBoundingClientRect(),
        )

        child.style.transition = ``
        child.style.transform = `translate(${left}px, ${top}px)`
      }

      if (this.transitionTimeout) {
        clearTimeout(this.transitionTimeout)
      }

      this.transitionTimeout = setTimeout(() => {
        if (this.codeUnderlay) {
          for (const { newIndex } of moves) {
            const child = this.codeUnderlay.children[
              newIndex
            ] as HTMLSpanElement
            if (!child) {
              console.error("childs not the same as before :(")
              continue
            }
            child.style.transition = `transform 0.14s ease-out`
            child.style.transform = "translate(0px, 0px)"
          }
        }
      }, 30)
    }
  }

  handleSave = async (ev: KeyboardEvent) => {
    if (ev.key === "s" && ev.metaKey && this.textArea && this.codeUnderlay) {
      ev.preventDefault()
      try {
        const text = this.textArea.value
        const { formatted, cursorOffset } = await formatCode(
          text,
          this.textArea.selectionStart,
          this.getPrintWidth(),
        )

        // TODO render this biz without the cursor. Or put the cursor at the start every time

        const oldSpans = renderCode(this.state.text, tokenize(this.state.text))

        this.textArea.value = formatted
        this.textArea.selectionStart = this.textArea.selectionEnd = cursorOffset

        const newSpans = renderCode(formatted, tokenize(formatted))

        const moved = movedSpans(oldSpans, newSpans)

        const moves = []
        for (const { oldIndex, newIndex } of moved) {
          if (
            this.codeUnderlay.children[oldIndex].textContent !==
            oldSpans[oldIndex].text
          ) {
            console.error("things don't match up")
            return
          }

          moves.push({
            newIndex,
            text: newSpans[newIndex].text,
            oldBoundingBox: this.codeUnderlay.children[
              oldIndex
            ].getBoundingClientRect(),
          })
        }

        this.moves = moves

        this.setState({ pretty: true, text: formatted })
        this.handleSelectionChange()
      } catch (e) {
        console.error(e)
      }
    }
  }

  componentDidMount() {
    window.addEventListener("keydown", this.handleSave)
    document.addEventListener("selectionchange", this.handleSelectionChange)
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.handleSave)
    document.removeEventListener("selectionchange", this.handleSelectionChange)
  }

  render() {
    const { text, selectionStart, selectionEnd, pretty } = this.state

    return (
      <EditorWrapper>
        <ActivityIndicatorWrapper>
          <ActivityIndicatorInnerWrapper>
            <PrettierActivitiyIndicator dirty={!pretty} />
          </ActivityIndicatorInnerWrapper>
        </ActivityIndicatorWrapper>
        <EditorBoxWrapper>
          <SelectionUnderlay innerRef={ref => (this.selectionUnderlay = ref)}>
            {renderSelection(
              text,
              tokenize(text),
              selectionStart,
              selectionEnd,
            ).map(({ className, text }) => (
              <span className={className}>{text}</span>
            ))}
          </SelectionUnderlay>
          <CodeUnderlay innerRef={ref => (this.codeUnderlay = ref)}>
            {renderCode(text, tokenize(text)).map(renderSpan)}
          </CodeUnderlay>
          <TextArea
            onInput={this.setNewText}
            onKeyDown={ev => {
              if (ev.key === "Tab" && this.textArea) {
                ev.preventDefault()
                const startPos = this.textArea.selectionStart
                const endPos = this.textArea.selectionEnd

                const newText =
                  this.textArea.value.slice(0, startPos) +
                  "  " +
                  this.textArea.value.slice(endPos)
                this.textArea.value = newText
                this.textArea.selectionStart = startPos + 2
                this.textArea.selectionEnd = startPos + 2
                this.setNewText(ev)
              }
            }}
            defaultValue={text}
            innerRef={ref => {
              this.textArea = ref
              if (this.textArea) {
                this.textArea.onscroll = () => {
                  if (
                    this.codeUnderlay &&
                    this.textArea &&
                    this.selectionUnderlay
                  ) {
                    this.codeUnderlay.scrollTop = this.textArea.scrollTop
                    this.selectionUnderlay.scrollTop = this.textArea.scrollTop
                  }
                }
              }
            }}
          />
        </EditorBoxWrapper>
      </EditorWrapper>
    )
  }
}

function diffBoundingBoxes(boxA: Rect, boxB: Rect): Rect {
  return {
    left: boxA.left - boxB.left,
    top: boxA.top - boxB.top,
    width: boxA.width - boxB.width,
    height: boxA.height - boxB.height,
  }
}
