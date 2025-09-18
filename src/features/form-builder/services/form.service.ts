import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/libs/firebase'
import { logger } from '@/utils/logger'
import type {
  CustomForm,
  CreateFormInput,
  UpdateFormInput,
  FormSubmission
} from '@/entities/form/form.types'
import type { UserId } from '@/entities/user/user.types'

const FORMS_COLLECTION = 'forms'
const SUBMISSIONS_COLLECTION = 'form_submissions'

export class FormService {
  static async createForm(input: CreateFormInput, createdBy: UserId): Promise<string> {
    try {
      logger.info('Creating new form', { title: input.title, createdBy })

      const formData = {
        title: input.title,
        description: input.description || '',
        fields: input.fields.map((field, index) => ({
          ...field,
          id: crypto.randomUUID(),
          order: index
        })),
        settings: input.settings,
        createdBy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      }

      const docRef = await addDoc(collection(db, FORMS_COLLECTION), formData)

      logger.info('Form created successfully', { formId: docRef.id, createdBy })
      return docRef.id
    } catch (error) {
      logger.error('Failed to create form', { input, createdBy, error })
      throw error
    }
  }

  static async updateForm(input: UpdateFormInput, userId: UserId): Promise<void> {
    try {
      logger.info('Updating form', { formId: input.id, userId })

      const formRef = doc(db, FORMS_COLLECTION, input.id)
      const formDoc = await getDoc(formRef)

      if (!formDoc.exists()) {
        throw new Error('Form not found')
      }

      const formData = formDoc.data()

      // Check if user owns the form or is admin
      if (formData.createdBy !== userId) {
        // This should be checked at the component level with permissions
        throw new Error('Unauthorized to update this form')
      }

      const updateData: any = {
        updatedAt: serverTimestamp()
      }

      if (input.title !== undefined) updateData.title = input.title
      if (input.description !== undefined) updateData.description = input.description
      if (input.fields !== undefined) updateData.fields = input.fields
      if (input.settings !== undefined) updateData.settings = input.settings
      if (input.isActive !== undefined) updateData.isActive = input.isActive

      await updateDoc(formRef, updateData)

      logger.info('Form updated successfully', { formId: input.id, userId })
    } catch (error) {
      logger.error('Failed to update form', { input, userId, error })
      throw error
    }
  }

  static async deleteForm(formId: string, userId: UserId): Promise<void> {
    try {
      logger.info('Deleting form', { formId, userId })

      const formRef = doc(db, FORMS_COLLECTION, formId)
      const formDoc = await getDoc(formRef)

      if (!formDoc.exists()) {
        throw new Error('Form not found')
      }

      const formData = formDoc.data()

      // Check if user owns the form or is admin
      if (formData.createdBy !== userId) {
        throw new Error('Unauthorized to delete this form')
      }

      await deleteDoc(formRef)

      logger.info('Form deleted successfully', { formId, userId })
    } catch (error) {
      logger.error('Failed to delete form', { formId, userId, error })
      throw error
    }
  }

  static async getForm(formId: string): Promise<CustomForm | null> {
    try {
      logger.info('Fetching form', { formId })

      const formDoc = await getDoc(doc(db, FORMS_COLLECTION, formId))

      if (!formDoc.exists()) {
        return null
      }

      const data = formDoc.data()
      return {
        id: formDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as CustomForm
    } catch (error) {
      logger.error('Failed to fetch form', { formId, error })
      throw error
    }
  }

  static async getUserForms(userId: UserId): Promise<CustomForm[]> {
    try {
      logger.info('Fetching user forms', { userId })

      const q = query(
        collection(db, FORMS_COLLECTION),
        where('createdBy', '==', userId),
        orderBy('updatedAt', 'desc')
      )

      const querySnapshot = await getDocs(q)
      const forms: CustomForm[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        forms.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as CustomForm)
      })

      logger.info('User forms fetched successfully', { userId, count: forms.length })
      return forms
    } catch (error) {
      logger.error('Failed to fetch user forms', { userId, error })
      throw error
    }
  }

  static async getAllForms(): Promise<CustomForm[]> {
    try {
      logger.info('Fetching all forms')

      const q = query(
        collection(db, FORMS_COLLECTION),
        orderBy('updatedAt', 'desc')
      )

      const querySnapshot = await getDocs(q)
      const forms: CustomForm[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        forms.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as CustomForm)
      })

      logger.info('All forms fetched successfully', { count: forms.length })
      return forms
    } catch (error) {
      logger.error('Failed to fetch all forms', { error })
      throw error
    }
  }

  static async submitForm(formId: string, data: Record<string, unknown>, submittedBy?: UserId, submitterEmail?: string): Promise<string> {
    try {
      logger.info('Submitting form', { formId, submittedBy })

      const submissionData = {
        formId,
        submittedBy: submittedBy || null,
        submitterEmail: submitterEmail || null,
        data,
        submittedAt: serverTimestamp(),
        ipAddress: 'unknown' // In a real app, you'd get this from the request
      }

      const docRef = await addDoc(collection(db, SUBMISSIONS_COLLECTION), submissionData)

      logger.info('Form submitted successfully', { formId, submissionId: docRef.id, submittedBy })
      return docRef.id
    } catch (error) {
      logger.error('Failed to submit form', { formId, submittedBy, error })
      throw error
    }
  }

  static async getFormSubmissions(formId: string): Promise<FormSubmission[]> {
    try {
      logger.info('Fetching form submissions', { formId })

      const q = query(
        collection(db, SUBMISSIONS_COLLECTION),
        where('formId', '==', formId),
        orderBy('submittedAt', 'desc')
      )

      const querySnapshot = await getDocs(q)
      const submissions: FormSubmission[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        submissions.push({
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate() || new Date(),
        } as FormSubmission)
      })

      logger.info('Form submissions fetched successfully', { formId, count: submissions.length })
      return submissions
    } catch (error) {
      logger.error('Failed to fetch form submissions', { formId, error })
      throw error
    }
  }

  static async duplicateForm(formId: string, userId: UserId): Promise<string> {
    try {
      logger.info('Duplicating form', { formId, userId })

      const originalForm = await this.getForm(formId)
      if (!originalForm) {
        throw new Error('Form not found')
      }

      const duplicateInput: CreateFormInput = {
        title: `${originalForm.title} (Copy)`,
        description: originalForm.description,
        fields: originalForm.fields.map(field => ({
          type: field.type,
          label: field.label,
          placeholder: field.placeholder,
          description: field.description,
          required: field.required,
          options: field.options,
          validation: field.validation,
          defaultValue: field.defaultValue,
          order: field.order
        })),
        settings: { ...originalForm.settings }
      }

      const newFormId = await this.createForm(duplicateInput, userId)

      logger.info('Form duplicated successfully', { originalFormId: formId, newFormId, userId })
      return newFormId
    } catch (error) {
      logger.error('Failed to duplicate form', { formId, userId, error })
      throw error
    }
  }
}