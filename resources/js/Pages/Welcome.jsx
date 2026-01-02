import { Head, Link } from "@inertiajs/react";
import { useState, useEffect } from "react";

// Animated background particles
const ParticleBackground = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(50)].map((_, i) => (
                <div
                    key={i}
                    className="absolute rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 animate-float"
                    style={{
                        width: Math.random() * 100 + 20 + "px",
                        height: Math.random() * 100 + 20 + "px",
                        left: Math.random() * 100 + "%",
                        top: Math.random() * 100 + "%",
                        animationDelay: Math.random() * 5 + "s",
                        animationDuration: Math.random() * 10 + 10 + "s",
                    }}
                />
            ))}
        </div>
    );
};

// Feature card component
const FeatureCard = ({ icon, title, description, delay }) => (
    <div
        className="group relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-indigo-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20"
        style={{ animationDelay: delay }}
    >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-purple-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative z-10">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-gray-300 leading-relaxed">{description}</p>
        </div>
    </div>
);

// Pricing card component
const PricingCard = ({ title, price, features, isPopular }) => (
    <div
        className={`relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border ${
            isPopular ? "border-indigo-400 scale-105" : "border-white/20"
        } hover:border-indigo-400/50 transition-all duration-500`}
    >
        {isPopular && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                    Most Popular
                </span>
            </div>
        )}
        <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
            <div className="flex items-baseline justify-center">
                <span className="text-4xl font-extrabold text-white">
                    ₦{price.toLocaleString()}
                </span>
                <span className="text-gray-400 ml-2">/month</span>
            </div>
        </div>
        <ul className="space-y-4 mb-8">
            {features.map((feature, index) => (
                <li key={index} className="flex items-center text-gray-300">
                    <svg
                        className="w-5 h-5 text-green-400 mr-3 flex-shrink-0"
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
        <Link
            href={route("register")}
            className={`block w-full py-3 px-6 text-center rounded-xl font-semibold transition-all duration-300 ${
                isPopular
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 hover:shadow-lg hover:shadow-indigo-500/30"
                    : "bg-white/10 text-white hover:bg-white/20"
            }`}
        >
            Get Started
        </Link>
    </div>
);

// Stats counter component
const StatCounter = ({ number, label, suffix = "" }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const duration = 2000;
        const steps = 60;
        const increment = number / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= number) {
                setCount(number);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [number]);

    return (
        <div className="text-center">
            <div className="text-4xl md:text-5xl font-extrabold text-white mb-2">
                {count.toLocaleString()}
                {suffix}
            </div>
            <div className="text-gray-400">{label}</div>
        </div>
    );
};

// Testimonial card
const TestimonialCard = ({ name, role, content, avatar }) => (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {avatar}
            </div>
            <div className="ml-4">
                <div className="text-white font-semibold">{name}</div>
                <div className="text-gray-400 text-sm">{role}</div>
            </div>
        </div>
        <p className="text-gray-300 leading-relaxed">{content}</p>
        <div className="flex mt-4 text-yellow-400">
            {[...Array(5)].map((_, i) => (
                <svg
                    key={i}
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    </div>
);

export default function Welcome({ auth, canLogin, canRegister }) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const features = [
        {
            icon: (
                <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                </svg>
            ),
            title: "Staff Management",
            description:
                "Efficiently manage your team with comprehensive employee profiles, departments, and organizational structure.",
        },
        {
            icon: (
                <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            ),
            title: "Time & Attendance",
            description:
                "Track clock-ins, clock-outs, and working hours with our intuitive attendance management system.",
        },
        {
            icon: (
                <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                </svg>
            ),
            title: "Task Management",
            description:
                "Assign, track, and complete tasks with our powerful Kanban board and task tracking features.",
        },
        {
            icon: (
                <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
            ),
            title: "Leave Management",
            description:
                "Streamline leave requests and approvals with automated workflows and calendar integration.",
        },
        {
            icon: (
                <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                </svg>
            ),
            title: "Team Communication",
            description:
                "Real-time messaging, group chats, and video meetings to keep your team connected.",
        },
        {
            icon: (
                <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                </svg>
            ),
            title: "Performance Reviews",
            description:
                "Conduct comprehensive performance evaluations with customizable review templates.",
        },
    ];

    const pricingPlans = [
        {
            title: "Starter",
            price: 15000,
            features: [
                "Up to 10 employees",
                "Basic attendance tracking",
                "Leave management",
                "Email support",
                "5GB storage",
            ],
            isPopular: false,
        },
        {
            title: "Professional",
            price: 35000,
            features: [
                "Up to 50 employees",
                "Advanced attendance & reports",
                "Task management",
                "Team messaging",
                "Priority support",
                "25GB storage",
            ],
            isPopular: true,
        },
        {
            title: "Enterprise",
            price: 75000,
            features: [
                "Unlimited employees",
                "All features included",
                "Custom integrations",
                "Dedicated account manager",
                "24/7 support",
                "Unlimited storage",
            ],
            isPopular: false,
        },
    ];

    const testimonials = [
        {
            name: "Adaora Okafor",
            role: "HR Director, TechCorp",
            content:
                "StaffMS has transformed how we manage our 200+ employees. The automation features have saved us countless hours.",
            avatar: "AO",
        },
        {
            name: "Emeka Nwosu",
            role: "CEO, FinanceHub",
            content:
                "The best staff management solution we've used. The interface is intuitive and our team adopted it quickly.",
            avatar: "EN",
        },
        {
            name: "Fatima Ibrahim",
            role: "Operations Manager",
            content:
                "Real-time attendance tracking and reporting have given us unprecedented visibility into our workforce.",
            avatar: "FI",
        },
    ];

    return (
        <>
            <Head title="Welcome - Modern Staff Management System" />

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(10deg); }
                }
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(-30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.3); }
                    50% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.6); }
                }
                .animate-float { animation: float 15s ease-in-out infinite; }
                .animate-gradient { 
                    background-size: 200% 200%;
                    animation: gradient 8s ease infinite; 
                }
                .animate-slideUp { animation: slideUp 0.8s ease-out forwards; }
                .animate-slideIn { animation: slideIn 0.8s ease-out forwards; }
                .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
            `}</style>

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 animate-gradient">
                <ParticleBackground />

                {/* Navigation */}
                <nav
                    className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                        isScrolled
                            ? "bg-slate-900/95 backdrop-blur-lg shadow-lg"
                            : "bg-transparent"
                    }`}
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-20">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                        StaffMS
                                    </span>
                                </div>
                            </div>

                            {/* Desktop Navigation */}
                            <div className="hidden md:flex items-center space-x-8">
                                <a
                                    href="#features"
                                    className="text-gray-300 hover:text-white transition-colors"
                                >
                                    Features
                                </a>
                                <a
                                    href="#pricing"
                                    className="text-gray-300 hover:text-white transition-colors"
                                >
                                    Pricing
                                </a>
                                <a
                                    href="#testimonials"
                                    className="text-gray-300 hover:text-white transition-colors"
                                >
                                    Testimonials
                                </a>
                                {auth.user ? (
                                    <Link
                                        href={route("dashboard")}
                                        className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-full font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        {canLogin && (
                                            <Link
                                                href={route("login")}
                                                className="text-gray-300 hover:text-white transition-colors"
                                            >
                                                Log in
                                            </Link>
                                        )}
                                        {canRegister && (
                                            <Link
                                                href={route("register")}
                                                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-full font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30"
                                            >
                                                Get Started
                                            </Link>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Mobile menu button */}
                            <div className="md:hidden">
                                <button
                                    onClick={() =>
                                        setMobileMenuOpen(!mobileMenuOpen)
                                    }
                                    className="text-gray-300 hover:text-white"
                                >
                                    <svg
                                        className="w-6 h-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        {mobileMenuOpen ? (
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        ) : (
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M4 6h16M4 12h16M4 18h16"
                                            />
                                        )}
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Mobile Navigation */}
                        {mobileMenuOpen && (
                            <div className="md:hidden bg-slate-900/95 backdrop-blur-lg rounded-lg mb-4 p-4">
                                <div className="flex flex-col space-y-4">
                                    <a
                                        href="#features"
                                        className="text-gray-300 hover:text-white transition-colors"
                                    >
                                        Features
                                    </a>
                                    <a
                                        href="#pricing"
                                        className="text-gray-300 hover:text-white transition-colors"
                                    >
                                        Pricing
                                    </a>
                                    <a
                                        href="#testimonials"
                                        className="text-gray-300 hover:text-white transition-colors"
                                    >
                                        Testimonials
                                    </a>
                                    {auth.user ? (
                                        <Link
                                            href={route("dashboard")}
                                            className="text-indigo-400 hover:text-indigo-300"
                                        >
                                            Dashboard
                                        </Link>
                                    ) : (
                                        <>
                                            {canLogin && (
                                                <Link
                                                    href={route("login")}
                                                    className="text-gray-300 hover:text-white"
                                                >
                                                    Log in
                                                </Link>
                                            )}
                                            {canRegister && (
                                                <Link
                                                    href={route("register")}
                                                    className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-full font-semibold text-center"
                                                >
                                                    Get Started
                                                </Link>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center animate-slideUp">
                            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
                                Modern Staff Management
                                <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    Made Simple
                                </span>
                            </h1>
                            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
                                Streamline your workforce management with our
                                comprehensive platform. From attendance tracking
                                to performance reviews, we've got you covered.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href={route("register")}
                                    className="inline-flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-105 animate-pulse-glow"
                                >
                                    Start Free Trial
                                    <svg
                                        className="w-5 h-5 ml-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                                        />
                                    </svg>
                                </Link>
                                <a
                                    href="#features"
                                    className="inline-flex items-center justify-center bg-white/10 backdrop-blur-lg text-white px-8 py-4 rounded-full font-semibold text-lg border border-white/20 hover:bg-white/20 transition-all duration-300"
                                >
                                    Learn More
                                </a>
                            </div>
                        </div>

                        {/* Dashboard Preview */}
                        <div className="mt-20 relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10 pointer-events-none" />
                            <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/20 p-2 shadow-2xl shadow-indigo-500/10 overflow-hidden">
                                <div className="bg-slate-800/80 rounded-xl p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-3 h-3 rounded-full bg-red-500" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                        <div className="w-3 h-3 rounded-full bg-green-500" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-slate-700/50 rounded-lg p-4">
                                            <div className="text-sm text-gray-400 mb-2">
                                                Total Employees
                                            </div>
                                            <div className="text-2xl font-bold text-white">
                                                1,247
                                            </div>
                                            <div className="text-green-400 text-sm mt-1">
                                                ↑ 12% from last month
                                            </div>
                                        </div>
                                        <div className="bg-slate-700/50 rounded-lg p-4">
                                            <div className="text-sm text-gray-400 mb-2">
                                                Present Today
                                            </div>
                                            <div className="text-2xl font-bold text-white">
                                                1,156
                                            </div>
                                            <div className="text-green-400 text-sm mt-1">
                                                92.7% attendance
                                            </div>
                                        </div>
                                        <div className="bg-slate-700/50 rounded-lg p-4">
                                            <div className="text-sm text-gray-400 mb-2">
                                                Pending Tasks
                                            </div>
                                            <div className="text-2xl font-bold text-white">
                                                89
                                            </div>
                                            <div className="text-yellow-400 text-sm mt-1">
                                                23 due today
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <StatCounter
                                number={5000}
                                suffix="+"
                                label="Companies Trust Us"
                            />
                            <StatCounter
                                number={500000}
                                suffix="+"
                                label="Employees Managed"
                            />
                            <StatCounter
                                number={99.9}
                                suffix="%"
                                label="Uptime Guaranteed"
                            />
                            <StatCounter
                                number={24}
                                suffix="/7"
                                label="Support Available"
                            />
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                Everything You Need to Manage Your Team
                            </h2>
                            <p className="text-gray-400 max-w-2xl mx-auto">
                                Powerful features designed to streamline your HR
                                operations and boost productivity.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {features.map((feature, index) => (
                                <FeatureCard
                                    key={index}
                                    icon={feature.icon}
                                    title={feature.title}
                                    description={feature.description}
                                    delay={`${index * 100}ms`}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section
                    id="pricing"
                    className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10"
                >
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                Simple, Transparent Pricing
                            </h2>
                            <p className="text-gray-400 max-w-2xl mx-auto">
                                Choose the plan that fits your organization. All
                                plans include a 14-day free trial.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                            {pricingPlans.map((plan, index) => (
                                <PricingCard key={index} {...plan} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section
                    id="testimonials"
                    className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10"
                >
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                Trusted by Industry Leaders
                            </h2>
                            <p className="text-gray-400 max-w-2xl mx-auto">
                                See what our customers have to say about their
                                experience with StaffMS.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {testimonials.map((testimonial, index) => (
                                <TestimonialCard key={index} {...testimonial} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-12 text-center overflow-hidden">
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
                            <div className="relative z-10">
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                    Ready to Transform Your Workforce
                                    Management?
                                </h2>
                                <p className="text-indigo-100 mb-8 max-w-2xl mx-auto">
                                    Join thousands of companies already using
                                    StaffMS to streamline their HR operations.
                                </p>
                                <Link
                                    href={route("register")}
                                    className="inline-flex items-center justify-center bg-white text-indigo-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all duration-300 hover:shadow-xl hover:scale-105"
                                >
                                    Start Your Free Trial
                                    <svg
                                        className="w-5 h-5 ml-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                                        />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                            <div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                    StaffMS
                                </span>
                                <p className="text-gray-400 mt-4">
                                    Modern staff management for modern
                                    businesses.
                                </p>
                            </div>
                            <div>
                                <h4 className="text-white font-semibold mb-4">
                                    Product
                                </h4>
                                <ul className="space-y-2">
                                    <li>
                                        <a
                                            href="#features"
                                            className="text-gray-400 hover:text-white transition-colors"
                                        >
                                            Features
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#pricing"
                                            className="text-gray-400 hover:text-white transition-colors"
                                        >
                                            Pricing
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#"
                                            className="text-gray-400 hover:text-white transition-colors"
                                        >
                                            Integrations
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-white font-semibold mb-4">
                                    Company
                                </h4>
                                <ul className="space-y-2">
                                    <li>
                                        <a
                                            href="#"
                                            className="text-gray-400 hover:text-white transition-colors"
                                        >
                                            About
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#"
                                            className="text-gray-400 hover:text-white transition-colors"
                                        >
                                            Blog
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#"
                                            className="text-gray-400 hover:text-white transition-colors"
                                        >
                                            Careers
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-white font-semibold mb-4">
                                    Support
                                </h4>
                                <ul className="space-y-2">
                                    <li>
                                        <a
                                            href="#"
                                            className="text-gray-400 hover:text-white transition-colors"
                                        >
                                            Help Center
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#"
                                            className="text-gray-400 hover:text-white transition-colors"
                                        >
                                            Contact Us
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#"
                                            className="text-gray-400 hover:text-white transition-colors"
                                        >
                                            Privacy Policy
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="border-t border-white/10 pt-8 text-center text-gray-400">
                            <p>
                                &copy; {new Date().getFullYear()} StaffMS. All
                                rights reserved.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
