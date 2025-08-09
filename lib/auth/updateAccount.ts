export type UpdateAccountData = {
  name: string;
  email: string;
};

export type UpdateAccountResponse = {
  success?: string;
  error?: string;
  name?: string;
};

export async function updateAccount(data: UpdateAccountData): Promise<UpdateAccountResponse> {
  const response = await fetch('/api/account/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return response.json();
}
