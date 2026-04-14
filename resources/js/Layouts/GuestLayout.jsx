import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function Guest({ children }) {
    return (
        <div className="flex flex-col items-center min-h-screen pt-6 sm:justify-center sm:pt-0 bg-[radial-gradient(circle_at_top_right,_#d1fae5_0%,_#f8fafc_40%,_#eef2ff_100%)]">
            <div>
                <Link href="/">
                    <ApplicationLogo className="w-20 h-20 text-green-500 fill-current" />
                </Link>
            </div>

            <div className="w-full px-6 py-4 mt-6 overflow-hidden bg-white/90 shadow-md border border-emerald-100 sm:max-w-md sm:rounded-lg backdrop-blur">
                {children}
            </div>
        </div>
    );
}
