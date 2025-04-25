"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function EmailTestPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [details, setDetails] = useState<string | null>(null)
  const [smtpConfig, setSmtpConfig] = useState({
    host: "smtp.titan.email",
    port: "465",
    secure: "true",
  })
  const [activeTab, setActiveTab] = useState("test")
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null)
  const [isDiagnosing, setIsDiagnosing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)
    setDetails(null)

    try {
      const response = await fetch("/api/test/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: "Test email sent successfully!",
        })
        setDetails(JSON.stringify(data.details, null, 2))
      } else {
        setResult({
          success: false,
          message: data.message || "Failed to send test email",
        })
        setDetails(JSON.stringify(data.details, null, 2))
      }
    } catch (error) {
      setResult({
        success: false,
        message: "An error occurred while sending the test email",
      })
      setDetails(error instanceof Error ? error.message : String(error))
    } finally {
      setIsLoading(false)
    }
  }

  const runDiagnostics = async () => {
    setIsDiagnosing(true)
    setDiagnosticResult(null)

    try {
      let diagnosticLog = "=== Email Configuration Diagnostics ===\n\n"

      // Check environment variables
      diagnosticLog += "Checking environment variables...\n"
      const emailUser = process.env.NEXT_PUBLIC_EMAIL_USER || "Not accessible in client"
      const emailPassword = process.env.NEXT_PUBLIC_EMAIL_PASSWORD ? "Set (masked)" : "Not set or not accessible"

      diagnosticLog += `EMAIL_USER: ${emailUser}\n`
      diagnosticLog += `EMAIL_PASSWORD: ${emailPassword}\n\n`

      // Check network connectivity to SMTP server
      diagnosticLog += `Testing network connectivity to ${smtpConfig.host}:${smtpConfig.port}...\n`
      diagnosticLog += "Note: Direct network testing is limited in browser environment.\n\n"

      // Test DNS resolution
      diagnosticLog += `Attempting DNS lookup for ${smtpConfig.host}...\n`
      diagnosticLog += "Note: Direct DNS testing is not available in browser environment.\n\n"

      // Check current SMTP configuration
      diagnosticLog += "Current SMTP Configuration:\n"
      diagnosticLog += `Host: ${smtpConfig.host}\n`
      diagnosticLog += `Port: ${smtpConfig.port}\n`
      diagnosticLog += `Secure: ${smtpConfig.secure}\n\n`

      // Recommendations
      diagnosticLog += "Recommendations:\n"
      diagnosticLog += "1. Verify your Titan Mail credentials are correct\n"
      diagnosticLog += "2. Ensure your Titan Mail account has SMTP access enabled\n"
      diagnosticLog += "3. Check if your server environment allows outgoing connections on port 465\n"
      diagnosticLog += "4. Try alternative ports (587) if 465 is blocked\n"
      diagnosticLog += "5. Check server logs for detailed error messages\n\n"

      diagnosticLog += "=== End of Diagnostics ==="

      setDiagnosticResult(diagnosticLog)
    } catch (error) {
      setDiagnosticResult(`Error running diagnostics: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsDiagnosing(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background p-4">
      <div className="container max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Link href="/" className="mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Email Configuration Test</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="test">Test Email</TabsTrigger>
            <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          </TabsList>

          <TabsContent value="test">
            <Card>
              <CardHeader>
                <CardTitle>Send Test Email</CardTitle>
                <CardDescription>Test your Titan Mail configuration by sending a test email</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  {result && (
                    <Alert variant={result.success ? "default" : "destructive"}>
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertDescription>{result.message}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  {details && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Response Details:</h3>
                      <pre className="rounded bg-muted p-2 text-xs overflow-auto max-h-40">{details}</pre>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full bg-[#27AE60] hover:bg-[#219653]" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Test Email
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="diagnostics">
            <Card>
              <CardHeader>
                <CardTitle>Email Diagnostics</CardTitle>
                <CardDescription>Check your email configuration and troubleshoot issues</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="host" className="text-sm font-medium">
                      SMTP Host
                    </label>
                    <Input
                      id="host"
                      value={smtpConfig.host}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="port" className="text-sm font-medium">
                      SMTP Port
                    </label>
                    <Select
                      value={smtpConfig.port}
                      onValueChange={(value) => setSmtpConfig({ ...smtpConfig, port: value })}
                    >
                      <SelectTrigger id="port">
                        <SelectValue placeholder="Select port" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="465">465 (SSL)</SelectItem>
                        <SelectItem value="587">587 (TLS)</SelectItem>
                        <SelectItem value="25">25 (Default)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="secure" className="text-sm font-medium">
                      Secure
                    </label>
                    <Select
                      value={smtpConfig.secure}
                      onValueChange={(value) => setSmtpConfig({ ...smtpConfig, secure: value })}
                    >
                      <SelectTrigger id="secure">
                        <SelectValue placeholder="Select secure option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">True (SSL/TLS)</SelectItem>
                        <SelectItem value="false">False (STARTTLS)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={runDiagnostics} variant="outline" className="w-full" disabled={isDiagnosing}>
                  {isDiagnosing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Run Diagnostics
                </Button>

                {diagnosticResult && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Diagnostic Results:</h3>
                    <pre className="rounded bg-muted p-2 text-xs overflow-auto max-h-80 whitespace-pre-wrap">
                      {diagnosticResult}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
