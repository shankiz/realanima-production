
import { User } from 'firebase/auth';

export const checkCallAccess = async (user: User | null): Promise<{ hasAccess: boolean; currentPlan: string }> => {
  if (!user) {
    return { hasAccess: false, currentPlan: 'free' };
  }

  try {
    const token = await user.getIdToken();
    const response = await fetch('/api/user/profile', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const currentPlan = data.currentPlan || 'free';
      return { 
        hasAccess: currentPlan === 'ultimate', 
        currentPlan 
      };
    }
  } catch (error) {
    console.error('Error checking call access:', error);
  }

  return { hasAccess: false, currentPlan: 'free' };
};
