import { NextRequest, NextResponse } from 'next/server';
import { verifyOnChain } from '@/lib/blockchain';
import { adminAuth } from '@/lib/firebase-db';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { txHash, paymentIntentId } = await req.json();

        if (!txHash || !paymentIntentId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Trigger the background verification process
        verifyOnChain(txHash, paymentIntentId).catch(err => {
            console.error(`Background verification failure: ${err.message}`);
        });

        return NextResponse.json({ message: 'Verification process started' });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
