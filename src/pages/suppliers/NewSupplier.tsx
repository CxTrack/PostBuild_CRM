import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Supplier } from '../../types/database.types';
import { useSupplierStore } from '../../stores/supplierStore';

const COUNTRIES = [
    {
        code: 'CA', name: 'Canada', states: [
            'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
            'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan',
            'Northwest Territories', 'Nunavut', 'Yukon'
        ]
    },
    {
        code: 'US', name: 'United States', states: [
            'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
            'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
            'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
            'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
            'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
            'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
            'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
            'Wisconsin', 'Wyoming'
        ]
    },
    { code: 'UK', name: 'United Kingdom' },
    { code: 'AU', name: 'Australia' },
    { code: 'NZ', name: 'New Zealand' }
];

const NewSupplier: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { createSupplier, updateSupplier, getSupplierById, loading, error, clearError } = useSupplierStore();
    const [selectedCountry, setSelectedCountry] = useState('CA');
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [phoneValue, setPhoneValue] = useState('');
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [newSupplierId, setNewSupplierId] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<Supplier>({
        defaultValues: {
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            company: '',
            notes: ''
        }
    });

    useEffect(() => {
        const loadSupplier = async () => {
            if (id) {
                const supplier = await getSupplierById(id);
                if (supplier) {
                    reset({
                        first_name: supplier.first_name,
                        last_name: supplier.last_name,
                        email: supplier.email || '',
                        phone: supplier.phone || '',
                        company: supplier.company || '',
                        notes: supplier.notes || '',
                        // Address fields
                        street: supplier.street || '',
                        city: supplier.city || '',
                        state: supplier.state || '',
                        country: supplier.country || 'CA',
                        postal_code: supplier.postal_code || ''
                    });
                }
            }
        };

        loadSupplier();
    }, [id, getSupplierById, reset]);

    const onSubmit = async (data: Supplier) => {
        setSubmitAttempted(true);
        clearError();

        try {
            let supplier;
            if (id) {
                // Update existing supplier
                supplier = await updateSupplier(id, data);
                toast.success('Supplier updated successfully!');
            } else {
                // Create new customer
                console.log(data);
                
                supplier = await createSupplier(data);
                toast.success('Supplier created successfully!');
                setNewSupplierId(supplier.id);
                //setShowLeadModal(true);
                navigate(`/suppliers`);
                return;
            }

            // Navigate to the supplier detail page
            navigate(`/suppliers/${supplier.id}`);
        } catch (err) {
            console.error('Error creating supplier:', err);
            toast.error('Failed to create supplier. Please try again.');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with back button */}
            <div className="flex items-center space-x-4">
                <Link to="/suppliers" className="btn btn-secondary p-2">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-white">
                    {id ? 'Edit Supplier' : 'Add New Supplier'}
                </h1>
            </div>

            {/* Error message */}
            {error && (
                <div className="bg-red-900/50 border border-red-800 text-red-300 px-4 py-3 rounded-md">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="card bg-dark-800 border border-dark-700">
                        <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>

                        <div className="space-y-4">

                            <div>
                                <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-1">
                                    Company <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="company"
                                    type="text"
                                    className="input"
                                    placeholder="Company name"
                                    {...register('company', { required: 'Last name is required' })}
                                />
                            </div>

                            <div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="first_name" className="block text-sm font-medium text-gray-300 mb-1">
                                            Contact First Name
                                        </label>
                                        <input
                                            id="first_name"
                                            type="text"
                                            className="input"
                                            placeholder="First name"
                                            {...register('first_name')}
                                        />
                                        {errors.first_name && (
                                            <p className="mt-1 text-sm text-red-400">{errors.first_name.message}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="last_name" className="block text-sm font-medium text-gray-300 mb-1">
                                            Contact Last Name
                                        </label>
                                        <input
                                            id="last_name"
                                            type="text"
                                            className="input"
                                            placeholder="Last name"
                                            {...register('last_name')}
                                        />
                                        {errors.last_name && (
                                            <p className="mt-1 text-sm text-red-400">{errors.last_name.message}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    className="input"
                                    placeholder="supplier@example.com"
                                    {...register('email', {
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: 'Invalid email address'
                                        }
                                    })}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    id="phone"
                                    type="tel"
                                    className="input"
                                    value={phoneValue}
                                    onChange={(e) => {
                                        // Only allow digits
                                        const digits = e.target.value.replace(/\D/g, '');
                                        // Limit to 10 digits
                                        const truncated = digits.slice(0, 10);
                                        // Format as (XXX) XXX-XXXX
                                        const formatted = truncated.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                                        setPhoneValue(formatted);
                                        // Store raw digits in form
                                        register('phone').onChange({
                                            target: { value: truncated, name: 'phone' }
                                        });
                                    }}
                                    placeholder="(555) 555-5555"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address Information */}
                    <div className="card bg-dark-800 border border-dark-700">
                        <h2 className="text-lg font-semibold text-white mb-4">Address Information</h2>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-1">
                                    Country <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="country"
                                    className="input"
                                    value={selectedCountry}
                                    onChange={(e) => setSelectedCountry(e.target.value)}
                                    {...register('country', { required: 'Country is required' })}
                                >
                                    {COUNTRIES.map(country => (
                                        <option key={country.code} value={country.code}>
                                            {country.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="street" className="block text-sm font-medium text-gray-300 mb-1">
                                    Street Address
                                </label>
                                <input
                                    id="street"
                                    type="text"
                                    className="input"
                                    placeholder="123 Main St"
                                    {...register('street')}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-1">
                                        City
                                    </label>
                                    <input
                                        id="city"
                                        type="text"
                                        className="input"
                                        placeholder="City"
                                        {...register('city')}
                                    />
                                </div>

                                {selectedCountry === 'CA' && (
                                    <div>
                                        <label htmlFor="province" className="block text-sm font-medium text-gray-300 mb-1">
                                            Province
                                        </label>
                                        <select
                                            id="province"
                                            className="input"
                                            {...register('state')}
                                        >
                                            <option value="">Select Province</option>
                                            {COUNTRIES.find(c => c.code === 'CA')?.states.map(state => (
                                                <option key={state} value={state}>{state}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {selectedCountry === 'US' && (
                                    <div>
                                        <label htmlFor="state" className="block text-sm font-medium text-gray-300 mb-1">
                                            State
                                        </label>
                                        <select
                                            id="state"
                                            className="input"
                                            {...register('state')}
                                        >
                                            <option value="">Select State</option>
                                            {COUNTRIES.find(c => c.code === 'US')?.states.map(state => (
                                                <option key={state} value={state}>{state}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {['UK', 'AU', 'NZ'].includes(selectedCountry) && (
                                    <div>
                                        <label htmlFor="state" className="block text-sm font-medium text-gray-300 mb-1">
                                            {selectedCountry === 'UK' ? 'County' :
                                                selectedCountry === 'AU' ? 'State/Territory' :
                                                    'Region'}
                                        </label>
                                        <input
                                            id="state"
                                            type="text"
                                            className="input"
                                            placeholder={selectedCountry === 'UK' ? 'County' :
                                                selectedCountry === 'AU' ? 'State/Territory' :
                                                    'Region'}
                                            {...register('state')}
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label htmlFor="postal_code" className="block text-sm font-medium text-gray-300 mb-1">
                                    {selectedCountry === 'US' ? 'ZIP Code' :
                                        selectedCountry === 'UK' ? 'Post Code' :
                                            'Postal Code'}
                                </label>
                                <input
                                    id="postal_code"
                                    type="text"
                                    className="input"
                                    placeholder={selectedCountry === 'US' ? '12345' :
                                        selectedCountry === 'CA' ? 'A1A 1A1' :
                                            selectedCountry === 'UK' ? 'SW1A 1AA' :
                                                'Postal Code'}
                                    {...register('postal_code', {
                                        pattern: selectedCountry === 'CA' ? {
                                            value: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
                                            message: 'Please enter a valid Canadian postal code'
                                        } : selectedCountry === 'US' ? {
                                            value: /^\d{5}(-\d{4})?$/,
                                            message: 'Please enter a valid US ZIP code'
                                        } : selectedCountry === 'UK' ? {
                                            value: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
                                            message: 'Please enter a valid UK post code'
                                        } : undefined
                                    })}
                                />
                                {errors.postal_code && (
                                    <p className="mt-1 text-sm text-red-400">{errors.postal_code.message}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="btn btn-primary flex items-center space-x-2"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                <span>Save Supplier</span>
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Lead Creation Modal */}
            {showLeadModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-white">Create Lead</h3>
                            <button
                                onClick={() => {
                                    setShowLeadModal(false);
                                    navigate(`/suppliers/${newSupplierId}`);
                                }}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-gray-300 mb-6">
                            Would you like to create a lead for this customer? This will add them to your sales pipeline.
                        </p>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowLeadModal(false);
                                    navigate(`/suppliers/${newSupplierId}`);
                                }}
                                className="btn btn-secondary"
                            >
                                Skip
                            </button>
                            <Link
                                to={`/crm?supplier=${newSupplierId}&action=create-lead`}
                                className="btn btn-primary flex items-center space-x-2"
                            >
                                <Plus size={16} />
                                <span>Create Lead</span>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewSupplier;