import React, { useState, useRef, useEffect } from "react";

export function MentionTextarea({
  value,
  onChange,
  onSubmit,
  members,
  placeholder,
  className,
  autoFocus
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  members: any[];
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const [mentionIndex, setMentionIndex] = useState(-1);
  const [mentionQuery, setMentionQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentionIndex >= 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex(i => Math.min(i + 1, filteredMembers.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex(i => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (filteredMembers[mentionIndex]) {
          insertMention(filteredMembers[mentionIndex].name);
        }
        return;
      }
      if (e.key === "Escape") {
        setMentionIndex(-1);
        return;
      }
    } else {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSubmit();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9]*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentionIndex(0);
    } else {
      setMentionIndex(-1);
    }
  };

  const insertMention = (name: string) => {
    const cursor = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursor);
    const textAfterCursor = value.slice(cursor);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9]*)$/);
    
    if (match) {
      const startPos = textBeforeCursor.lastIndexOf("@");
      const newValue = value.slice(0, startPos) + `@[${name}] ` + textAfterCursor;
      onChange(newValue);
      setMentionIndex(-1);
      
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursor = startPos + name.length + 4; // @[name] + space
          textareaRef.current.setSelectionRange(newCursor, newCursor);
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  const filteredMembers = members.filter(m => m.name.toLowerCase().includes(mentionQuery.toLowerCase()));

  return (
    <div className="relative flex-1">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        rows={1}
      />
      {mentionIndex >= 0 && filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 w-48 rounded-md border border-zinc-700 bg-surface shadow-xl overflow-hidden z-50 text-xs">
          {filteredMembers.map((m, i) => (
            <div
              key={m.id}
              onClick={() => insertMention(m.name)}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2 ${i === mentionIndex ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:bg-zinc-800'}`}
            >
              {m.avatar ? (
                <img src={m.avatar} alt={m.name} className="size-4 shrink-0 rounded-full object-cover" />
              ) : (
                <span className={`grid size-4 shrink-0 place-items-center rounded-full ${m.color || 'bg-zinc-700'} text-[8px] font-bold text-zinc-950`}>
                  {m.name.charAt(0)}
                </span>
              )}
              <span>{m.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function parseMentions(text: string) {
  const parts = text.split(/(@\[[^\]]+\])/g);
  return parts.map((part, i) => {
    if (part.startsWith('@[') && part.endsWith(']')) {
      const name = part.slice(2, -1);
      return <span key={i} className="font-semibold text-brand bg-brand/10 px-1 rounded-sm">{`@${name}`}</span>;
    }
    return part;
  });
}
