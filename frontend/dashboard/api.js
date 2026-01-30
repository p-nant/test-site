export async function fetchExpenses(apiBaseUrl) {
  const response = await fetch(`${apiBaseUrl}/api/expenses`);
  if (!response.ok) {
    throw new Error('Failed to load expenses');
  }
  return response.json();
}
