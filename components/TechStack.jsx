import SectionWrapper from './ui/SectionWrapper'
import { techStack, pipelineStages } from '../data/techStack'
import './TechStack.css'

function TechStack() {
  const getToolById = (id) => techStack.find(t => t.id === id)

  return (
    <SectionWrapper id="tech-stack">
      <div className="stack__header">
        <span className="stack__label">// tech_stack</span>
        <h2 className="stack__title">THE PIPELINE UNDER THE HOOD</h2>
        <p className="stack__desc">
          We don't just consult — we operate. Here's the infrastructure powering every GTMx engagement.
        </p>
      </div>

      <div className="stack__pipeline">
        {pipelineStages.map((stage, i) => (
          <div key={stage.label} className="stack__stage">
            <div className="stack__stage-header">
              <span className="stack__stage-number">0{i + 1}</span>
              <span className="stack__stage-label">{stage.label}</span>
            </div>
            <div className="stack__stage-tools">
              {stage.tools.map(toolId => {
                const tool = getToolById(toolId)
                if (!tool) return null
                return (
                  <div key={tool.id} className="stack__tool">
                    <div
                      className="stack__tool-icon"
                      style={{ borderColor: tool.color }}
                    >
                      <span style={{ color: tool.color }}>{tool.letter}</span>
                    </div>
                    <div className="stack__tool-info">
                      <span className="stack__tool-name">{tool.name}</span>
                      <span className="stack__tool-desc">{tool.description}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            {i < pipelineStages.length - 1 && (
              <div className="stack__connector">
                <span>→</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}

export default TechStack
