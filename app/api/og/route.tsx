import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const termA = searchParams.get('a') || 'Topic A';
  const termB = searchParams.get('b') || 'Topic B';
  const winner = searchParams.get('winner') || '';
  const advantage = searchParams.get('advantage') || '';

  const formatTerm = (term: string) => {
    return term
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formattedA = formatTerm(termA);
  const formattedB = formatTerm(termB);
  const winnerFormatted = winner ? formatTerm(winner) : '';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '48px 64px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '90%',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '32px',
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              style={{ marginRight: '12px' }}
            >
              <rect width="24" height="24" rx="6" fill="#7c3aed" />
              <path
                d="M6 18L10 10L14 14L18 6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#7c3aed',
              }}
            >
              TrendArc
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '16px 32px',
                backgroundColor: winner === termA ? '#f0fdf4' : '#f8fafc',
                borderRadius: '16px',
                border: winner === termA ? '3px solid #22c55e' : '2px solid #e2e8f0',
              }}
            >
              <span
                style={{
                  fontSize: '36px',
                  fontWeight: 700,
                  color: '#1e293b',
                }}
              >
                {formattedA}
              </span>
              {winner === termA && (
                <span
                  style={{
                    fontSize: '14px',
                    color: '#22c55e',
                    fontWeight: 600,
                    marginTop: '8px',
                  }}
                >
                  LEADING
                </span>
              )}
            </div>

            <span
              style={{
                fontSize: '28px',
                fontWeight: 600,
                color: '#94a3b8',
              }}
            >
              vs
            </span>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '16px 32px',
                backgroundColor: winner === termB ? '#f0fdf4' : '#f8fafc',
                borderRadius: '16px',
                border: winner === termB ? '3px solid #22c55e' : '2px solid #e2e8f0',
              }}
            >
              <span
                style={{
                  fontSize: '36px',
                  fontWeight: 700,
                  color: '#1e293b',
                }}
              >
                {formattedB}
              </span>
              {winner === termB && (
                <span
                  style={{
                    fontSize: '14px',
                    color: '#22c55e',
                    fontWeight: 600,
                    marginTop: '8px',
                  }}
                >
                  LEADING
                </span>
              )}
            </div>
          </div>

          {winnerFormatted && advantage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#f0fdf4',
                padding: '12px 24px',
                borderRadius: '9999px',
                marginTop: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '18px',
                  color: '#166534',
                  fontWeight: 600,
                }}
              >
                {winnerFormatted} leads by {advantage}%
              </span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              marginTop: '32px',
              fontSize: '16px',
              color: '#64748b',
            }}
          >
            Compare search trends at trendarc.net
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
