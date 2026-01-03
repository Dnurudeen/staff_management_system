import { Link } from "@inertiajs/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export default function Pagination({ links }) {
    if (!links || links.length <= 3) {
        return null;
    }

    return (
        <nav className="flex items-center justify-between">
            <div className="flex flex-1 justify-between sm:hidden">
                {links[0].url ? (
                    <Link
                        href={links[0].url}
                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Previous
                    </Link>
                ) : (
                    <span className="relative inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
                        Previous
                    </span>
                )}
                {links[links.length - 1].url ? (
                    <Link
                        href={links[links.length - 1].url}
                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Next
                    </Link>
                ) : (
                    <span className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
                        Next
                    </span>
                )}
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-center">
                <div>
                    <nav
                        className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                        aria-label="Pagination"
                    >
                        {links.map((link, index) => {
                            // Previous button
                            if (index === 0) {
                                return link.url ? (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                                    >
                                        <span className="sr-only">
                                            Previous
                                        </span>
                                        <ChevronLeftIcon
                                            className="h-5 w-5"
                                            aria-hidden="true"
                                        />
                                    </Link>
                                ) : (
                                    <span
                                        key={index}
                                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-300 ring-1 ring-inset ring-gray-300 cursor-not-allowed"
                                    >
                                        <span className="sr-only">
                                            Previous
                                        </span>
                                        <ChevronLeftIcon
                                            className="h-5 w-5"
                                            aria-hidden="true"
                                        />
                                    </span>
                                );
                            }

                            // Next button
                            if (index === links.length - 1) {
                                return link.url ? (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                                    >
                                        <span className="sr-only">Next</span>
                                        <ChevronRightIcon
                                            className="h-5 w-5"
                                            aria-hidden="true"
                                        />
                                    </Link>
                                ) : (
                                    <span
                                        key={index}
                                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-300 ring-1 ring-inset ring-gray-300 cursor-not-allowed"
                                    >
                                        <span className="sr-only">Next</span>
                                        <ChevronRightIcon
                                            className="h-5 w-5"
                                            aria-hidden="true"
                                        />
                                    </span>
                                );
                            }

                            // Page numbers
                            if (link.label === "...") {
                                return (
                                    <span
                                        key={index}
                                        className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
                                    >
                                        ...
                                    </span>
                                );
                            }

                            return link.url ? (
                                <Link
                                    key={index}
                                    href={link.url}
                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0 ${
                                        link.active
                                            ? "z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                            : "text-gray-900 hover:bg-gray-50"
                                    }`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ) : (
                                <span
                                    key={index}
                                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            );
                        })}
                    </nav>
                </div>
            </div>
        </nav>
    );
}
