// do char diff on raw text.
// should be possilbe to infer a source map from that.
// at least you can find out which ranges were deleted from
// the original text, and then map everything else

import * as React from "react"
import styled, { injectGlobal } from "styled-components"
import { Button } from "./Button"
import { GithubMark } from "./GithubMark"
import { Editor } from "./Editor"
import { Hearts } from "./Hearts"
import * as colors from "./colors"
import * as bowser from "bowser"

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
`

const AuthorLinkWrapper = styled.div`
  padding: 30px 0px;
  letter-spacing: 0.3px;
  font-weight: 100;
`

const AuthorLink = styled.a`
  color: ${colors.bodyText};
  font-weight: 500;
  &:hover {
    text-decoration: none;
  }
`

injectGlobal`
  * {
    box-sizing: border-box;
  }
  body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    padding: 0;
    margin: 0;
    padding-top: 10vh;
    font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol";
    color: rgb(192, 206, 216);
    line-height: 1.4em;
    font-size: 16px;
    background: #1a1d21;
  }
  h1 {
    margin-bottom: 60px;
    font-size: 35px;
    font-weight: 200;
    letter-spacing: 4px;
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
    background: rgba(255,255,255, 0.7);
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
    color: hsl(53, 71%, 85%);
  }
  .punctuation {
    color: hsl(203, 20%, 75%);
  }
  .reserved {
    color: hsl(300, 55%, 71%);
  }
  .string {
    color: hsl(32, 76%, 49%);
  }
  .name {
    color: hsl(181, 84%, 84%);
  }
  .number {
    color: hsl(9, 49%, 53%);
  }
  .comment {
    color: hsl(92, 45%, 46%);
  }
  span.space {
    /* for some reason display: inline-block for whitepsace ruins pre-wrap */
    display: inline;
  }
`

const text = `// Hi! This is an experiment using the FLIP
// animation technique to see how Prettier
// would feel with smooth transitions
const instructions = [
  "Type some code",
  "Or delete some code",
  "Whatever",
  "Just mess my biz up fam",
  "But don't make syntax errors",
  "Then hit ${bowser.mac ? "cmd" : "ctrl"} + s",
  "And watch it do a FLIP 🤸",
]

// Delete one of these parameters
function lolThisIsGonnaBeGreat(
  one,
  two,
  three,
) {
  console.log("hahaha")
}

// and maybe delete it again after

`

export const App = () => (
  <PageWrapper>
    <h1>
      Prettier + FLIP = <Hearts />
    </h1>
    <Editor text={text} />
    <Button href="https://github.com/ds300/prettier-thing">
      View source on GitHub <GithubMark />
    </Button>
    <AuthorLinkWrapper>
      by{" "}
      <AuthorLink href="https://twitter.com/djsheldrick">
        @djsheldrick
      </AuthorLink>
    </AuthorLinkWrapper>
  </PageWrapper>
)
