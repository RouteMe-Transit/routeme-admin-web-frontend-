import Image from "next/image";

export default function PassengerNewsFeed() {
  const news = [
    {
      id: 1,
      title: "New Express Route Colombo - Veyangoda Launched",
      description:
        "A new express bus service has been introduced connecting Colombo Fort to Veyangoda. Bus No. 267 will operate this route with limited stops for faster travel. The service runs daily from 6:00 AM to 9:00 PM with departures every 45 minutes.",
      date: "March 3, 2026",
      author: "SLTB Authority",
      image:
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&q=80",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f4f1]">
      
      {/* Main Content (aligned with sidebar) */}
      <div className="ml-[1px] px-6 py-6 w-[calc(100%-1px)]">
        
        <div className="max-w-5xl mx-auto space-y-6">

          {news.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Image */}
              <div className="w-full h-[300px] relative">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {item.title}
                </h2>

                <p className="text-gray-700 leading-relaxed">
                  {item.description}
                </p>

                <div className="text-sm text-gray-500 flex justify-between">
                  <span>Effective: {item.date}</span>
                  <span>Published by: {item.author}</span>
                </div>
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}