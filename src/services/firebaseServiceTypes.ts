import { CollectionReference, DocumentData } from 'firebase/firestore';

export function getCollectionOrThrow<T = DocumentData>(
  collection: CollectionReference<T> | null | undefined,
  name: string
): CollectionReference<T> {
  if (!collection) {
    throw new Error(`Firebase collection '${name}' is not initialized`);
  }
  return collection;
}