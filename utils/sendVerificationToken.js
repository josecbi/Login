import nodemailer from 'nodemailer'
import * as brevo from '@getbrevo/brevo'
import 'dotenv/config'

export async function sendVerificationToken(email, token, name = '', tokenType = 'reset', baseUrl) {
    const appName = process.env.APP_NAME
    //const baseUrl = process.env.BASE_URL

    let verificationUrl
    if (tokenType === 'reset') {
        verificationUrl = `${baseUrl.replace(/\/$/, '')}/reset-password.html?token=${token}`
    }

    const year = new Date().getFullYear()

    const subject = `Confirm your email at ${appName}`
    const text = `Hello ${name || ''}\n\nThank you for signing up for ${appName}. To activate your account, open the following link:\n\n${verificationUrl}\n\nThis link expires in 1 hour. If you did not request this, you can ignore this email.\n\nRegards,\nThe ${appName} Team`

    const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Verify your email</title>
    </head>
    <body style="font-family:Arial,sans-serif;background:#f6f6f6;margin:0;padding:20px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
                <td align="center">
                    <table width="600" style="background:#ffffff;border-radius:8px;overflow:hidden;" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                            <td style="padding:24px;text-align:left;">
                                <h2 style="margin:0 0 8px 0;color:#333333;">Hello ${name || ''}!</h2>
                                <p style="color:#555555;margin:0 0 16px 0;">Thank you for signing up for <strong>${appName}</strong>. To activate your account, click the button below:</p>
                                <p style="text-align:center;margin:24px 0;">
                                    <a href="${verificationUrl}" style="background:#1a73e8;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600;">Verify my email</a>
                                </p>
                                <p style="color:#999999;font-size:13px;margin:16px 0 0 0;">If the button doesn't work, copy and paste this link into your browser:</p>
                                <p style="word-break:break-all;color:#1a73e8;font-size:14px;margin:8px 0 0 0;">${verificationUrl}</p>
                                <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
                                <p style="color:#999999;font-size:12px;margin:0;">This link expires in 1 hour. If you did not request this email, you can ignore it.</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="background:#fafafa;padding:12px;text-align:center;font-size:12px;color:#999999;">© ${year} ${appName}. All rights reserved.</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`

    try {
        // Use Brevo API if available (works on Render free tier)
        if (process.env.BREVO_API_KEY) {
            const apiInstance = new brevo.TransactionalEmailsApi()
            apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY)

            // Sanitize email (remove any whitespace/newlines)
            const fromEmail = (process.env.BREVO_FROM_EMAIL || process.env.EMAIL_USER).trim().replace(/[\r\n]/g, '')

            const sendSmtpEmail = new brevo.SendSmtpEmail()
            sendSmtpEmail.sender = {
                email: fromEmail,
                name: appName
            }
            sendSmtpEmail.to = [{ email }]
            sendSmtpEmail.subject = subject
            sendSmtpEmail.textContent = text
            sendSmtpEmail.htmlContent = html

            const result = await apiInstance.sendTransacEmail(sendSmtpEmail)
            console.log('✅ Verification email sent via Brevo API:', result.response.body.messageId)
            return { messageId: result.response.body.messageId }
        }

        // Fallback to SMTP (for local development)
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        })

        const mailOptions = {
            from: `${appName} <${process.env.EMAIL_USER}>`,
            to: email,
            subject,
            text,
            html
        }

        const info = await transporter.sendMail(mailOptions)
        console.log('✅ Verification email sent:', info.messageId)
        return info
    } catch (err) {
        console.error('sendVerificationToken error:', err)
        throw err
    }
}

