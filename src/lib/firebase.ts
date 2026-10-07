import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: The app will break without specifying firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot when in client environment
if (typeof window !== "undefined") {
  (async function testConnection() {
    try {
      await getDocFromServer(doc(db, "test", "connection"));
    } catch (error) {
      if (error instanceof Error && error.message.includes("the client is offline")) {
        console.error("Please check your Firebase configuration.");
      }
    }
  })();
}

export async function signInAdmin(email: string, pass: string) {
  return await signInWithEmailAndPassword(auth, email.trim(), pass);
}

export async function signUpAdmin(email: string, pass: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  // Create admin record in /admins/{uid}
  if (userCredential.user) {
    const adminDocRef = doc(db, "admins", userCredential.user.uid);
    await setDoc(adminDocRef, {
      email: userCredential.user.email || email.trim(),
      role: "admin",
      createdAt: new Date().toISOString(),
    });
  }
  return userCredential;
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error("No authenticated session found. Please sign in again.");
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters long.");
  }

  // 1. Re-authenticate to ensure fresh credential and prevent auth/requires-recent-login
  if (currentPassword) {
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
    } catch (reauthErr: unknown) {
      const err = reauthErr as { code?: string; message?: string };
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        throw new Error(
          "The current password you entered is incorrect. Please double-check and try again.",
        );
      }
      throw new Error(err.message || "Authentication verification failed.");
    }
  }

  // 2. Perform password update
  try {
    await updatePassword(user, newPassword);
  } catch (updateErr: unknown) {
    const err = updateErr as { code?: string; message?: string };
    if (err.code === "auth/requires-recent-login") {
      throw new Error("For security, please enter your current password to confirm this change.");
    }
    throw new Error(err.message || "Failed to update password.");
  }
}

export async function hasAnyRegisteredAdmin(): Promise<boolean> {
  try {
    const adminsSnap = await getDocs(collection(db, "admins"));
    return !adminsSnap.empty;
  } catch {
    return false;
  }
}
