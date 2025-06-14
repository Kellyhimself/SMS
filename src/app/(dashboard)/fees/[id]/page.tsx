'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { useFee, useProcessPayment } from '@/hooks/use-fees'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export default function FeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { data: fee, isLoading } = useFee(resolvedParams.id)
  const { mutate: processPayment } = useProcessPayment()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [receiptBlob, setReceiptBlob] = useState<Blob | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'bank' | 'cash'>('cash')
  const [bankDetails, setBankDetails] = useState({
    bank_name: '',
    bank_account: '',
    bank_slip_number: ''
  })
  const [bankSettingsError, setBankSettingsError] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const { user, school, isLoading: isAuthLoading } = useAuth()
  const isOnline = navigator.onLine

  // Add effect to log receipt modal state
  useEffect(() => {
    console.log('Receipt modal state:', { showReceiptModal, hasReceiptBlob: !!receiptBlob })
  }, [showReceiptModal, receiptBlob])

  useEffect(() => {
    if (isOnline && school?.id) {
      fetch(`/api/bank/service?schoolId=${school.id}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to load bank service')
          }
          return response.json()
        })
        .then(() => {
          setBankSettingsError(null)
        })
        .catch(error => {
          console.error('Failed to load bank service:', error)
          setBankSettingsError('Bank payment settings are not configured for this school. Please contact the school administrator.')
        })
    }
  }, [school?.id, isOnline])

  // Reset payment amount when modal opens
  useEffect(() => {
    if (showPaymentModal && fee) {
      setPaymentAmount(fee.amount - (fee.amount_paid || 0))
    }
  }, [showPaymentModal, fee])

  if (isLoading || isAuthLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-1/4 bg-gray-200 animate-pulse rounded" />
        <div className="h-32 w-full bg-gray-200 animate-pulse rounded" />
      </div>
    )
  }

  if (!fee) {
    return <div>Fee not found</div>
  }

  // Check if user has permission to view this fee
  if (user?.role !== 'admin' && fee.school_id !== school?.id) {
    return <div>You don&apos;t have permission to view this fee</div>
  }

  const handlePayment = async (amount: number) => {
    console.log('Starting payment process...')
    if (paymentMethod === 'bank') {
      if (!bankDetails.bank_name || !bankDetails.bank_account || !bankDetails.bank_slip_number) {
        toast.error('Please fill in all bank details')
        return
      }

      processPayment({
        feeId: resolvedParams.id,
        amount,
        paymentMethod: 'bank',
        paymentDetails: {
          bank_name: bankDetails.bank_name,
          bank_account: bankDetails.bank_account,
          bank_slip_number: bankDetails.bank_slip_number
        }
      }, {
        onSuccess: (data) => {
          console.log('Payment success data:', data)
          if (data.receiptBlob) {
            console.log('Setting receipt blob and showing modal')
            setReceiptBlob(data.receiptBlob)
            setShowReceiptModal(true)
          } else {
            console.log('No receipt blob in response')
          }
          setShowPaymentModal(false)
        },
        onError: (error) => {
          console.error('Payment error:', error)
          toast.error('Failed to process payment')
        }
      })
    } else if (paymentMethod === 'mpesa') {
      if (!school?.payment_settings?.paybill_number) {
        toast.error('M-Pesa payments are not configured for this school')
        return
      }

      processPayment({
        feeId: resolvedParams.id,
        amount,
        paymentMethod: 'mpesa',
        paymentDetails: {
          paybill_number: school.payment_settings.paybill_number,
          account_number: fee.student_id
        }
      }, {
        onSuccess: (data) => {
          console.log('Payment success data:', data)
          if (data.receiptBlob) {
            console.log('Setting receipt blob and showing modal')
            setReceiptBlob(data.receiptBlob)
            setShowReceiptModal(true)
          } else {
            console.log('No receipt blob in response')
          }
          setShowPaymentModal(false)
        },
        onError: (error) => {
          console.error('Payment error:', error)
          toast.error('Failed to process payment')
        }
      })
    } else if (paymentMethod === 'cash') {
      processPayment({
        feeId: resolvedParams.id,
        amount,
        paymentMethod: 'cash'
      }, {
        onSuccess: (data) => {
          console.log('Payment success data:', data)
          if (data.receiptBlob) {
            console.log('Setting receipt blob and showing modal')
            setReceiptBlob(data.receiptBlob)
            setShowReceiptModal(true)
          } else {
            console.log('No receipt blob in response')
          }
          setShowPaymentModal(false)
        },
        onError: (error) => {
          console.error('Payment error:', error)
          toast.error('Failed to process payment')
        }
      })
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fee Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <h3 className="font-medium text-muted-foreground">Total Amount</h3>
                <p className="text-2xl font-bold">KES {fee.amount}</p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground">Amount Paid</h3>
                <p className="text-2xl font-bold">KES {fee.amount_paid || 0}</p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground">Balance Due</h3>
                <p className="text-2xl font-bold text-primary">
                  KES {fee.amount - (fee.amount_paid || 0)}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground">Status</h3>
                <p className="text-2xl font-bold">
                  {fee.status === 'paid' ? (
                    <span className="text-green-600">Paid</span>
                  ) : fee.amount_paid && fee.amount_paid > 0 ? (
                    <span className="text-yellow-600">Partially Paid</span>
                  ) : (
                    <span className="text-red-600">Unpaid</span>
                  )}
                </p>
              </div>
            </div>

            {/* Payment Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Payment Progress</span>
                <span className="text-sm font-medium">
                  {Math.round(((fee.amount_paid || 0) / fee.amount) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full"
                  style={{
                    width: `${Math.min(((fee.amount_paid || 0) / fee.amount) * 100, 100)}%`
                  }}
                />
              </div>
            </div>

            {isOnline && bankSettingsError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Bank Settings Not Configured</AlertTitle>
                <AlertDescription>{bankSettingsError}</AlertDescription>
              </Alert>
            ) : isOnline && school?.payment_settings && (
              <div className="bg-muted p-4 rounded-md">
                <h3 className="font-medium mb-2">Bank Payment Details</h3>
                <p className="text-sm">Paybill Number: {school.payment_settings.paybill_number}</p>
                <p className="text-sm">Account Number: {fee.student_id}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Make your payment directly to the bank using these details. The system will automatically update the fee status.
                </p>
              </div>
            )}
            <div className="flex justify-end">
              <Button
                onClick={() => setShowPaymentModal(true)}
                disabled={!isOnline && paymentMethod !== 'cash'}
              >
                {fee.amount_paid && fee.amount_paid > 0 ? 'Make Additional Payment' : 'Make Payment'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="bg-muted p-4 rounded-md">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-medium">KES {fee.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount Paid</p>
                  <p className="font-medium">KES {fee.amount_paid || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Balance Due</p>
                  <p className="font-medium text-primary">KES {fee.amount - (fee.amount_paid || 0)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Payment Method</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value: 'mpesa' | 'bank' | 'cash') => setPaymentMethod(value)}
                  disabled={!isOnline}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {isOnline && <SelectItem value="mpesa">M-Pesa</SelectItem>}
                    {isOnline && <SelectItem value="bank">Bank Deposit</SelectItem>}
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
                {!isOnline && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Only cash payments are available in offline mode.
                  </p>
                )}
              </div>

              {paymentMethod === 'bank' && isOnline && (
                <div className="space-y-4">
                  <div className="bg-yellow-50 p-4 rounded-md">
                    <p className="text-sm text-yellow-800">
                      This form is for confirming bank deposits that have already been made. 
                      For new payments, please use the bank details shown above.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label>Bank Name</Label>
                      <Input
                        value={bankDetails.bank_name}
                        onChange={(e) => setBankDetails(prev => ({ ...prev, bank_name: e.target.value }))}
                        placeholder="Enter bank name"
                      />
                    </div>
                    <div>
                      <Label>Bank Account</Label>
                      <Input
                        value={bankDetails.bank_account}
                        onChange={(e) => setBankDetails(prev => ({ ...prev, bank_account: e.target.value }))}
                        placeholder="Enter bank account number"
                      />
                    </div>
                    <div>
                      <Label>Slip Number</Label>
                      <Input
                        value={bankDetails.bank_slip_number}
                        onChange={(e) => setBankDetails(prev => ({ ...prev, bank_slip_number: e.target.value }))}
                        placeholder="Enter bank slip number"
                      />
                    </div>
                    <div>
                      <Label>Payment Amount</Label>
                      <Input
                        type="number"
                        min="0"
                        max={fee.amount - (fee.amount_paid || 0)}
                        step="0.01"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                        placeholder={`Enter amount (max: KES ${fee.amount - (fee.amount_paid || 0)})`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'mpesa' && isOnline && (
                <div className="space-y-4">
                  {school?.payment_settings?.paybill_number ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Please use the following details to make your M-Pesa payment:
                      </p>
                      <div className="bg-muted p-4 rounded-md">
                        <p className="font-medium">Paybill Number: {school.payment_settings.paybill_number}</p>
                        <p className="font-medium">Account Number: {fee.student_id}</p>
                      </div>
                      <div>
                        <Label>Payment Amount</Label>
                        <Input
                          type="number"
                          min="0"
                          max={fee.amount - (fee.amount_paid || 0)}
                          step="0.01"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(Number(e.target.value))}
                          placeholder={`Enter amount (max: KES ${fee.amount - (fee.amount_paid || 0)})`}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        After making the payment, the system will automatically update the fee status.
                      </p>
                    </>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>M-Pesa Not Configured</AlertTitle>
                      <AlertDescription>
                        M-Pesa payments are not configured for this school. Please contact the school administrator.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {paymentMethod === 'cash' && (
                <div>
                  <Label>Payment Amount</Label>
                  <Input
                    type="number"
                    min="0"
                    max={fee.amount - (fee.amount_paid || 0)}
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    placeholder={`Enter amount (max: KES ${fee.amount - (fee.amount_paid || 0)})`}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  console.log('Payment button clicked', {
                    paymentMethod,
                    paymentAmount,
                    bankDetails,
                    schoolPaymentSettings: school?.payment_settings
                  });
                  handlePayment(paymentAmount || fee.amount - (fee.amount_paid || 0));
                }}
                disabled={
                  (paymentMethod === 'mpesa' && !school?.payment_settings?.paybill_number) ||
                  (paymentMethod === 'bank' && (!bankDetails.bank_name || !bankDetails.bank_account || !bankDetails.bank_slip_number)) ||
                  paymentAmount <= 0 ||
                  paymentAmount > (fee.amount - (fee.amount_paid || 0))
                }
              >
                Confirm Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
          </DialogHeader>
          {receiptBlob ? (
            <div className="mt-4">
              <iframe
                src={URL.createObjectURL(receiptBlob)}
                className="w-full h-[400px] border-0"
                title="Payment Receipt"
                id="receipt-iframe"
                onError={(e) => {
                  console.error('Error loading receipt:', e);
                  toast.error('Failed to load receipt. Please try downloading it instead.');
                }}
              />
            </div>
          ) : (
            <div className="mt-4 text-center text-muted-foreground">
              Loading receipt...
            </div>
          )}
          <div className="flex justify-end mt-4 space-x-2">
            <Button variant="outline" onClick={() => setShowReceiptModal(false)}>
              Close
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                const iframe = document.getElementById('receipt-iframe') as HTMLIFrameElement;
                if (iframe) {
                  iframe.contentWindow?.print();
                }
              }}
              disabled={!receiptBlob}
            >
              Print Receipt
            </Button>
            <Button 
              onClick={() => {
                if (receiptBlob) {
                  const url = URL.createObjectURL(receiptBlob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `receipt-${fee.id}-${Date.now()}.pdf`
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  URL.revokeObjectURL(url)
                }
              }}
              disabled={!receiptBlob}
            >
              Download Receipt
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 