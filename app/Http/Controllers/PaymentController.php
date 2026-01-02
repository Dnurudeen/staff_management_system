<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PaymentController extends Controller
{
    protected $plans = [
        'starter' => [
            'name' => 'Starter',
            'price' => 15000,
            'employees' => 10,
        ],
        'professional' => [
            'name' => 'Professional',
            'price' => 35000,
            'employees' => 50,
        ],
        'enterprise' => [
            'name' => 'Enterprise',
            'price' => 75000,
            'employees' => -1, // unlimited
        ],
    ];

    /**
     * Initialize Paystack payment
     */
    public function initializePaystack(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'plan' => 'required|in:starter,professional,enterprise',
            'user_data' => 'required|array',
            'user_data.name' => 'required|string|max:255',
            'user_data.password' => 'required|string|min:8',
        ]);

        $plan = $this->plans[$request->plan];
        $reference = Payment::generateReference();
        $amount = $plan['price'] * 100; // Paystack uses kobo

        // Create pending payment record
        $payment = Payment::create([
            'email' => $request->email,
            'reference' => $reference,
            'amount' => $plan['price'],
            'currency' => 'NGN',
            'payment_method' => 'paystack',
            'status' => 'pending',
            'plan' => $request->plan,
            'metadata' => [
                'user_data' => $request->user_data,
                'plan_name' => $plan['name'],
            ],
        ]);

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.paystack.secret_key'),
                'Content-Type' => 'application/json',
            ])->post('https://api.paystack.co/transaction/initialize', [
                'email' => $request->email,
                'amount' => $amount,
                'reference' => $reference,
                'callback_url' => route('payment.paystack.callback'),
                'metadata' => [
                    'payment_id' => $payment->id,
                    'plan' => $request->plan,
                    'custom_fields' => [
                        [
                            'display_name' => 'Plan',
                            'variable_name' => 'plan',
                            'value' => $plan['name'],
                        ],
                    ],
                ],
            ]);

            if ($response->successful() && $response->json('status')) {
                return response()->json([
                    'status' => true,
                    'message' => 'Payment initialized',
                    'data' => [
                        'authorization_url' => $response->json('data.authorization_url'),
                        'reference' => $reference,
                    ],
                ]);
            }

            $payment->update(['status' => 'failed']);

            return response()->json([
                'status' => false,
                'message' => $response->json('message') ?? 'Failed to initialize payment',
            ], 400);
        } catch (\Exception $e) {
            Log::error('Paystack initialization error: ' . $e->getMessage());
            $payment->update(['status' => 'failed']);

            return response()->json([
                'status' => false,
                'message' => 'Payment initialization failed. Please try again.',
            ], 500);
        }
    }

    /**
     * Handle Paystack callback
     */
    public function paystackCallback(Request $request)
    {
        $reference = $request->query('reference');

        if (!$reference) {
            return redirect()->route('register')->with('error', 'Invalid payment reference');
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.paystack.secret_key'),
            ])->get("https://api.paystack.co/transaction/verify/{$reference}");

            if ($response->successful() && $response->json('data.status') === 'success') {
                return $this->handleSuccessfulPayment($reference, 'paystack', $response->json('data'));
            }

            return redirect()->route('register')->with('error', 'Payment verification failed. Please try again.');
        } catch (\Exception $e) {
            Log::error('Paystack callback error: ' . $e->getMessage());
            return redirect()->route('register')->with('error', 'Payment verification failed. Please contact support.');
        }
    }

    /**
     * Initialize Flutterwave payment
     */
    public function initializeFlutterwave(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'plan' => 'required|in:starter,professional,enterprise',
            'user_data' => 'required|array',
            'user_data.name' => 'required|string|max:255',
            'user_data.password' => 'required|string|min:8',
        ]);

        $plan = $this->plans[$request->plan];
        $reference = Payment::generateReference();

        // Create pending payment record
        $payment = Payment::create([
            'email' => $request->email,
            'reference' => $reference,
            'amount' => $plan['price'],
            'currency' => 'NGN',
            'payment_method' => 'flutterwave',
            'status' => 'pending',
            'plan' => $request->plan,
            'metadata' => [
                'user_data' => $request->user_data,
                'plan_name' => $plan['name'],
            ],
        ]);

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.flutterwave.secret_key'),
                'Content-Type' => 'application/json',
            ])->post('https://api.flutterwave.com/v3/payments', [
                'tx_ref' => $reference,
                'amount' => $plan['price'],
                'currency' => 'NGN',
                'redirect_url' => route('payment.flutterwave.callback'),
                'customer' => [
                    'email' => $request->email,
                    'name' => $request->user_data['name'],
                ],
                'customizations' => [
                    'title' => 'StaffMS Subscription',
                    'description' => 'Payment for ' . $plan['name'] . ' Plan',
                    'logo' => asset('images/logo.png'),
                ],
                'meta' => [
                    'payment_id' => $payment->id,
                    'plan' => $request->plan,
                ],
            ]);

            if ($response->successful() && $response->json('status') === 'success') {
                return response()->json([
                    'status' => true,
                    'message' => 'Payment initialized',
                    'data' => [
                        'authorization_url' => $response->json('data.link'),
                        'reference' => $reference,
                    ],
                ]);
            }

            $payment->update(['status' => 'failed']);

            return response()->json([
                'status' => false,
                'message' => $response->json('message') ?? 'Failed to initialize payment',
            ], 400);
        } catch (\Exception $e) {
            Log::error('Flutterwave initialization error: ' . $e->getMessage());
            $payment->update(['status' => 'failed']);

            return response()->json([
                'status' => false,
                'message' => 'Payment initialization failed. Please try again.',
            ], 500);
        }
    }

    /**
     * Handle Flutterwave callback
     */
    public function flutterwaveCallback(Request $request)
    {
        $transactionId = $request->query('transaction_id');
        $txRef = $request->query('tx_ref');
        $status = $request->query('status');

        if ($status !== 'successful' || !$transactionId) {
            return redirect()->route('register')->with('error', 'Payment was not successful. Please try again.');
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.flutterwave.secret_key'),
            ])->get("https://api.flutterwave.com/v3/transactions/{$transactionId}/verify");

            if ($response->successful() && $response->json('data.status') === 'successful') {
                return $this->handleSuccessfulPayment($txRef, 'flutterwave', $response->json('data'));
            }

            return redirect()->route('register')->with('error', 'Payment verification failed. Please try again.');
        } catch (\Exception $e) {
            Log::error('Flutterwave callback error: ' . $e->getMessage());
            return redirect()->route('register')->with('error', 'Payment verification failed. Please contact support.');
        }
    }

    /**
     * Handle successful payment and create user
     */
    protected function handleSuccessfulPayment(string $reference, string $provider, array $transactionData)
    {
        $payment = Payment::where('reference', $reference)->first();

        if (!$payment) {
            return redirect()->route('register')->with('error', 'Payment record not found.');
        }

        if ($payment->status === 'success') {
            // Payment already processed, redirect to login
            return redirect()->route('login')->with('success', 'Your account has already been created. Please log in.');
        }

        // Update payment record
        $payment->update([
            'status' => 'success',
            'transaction_id' => $transactionData['id'] ?? $transactionData['reference'] ?? null,
            'paid_at' => now(),
        ]);

        // Create the user
        $userData = $payment->metadata['user_data'];

        $user = User::create([
            'name' => $userData['name'],
            'email' => $payment->email,
            'password' => bcrypt($userData['password']),
            'role' => 'prime_admin',
            'status' => 'active',
            'subscription_plan' => $payment->plan,
            'subscription_expires_at' => now()->addMonth(),
            'is_paid' => true,
        ]);

        // Update payment with user_id
        $payment->update(['user_id' => $user->id]);

        // Log the user in
        Auth::login($user);

        return redirect()->route('dashboard')->with('success', 'Welcome! Your account has been created and your subscription is now active.');
    }

    /**
     * Get available plans
     */
    public function getPlans()
    {
        return response()->json([
            'status' => true,
            'data' => $this->plans,
        ]);
    }

    /**
     * Handle Paystack webhook
     */
    public function paystackWebhook(Request $request)
    {
        // Verify webhook signature
        $signature = $request->header('x-paystack-signature');
        $computedSignature = hash_hmac('sha512', $request->getContent(), config('services.paystack.secret_key'));

        if ($signature !== $computedSignature) {
            return response()->json(['status' => false], 401);
        }

        $event = $request->input('event');
        $data = $request->input('data');

        if ($event === 'charge.success') {
            $reference = $data['reference'];
            $payment = Payment::where('reference', $reference)->first();

            if ($payment && $payment->status === 'pending') {
                $this->handleSuccessfulPayment($reference, 'paystack', $data);
            }
        }

        return response()->json(['status' => true]);
    }

    /**
     * Handle Flutterwave webhook
     */
    public function flutterwaveWebhook(Request $request)
    {
        // Verify webhook signature
        $signature = $request->header('verif-hash');

        if ($signature !== config('services.flutterwave.webhook_secret')) {
            return response()->json(['status' => false], 401);
        }

        $event = $request->input('event');
        $data = $request->input('data');

        if ($event === 'charge.completed' && $data['status'] === 'successful') {
            $reference = $data['tx_ref'];
            $payment = Payment::where('reference', $reference)->first();

            if ($payment && $payment->status === 'pending') {
                $this->handleSuccessfulPayment($reference, 'flutterwave', $data);
            }
        }

        return response()->json(['status' => true]);
    }
}
