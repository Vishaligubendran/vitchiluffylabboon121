/**
 * Post-login navigation by role. Sellers always land on the dashboard
 * (KYC status + button shown there — not forced into onboarding).
 */
export async function redirectByRole(navigate, user, options = {}) {
  if (user.role === 'admin') {
    navigate('/admin');
    return;
  }
  if (user.role === 'seller') {
    navigate('/seller', {
      state: options.newSeller ? { newSeller: true } : undefined,
    });
    return;
  }
  navigate('/buyer');
}
