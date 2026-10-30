import { auth } from '../firebase';

// API role decisions happen server-side after verifying this Firebase ID token.
// LocalStorage/admin display roles and email values are NOT authentication.
export async function authenticatedApiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Firebase login required to view or modify private application data.');
  }
  const idToken = await currentUser.getIdToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${idToken}`);
  return fetch(url, { ...init, headers });
}
