import './Terminal.css'

function Terminal({ title = 'terminal', children }) {
  return (
    <div className="terminal">
      <div className="terminal__header">
        <div className="terminal__dots">
          <span className="terminal__dot terminal__dot--red" />
          <span className="terminal__dot terminal__dot--yellow" />
          <span className="terminal__dot terminal__dot--green" />
        </div>
        <span className="terminal__title">{title}</span>
      </div>
      <div className="terminal__body">
        {children}
      </div>
    </div>
  )
}

export default Terminal
