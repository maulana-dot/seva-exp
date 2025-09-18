import { format, parseISO, isValid } from 'date-fns'

export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (!isValid(dateObj)) {
    return 'Invalid Date'
  }

  return format(dateObj, 'MMM dd, yyyy')
}

export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (!isValid(dateObj)) {
    return 'Invalid Date'
  }

  return format(dateObj, 'MMM dd, yyyy hh:mm a')
}

export const formatDateForInput = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (!isValid(dateObj)) {
    return ''
  }

  return format(dateObj, 'yyyy-MM-dd')
}