import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm, router } from "@inertiajs/react";
import { useState } from "react";
import axios from "axios";

// Step indicator component
const StepIndicator = ({ currentStep, steps }) => (
    <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
            <div key={index} className="flex items-center">
                <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                        index + 1 <= currentStep
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "border-gray-300 text-gray-400"
                    }`}
                >
                    {index + 1 < currentStep ? (
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    ) : (
                        index + 1
                    )}
                </div>
                {index < steps.length - 1 && (
                    <div
                        className={`w-16 h-1 mx-2 transition-all duration-300 ${
                            index + 1 < currentStep
                                ? "bg-indigo-600"
                                : "bg-gray-200"
                        }`}
                    />
                )}
            </div>
        ))}
    </div>
);

// Plan card component
const PlanCard = ({
    plan,
    price,
    features,
    isSelected,
    onSelect,
    isPopular,
    employees,
}) => (
    <div
        onClick={onSelect}
        className={`relative cursor-pointer rounded-2xl p-6 border-2 transition-all duration-300 ${
            isSelected
                ? "border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-500/20"
                : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
        }`}
    >
        {isPopular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                </span>
            </div>
        )}
        <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900">{plan}</h3>
            <div className="mt-2">
                <span className="text-3xl font-extrabold text-gray-900">
                    ₦{price.toLocaleString()}
                </span>
                <span className="text-gray-500">/month</span>
            </div>
            <p className="text-sm text-indigo-600 font-medium mt-1">
                {employees === -1 ? "Unlimited" : `Up to ${employees}`}{" "}
                employees
            </p>
        </div>
        <ul className="mt-4 space-y-2">
            {features.map((feature, index) => (
                <li
                    key={index}
                    className="flex items-center text-sm text-gray-600"
                >
                    <svg
                        className="w-4 h-4 text-green-500 mr-2 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                    {feature}
                </li>
            ))}
        </ul>
        {isSelected && (
            <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                    <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </div>
            </div>
        )}
    </div>
);

// Payment method card
const PaymentMethodCard = ({
    method,
    icon,
    isSelected,
    onSelect,
    description,
}) => (
    <div
        onClick={onSelect}
        className={`cursor-pointer rounded-xl p-6 border-2 transition-all duration-300 ${
            isSelected
                ? "border-indigo-500 bg-indigo-50 shadow-lg"
                : "border-gray-200 hover:border-indigo-300"
        }`}
    >
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <div className="w-12 h-12 flex items-center justify-center">
                    {icon}
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">{method}</h3>
                    <p className="text-sm text-gray-500">{description}</p>
                </div>
            </div>
            {isSelected && (
                <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                    <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </div>
            )}
        </div>
    </div>
);

export default function Register() {
    const [step, setStep] = useState(1);
    const [selectedPlan, setSelectedPlan] = useState("professional");
    const [paymentMethod, setPaymentMethod] = useState("paystack");
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState("");

    const { data, setData, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        organization_name: "",
    });

    const steps = ["Account", "Plan", "Payment"];

    const plans = {
        starter: {
            name: "Starter",
            price: 15000,
            employees: 10,
            features: [
                "Basic attendance tracking",
                "Leave management",
                "Email support",
                "5GB storage",
            ],
        },
        professional: {
            name: "Professional",
            price: 35000,
            employees: 50,
            features: [
                "Advanced attendance & reports",
                "Task management",
                "Team messaging",
                "Performance reviews",
                "Priority support",
                "25GB storage",
            ],
            isPopular: true,
        },
        enterprise: {
            name: "Enterprise",
            price: 75000,
            employees: -1,
            features: [
                "All features included",
                "Custom integrations",
                "API access",
                "24/7 dedicated support",
                "Unlimited storage",
            ],
        },
    };

    const validateStep1 = () => {
        const newErrors = {};
        if (!data.name.trim()) newErrors.name = "Name is required";
        if (!data.organization_name.trim())
            newErrors.organization_name = "Organization name is required";
        if (!data.email.trim()) newErrors.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
            newErrors.email = "Invalid email format";
        if (!data.password) newErrors.password = "Password is required";
        else if (data.password.length < 8)
            newErrors.password = "Password must be at least 8 characters";
        if (data.password !== data.password_confirmation)
            newErrors.password_confirmation = "Passwords do not match";

        if (Object.keys(newErrors).length > 0) {
            setError(Object.values(newErrors)[0]);
            return false;
        }
        setError("");
        return true;
    };

    const handleNext = () => {
        if (step === 1 && !validateStep1()) return;
        if (step < 3) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handlePayment = async () => {
        setIsProcessing(true);
        setError("");

        try {
            const endpoint =
                paymentMethod === "paystack"
                    ? "/payment/paystack/initialize"
                    : "/payment/flutterwave/initialize";

            const response = await axios.post(endpoint, {
                email: data.email,
                plan: selectedPlan,
                user_data: {
                    name: data.name,
                    password: data.password,
                    organization_name: data.organization_name,
                },
            });

            if (response.data.status && response.data.data.authorization_url) {
                // Redirect to payment gateway
                window.location.href = response.data.data.authorization_url;
            } else {
                setError(
                    response.data.message || "Failed to initialize payment"
                );
            }
        } catch (err) {
            console.error("Payment error:", err);
            setError(
                err.response?.data?.message ||
                    "Payment initialization failed. Please try again."
            );
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <div className="w-full">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Create Your Account
                    </h2>
                    <p className="text-gray-600 mt-1">
                        Start managing your staff efficiently
                    </p>
                </div>

                <StepIndicator currentStep={step} steps={steps} />

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Step 1: Account Details */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div>
                            <InputLabel
                                htmlFor="organization_name"
                                value="Organization/Company Name"
                            />
                            <TextInput
                                id="organization_name"
                                name="organization_name"
                                value={data.organization_name}
                                className="mt-1 block w-full"
                                isFocused={true}
                                onChange={(e) =>
                                    setData("organization_name", e.target.value)
                                }
                                placeholder="e.g., Acme Corporation"
                                required
                            />
                            <InputError
                                message={errors.organization_name}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel htmlFor="name" value="Your Full Name" />
                            <TextInput
                                id="name"
                                name="name"
                                value={data.name}
                                className="mt-1 block w-full"
                                autoComplete="name"
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                placeholder="e.g., John Doe"
                                required
                            />
                            <InputError
                                message={errors.name}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel htmlFor="email" value="Email" />
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="mt-1 block w-full"
                                autoComplete="username"
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                                placeholder="e.g., john@company.com"
                                required
                            />
                            <InputError
                                message={errors.email}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel htmlFor="password" value="Password" />
                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="mt-1 block w-full"
                                autoComplete="new-password"
                                onChange={(e) =>
                                    setData("password", e.target.value)
                                }
                                required
                            />
                            <InputError
                                message={errors.password}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="password_confirmation"
                                value="Confirm Password"
                            />
                            <TextInput
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                value={data.password_confirmation}
                                className="mt-1 block w-full"
                                autoComplete="new-password"
                                onChange={(e) =>
                                    setData(
                                        "password_confirmation",
                                        e.target.value
                                    )
                                }
                                required
                            />
                            <InputError
                                message={errors.password_confirmation}
                                className="mt-2"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <Link
                                href={route("login")}
                                className="text-sm text-indigo-600 hover:text-indigo-500"
                            >
                                Already have an account?
                            </Link>
                            <PrimaryButton onClick={handleNext}>
                                Continue
                            </PrimaryButton>
                        </div>
                    </div>
                )}

                {/* Step 2: Choose Plan */}
                {step === 2 && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            {Object.entries(plans).map(([key, plan]) => (
                                <PlanCard
                                    key={key}
                                    plan={plan.name}
                                    price={plan.price}
                                    features={plan.features}
                                    employees={plan.employees}
                                    isSelected={selectedPlan === key}
                                    onSelect={() => setSelectedPlan(key)}
                                    isPopular={plan.isPopular}
                                />
                            ))}
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="text-sm text-gray-600 hover:text-gray-900"
                            >
                                ← Back
                            </button>
                            <PrimaryButton onClick={handleNext}>
                                Continue to Payment
                            </PrimaryButton>
                        </div>
                    </div>
                )}

                {/* Step 3: Payment */}
                {step === 3 && (
                    <div className="space-y-6">
                        {/* Order Summary */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-3">
                                Order Summary
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">
                                        Organization
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        {data.organization_name}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Plan</span>
                                    <span className="font-medium text-gray-900">
                                        {plans[selectedPlan].name}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">
                                        Max Employees
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        {plans[selectedPlan].employees === -1
                                            ? "Unlimited"
                                            : plans[selectedPlan].employees}
                                    </span>
                                </div>
                                <div className="border-t pt-2 mt-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-900 font-semibold">
                                            Total
                                        </span>
                                        <span className="font-bold text-xl text-indigo-600">
                                            ₦
                                            {plans[
                                                selectedPlan
                                            ].price.toLocaleString()}
                                            /month
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-900">
                                Select Payment Method
                            </h3>

                            <PaymentMethodCard
                                method="Paystack"
                                description="Pay with card, bank transfer, or USSD"
                                isSelected={paymentMethod === "paystack"}
                                onSelect={() => setPaymentMethod("paystack")}
                                icon={
                                    <svg
                                        className="w-10 h-10"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <rect
                                            width="24"
                                            height="24"
                                            rx="4"
                                            fill="#00C3F7"
                                        />
                                        <path
                                            d="M6 8h12M6 12h12M6 16h8"
                                            stroke="white"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                }
                            />

                            <PaymentMethodCard
                                method="Flutterwave"
                                description="Pay with card, bank, mobile money"
                                isSelected={paymentMethod === "flutterwave"}
                                onSelect={() => setPaymentMethod("flutterwave")}
                                icon={
                                    <svg
                                        className="w-10 h-10"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <rect
                                            width="24"
                                            height="24"
                                            rx="4"
                                            fill="#F5A623"
                                        />
                                        <path
                                            d="M12 6L18 12L12 18L6 12L12 6Z"
                                            fill="white"
                                        />
                                    </svg>
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="text-sm text-gray-600 hover:text-gray-900"
                                disabled={isProcessing}
                            >
                                ← Back
                            </button>
                            <PrimaryButton
                                onClick={handlePayment}
                                disabled={isProcessing}
                                className="min-w-[150px]"
                            >
                                {isProcessing ? (
                                    <span className="flex items-center">
                                        <svg
                                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            />
                                        </svg>
                                        Processing...
                                    </span>
                                ) : (
                                    `Pay ₦${plans[
                                        selectedPlan
                                    ].price.toLocaleString()}`
                                )}
                            </PrimaryButton>
                        </div>

                        <p className="text-xs text-center text-gray-500 mt-4">
                            By proceeding, you agree to our Terms of Service and
                            Privacy Policy. Your payment is secure and
                            encrypted.
                        </p>
                    </div>
                )}
            </div>
        </GuestLayout>
    );
}
