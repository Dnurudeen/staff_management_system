export default function ModalFooter({ children, className = "" }) {
    return (
        <div
            className={`border-t border-gray-200 bg-gray-50 px-6 py-4 ${className}`}
        >
            <div className="flex items-center justify-end space-x-3">
                {children}
            </div>
        </div>
    );
}
