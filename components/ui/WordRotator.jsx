'use client'

import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import './WordRotator.css'

const WORDS = ['the US', 'Europe']

function WordRotator() {
  const [index, setIndex] = useState(0)
  const wordRef = useRef(null)

  useEffect(() => {
    const interval = setInterval(() => {
      // Animate out
      gsap.to(wordRef.current, {
        y: -20,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          setIndex(prev => (prev + 1) % WORDS.length)
          // Reset position below
          gsap.set(wordRef.current, { y: 20, opacity: 0 })
          // Animate in
          gsap.to(wordRef.current, {
            y: 0,
            opacity: 1,
            duration: 0.4,
            ease: 'power2.out',
          })
        },
      })
    }, 2500)

    return () => clearInterval(interval)
  }, [])

  return (
    <span className="word-rotator">
      <span ref={wordRef} className="word-rotator__word">
        {WORDS[index]}
      </span>
    </span>
  )
}

export default WordRotator
