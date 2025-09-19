import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/libs/firebase'
import type {
  FormSubmission,
  CreateFormSubmissionInput,
  FormSubmissionFilters,
} from '@/entities/form-submission/form-submission.types'

const SUBMISSIONS_COLLECTION = 'formSubmissions'

export class FormSubmissionService {
  static async createSubmission(input: CreateFormSubmissionInput): Promise<string> {
    try {
      console.log('Creating form submission', {
        formId: input.formId,
        formTitle: input.formTitle,
        submittedBy: input.submittedBy,
      })

      const submissionData = {
        formId: input.formId,
        formTitle: input.formTitle,
        submissionData: input.submissionData,
        submittedBy: input.submittedBy || null,
        submittedByDepartment: input.submittedByDepartment || null,
        submittedAt: Timestamp.now(),
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
      }

      const docRef = await addDoc(collection(db, SUBMISSIONS_COLLECTION), submissionData)

      console.log('Form submission created successfully', {
        submissionId: docRef.id,
        formId: input.formId,
      })

      return docRef.id
    } catch (error) {
      console.error('Failed to create form submission', {
        input,
        error,
      })
      throw error
    }
  }

  static async getSubmissions(filters: FormSubmissionFilters = {}): Promise<FormSubmission[]> {
    try {
      let q = query(collection(db, SUBMISSIONS_COLLECTION))

      // Apply filters - but avoid compound queries that require indexes
      if (filters.formId) {
        q = query(q, where('formId', '==', filters.formId))
      } else if (filters.submittedBy) {
        q = query(q, where('submittedBy', '==', filters.submittedBy))
      } else if (filters.submittedByDepartment) {
        q = query(q, where('submittedByDepartment', '==', filters.submittedByDepartment))
      } else if (filters.startDate) {
        q = query(q, where('submittedAt', '>=', Timestamp.fromDate(filters.startDate)))
      } else if (filters.endDate) {
        q = query(q, where('submittedAt', '<=', Timestamp.fromDate(filters.endDate)))
      }

      const querySnapshot = await getDocs(q)
      const submissions: FormSubmission[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        submissions.push({
          id: doc.id,
          formId: data.formId,
          formTitle: data.formTitle,
          submissionData: data.submissionData,
          submittedBy: data.submittedBy,
          submittedByDepartment: data.submittedByDepartment,
          submittedAt: data.submittedAt.toDate(),
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        })
      })

      // Sort by submission date (newest first) - done client-side to avoid index requirement
      submissions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())

      console.log('Retrieved form submissions', {
        count: submissions.length,
        filters,
      })

      return submissions
    } catch (error) {
      console.error('Failed to get form submissions', {
        filters,
        error,
      })
      throw error
    }
  }

  static async getSubmission(id: string): Promise<FormSubmission | null> {
    try {
      const docRef = doc(db, SUBMISSIONS_COLLECTION, id)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return null
      }

      const data = docSnap.data()
      return {
        id: docSnap.id,
        formId: data.formId,
        formTitle: data.formTitle,
        submissionData: data.submissionData,
        submittedBy: data.submittedBy,
        submittedByDepartment: data.submittedByDepartment,
        submittedAt: data.submittedAt.toDate(),
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      }
    } catch (error) {
      console.error('Failed to get form submission', {
        id,
        error,
      })
      throw error
    }
  }

  static async getSubmissionsByForm(formId: string): Promise<FormSubmission[]> {
    return this.getSubmissions({ formId })
  }

  static async getSubmissionsByUser(userId: string): Promise<FormSubmission[]> {
    return this.getSubmissions({ submittedBy: userId })
  }

  static async getSubmissionsByDepartment(department: string): Promise<FormSubmission[]> {
    return this.getSubmissions({ submittedByDepartment: department })
  }

  static async updateSubmission(id: string, submissionData: Record<string, any>): Promise<void> {
    try {
      console.log('Updating form submission', {
        submissionId: id,
        submissionData,
      })

      const docRef = doc(db, SUBMISSIONS_COLLECTION, id)
      await updateDoc(docRef, {
        submissionData,
        updatedAt: Timestamp.now(),
      })

      console.log('Form submission updated successfully', {
        submissionId: id,
      })
    } catch (error) {
      console.error('Failed to update form submission', {
        id,
        submissionData,
        error,
      })
      throw error
    }
  }
}