import * as React from "react"

import * as bowser from "bowser"
import immer from "immer"
import styled, { css } from "styled-components"
import { tokenize as _tokenize } from "./tokenize"
import * as colors from "./colors"
import { formatCode } from "./prettierWorker"
import {
  renderCode as _renderCode,
  renderSpan,
  renderSelection,
} from "./renderCode"
import { movedSpans } from "./movedSpans"
import throttle from "lodash/throttle"
import memoize from "lodash/memoize"

const tokenize = memoize(_tokenize)
const renderCode = memoize(_renderCode)

const WIDTH = 600
const HEIGHT = 500
const H_PADDING = 20

const editorBox = css`
  transition: transform 0.24s ease-out;
  position: absolute;
  top: 0;
  left: 0;
  min-width: ${WIDTH}px;
  min-height: ${HEIGHT}px;
  transform-origin: top left;
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

interface MovedSpan {
  type: "moved span"
  newIndex: number
  oldBoundingBox: ClientRect
  text: string
}

interface EnteringSpan {
  type: "entering span"
  index: number
  text: string
}

type SpanTransition = MovedSpan | EnteringSpan

interface Props {
  text: string
}
interface State {
  history: {
    entries: HistoryEntry[]
    offset: number
  }
}
interface Snapshot {
  spanTransitions: SpanTransition[]
  cursorBoundingBox?: ClientRect
}

export class Editor extends React.Component<Props, State, Snapshot> {
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
  }

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

        // +1 px for weird safari issue where fonts don't render the same
        // in text area
        this.textArea.style.width = actualWidth + 1 + "px"
        this.textArea.style.height = actualHeight + HEIGHT + "px"

        const ratio = WIDTH / actualWidth

        const transform = `scale(${ratio})`
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

  lastRenderedState: HistoryEntry = this.getCurrentState()
  animateNextTransition: boolean = false

  getSnapshotBeforeUpdate() {
    if (this.animateNextTransition && this.textArea && this.codeUnderlay) {
      this.animateNextTransition = false

      const { text: oldText } = this.lastRenderedState
      const { text: newText } = this.getCurrentState()

      const oldSpans = renderCode(oldText, tokenize(oldText))
      const newSpans = renderCode(newText, tokenize(newText))

      const moves = movedSpans(oldSpans, newSpans)

      const spanTransitions: SpanTransition[] = []

      let i = 0
      for (const { oldIndex, newIndex } of moves) {
        while (i < newIndex) {
          if (newSpans[i].text.trim() !== "") {
            console.log("entering", newSpans[i].text)
            spanTransitions.push({
              type: "entering span",
              index: i,
              text: newSpans[i].text,
            })
          }
          i++
        }
        i++

        if (!this.codeUnderlay.children[oldIndex]) {
          console.error("things don't match up", oldIndex, newIndex)
          break
        }
        if (
          this.codeUnderlay.children[oldIndex].textContent !==
          oldSpans[oldIndex].text
        ) {
          console.error("things don't match up")
          return null
        }

        spanTransitions.push({
          type: "moved span",
          newIndex,
          text: newSpans[newIndex].text,
          oldBoundingBox: this.codeUnderlay.children[
            oldIndex
          ].getBoundingClientRect(),
        })
      }

      const cursor = this.getCursor()
      if (cursor) {
        return {
          spanTransitions,
          cursorBoundingBox: cursor.getBoundingClientRect(),
        }
      }

      return { spanTransitions }
    }
    return null
  }

  componentDidUpdate(_prevProps: Props, _prevState: State, snapshot: Snapshot) {
    this.lastRenderedState = this.getCurrentState()
    if (snapshot !== null && this.codeUnderlay && this.wrapperRef) {
      if (this.textArea) {
        this.textArea.value = this.lastRenderedState.text
        this.textArea.selectionStart = this.lastRenderedState.selectionStart
        this.textArea.selectionEnd = this.lastRenderedState.selectionEnd
      }
      const { cursorBoundingBox, spanTransitions } = snapshot

      for (const transition of spanTransitions) {
        switch (transition.type) {
          case "moved span":
            {
              const { newIndex, text, oldBoundingBox } = transition
              const child = this.codeUnderlay.children[
                newIndex
              ] as HTMLSpanElement

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
              if (top !== 0 || left !== 0) {
                child.style.transform = `translate(${left}px, ${top}px)`
              } else {
                child.style.transform = ``
              }
            }
            break
          case "entering span":
            {
              const { index, text } = transition
              console.log("yes entering", text)
              if (text.trim() === "") {
                break
              }
              const child = this.codeUnderlay.children[index] as HTMLSpanElement
              if (!child) {
                console.error("What! no child at given :(")
                return
              }

              child.style.transition = ``
              child.style.opacity = "0"
              child.style.transform = `translateY(-20px)`
            }
            break
        }
      }

      const cursor = this.getCursor()
      if (cursorBoundingBox && cursor) {
        const newCursorBoundingBox = cursor.getBoundingClientRect()
        const { top, left } = diffBoundingBoxes(
          cursorBoundingBox,
          newCursorBoundingBox,
        )
        cursor.style.transition = ``
        cursor.style.transform = `translate(${left}px, ${top}px)`

        const wrapperBoundingBox = this.wrapperRef.getBoundingClientRect()

        const bottomDiff =
          newCursorBoundingBox.top +
          newCursorBoundingBox.height -
          (wrapperBoundingBox.top + wrapperBoundingBox.height)

        if (bottomDiff > 0) {
          // cursor is too low
          this.wrapperRef.scrollBy({
            top: bottomDiff + 100,
            behavior: "smooth",
          })
        } else if (newCursorBoundingBox.top < wrapperBoundingBox.top) {
          // cursor is too high
          const diff = wrapperBoundingBox.top - newCursorBoundingBox.top
          // scroll up
          this.wrapperRef.scrollBy({
            top: -(diff + 100),
            behavior: "smooth",
          })
        }
      }

      if (this.transitionTimeout) {
        clearTimeout(this.transitionTimeout)
      }

      this.transitionTimeout = setTimeout(() => {
        if (this.codeUnderlay) {
          for (const transition of spanTransitions) {
            switch (transition.type) {
              case "moved span":
                {
                  const child = this.codeUnderlay.children[
                    transition.newIndex
                  ] as HTMLSpanElement
                  if (!child) {
                    console.error("childs not the same as before :(")
                    continue
                  }
                  if (child.style.transform !== "") {
                    child.style.transition = `transform 0.24s ease-out`
                    child.style.transform = "translate(0px, 0px)"
                  }
                }
                break
              case "entering span": {
                if (transition.text.trim() === "") {
                  break
                }
                const child = this.codeUnderlay.children[
                  transition.index
                ] as HTMLSpanElement
                if (!child) {
                  console.error("childs not the same as before :(")
                  continue
                }
                child.style.transition = `transform 0.24s ease-out, opacity 0.3s ease-out`
                child.style.transform = "translateY(0px)"
                child.style.opacity = "1"
              }
            }
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

        this.animateNextTransition = true
        this.pushHistory({
          text: formatted,
          selectionStart: cursorOffset,
          selectionEnd: cursorOffset,
          timestamp: Date.now(),
        })
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
          this.animateNextTransition = true
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
    this.lastRenderedState = this.getCurrentState()
    this.updateEditorSize()
    window.addEventListener("keydown", this.handleKeyDown)
    document.addEventListener("selectionchange", this.handleSelectionChange)
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.handleKeyDown)
    document.removeEventListener("selectionchange", this.handleSelectionChange)
  }

  wrapperRef: HTMLDivElement | null = null

  render() {
    const { text, selectionStart, selectionEnd } = this.getCurrentState()

    return (
      <EditorWrapper>
        <EditorBoxWrapper
          onScroll={ev => (ev.currentTarget.scrollLeft = 0)}
          innerRef={ref => (this.wrapperRef = ref)}
        >
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
