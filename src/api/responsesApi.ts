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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FormAnswer, FormResponse } from '@/types/form';

const RESPONSES_COLLECTION = 'responses';

export const responsesApi = {
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

    // Look up user display name
    let userName = 'Unknown User';
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        userName = (userDoc.data().displayName as string) || userName;
      }
    } catch {
      // Fall back to default name
    }

    const now = Timestamp.now();

    const docData = {
      form_id: formId,
      user_id: userId,
      user_name: userName,
      submitted_at: now,
      answers,
    };

    const docRef = await addDoc(collection(db, RESPONSES_COLLECTION), docData);

    return {
      id: docRef.id,
      form_id: formId,
      user_id: userId,
      user_name: userName,
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
};
