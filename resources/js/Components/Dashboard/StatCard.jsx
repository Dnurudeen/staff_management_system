export default function StatCard({
    title,
    value,
    icon: Icon,
    color = "indigo",
    trend,
    trendValue,
}) {
    const colors = {
        indigo: "bg-indigo-500",
        green: "bg-green-500",
        yellow: "bg-yellow-500",
        red: "bg-red-500",
        blue: "bg-blue-500",
        purple: "bg-purple-500",
    };

    return (
        <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className={`${colors[color]} rounded-md p-3`}>
                            <Icon className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                                {title}
                            </dt>
                            <dd className="flex items-baseline">
                                <div className="text-2xl font-semibold text-gray-900">
                                    {value}
                                </div>
                                {trend && trendValue && (
                                    <div
                                        className={`ml-2 flex items-baseline text-sm font-semibold ${
                                            trend === "up"
                                                ? "text-green-600"
                                                : "text-red-600"
                                        }`}
                                    >
                                        {trend === "up" ? "↑" : "↓"}{" "}
                                        {trendValue}
                                    </div>
                                )}
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}
