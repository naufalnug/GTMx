import { useState } from 'react'
import SectionWrapper from './ui/SectionWrapper'
import { faqs } from '../data/faq'
import './FAQ.css'

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <SectionWrapper id="faq">
      <div className="faq__header">
        <span className="faq__label">// faq</span>
        <h2 className="faq__title">FREQUENTLY ASKED</h2>
      </div>

      <div className="faq__list">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className={`faq__item ${openIndex === i ? 'faq__item--open' : ''}`}
          >
            <button className="faq__question" onClick={() => toggle(i)}>
              <span>{faq.question}</span>
              <span className="faq__toggle">{openIndex === i ? '−' : '+'}</span>
            </button>
            <div className="faq__answer-wrapper">
              <p className="faq__answer">{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}

export default FAQ
