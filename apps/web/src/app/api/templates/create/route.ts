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

    const { title, form_slug, description, schema_definition } = await request.json();

    if (!title || !form_slug) {
      return NextResponse.json({ error: 'Title and Form Slug are required' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO diary_templates (title, form_slug, category, description, schema_definition, is_active)
       VALUES ($1, $2, 'summary', $3, $4, true) RETURNING *`,
      [title, form_slug, description || '', JSON.stringify(schema_definition || [])]
    );

    return NextResponse.json({ success: true, template: result.rows[0] });
  } catch (error: any) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}