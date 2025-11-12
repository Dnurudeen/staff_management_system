import {
    Dialog,
    DialogPanel,
    DialogTitle,
    Transition,
    TransitionChild,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Children, cloneElement, isValidElement } from "react";

export default function Modal({
    children,
    show = false,
    maxWidth = "2xl",
    closeable = true,
    onClose = () => {},
    title,
    showHeader = true,
}) {
    const close = () => {
        if (closeable) {
            onClose();
        }
    };

    const maxWidthClass = {
        sm: "sm:max-w-sm",
        md: "sm:max-w-md",
        lg: "sm:max-w-lg",
        xl: "sm:max-w-xl",
        "2xl": "sm:max-w-2xl",
        "3xl": "sm:max-w-3xl",
        "4xl": "sm:max-w-4xl",
        "5xl": "sm:max-w-5xl",
        "6xl": "sm:max-w-6xl",
        "7xl": "sm:max-w-7xl",
    }[maxWidth];

    // Separate footer from other children
    let footer = null;
    let bodyChildren = [];

    Children.forEach(children, (child) => {
        if (isValidElement(child) && child.type?.name === "ModalFooter") {
            footer = child;
        } else {
            bodyChildren.push(child);
        }
    });

    return (
        <Transition show={show} leave="duration-200">
            <Dialog
                as="div"
                id="modal"
                className="fixed inset-0 z-50 flex transform items-center justify-center overflow-y-auto px-4 py-6 transition-all"
                onClose={close}
            >
                <TransitionChild
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="absolute inset-0 bg-gray-900/75 backdrop-blur-sm" />
                </TransitionChild>

                <TransitionChild
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                    enterTo="opacity-100 translate-y-0 sm:scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                    leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                    <DialogPanel
                        className={`my-8 w-full transform rounded-xl bg-white shadow-2xl ring-1 ring-black/5 transition-all ${maxWidthClass}`}
                    >
                        {/* Modal Header */}
                        {showHeader && (title || closeable) && (
                            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                                {title && (
                                    <DialogTitle className="text-lg font-semibold text-gray-900">
                                        {title}
                                    </DialogTitle>
                                )}
                                {closeable && (
                                    <button
                                        onClick={close}
                                        className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Modal Body - Scrollable */}
                        <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6 py-4">
                            {bodyChildren}
                        </div>

                        {/* Modal Footer */}
                        {footer}
                    </DialogPanel>
                </TransitionChild>
            </Dialog>
        </Transition>
    );
}
