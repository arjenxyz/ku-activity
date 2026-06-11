import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabaseClient';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const email = "newlifearjen@gmail.co";
    const password = "mehmet21";
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('admins')
      .insert([{ email, password_hash: hashedPassword }])
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: unknown) {
    let message = 'Bilinmeyen hata';
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({
      success: false,
      error: message
    }, { status: 500 });
  }
}
