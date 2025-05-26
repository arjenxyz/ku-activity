import { NextResponse } from 'next/server'
import { supabase } from "../../lib/supabaseClient";
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const email = "newlifearjen@gmail.co"
    const password = "mehmet21"
    const hashedPassword = await bcrypt.hash(password, 10)

    const { data, error } = await supabase
      .from('admins')
      .insert([{ email, password_hash: hashedPassword }])
      .select()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as any).message
    }, { status: 500 })
  }
}