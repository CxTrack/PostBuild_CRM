/**
 * SupplierContactsList - Inline CRUD for managing multiple contacts per supplier.
 * Shared between SupplierModal (compact) and SupplierProfile (full-page).
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Star, Edit, Check, X, User } from 'lucide-react';
import { useSupplierStore } from '@/stores/supplierStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { formatPhoneForStorage } from '@/utils/phone.utils';
import { validateEmail, validatePhone } from '@/utils/validation';
import TitleCombobox from './TitleCombobox';
import type { SupplierContact } from '@/types/app.types';
import toast from 'react-hot-toast';

interface SupplierContactsListProps {
    supplierId: string;
    /** When true, uses a more compact layout (for modals). */
    compact?: boolean;
}

interface ContactFormState {
    name: string;
    email: string;
    phone: string;
    title: string;
    is_primary: boolean;
}

const EMPTY_FORM: ContactFormState = {
    name: '',
    email: '',
    phone: '',
    title: '',
    is_primary: false,
};

const inputClass = 'w-full px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white text-sm';

export default function SupplierContactsList({ supplierId, compact = false }: SupplierContactsListProps) {
    const { contacts, fetchSupplierContacts, addSupplierContact, updateSupplierContact, deleteSupplierContact, fetchAllContactTitles } = useSupplierStore();
    const { currentOrganization } = useOrganizationStore();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [form, setForm] = useState<ContactFormState>({ ...EMPTY_FORM });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [existingTitles, setExistingTitles] = useState<string[]>([]);

    useEffect(() => {
        if (supplierId) {
            fetchSupplierContacts(supplierId);
        }
    }, [supplierId]);

    useEffect(() => {
        if (currentOrganization?.id) {
            fetchAllContactTitles(currentOrganization.id).then(setExistingTitles);
        }
    }, [currentOrganization?.id]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!form.name.trim()) newErrors.name = 'Name is required';
        if (form.email) {
            const result = validateEmail(form.email);
            if (!result.isValid) newErrors.email = result.error!;
        }
        if (form.phone) {
            const result = validatePhone(form.phone);
            if (!result.isValid) newErrors.phone = result.error!;
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAdd = async () => {
        if (!validate() || !currentOrganization?.id) return;
        const result = await addSupplierContact({
            supplier_id: supplierId,
            organization_id: currentOrganization.id,
            name: form.name.trim(),
            email: form.email.trim() || undefined,
            phone: formatPhoneForStorage(form.phone) || undefined,
            title: form.title.trim() || undefined,
            is_primary: form.is_primary || contacts.length === 0, // First contact is auto-primary
        });
        if (result) {
            toast.success('Contact added');
            setForm({ ...EMPTY_FORM });
            setIsAdding(false);
            setErrors({});
        }
    };

    const handleUpdate = async (id: string) => {
        if (!validate()) return;
        await updateSupplierContact(id, {
            name: form.name.trim(),
            email: form.email.trim() || undefined,
            phone: formatPhoneForStorage(form.phone) || undefined,
            title: form.title.trim() || undefined,
            is_primary: form.is_primary,
        });
        toast.success('Contact updated');
        setEditingId(null);
        setForm({ ...EMPTY_FORM });
        setErrors({});
    };

    const handleDelete = async (id: string) => {
        if (confirm('Remove this contact?')) {
            await deleteSupplierContact(id);
            toast.success('Contact removed');
        }
    };

    const startEdit = (contact: SupplierContact) => {
        setEditingId(contact.id);
        setIsAdding(false);
        setForm({
            name: contact.name,
            email: contact.email || '',
            phone: contact.phone || '',
            title: contact.title || '',
            is_primary: contact.is_primary,
        });
        setErrors({});
    };

    const cancelEdit = () => {
        setEditingId(null);
        setIsAdding(false);
        setForm({ ...EMPTY_FORM });
        setErrors({});
    };

    const togglePrimary = async (contact: SupplierContact) => {
        if (contact.is_primary) return; // Can't un-primary without selecting another
        await updateSupplierContact(contact.id, { is_primary: true });
        toast.success(`${contact.name} is now the primary contact`);
    };

    // ── Inline form (shared between add + edit) ─────────────────────
    const renderForm = (mode: 'add' | 'edit', contactId?: string) => (
        <div className={`${compact ? 'p-3' : 'p-4'} bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3`}>
            <div className={`grid ${compact ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 gap-3'}`}>
                <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name *</label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: '' }); }}
                        className={`${inputClass} ${errors.name ? 'border-red-500' : ''}`}
                        placeholder="Full name"
                        autoFocus
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-0.5">{errors.name}</p>}
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Title</label>
                    <TitleCombobox
                        value={form.title}
                        onChange={(v) => setForm({ ...form, title: v })}
                        existingTitles={existingTitles}
                        className={inputClass}
                        placeholder="e.g., Account Manager"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
                    <input
                        type="email"
                        value={form.email}
                        onChange={(e) => { setForm({ ...form, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: '' }); }}
                        className={`${inputClass} ${errors.email ? 'border-red-500' : ''}`}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-0.5">{errors.email}</p>}
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Phone</label>
                    <PhoneInput
                        value={form.phone}
                        onChange={(e) => { setForm({ ...form, phone: e.target.value }); if (errors.phone) setErrors({ ...errors, phone: '' }); }}
                        className={`rounded-lg bg-gray-50 dark:bg-gray-900/50 text-sm ${errors.phone ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}`}
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-0.5">{errors.phone}</p>}
                </div>
            </div>

            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={form.is_primary}
                        onChange={(e) => setForm({ ...form, is_primary: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    Primary contact
                </label>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => mode === 'add' ? handleAdd() : handleUpdate(contactId!)}
                        className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1"
                    >
                        <Check size={14} />
                        {mode === 'add' ? 'Add' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-3">
            {/* Contact list */}
            {contacts.length > 0 ? (
                <div className="space-y-2">
                    {contacts.map(contact => (
                        editingId === contact.id ? (
                            <div key={contact.id}>{renderForm('edit', contact.id)}</div>
                        ) : (
                            <div
                                key={contact.id}
                                className={`${compact ? 'p-3' : 'p-4'} rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between group hover:border-primary-300 dark:hover:border-primary-600 transition-colors`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 flex-shrink-0">
                                        <User size={14} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                                {contact.name}
                                            </span>
                                            {contact.is_primary && (
                                                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded">
                                                    Primary
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                            {contact.title && <span>{contact.title}</span>}
                                            {contact.email && <span>{contact.email}</span>}
                                            {contact.phone && <span>{contact.phone}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                    {!contact.is_primary && (
                                        <button
                                            type="button"
                                            onClick={() => togglePrimary(contact)}
                                            className="p-1.5 text-gray-400 hover:text-yellow-500 rounded-md hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                                            title="Set as primary"
                                        >
                                            <Star size={14} />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => startEdit(contact)}
                                        className="p-1.5 text-gray-400 hover:text-primary-600 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(contact.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        title="Remove"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        )
                    ))}
                </div>
            ) : !isAdding ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic py-2">
                    No contacts added yet.
                </p>
            ) : null}

            {/* Add form */}
            {isAdding ? (
                renderForm('add')
            ) : (
                <button
                    type="button"
                    onClick={() => { setIsAdding(true); setEditingId(null); setForm({ ...EMPTY_FORM }); setErrors({}); }}
                    className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors py-1"
                >
                    <Plus size={16} />
                    Add contact
                </button>
            )}
        </div>
    );
}
