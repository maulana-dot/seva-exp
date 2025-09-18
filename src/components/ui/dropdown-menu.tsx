import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface DropdownContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const DropdownContext = createContext<DropdownContextType | undefined>(undefined)

function useDropdown() {
  const context = useContext(DropdownContext)
  if (!context) {
    throw new Error('Dropdown components must be used within DropdownMenu')
  }
  return context
}

interface DropdownMenuProps {
  children: ReactNode
}

function DropdownMenu({ children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

interface DropdownTriggerProps {
  children: ReactNode
  className?: string
}

function DropdownTrigger({ children, className }: DropdownTriggerProps) {
  const { isOpen, setIsOpen } = useDropdown()

  return (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className={cn('outline-none', className)}
    >
      {children}
    </button>
  )
}

interface DropdownContentProps {
  children: ReactNode
  className?: string
  align?: 'start' | 'end'
}

function DropdownContent({ children, className, align = 'end' }: DropdownContentProps) {
  const { isOpen, setIsOpen } = useDropdown()
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, setIsOpen])

  if (!isOpen) return null

  const alignClasses = align === 'end' ? 'right-0' : 'left-0'

  return (
    <div
      ref={contentRef}
      className={cn(
        'absolute z-50 mt-2 w-56 rounded-md border bg-white shadow-lg',
        alignClasses,
        className
      )}
    >
      <div className="py-1">
        {children}
      </div>
    </div>
  )
}

interface DropdownItemProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}

function DropdownItem({ children, onClick, className, disabled }: DropdownItemProps) {
  const { setIsOpen } = useDropdown()

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick()
      setIsOpen(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  )
}

function DropdownSeparator({ className }: { className?: string }) {
  return <div className={cn('my-1 h-px bg-gray-200', className)} />
}

export {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
}