import {
    ChevronUpIcon,
    ChevronDownIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

export default function DataTable({
    columns,
    data,
    onSort,
    sortColumn,
    sortDirection,
    searchable = true,
    onSearch,
    searchPlaceholder = "Search...",
    pagination,
    onPageChange,
    actions,
    loading = false,
}) {
    const [searchTerm, setSearchTerm] = useState("");

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (onSearch) {
            onSearch(value);
        }
    };

    const handleSort = (column) => {
        if (column.sortable && onSort) {
            onSort(column.key);
        }
    };

    return (
        <div className="w-full">
            {searchable && (
                <div className="mb-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearch}
                            placeholder={searchPlaceholder}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>
            )}

            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    scope="col"
                                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                                        column.sortable
                                            ? "cursor-pointer hover:bg-gray-100"
                                            : ""
                                    }`}
                                    onClick={() => handleSort(column)}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>{column.label}</span>
                                        {column.sortable &&
                                            sortColumn === column.key && (
                                                <span>
                                                    {sortDirection === "asc" ? (
                                                        <ChevronUpIcon className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronDownIcon className="h-4 w-4" />
                                                    )}
                                                </span>
                                            )}
                                    </div>
                                </th>
                            ))}
                            {actions && (
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (actions ? 1 : 0)}
                                    className="px-6 py-12 text-center"
                                >
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                    </div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (actions ? 1 : 0)}
                                    className="px-6 py-12 text-center text-gray-500"
                                >
                                    No data available
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-gray-50">
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                        >
                                            {column.render
                                                ? column.render(
                                                      row[column.key],
                                                      row
                                                  )
                                                : row[column.key]}
                                        </td>
                                    ))}
                                    {actions && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {actions(row)}
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() =>
                                onPageChange(pagination.current_page - 1)
                            }
                            disabled={pagination.current_page === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() =>
                                onPageChange(pagination.current_page + 1)
                            }
                            disabled={
                                pagination.current_page === pagination.last_page
                            }
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing{" "}
                                <span className="font-medium">
                                    {pagination.from}
                                </span>{" "}
                                to{" "}
                                <span className="font-medium">
                                    {pagination.to}
                                </span>{" "}
                                of{" "}
                                <span className="font-medium">
                                    {pagination.total}
                                </span>{" "}
                                results
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                <button
                                    onClick={() =>
                                        onPageChange(
                                            pagination.current_page - 1
                                        )
                                    }
                                    disabled={pagination.current_page === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                {[...Array(pagination.last_page)].map(
                                    (_, index) => {
                                        const page = index + 1;
                                        if (
                                            page === 1 ||
                                            page === pagination.last_page ||
                                            (page >=
                                                pagination.current_page - 1 &&
                                                page <=
                                                    pagination.current_page + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() =>
                                                        onPageChange(page)
                                                    }
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                        page ===
                                                        pagination.current_page
                                                            ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        } else if (
                                            page ===
                                                pagination.current_page - 2 ||
                                            page === pagination.current_page + 2
                                        ) {
                                            return (
                                                <span
                                                    key={page}
                                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                                                >
                                                    ...
                                                </span>
                                            );
                                        }
                                        return null;
                                    }
                                )}
                                <button
                                    onClick={() =>
                                        onPageChange(
                                            pagination.current_page + 1
                                        )
                                    }
                                    disabled={
                                        pagination.current_page ===
                                        pagination.last_page
                                    }
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
