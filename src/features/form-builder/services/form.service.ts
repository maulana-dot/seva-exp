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
  serverTimestamp
} from 'firebase/firestore'
import { db } from '@/libs/firebase'
import { AuditService } from '@/features/audit/services/audit.service'
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
  static async createForm(input: CreateFormInput, createdBy: UserId, userEmail: string): Promise<string> {
    try {
      console.log('Creating new form', { title: input.title, createdBy })

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

      // Log audit trail
      await AuditService.logFormCreated(createdBy, userEmail, docRef.id, input.title)

      console.log('Form created successfully', { formId: docRef.id, createdBy })
      return docRef.id
    } catch (error) {
      console.error('Failed to create form', { input, createdBy, error })
      throw error
    }
  }

  static async updateForm(input: UpdateFormInput, userId: UserId, userEmail: string): Promise<void> {
    try {
      console.log('Updating form', { formId: input.id, userId })

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

      // Log audit trail
      await AuditService.logFormUpdated(userId, userEmail, input.id, formData.title, updateData)

      console.log('Form updated successfully', { formId: input.id, userId })
    } catch (error) {
      console.error('Failed to update form', { input, userId, error })
      throw error
    }
  }

  static async deleteForm(formId: string, userId: UserId, userEmail: string): Promise<void> {
    try {
      console.log('Deleting form', { formId, userId })

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

      // Log audit trail
      await AuditService.logFormDeleted(userId, userEmail, formId, formData.title)

      console.log('Form deleted successfully', { formId, userId })
    } catch (error) {
      console.error('Failed to delete form', { formId, userId, error })
      throw error
    }
  }

  static async getForm(formId: string): Promise<CustomForm | null> {
    try {
      console.log('Fetching form', { formId })

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
      console.error('Failed to fetch form', { formId, error })
      throw error
    }
  }

  static async getUserForms(userId: UserId): Promise<CustomForm[]> {
    try {
      console.log('Fetching user forms', { userId })

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

      console.log('User forms fetched successfully', { userId, count: forms.length })
      return forms
    } catch (error) {
      console.error('Failed to fetch user forms', { userId, error })
      throw error
    }
  }

  static async getAllForms(): Promise<CustomForm[]> {
    try {
      console.log('Fetching all forms')

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

      console.log('All forms fetched successfully', { count: forms.length })
      return forms
    } catch (error) {
      console.error('Failed to fetch all forms', { error })
      throw error
    }
  }

  static async submitForm(formId: string, data: Record<string, unknown>, submittedBy?: UserId, submitterEmail?: string): Promise<string> {
    try {
      console.log('Submitting form', { formId, submittedBy })

      // Get form title for audit logging
      const form = await this.getForm(formId)
      const formTitle = form?.title || 'Unknown Form'

      const submissionData = {
        formId,
        submittedBy: submittedBy || null,
        submitterEmail: submitterEmail || null,
        data,
        submittedAt: serverTimestamp(),
        ipAddress: 'unknown' // In a real app, you'd get this from the request
      }

      const docRef = await addDoc(collection(db, SUBMISSIONS_COLLECTION), submissionData)

      // Log audit trail
      if (submittedBy && submitterEmail) {
        await AuditService.logFormSubmitted(submittedBy, submitterEmail, formId, formTitle, docRef.id)
      }

      console.log('Form submitted successfully', { formId, submissionId: docRef.id, submittedBy })
      return docRef.id
    } catch (error) {
      console.error('Failed to submit form', { formId, submittedBy, error })
      throw error
    }
  }

  static async getFormSubmissions(formId: string): Promise<FormSubmission[]> {
    try {
      console.log('Fetching form submissions', { formId })

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

      console.log('Form submissions fetched successfully', { formId, count: submissions.length })
      return submissions
    } catch (error) {
      console.error('Failed to fetch form submissions', { formId, error })
      throw error
    }
  }

  static async duplicateForm(formId: string, userId: UserId, userEmail: string): Promise<string> {
    try {
      console.log('Duplicating form', { formId, userId })

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

      const newFormId = await this.createForm(duplicateInput, userId, userEmail)

      console.log('Form duplicated successfully', { originalFormId: formId, newFormId, userId })
      return newFormId
    } catch (error) {
      console.error('Failed to duplicate form', { formId, userId, error })
      throw error
    }
  }
}