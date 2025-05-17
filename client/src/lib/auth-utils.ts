// Simple authentication utilities without React context/JSX

/**
 * Get mock authentication token
 */
export function getMockToken(): string {
  return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkRyLiBNaWNoYWVsIENoZW4iLCJyb2xlIjoiRE9DVE9SIiwiaWF0IjoxNTE2MjM5MDIyfQ.6w9X3pPOepHgDpOTL0_Nr72WbEJoNu9kqRN_hGlqnmo";
}

/**
 * Get mock user info
 */
export function getMockUser() {
  return {
    id: 'doctor-123',
    name: 'Dr. Michael Chen',
    email: 'doctor@example.com',
    role: 'DOCTOR',
    specialization: 'Cardiology'
  };
}