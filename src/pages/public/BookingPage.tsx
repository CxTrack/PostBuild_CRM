import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
    Calendar as CalendarIcon,
    Clock,
    User,
    Mail,
    Phone,
    MessageSquare,
    CheckCircle2,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, startOfToday } from 'date-fns';
import toast from 'react-hot-toast';

export const BookingPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [organization, setOrganization] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Date, 2: Time, 3: Form
    const [bookingStatus, setBookingStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        notes: ''
    });

    useEffect(() => {
        fetchOrg();
    }, [slug]);

    const fetchOrg = async () => {
        try {
            if (!slug) return;
            const { data, error } = await supabase
                .from('organizations')
                .select('id, name, slug, logo_url, industry_template, metadata')
                .eq('slug', slug)
                .maybeSingle();

            if (error) throw error;
            if (!data) throw new Error('Organization not found');

            setOrganization(data);
        } catch (err) {
            console.error(err);
            toast.error('Could not load booking page');
        } finally {
            setLoading(false);
        }
    };

    const getHeading = () => {
        if (!organization) return 'Schedule Appointment';
        const industry = organization.industry_template;
        switch (industry) {
            case 'healthcare': return 'Book Appointment';
            case 'legal_services': return 'Schedule Consultation';
            case 'contractors_home_services': return 'Request Estimate';
            case 'real_estate': return 'Schedule Viewing';
            case 'mortgage_broker': return 'Book Consultation';
            case 'gyms_fitness': return 'Book a Class';
            default: return 'Schedule Appointment';
        }
    };

    const timeSlots = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
        '15:00', '15:30', '16:00', '16:30', '17:00'
    ];

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate || !selectedTime || !organization) return;

        setBookingStatus('submitting');
        try {
            const startTime = new Date(selectedDate);
            const [hours, minutes] = selectedTime.split(':');
            startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + 30);

            const { error } = await supabase
                .from('calendar_events')
                .insert({
                    organization_id: organization.id,
                    title: `Booking: ${formData.name}`,
                    event_type: 'appointment',
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    status: 'confirmed',
                    attendees: [{ name: formData.name, email: formData.email, phone: formData.phone }],
                    metadata: { notes: formData.notes }
                });

            if (error) throw error;
            setBookingStatus('success');
        } catch (err) {
            console.error(err);
            toast.error('Failed to book appointment. Please try again.');
            setBookingStatus('idle');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!organization) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md bg-white p-8 rounded-3xl shadow-xl">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Not Found</h1>
                    <p className="text-gray-600">The booking link you followed appears to be invalid or expired.</p>
                </div>
            </div>
        );
    }

    if (bookingStatus === 'success') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl overflow-hidden p-8 text-center animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} className="text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
                    <p className="text-gray-600 mb-8">
                        Thank you, {formData.name}. Your appointment has been scheduled with {organization.name}.
                        A confirmation has been sent to {formData.email}.
                    </p>
                    <div className="bg-gray-50 rounded-2xl p-4 text-left mb-8 border border-gray-100">
                        <div className="flex items-center gap-3 text-gray-700 font-medium mb-1">
                            <CalendarIcon size={18} className="text-blue-500" />
                            {format(selectedDate!, 'EEEE, MMMM do, yyyy')}
                        </div>
                        <div className="flex items-center gap-3 text-gray-700 font-medium">
                            <Clock size={18} className="text-blue-500" />
                            {selectedTime}
                        </div>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg"
                    >
                        Done
                    </button>
                </div>
            </div>
        );
    }

    const days = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
    });

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
            {/* Hero Section */}
            <div className="max-w-2xl w-full mb-8 text-center">
                {organization.logo_url && (
                    <img src={organization.logo_url} alt={organization.name} className="h-16 mx-auto mb-6 rounded-2xl shadow-sm" />
                )}
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">{getHeading()}</h1>
                <p className="text-lg text-gray-600">Choose a time that works for you</p>
            </div>

            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Organization Summary */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-bold">
                                {organization.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{organization.name}</h3>
                                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">CxTrack Partner</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Clock size={18} className="text-gray-400 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-semibold text-gray-900">30 Min Consultation</p>
                                    <p className="text-gray-500">Video call or phone</p>
                                </div>
                            </div>
                        </div>

                        {selectedDate && (
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Your Selection</p>
                                <div className="flex items-center gap-3 text-sm font-bold text-gray-900 mb-2">
                                    <CalendarIcon size={16} className="text-blue-500" />
                                    {format(selectedDate, 'MMM d, yyyy')}
                                </div>
                                {selectedTime && (
                                    <div className="flex items-center gap-3 text-sm font-bold text-gray-900">
                                        <Clock size={16} className="text-blue-500" />
                                        {selectedTime}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Interaction Area */}
                <div className="md:col-span-2 bg-white rounded-[32px] shadow-xl border border-gray-100 p-8">
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-bold text-gray-900">Select a Date</h2>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                        <ChevronLeft size={20} />
                                    </button>
                                    <span className="font-bold text-gray-900 w-32 text-center">{format(currentDate, 'MMMM yyyy')}</span>
                                    <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-2 mb-2">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="text-center text-[10px] uppercase font-black text-gray-400 py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-2">
                                {/* Prepend empty days for the UI layout */}
                                {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
                                    <div key={`empty-${i}`} className="h-14"></div>
                                ))}

                                {days.map(day => {
                                    const isPast = isBefore(day, startOfToday());
                                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                                    return (
                                        <button
                                            key={day.toISOString()}
                                            disabled={isPast}
                                            onClick={() => {
                                                setSelectedDate(day);
                                                setStep(2);
                                            }}
                                            className={`
                        h-14 rounded-2xl flex items-center justify-center text-sm font-bold transition-all
                        ${isPast ? 'text-gray-200 cursor-not-allowed' : 'hover:bg-blue-50 hover:text-blue-600'}
                        ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white shadow-lg scale-105' : 'text-gray-900'}
                        ${isToday(day) && !isSelected ? 'border-2 border-blue-600 text-blue-600' : ''}
                      `}
                                        >
                                            {format(day, 'd')}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <button onClick={() => setStep(1)} className="mb-6 flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                                <ChevronLeft size={16} /> Back to calendar
                            </button>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Select a Time</h2>
                            <p className="text-gray-500 mb-8">{format(selectedDate!, 'EEEE, MMMM do')}</p>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {timeSlots.map(time => (
                                    <button
                                        key={time}
                                        onClick={() => {
                                            setSelectedTime(time);
                                            setStep(3);
                                        }}
                                        className={`
                      py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all
                      ${selectedTime === time
                                                ? 'border-blue-600 bg-blue-600 text-white shadow-lg'
                                                : 'border-gray-100 bg-gray-50 text-gray-900 hover:border-blue-400 hover:bg-white'}
                    `}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <button
                                onClick={() => setStep(2)}
                                disabled={bookingStatus === 'submitting'}
                                className="mb-6 flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                <ChevronLeft size={16} /> Edit time
                            </button>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Enter Details</h2>
                            <p className="text-gray-500 mb-8">Almost done! Just a few details to confirm.</p>

                            <form onSubmit={handleBooking} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Full Name</label>
                                        <div className="relative">
                                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                required
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl py-3.5 pl-12 pr-4 outline-none transition-all text-sm"
                                                placeholder="John Doe"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                disabled={bookingStatus === 'submitting'}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Email Address</label>
                                        <div className="relative">
                                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                required
                                                type="email"
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl py-3.5 pl-12 pr-4 outline-none transition-all text-sm"
                                                placeholder="john@example.com"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                disabled={bookingStatus === 'submitting'}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Phone Number</label>
                                    <div className="relative">
                                        <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            required
                                            type="tel"
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl py-3.5 pl-12 pr-4 outline-none transition-all text-sm"
                                            placeholder=" (555) 000-0000"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            disabled={bookingStatus === 'submitting'}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Notes / Special Requests</label>
                                    <div className="relative">
                                        <MessageSquare size={18} className="absolute left-4 top-4 text-gray-400" />
                                        <textarea
                                            rows={3}
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all text-sm resize-none"
                                            placeholder="Any specific topics you'd like to discuss?"
                                            value={formData.notes}
                                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                            disabled={bookingStatus === 'submitting'}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={bookingStatus === 'submitting'}
                                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    {bookingStatus === 'submitting' ? (
                                        'Confirming...'
                                    ) : (
                                        <>
                                            Confirm Booking
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            <p className="mt-12 text-sm text-gray-400">Powered by CxTrack CRM</p>
        </div>
    );
};
