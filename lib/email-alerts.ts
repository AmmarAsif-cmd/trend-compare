import { sendEmail, type SendEmailOptions } from './send-email';

/**
 * Send trend alert email to user
 */
export async function sendTrendAlertEmail(
  email: string,
  alert: {
    termA: string;
    termB: string;
    slug: string;
    reason: string;
    currentScoreA: number;
    currentScoreB: number;
    baselineScoreA?: number;
    baselineScoreB?: number;
    alertType: string;
  }
): Promise<void> {
  const formatTerm = (term: string) => 
    term.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const termA = formatTerm(alert.termA);
  const termB = formatTerm(alert.termB);
  const comparisonUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://trendarc.net'}/compare/${alert.slug}`;

  const subject = `Trend Alert: ${termA} vs ${termB}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Trend Alert</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">
          ${termA} vs ${termB}
        </h2>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <p style="margin: 0 0 15px 0; font-weight: 600; color: #374151;">
            Alert Triggered: ${alert.reason}
          </p>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
            <div style="text-align: center; padding: 15px; background: #f3f4f6; border-radius: 6px;">
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">${termA}</div>
              <div style="font-size: 28px; font-weight: bold; color: #1f2937;">${alert.currentScoreA}</div>
              ${alert.baselineScoreA ? (
                `<div style="font-size: 12px; color: #6b7280; margin-top: 5px;">
                  Was: ${alert.baselineScoreA} 
                  <span style="color: ${alert.currentScoreA > alert.baselineScoreA ? '#10b981' : '#ef4444'};">
                    (${alert.currentScoreA > alert.baselineScoreA ? '+' : ''}${alert.currentScoreA - alert.baselineScoreA})
                  </span>
                </div>`
              ) : ''}
            </div>
            
            <div style="text-align: center; padding: 15px; background: #f3f4f6; border-radius: 6px;">
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">${termB}</div>
              <div style="font-size: 28px; font-weight: bold; color: #1f2937;">${alert.currentScoreB}</div>
              ${alert.baselineScoreB ? (
                `<div style="font-size: 12px; color: #6b7280; margin-top: 5px;">
                  Was: ${alert.baselineScoreB} 
                  <span style="color: ${alert.currentScoreB > alert.baselineScoreB ? '#10b981' : '#ef4444'};">
                    (${alert.currentScoreB > alert.baselineScoreB ? '+' : ''}${alert.currentScoreB - alert.baselineScoreB})
                  </span>
                </div>`
              ) : ''}
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${comparisonUrl}" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            View Full Comparison →
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          You're receiving this email because you set up a trend alert for this comparison. 
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://trendarc.net'}/dashboard/alerts" style="color: #667eea; text-decoration: none;">
            Manage your alerts
          </a>
        </p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Trend Alert: ${termA} vs ${termB}

Alert Triggered: ${alert.reason}

Current Scores:
${termA}: ${alert.currentScoreA}${alert.baselineScoreA ? ` (was: ${alert.baselineScoreA})` : ''}
${termB}: ${alert.currentScoreB}${alert.baselineScoreB ? ` (was: ${alert.baselineScoreB})` : ''}

View full comparison: ${comparisonUrl}

Manage your alerts: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://trendarc.net'}/dashboard/alerts
  `;

  const emailOptions: SendEmailOptions = {
    to: email,
    subject,
    html: htmlContent,
    text: textContent,
  };

  await sendEmail(emailOptions);
}

