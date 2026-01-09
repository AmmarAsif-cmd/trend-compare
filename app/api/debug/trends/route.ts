
import { NextResponse } from 'next/server';
import { getProductTrendData } from '@/lib/services/product/trends';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('q') || 'Playstation 5 Console';

    console.log(`[DebugAPI] Fetching trends for: ${keyword}`);

    try {
        const data = await getProductTrendData(keyword);
        return NextResponse.json({
            success: !!data,
            keyword,
            data
        });
    } catch (error: any) {
        console.error('[DebugAPI] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
