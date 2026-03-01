const TrustBadges = () => {
    const badges = [
        {
            title: "ضمان الجودة",
            description: "فحص شامل لكل جهاز 100%",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-laapak-green">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
            ),
        },
        {
            title: "شحن سريع وكاش",
            description: "الدفع عند الاستلام متاح",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-laapak-green">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
            ),
        },
        {
            title: "استرجاع مضمون",
            description: "خلال 14 يوم من الشراء",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-laapak-green">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
            ),
        },
    ];

    return (
        <div className="w-full bg-white border-b border-gray-100 py-12">
            <div className="content-container flex flex-col md:flex-row items-center justify-between gap-8">
                {badges.map((badge, index) => (
                    <div key={index} className="flex flex-col items-center text-center gap-3 w-full md:w-1/3 p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="bg-white p-3 rounded-full shadow-sm mb-2 border border-gray-50">
                            {badge.icon}
                        </div>
                        <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 whitespace-nowrap">{badge.title}</h3>
                        <p className="text-laapak-gray font-medium">{badge.description}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default TrustBadges
