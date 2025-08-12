
import { getAllUsers } from '@/lib/db/queries';
import { User } from '@/lib/db/schema';

export async function GET() {
  try {
    const users: User[] = await getAllUsers();
    return new Response(JSON.stringify(users), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in API route:', error);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

