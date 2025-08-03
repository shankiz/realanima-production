
// This file should only contain type definitions and utilities
// for Firebase admin operations

import { adminAuth, adminDb } from './admin';

export async function verifyIdToken(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw error;
  }
}

export async function getUserDataAdmin(userId: string) {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return null;
    }
    return userDoc.data();
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
}

export async function updateUserCredits(userId: string, credits: number) {
  try {
    await adminDb.collection('users').doc(userId).update({
      credits,
      messagesLeft: credits
    });
  } catch (error) {
    console.error('Error updating user credits:', error);
    throw error;
  }
}

// Fix missing exports
export async function getUserData(userId: string) {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return null;
    }
    return userDoc.data();
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
}

export async function updateUserActivity(userId: string) {
  try {
    await adminDb.collection('users').doc(userId).update({
      lastActivity: new Date()
    });
  } catch (error) {
    console.error('Error updating user activity:', error);
    throw error;
  }
}
