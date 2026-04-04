'use client'

import { useState, useEffect, useRef } from 'react'

function TypeWriter({ lines, typingSpeed = 25, lineDelay = 400, onComplete }) {
  const [displayedLines, setDisplayedLines] = useState([])
  const [currentLine, setCurrentLine] = useState(0)
  const [currentChar, setCurrentChar] = useState(0)
  const [done, setDone] = useState(false)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (currentLine >= lines.length) {
      setDone(true)
      onCompleteRef.current?.()
      return
    }

    const line = lines[currentLine]

    if (currentChar < line.text.length) {
      const timeout = setTimeout(() => {
        setCurrentChar(prev => prev + 1)
      }, typingSpeed)
      return () => clearTimeout(timeout)
    } else {
      const timeout = setTimeout(() => {
        setDisplayedLines(prev => [...prev, line])
        setCurrentLine(prev => prev + 1)
        setCurrentChar(0)
      }, lineDelay)
      return () => clearTimeout(timeout)
    }
  }, [currentLine, currentChar, lines, typingSpeed, lineDelay])

  return (
    <div className="typewriter">
      {displayedLines.map((line, i) => (
        <div key={i} className="typewriter__line">
          <span className="typewriter__text">{line.text}</span>
          {line.status && (
            <span className="typewriter__status">
              [{line.status}]
            </span>
          )}
        </div>
      ))}
      {!done && currentLine < lines.length && (
        <div className="typewriter__line typewriter__line--active">
          <span className="typewriter__text">
            {lines[currentLine].text.slice(0, currentChar)}
          </span>
          <span className="typewriter__cursor">_</span>
        </div>
      )}
    </div>
  )
}

export default TypeWriter
