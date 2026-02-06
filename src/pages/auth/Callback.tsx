import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function Callback() {
    const navigate = useNavigate();
    const { initialize } = useAuthStore();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // initialize() in authStore already handles extracting tokens from URL
                await initialize();
                navigate('/dashboard', { replace: true });
            } catch (error) {
                console.error('Error during auth callback:', error);
                navigate('/login', { replace: true });
            }
        };

        handleCallback();
    }, [initialize, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Completing sign in...
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Please wait while we redirect you.
                </p>
            </div>
        </div>
    );
}
