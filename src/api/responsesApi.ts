import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  limit,
  startAfter,
  getCountFromServer,
} from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FormAnswer, FormResponse } from '@/types/form';

const RESPONSES_COLLECTION = 'responses';

/**
 * Paginated response result type for server-side pagination.
 */
export interface PaginatedResponses {
  responses: FormResponse[];
  totalCount: number;
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export const responsesApi = {
  /**
   * Check if an email has already submitted a specific form.
   */
  async hasSubmittedByEmail(formId: string, email: string): Promise<boolean> {
    const q = query(
      collection(db, RESPONSES_COLLECTION),
      where('form_id', '==', formId),
      where('user_email', '==', email.toLowerCase()),
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  },

  /**
   * Check if a user has already submitted a specific form.
   */
  async hasSubmitted(formId: string, userId: string): Promise<boolean> {
    const q = query(
      collection(db, RESPONSES_COLLECTION),
      where('form_id', '==', formId),
      where('user_id', '==', userId),
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  },

  /**
   * Submit a form response with answers (for public/anonymous users with name and email).
   */
  async submitPublic(
    formId: string,
    email: string,
    userName: string,
    answers: FormAnswer[],
  ): Promise<FormResponse> {
    const normalizedEmail = email.toLowerCase();
    const alreadySubmitted = await this.hasSubmittedByEmail(formId, normalizedEmail);
    if (alreadySubmitted) {
      throw new Error('You have already submitted this form with this email address.');
    }

    const now = Timestamp.now();

    const docData = {
      form_id: formId,
      user_id: normalizedEmail, // Use email as user_id for public submissions
      user_name: userName.trim() || normalizedEmail.split('@')[0], // Use provided name or email prefix as fallback
      user_email: normalizedEmail,
      submitted_at: now,
      answers,
    };

    const docRef = await addDoc(collection(db, RESPONSES_COLLECTION), docData);

    return {
      id: docRef.id,
      form_id: formId,
      user_id: normalizedEmail,
      user_name: userName.trim() || normalizedEmail.split('@')[0],
      user_email: normalizedEmail,
      submitted_at: now.toDate().toISOString(),
      answers,
    };
  },

  /**
   * Submit a form response with answers. Each user can only submit once per form.
   */
  async submit(
    formId: string,
    userId: string,
    answers: FormAnswer[],
  ): Promise<FormResponse> {
    const alreadySubmitted = await this.hasSubmitted(formId, userId);
    if (alreadySubmitted) {
      throw new Error('You have already submitted this form.');
    }

    // Look up user display name and email
    let userName = 'Unknown User';
    let userEmail = '';
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        userName = (userDoc.data().displayName as string) || userName;
        userEmail = (userDoc.data().email as string) || '';
      }
    } catch {
      // Fall back to default name
    }

    const now = Timestamp.now();

    const docData = {
      form_id: formId,
      user_id: userId,
      user_name: userName,
      user_email: userEmail,
      submitted_at: now,
      answers,
    };

    const docRef = await addDoc(collection(db, RESPONSES_COLLECTION), docData);

    return {
      id: docRef.id,
      form_id: formId,
      user_id: userId,
      user_name: userName,
      user_email: userEmail,
      submitted_at: now.toDate().toISOString(),
      answers,
    };
  },

  /**
   * Get all responses for a specific form.
   */
  async listByForm(formId: string): Promise<FormResponse[]> {
    let snapshot;
    try {
      const q = query(
        collection(db, RESPONSES_COLLECTION),
        where('form_id', '==', formId),
        orderBy('submitted_at', 'desc'),
      );
      snapshot = await getDocs(q);
    } catch {
      // Fallback without ordering if index not ready
      const q = query(
        collection(db, RESPONSES_COLLECTION),
        where('form_id', '==', formId),
      );
      snapshot = await getDocs(q);
    }

    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        form_id: data.form_id as string,
        user_id: data.user_id as string,
        user_name: (data.user_name as string) || 'Unknown User',
        user_email: (data.user_email as string) || '',
        submitted_at:
          data.submitted_at instanceof Timestamp
            ? data.submitted_at.toDate().toISOString()
            : (data.submitted_at as string),
        answers: (data.answers as FormAnswer[]) ?? [],
      };
    });
  },

  /**
   * Get the response count for a specific form.
   */
  async countByForm(formId: string): Promise<number> {
    const q = query(
      collection(db, RESPONSES_COLLECTION),
      where('form_id', '==', formId),
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  },

  /**
   * Get all responses submitted by a specific user (across all forms).
   * Returns enriched objects that include the form name for display.
   */
  async listByUser(userId: string): Promise<(FormResponse & { form_name: string })[]> {
    let snapshot;
    try {
      const q = query(
        collection(db, RESPONSES_COLLECTION),
        where('user_id', '==', userId),
        orderBy('submitted_at', 'desc'),
      );
      snapshot = await getDocs(q);
    } catch {
      // Fallback without ordering if index not ready
      const q = query(
        collection(db, RESPONSES_COLLECTION),
        where('user_id', '==', userId),
      );
      snapshot = await getDocs(q);
    }

    // Map the raw docs and look up form names
    const responses = await Promise.all(
      snapshot.docs.map(async (d) => {
        const data = d.data();
        let formName = 'Unknown Form';
        try {
          const formDoc = await getDoc(doc(db, 'forms', data.form_id as string));
          if (formDoc.exists()) {
            formName = (formDoc.data().form_name as string) || formName;
          }
        } catch {
          // Fall back to default name
        }

        return {
          id: d.id,
          form_id: data.form_id as string,
          form_name: formName,
          user_id: data.user_id as string,
          user_name: (data.user_name as string) || 'Unknown User',
          user_email: (data.user_email as string) || '',
          submitted_at:
            data.submitted_at instanceof Timestamp
              ? data.submitted_at.toDate().toISOString()
              : (data.submitted_at as string),
          answers: (data.answers as FormAnswer[]) ?? [],
        };
      }),
    );

    return responses;
  },

  /**
   * Get paginated responses for a specific form using Firestore cursor-based pagination.
   * This is more efficient than client-side pagination for large datasets as it only
   * fetches the required documents, reducing database read costs.
   *
   * @param formId - The ID of the form to get responses for
   * @param pageSize - Number of items per page
   * @param lastDocument - The last document from the previous page (for cursor-based pagination)
   * @returns Paginated responses with metadata
   */
  async listByFormPaginated(
    formId: string,
    pageSize: number,
    lastDocument?: QueryDocumentSnapshot<DocumentData> | null,
  ): Promise<PaginatedResponses> {
    // Get total count first (for displaying "X of Y entries")
    const countQuery = query(
      collection(db, RESPONSES_COLLECTION),
      where('form_id', '==', formId),
    );
    const countSnapshot = await getCountFromServer(countQuery);
    const totalCount = countSnapshot.data().count;

    // Build the paginated query
    let paginatedQuery;
    try {
      if (lastDocument) {
        paginatedQuery = query(
          collection(db, RESPONSES_COLLECTION),
          where('form_id', '==', formId),
          orderBy('submitted_at', 'desc'),
          startAfter(lastDocument),
          limit(pageSize),
        );
      } else {
        paginatedQuery = query(
          collection(db, RESPONSES_COLLECTION),
          where('form_id', '==', formId),
          orderBy('submitted_at', 'desc'),
          limit(pageSize),
        );
      }
    } catch {
      // Fallback without ordering if index not ready
      if (lastDocument) {
        paginatedQuery = query(
          collection(db, RESPONSES_COLLECTION),
          where('form_id', '==', formId),
          startAfter(lastDocument),
          limit(pageSize),
        );
      } else {
        paginatedQuery = query(
          collection(db, RESPONSES_COLLECTION),
          where('form_id', '==', formId),
          limit(pageSize),
        );
      }
    }

    const snapshot = await getDocs(paginatedQuery);
    const lastDoc = snapshot.docs.at(-1) ?? null;
    const hasMore = snapshot.docs.length === pageSize;

    const responses: FormResponse[] = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        form_id: data.form_id as string,
        user_id: data.user_id as string,
        user_name: (data.user_name as string) || 'Unknown User',
        user_email: (data.user_email as string) || '',
        submitted_at:
          data.submitted_at instanceof Timestamp
            ? data.submitted_at.toDate().toISOString()
            : (data.submitted_at as string),
        answers: (data.answers as FormAnswer[]) ?? [],
      };
    });

    return {
      responses,
      totalCount,
      lastDoc,
      hasMore,
    };
  },
};
