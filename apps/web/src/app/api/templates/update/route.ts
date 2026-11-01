import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, schema_definition } = await request.json();

    const result = await pool.query(
      'UPDATE diary_templates SET schema_definition = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(schema_definition), id]
    );

    return NextResponse.json({ success: true, template: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}