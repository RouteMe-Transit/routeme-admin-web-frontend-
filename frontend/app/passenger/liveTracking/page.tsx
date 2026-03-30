export default function PassengerLiveTrackingPage() {
    return (
        <section className="w-full h-full flex flex-col gap-6">
            <h1 className="text-2xl font-bold text-accent">Live Tracking</h1>
            <p className="text-ashcolor">Live tracking interface will be displayed here.</p>
                <div className="w-full h-[400px] bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Map and live tracking data will be shown here.</p>
                </div>
                <div className="w-full h-[200px] bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Additional information and controls will be displayed here.</p>
                </div>
        </section>
            
    );
}