import Icon from '../common/Icon'
import ChatActionCard from './ChatActionCard'
import type { ChatMessage } from '../../types'

interface ChatMessageBubbleProps {
  message: ChatMessage
  onRespondAction: (action: 'accept' | 'reject' | 'confirm' | 'cancel') => void
  onOpenWallbitDetails: () => void
  actionBusy?: boolean
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatMessageBubble({ message, onRespondAction, onOpenWallbitDetails, actionBusy }: ChatMessageBubbleProps) {
  if (message.from === 'agent') {
    return (
      <div className="flex gap-4 max-w-[80%] animate-in-up">
        <div className="w-10 h-10 rounded-full bg-brand flex-shrink-0 flex items-center justify-center ai-glow border border-cta/40">
          <Icon name="smart_toy" className="text-cta" filled />
        </div>
        <div className="flex flex-col gap-2">
          <div className="agent-bubble p-5 rounded-[24px] shadow-sm">
            <p className="font-body-md text-brand leading-relaxed">{message.text}</p>
          </div>
          {message.action && (
            <ChatActionCard
              action={message.action}
              resolution={message.actionResolution}
              onRespond={onRespondAction}
              onOpenWallbitDetails={onOpenWallbitDetails}
              busy={actionBusy}
            />
          )}
          <span className="text-[10px] text-on-surface-variant/60 ml-2 font-bold">{formatTime(message.createdAt)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-4 max-w-[80%] flex-row-reverse self-end animate-in-up">
      <div className="w-10 h-10 rounded-full flex-shrink-0 border-2 border-cta bg-premium flex items-center justify-center">
        <span className="text-bone text-[10px] font-bold">TU</span>
      </div>
      <div className="flex flex-col gap-2 items-end">
        <div className="user-bubble p-5 rounded-[24px] shadow-sm">
          <p className="font-body-md leading-relaxed">{message.text}</p>
        </div>
        <span className="text-[10px] text-on-surface-variant/60 mr-2 font-bold">{formatTime(message.createdAt)}</span>
      </div>
    </div>
  )
}
