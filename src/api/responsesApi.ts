import {
  collection,
  addDoc,
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

    const now = Timestamp.now();

    const docData = {
      form_id: formId,
      user_id: userId,
      submitted_at: now,
      answers,
    };

    const docRef = await addDoc(collection(db, RESPONSES_COLLECTION), docData);

    return {
      id: docRef.id,
      form_id: formId,
      user_id: userId,
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
};
