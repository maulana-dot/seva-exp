export type UserRole = 'admin' | 'manager' | 'user'

export interface User {
  id: UserId
  email: string
  displayName?: string
  role: UserRole
  department?: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface CreateUserInput {
  email: string
  displayName?: string
  role: UserRole
  department?: string
}

export interface UpdateUserInput extends Partial<CreateUserInput> {
  id: UserId
}

export type UserId = string & { readonly brand: unique symbol }