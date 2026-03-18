'use client';

import { useRouter } from 'next/navigation';

export const useAppNavigation = () => {
  const router = useRouter();

  const goToLogin = () => router.push('/login');
  const goToAdminDashboard = () => router.push('/admin');
  const goToUserDashboard = () => router.push('/meetings');
  const goToMeeting = (id: string) => router.push(`/meeting/${id}`);

  return { goToLogin, goToAdminDashboard, goToUserDashboard, goToMeeting };
};
