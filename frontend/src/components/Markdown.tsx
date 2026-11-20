import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/** Renders the model's markdown answers (headings, lists, tables, links). */
function Markdown({ content }: { content: string }) {
  return (
    <div className="markdown text-sm leading-7 text-[#172033]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-gray-200">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default Markdown
