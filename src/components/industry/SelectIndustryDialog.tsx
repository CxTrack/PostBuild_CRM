import React, { useEffect, useState } from 'react';
import { useIndustriesStore } from '../../stores/industriesStore';
import { useProfileStore } from '../../stores/profileStore';
import toast from 'react-hot-toast';

interface SelectIndustryModalDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title?: string;
    message?: string | React.ReactNode;
    confirmButtonText?: string;
    cancelButtonText?: string;
    isDanger?: boolean;
}

const SelectIndustryModalDialog: React.FC<SelectIndustryModalDialogProps> = ({
    isOpen,
    onClose
}) => {
    const DEFAULT_INDUSTRY_ID = '3'; // default "General" option

    const [selectedIndustryId, setSelectedIndustryId] = useState<string | null>(DEFAULT_INDUSTRY_ID);
    const { industries, fetchIndustries } = useIndustriesStore();
    const loading = useIndustriesStore((state) => state.loading);
    const { updateProfileIndustry } = useProfileStore();

    useEffect(() => {
        const retrieveIndustries = async () => {
            await fetchIndustries();
        };
        retrieveIndustries();
    }, []);

    useEffect(() => {
        // Reset to default whenever modal is opened
        if (isOpen) {
            setSelectedIndustryId(DEFAULT_INDUSTRY_ID);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (!selectedIndustryId) return;

        await updateProfileIndustry(selectedIndustryId);
        toast.success('Industry has been updated');

        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Select Industry</h3>
                </div>

                <div className="mb-6">
                    <select
                        value={selectedIndustryId ?? ''}
                        onChange={(e) => setSelectedIndustryId(e.target.value)}
                        className="w-full bg-dark-700 text-white rounded-md p-2"
                    >
                        {/* Default General option */}
                        <option value={DEFAULT_INDUSTRY_ID}>General</option>

                        {/* List of industries from store */}
                        {industries.length > 0 ? (
                            industries.map((ind) => (
                                <option key={ind.id} value={ind.id}>
                                    {ind.name}
                                </option>
                            ))
                        ) : (
                            <option disabled>No industries available</option>
                        )}
                    </select>
                </div>

                <div className="flex justify-end space-x-2">
                    <button onClick={onClose} className="btn btn-secondary">
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="btn btn-primary"
                        disabled={!selectedIndustryId || loading}
                    >
                        {loading ? 'Saving...' : 'OK'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SelectIndustryModalDialog;
