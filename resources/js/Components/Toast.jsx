import { Fragment } from "react";
import { Transition } from "@headlessui/react";
import {
    CheckCircleIcon,
    XCircleIcon,
    InformationCircleIcon,
    ExclamationTriangleIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";

export default function Toast({
    show,
    message,
    type = "success",
    onClose,
    duration = 5000,
}) {
    const icons = {
        success: <CheckCircleIcon className="h-6 w-6 text-green-400" />,
        error: <XCircleIcon className="h-6 w-6 text-red-400" />,
        info: <InformationCircleIcon className="h-6 w-6 text-blue-400" />,
        warning: (
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
        ),
    };

    const colors = {
        success: "bg-green-50 border-green-200",
        error: "bg-red-50 border-red-200",
        info: "bg-blue-50 border-blue-200",
        warning: "bg-yellow-50 border-yellow-200",
    };

    // Auto-close after duration
    if (show && duration > 0) {
        setTimeout(() => {
            if (onClose) onClose();
        }, duration);
    }

    return (
        <div className="fixed top-4 right-4 z-50 w-full max-w-sm">
            <Transition
                show={show}
                as={Fragment}
                enter="transform ease-out duration-300 transition"
                enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
                enterTo="translate-y-0 opacity-100 sm:translate-x-0"
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
            >
                <div
                    className={`rounded-lg border p-4 shadow-lg ${colors[type]}`}
                >
                    <div className="flex items-start">
                        <div className="flex-shrink-0">{icons[type]}</div>
                        <div className="ml-3 w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900">
                                {message}
                            </p>
                        </div>
                        <div className="ml-4 flex flex-shrink-0">
                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex rounded-md bg-transparent text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </div>
    );
}
