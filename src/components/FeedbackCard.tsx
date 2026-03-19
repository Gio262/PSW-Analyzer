interface FeedbackItem {
  text: string
  isOk: boolean
}

interface FeedbackCardProps {
  title: string
  items: FeedbackItem[]
  hasData: boolean
}

export function FeedbackCard({ title, items, hasData }: FeedbackCardProps) {
  return (
    <div className="card">
      <div className="card-title"><span>//</span> {title}</div>
      {hasData ? (
        <ul className="feedback-list">
          {items.map((item, i) => (
            <li key={`${item.text}-${i}`} className={item.isOk ? 'ok' : ''}>{item.text}</li>
          ))}
        </ul>
      ) : (
        <div className="placeholder-text">-</div>
      )}
    </div>
  )
}
