
import { getAllUsers } from '@/lib/db/queries';
import { User } from '@/lib/db/schema';
import { checkAdminPermission } from '../checkPermissionsHelper';
import { NextRequest, NextResponse } from 'next/server';


export async function GET(request: NextRequest) {
      const user = await checkAdminPermission(request);
      if (!user) {
        return NextResponse.json(
          { error: 'Permissions insuffisantes' },
          { status: 403 }
        );
      } 
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

