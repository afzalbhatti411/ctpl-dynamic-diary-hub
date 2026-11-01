import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const query = `SELECT * FROM diary_submissions ORDER BY created_at DESC;`;
    const result = await pool.query(query);
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { form_slug, sector_name, picket_name, submitted_data } = body;

    const query = `
      INSERT INTO diary_submissions (form_slug, sector_name, picket_name, submitted_data)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [form_slug, sector_name, picket_name, JSON.stringify(submitted_data)];
    const result = await pool.query(query, values);

    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving submission:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}