import * as React from "react"

import * as bowser from "bowser"
import immer from "immer"
import styled, { css } from "styled-components"
import { tokenize } from "./tokenize"
import * as colors from "./colors"
import { formatCode } from "./prettierWorker"
import { renderCode, renderSpan, renderSelection } from "./renderCode"
import { movedSpans } from "./movedSpans"
import throttle from "lodash/throttle"

const WIDTH = 600
const HEIGHT = 500
const H_PADDING = 20

const editorBox = css`
  transition: transform 0.24s linear;
  position: absolute;
  top: 0;
  left: 0;
  min-width: ${WIDTH}px;
  min-height: ${HEIGHT}px;
  padding: 20px ${H_PADDING}px;
  margin: 0;
  white-space: pre;
  font-family: "Fira Code", "Menlo", "Source Code Pro", "Monaco", "Consolas",
    monospace;
  font-weight: 500;
  -ms-overflow-style: none;
`

const EditorBoxWrapper = styled.div`
  position: relative;
  background: ${colors.editorBackground};
  width: ${WIDTH}px;
  height: ${HEIGHT}px;
  max-width: ${WIDTH}px;
  max-height: ${HEIGHT}px;
  -ms-overflow-style: none;
  overflow-y: scroll;
  overflow-x: hidden;
  margin-bottom: 50px;
`

const CodeUnderlay = styled.div`
  ${editorBox};
  pointer-events: none;
  span {
    display: inline-block;
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

interface HistoryEntry {
  text: string
  selectionStart: number
  selectionEnd: number
  timestamp: number
}

export class Editor extends React.Component<
  { text: string },
  {
    history: {
      entries: HistoryEntry[]
      offset: number
    }
    pretty: boolean
  }
> {
  state = {
    history: {
      entries: [
        {
          text: this.props.text,
          timestamp: Date.now(),
          selectionStart: 0,
          selectionEnd: 0,
        },
      ],
      offset: 0,
    },
    pretty: true,
  }

  timeout = null as NodeJS.Timer | null

  getCurrentState = () => {
    return this.state.history.entries[this.state.history.offset]
  }

  _applyCurrentState = () => {
    const { text, selectionStart, selectionEnd } = this.getCurrentState()
    if (this.textArea) {
      this.textArea.value = text
      this.textArea.selectionStart = selectionStart
      this.textArea.selectionEnd = selectionEnd
    }
  }

  undo = () => {
    this.setState(
      state =>
        immer(state, draft => {
          draft.history.offset = Math.max(draft.history.offset - 1, 0)
        }),
      this._applyCurrentState,
    )
  }

  redo = () => {
    this.setState(
      state =>
        immer(state, draft => {
          draft.history.offset = Math.min(
            draft.history.offset + 1,
            draft.history.entries.length - 1,
          )
        }),
      this._applyCurrentState,
    )
  }

  pushHistory = (entry: HistoryEntry) => {
    // very low-effort and shitty history pruning. Basically debounce updates
    // by 300ms
    const lastTimestamp = this.state.history.entries[this.state.history.offset]
      .timestamp
    const shouldPush = entry.timestamp - lastTimestamp > 300

    this.setState(state =>
      immer(state, draft => {
        draft.history.entries.length = draft.history.offset + 1
        if (shouldPush) {
          draft.history.entries.push(entry)
          draft.history.offset++
        } else {
          draft.history.entries[draft.history.offset] = entry
        }
      }),
    )
  }

  setNewText = (ev: React.FormEvent<HTMLTextAreaElement>) => {
    let text = ev.currentTarget.value
    if (!text.endsWith("\n")) {
      text = text + "\n"
    }
    this.pushHistory({
      text,
      selectionStart: ev.currentTarget.selectionStart,
      selectionEnd: ev.currentTarget.selectionEnd,
      timestamp: Date.now(),
    })
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
    this.setState(state =>
      immer(state, draft => {
        if (this.textArea) {
          draft.history.entries[
            draft.history.offset
          ].selectionStart = this.textArea.selectionStart
          draft.history.entries[
            draft.history.offset
          ].selectionEnd = this.textArea.selectionEnd
        }
      }),
    )
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

  cursorBoundingBox: ClientRect | null = null

  getCursor = (): HTMLSpanElement | null => {
    if (this.selectionUnderlay) {
      const cursor = this.selectionUnderlay.querySelector(".cursor")
      if (cursor) {
        return cursor as HTMLSpanElement
      }
    }
    return null
  }

  transitionTimeout: NodeJS.Timer | null = null

  updateEditorSize = throttle(
    () => {
      if (this.codeUnderlay && this.textArea && this.selectionUnderlay) {
        const actualWidth = this.codeUnderlay.offsetWidth
        const actualHeight = this.codeUnderlay.offsetHeight

        this.textArea.style.width = actualWidth + "px"
        this.textArea.style.height = actualHeight + HEIGHT / 2 + "px"

        const ratio = WIDTH / actualWidth
        const xOffset = (actualWidth - WIDTH) / 2
        const yOffset = (actualHeight - actualHeight * ratio) / 2

        const transform = `translate(${-xOffset}px, ${-yOffset}px) scale(${ratio})`
        this.codeUnderlay.style.transform = transform
        this.selectionUnderlay.style.transform = transform
        this.textArea.style.transform = transform

        if (this.codeUnderlay.parentElement) {
          this.codeUnderlay.parentElement.scrollLeft = 0
        }
      }
    },
    120,
    { trailing: true },
  )

  componentDidUpdate() {
    if (this.moves && this.codeUnderlay) {
      const cursorBoundingBox = this.cursorBoundingBox
      this.cursorBoundingBox = null
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

      const cursor = this.getCursor()
      if (cursorBoundingBox && cursor) {
        const { top, left } = diffBoundingBoxes(
          cursorBoundingBox,
          cursor.getBoundingClientRect(),
        )
        cursor.style.transition = ``
        cursor.style.transform = `translate(${left}px, ${top}px)`
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
            child.style.transition = `transform 0.24s ease-out`
            child.style.transform = "translate(0px, 0px)"
          }
        }
        if (cursor) {
          cursor.style.transition = `transform 0.24s ease-out`
          cursor.style.transform = "translate(0px, 0px)"
        }
      }, 30)
    }
    this.updateEditorSize()
  }

  runPrettier = async () => {
    if (this.textArea && this.codeUnderlay) {
      try {
        const text = this.textArea.value
        const { formatted, cursorOffset } = await formatCode(
          text,
          this.textArea.selectionStart,
          this.getPrintWidth(),
        )

        // TODO render this biz without the cursor. Or put the cursor at the start every time

        const { text: oldText } = this.getCurrentState()

        const oldSpans = renderCode(oldText, tokenize(oldText))

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

        const cursor = this.getCursor()
        if (cursor) {
          this.cursorBoundingBox = cursor.getBoundingClientRect()
        }

        this.pushHistory({
          text: formatted,
          selectionStart: cursorOffset,
          selectionEnd: cursorOffset,
          timestamp: Date.now(),
        })
        this.setState({ pretty: true })
      } catch (e) {
        console.error(e)
      }
    }
  }

  handleKeyDown = async (ev: KeyboardEvent) => {
    const isCorrectModifierKeyPressed =
      (bowser.mac && ev.metaKey) || (!bowser.mac && ev.ctrlKey)
    if (isCorrectModifierKeyPressed) {
      switch (ev.key) {
        case "s":
          ev.preventDefault()
          this.runPrettier()
          break
        case "z":
          ev.preventDefault()
          if (ev.shiftKey) {
            this.redo()
          } else {
            this.undo()
          }
          break
      }
    }
  }

  componentDidMount() {
    this.updateEditorSize()
    window.addEventListener("keydown", this.handleKeyDown)
    document.addEventListener("selectionchange", this.handleSelectionChange)
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.handleKeyDown)
    document.removeEventListener("selectionchange", this.handleSelectionChange)
  }

  scaleWrapperRef: HTMLDivElement | null = null

  render() {
    const { pretty } = this.state
    const { text, selectionStart, selectionEnd } = this.getCurrentState()

    return (
      <EditorWrapper>
        <EditorBoxWrapper onScroll={ev => (ev.currentTarget.scrollLeft = 0)}>
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
