import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  html: string
  text?: string
}

// Simple SMTP client using raw TCP connection
class SimpleSmtpClient {
  private conn: Deno.Conn | null = null
  private textEncoder = new TextEncoder()
  private textDecoder = new TextDecoder()

  async connect(options: {
    hostname: string
    port: number
    username: string
    password: string
  }) {
    try {
      // Connect with TLS for port 465
      this.conn = await Deno.connectTls({
        hostname: options.hostname,
        port: options.port,
      })

      // Read greeting
      await this.readResponse()

      // Send EHLO
      await this.sendCommand(`EHLO ${options.hostname}`)

      // Authenticate
      const auth = btoa(`\0${options.username}\0${options.password}`)
      await this.sendCommand(`AUTH PLAIN ${auth}`)

      return true
    } catch (error) {
      console.error('SMTP connection error:', error)
      throw error
    }
  }

  async sendEmail(options: {
    from: string
    to: string
    subject: string
    html: string
    text?: string
  }) {
    if (!this.conn) throw new Error('Not connected')

    try {
      // Send MAIL FROM
      await this.sendCommand(`MAIL FROM:<${options.from}>`)

      // Send RCPT TO
      await this.sendCommand(`RCPT TO:<${options.to}>`)

      // Send DATA
      await this.sendCommand('DATA')

      // Send email headers and body
      const emailContent = this.buildEmailContent(options)
      await this.sendCommand(emailContent + '\r\n.', false)

      return true
    } catch (error) {
      console.error('SMTP send error:', error)
      throw error
    }
  }

  private buildEmailContent(options: {
    from: string
    to: string
    subject: string
    html: string
    text?: string
  }) {
    const boundary = `boundary_${Date.now()}`
    let content = `From: ${options.from}\r\n`
    content += `To: ${options.to}\r\n`
    content += `Subject: ${options.subject}\r\n`
    content += `MIME-Version: 1.0\r\n`
    content += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`

    if (options.text) {
      content += `--${boundary}\r\n`
      content += `Content-Type: text/plain; charset=UTF-8\r\n\r\n`
      content += `${options.text}\r\n\r\n`
    }

    content += `--${boundary}\r\n`
    content += `Content-Type: text/html; charset=UTF-8\r\n\r\n`
    content += `${options.html}\r\n\r\n`
    content += `--${boundary}--\r\n`

    return content
  }

  private async sendCommand(command: string, expectResponse = true) {
    if (!this.conn) throw new Error('Not connected')
    
    console.log('SMTP Command:', command.split('\r\n')[0])
    await this.conn.write(this.textEncoder.encode(command + '\r\n'))
    
    if (expectResponse) {
      const response = await this.readResponse()
      console.log('SMTP Response:', response)
      return response
    }
  }

  private async readResponse(): Promise<string> {
    if (!this.conn) throw new Error('Not connected')
    
    const buffer = new Uint8Array(1024)
    const n = await this.conn.read(buffer)
    if (n === null) throw new Error('Connection closed')
    
    return this.textDecoder.decode(buffer.subarray(0, n))
  }

  async close() {
    if (this.conn) {
      try {
        await this.sendCommand('QUIT')
        this.conn.close()
      } catch (error) {
        console.error('Error closing connection:', error)
      }
      this.conn = null
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, text }: EmailRequest = await req.json()

    // Get SMTP configuration from environment variables
    const smtpHost = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com'
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '465')
    const smtpUsername = Deno.env.get('SMTP_USERNAME')
    const smtpPassword = Deno.env.get('SMTP_PASSWORD')
    const fromEmail = Deno.env.get('FROM_EMAIL')
    const fromName = Deno.env.get('FROM_NAME') || 'TeamFlow'

    console.log('SMTP Configuration:', {
      host: smtpHost,
      port: smtpPort,
      username: smtpUsername,
      from: fromEmail,
      hasPassword: !!smtpPassword
    })

    if (!smtpUsername || !smtpPassword || !fromEmail) {
      throw new Error('SMTP configuration is incomplete')
    }

    // Create SMTP client
    const client = new SimpleSmtpClient()

    console.log('Connecting to SMTP server...')
    
    // Connect to SMTP server with SSL
    await client.connect({
      hostname: smtpHost,
      port: smtpPort,
      username: smtpUsername,
      password: smtpPassword,
    })

    console.log('Connected successfully, sending email...')

    // Send email
    await client.sendEmail({
      from: fromEmail,
      to,
      subject,
      html,
      text
    })

    console.log('Email sent successfully')

    // Close connection
    await client.close()

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Email sending error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to send email',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
