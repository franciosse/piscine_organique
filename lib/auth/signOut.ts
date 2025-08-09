export async function signOut() {
  const response = await fetch('/api/signout', { method: 'POST' });
  if (response.ok) {
    window.location.href = '/'; // redirection après logout
  } else {
    throw new Error('Sign out failed');
  }
}
