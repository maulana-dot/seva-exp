import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { usePasswordReset } from '../hooks/use-auth'
import { toast } from 'sonner'
import { Mail, ArrowLeft, Shield, CheckCircle } from 'lucide-react'

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
})

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only numbers'),
})

const newPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password confirmation is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type EmailFormData = z.infer<typeof emailSchema>
type OtpFormData = z.infer<typeof otpSchema>
type NewPasswordFormData = z.infer<typeof newPasswordSchema>

interface PasswordResetModalProps {
  isOpen: boolean
  onClose: () => void
}

type Step = 'email' | 'otp' | 'new-password' | 'success'

export function PasswordResetModal({ isOpen, onClose }: PasswordResetModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('email')
  const [resetEmail, setResetEmail] = useState('')
  const [isOtpSent, setIsOtpSent] = useState(false)

  const resetPasswordMutation = usePasswordReset()

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  })

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  })

  const newPasswordForm = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),
  })

  const handleEmailSubmit = async (data: EmailFormData) => {
    try {
      // For now, use Firebase's built-in password reset
      // In a real OTP implementation, this would call a backend service
      await resetPasswordMutation.mutateAsync({ email: data.email })

      setResetEmail(data.email)
      setIsOtpSent(true)

      // Simulate OTP flow - in real implementation, this would move to OTP verification
      toast.success('Password reset email sent! Check your email for further instructions.')
      setCurrentStep('success')
    } catch (error) {
      toast.error('Failed to send reset email. Please try again.')
    }
  }

  const handleOtpSubmit = async (data: OtpFormData) => {
    // This would verify OTP with backend in a real implementation
    console.log('Verifying OTP:', data.otp, 'for email:', resetEmail)

    // Simulate OTP verification
    // In real implementation, this would call backend to verify OTP
    toast.success('OTP verified successfully!')
    setCurrentStep('new-password')
  }

  const handleNewPasswordSubmit = async (data: NewPasswordFormData) => {
    // This would set new password with backend in a real implementation
    console.log('Setting new password for:', resetEmail)

    // Simulate password reset completion
    toast.success('Password reset successfully!')
    setCurrentStep('success')
  }

  const handleClose = () => {
    setCurrentStep('email')
    setResetEmail('')
    setIsOtpSent(false)
    emailForm.reset()
    otpForm.reset()
    newPasswordForm.reset()
    onClose()
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'email':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reset Your Password</h3>
              <p className="text-sm text-gray-600">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
            </div>

            <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="reset-email">Email Address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your email address"
                  {...emailForm.register('email')}
                  disabled={resetPasswordMutation.isPending}
                />
                {emailForm.formState.errors.email && (
                  <p className="text-sm text-red-600 mt-1">
                    {emailForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={resetPasswordMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending ? 'Sending...' : 'Send Reset Email'}
                </Button>
              </div>
            </form>
          </div>
        )

      case 'otp':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Verify OTP</h3>
              <p className="text-sm text-gray-600">
                We've sent a 6-digit verification code to <span className="font-medium">{resetEmail}</span>
              </p>
            </div>

            <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  {...otpForm.register('otp')}
                />
                {otpForm.formState.errors.otp && (
                  <p className="text-sm text-red-600 mt-1">
                    {otpForm.formState.errors.otp.message}
                  </p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep('email')}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button type="submit" className="flex-1">
                  Verify Code
                </Button>
              </div>
            </form>

            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEmailSubmit({ email: resetEmail })}
                className="text-blue-600 hover:text-blue-700"
              >
                Didn't receive code? Resend
              </Button>
            </div>
          </div>
        )

      case 'new-password':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Set New Password</h3>
              <p className="text-sm text-gray-600">
                Choose a strong password for your account
              </p>
            </div>

            <form onSubmit={newPasswordForm.handleSubmit(handleNewPasswordSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  {...newPasswordForm.register('password')}
                />
                {newPasswordForm.formState.errors.password && (
                  <p className="text-sm text-red-600 mt-1">
                    {newPasswordForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  {...newPasswordForm.register('confirmPassword')}
                />
                {newPasswordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">
                    {newPasswordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep('otp')}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button type="submit" className="flex-1">
                  Reset Password
                </Button>
              </div>
            </form>
          </div>
        )

      case 'success':
        return (
          <div className="space-y-4">
            <div className="text-center py-6">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Password Reset Successful!</h3>
              <p className="text-sm text-gray-600 mb-6">
                {isOtpSent
                  ? "Check your email for the password reset link and follow the instructions to complete the process."
                  : "Your password has been reset successfully. You can now sign in with your new password."
                }
              </p>
              <Button onClick={handleClose} className="w-full">
                Continue to Sign In
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Password Reset</DialogTitle>
        </DialogHeader>
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  )
}