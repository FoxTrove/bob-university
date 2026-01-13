import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;

  // Get revenue ledger data (bypasses RLS)
  const { data: ledgerRows, error: ledgerError } = await supabaseAdmin
    .from('revenue_ledger')
    .select('id, source, product_type, plan, status, amount_cents, fee_cents, net_cents, currency, occurred_at, external_id')
    .eq('user_id', userId)
    .in('status', ['completed', 'refunded'])
    .order('occurred_at', { ascending: false })
    .limit(50);

  if (ledgerError) {
    return NextResponse.json({ error: ledgerError.message }, { status: 500 });
  }

  return NextResponse.json({ ledgerRows: ledgerRows || [] });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;
  const body = await request.json();
  const { role } = body;

  if (!['user', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  // Update user role (bypasses RLS)
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, role });
}
