import { CornerDownLeft } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface QuestionBoxProps {
  onSubmit: (question: string) => void
  disabled: boolean
  placeholder: string
  /** Re-focus when this changes (e.g. switching conversations) */
  focusKey?: string
  /** Larger version for the welcome hero */
  size?: 'regular' | 'large'
}

/** The question input: Enter sends, Shift+Enter adds a line, grows with the text. */
function QuestionBox({ onSubmit, disabled, placeholder, focusKey, size = 'regular' }: QuestionBoxProps) {
  const [question, setQuestion] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const large = size === 'large'

  useEffect(() => {
    inputRef.current?.focus()
  }, [focusKey])

  const submit = () => {
    const trimmed = question.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed)
    setQuestion('')
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className={`flex items-end gap-2 rounded-md border bg-surface focus-within:border-accent ${
        large ? 'border-line-strong p-2 shadow-[0_4px_16px_rgb(43_29_22/0.06)]' : 'border-line-strong p-1.5'
      }`}
    >
      <textarea
        ref={inputRef}
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            submit()
          }
        }}
        placeholder={placeholder}
        aria-label="Your question"
        rows={1}
        maxLength={1000}
        disabled={disabled}
        className={`max-h-40 flex-1 resize-none bg-transparent px-2.5 text-ink outline-none placeholder:text-faint focus-visible:outline-none [field-sizing:content] ${
          large ? 'min-h-11 py-2.5 text-[15px] leading-6' : 'min-h-9 py-1.5 text-sm leading-6'
        }`}
      />
      <button
        type="submit"
        disabled={!question.trim() || disabled}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-accent px-3.5 text-sm font-medium text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-line-strong ${
          large ? 'h-11 px-4' : 'h-9'
        }`}
      >
        Ask
        <CornerDownLeft size={14} className="hidden opacity-70 sm:block" />
      </button>
    </form>
  )
}

export default QuestionBox
