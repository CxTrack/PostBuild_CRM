import { useEffect, useState } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { useCRMStore } from '@/stores/crmStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import LeadsTable from '@/components/crm/LeadsTable';
import OpportunitiesTable from '@/components/crm/OpportunitiesTable';
import Tasks from '@/pages/Tasks';
import {
    Users, CheckCircle, DollarSign,
    Target, Plus, Search, X
} from 'lucide-react';
import { PageContainer, Card, IconBadge } from '@/components/theme/ThemeComponents';
import toast from 'react-hot-toast';

export default function CRM() {
    const { theme } = useThemeStore();
    const { currentOrganization } = useOrganizationStore();
    const { fetchLeads, fetchOpportunities, leads, opportunities, createLead, createOpportunity } = useCRMStore();
    const [activeTab, setActiveTab] = useState<'leads' | 'opportunities' | 'tasks'>('leads');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);

    const [leadForm, setLeadForm] = useState({
        name: '', company: '', email: '', phone: '', source: 'direct', estimated_value: 0,
    });
    const [oppForm, setOppForm] = useState({
        name: '', value: 0, stage: 'discovery', probability: 0.1,
    });

    useEffect(() => {
        fetchLeads();
        fetchOpportunities();
    }, [currentOrganization?.id]);

    if (!currentOrganization) {
        return (
            <PageContainer className="items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </PageContainer>
        );
    }

    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter(l => l.status === 'qualified').length;
    const activeOpps = opportunities.filter(o => !['won', 'lost'].includes(o.stage)).length;
    const pipelineValue = opportunities
        .filter(o => !['won', 'lost'].includes(o.stage))
        .reduce((sum, o) => sum + (o.value * o.probability), 0);

    const getActionButton = () => {
        switch (activeTab) {
            case 'leads':
                return { label: 'New Lead', color: 'bg-blue-600 hover:bg-blue-700' };
            case 'opportunities':
                return { label: 'New Opportunity', color: 'bg-purple-600 hover:bg-purple-700' };
            case 'tasks':
                return { label: 'New Task', color: 'bg-teal-600 hover:bg-teal-700' };
        }
    };

    const actionConfig = getActionButton();

    const handleCreateLead = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!leadForm.name.trim()) {
            toast.error('Name is required');
            return;
        }
        setCreating(true);
        const result = await createLead({
            name: leadForm.name.trim(),
            company: leadForm.company.trim() || null,
            email: leadForm.email.trim() || null,
            phone: leadForm.phone.trim() || null,
            source: leadForm.source,
            estimated_value: leadForm.estimated_value || 0,
            status: 'new',
        } as any);
        setCreating(false);
        if (result) {
            setShowCreateModal(false);
            setLeadForm({ name: '', company: '', email: '', phone: '', source: 'direct', estimated_value: 0 });
        }
    };

    const handleCreateOpportunity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!oppForm.name.trim()) {
            toast.error('Name is required');
            return;
        }
        setCreating(true);
        const result = await createOpportunity({
            name: oppForm.name.trim(),
            value: oppForm.value || 0,
            stage: oppForm.stage,
            probability: oppForm.probability,
        } as any);
        setCreating(false);
        if (result) {
            setShowCreateModal(false);
            setOppForm({ name: '', value: 0, stage: 'discovery', probability: 0.1 });
        }
    };

    const handleActionClick = () => {
        if (activeTab === 'tasks') {
            // Tasks component handles its own creation
            const addTaskBtn = document.querySelector('[data-add-task-trigger]') as HTMLButtonElement;
            if (addTaskBtn) addTaskBtn.click();
            return;
        }
        setShowCreateModal(true);
    };

    return (
        <PageContainer className="gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        CRM
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Manage leads, opportunities, and customer relationships
                    </p>
                </div>

                <button
                    onClick={handleActionClick}
                    className={`flex items-center px-4 py-2 ${actionConfig.color} text-white rounded-lg transition-colors font-medium shadow-sm active:scale-95`}
                >
                    <Plus size={18} className="mr-2" />
                    {actionConfig.label}
                </button>
            </div>

            {/* Stats Cards */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card hover className="flex items-center gap-4 p-4 h-24">
                    <IconBadge
                        icon={<Users size={20} className="text-blue-600" />}
                        gradient="bg-blue-50"
                        size="md"
                    />
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Leads</p>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{totalLeads}</h3>
                    </div>
                </Card>

                <Card hover className="flex items-center gap-4 p-4 h-24">
                    <IconBadge
                        icon={<CheckCircle size={20} className="text-green-600" />}
                        gradient="bg-green-50"
                        size="md"
                    />
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Qualified</p>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{qualifiedLeads}</h3>
                    </div>
                </Card>

                <Card hover className="flex items-center gap-4 p-4 h-24">
                    <IconBadge
                        icon={<Target size={20} className="text-purple-600" />}
                        gradient="bg-purple-50"
                        size="md"
                    />
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Opportunities</p>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{activeOpps}</h3>
                    </div>
                </Card>

                <Card hover className="flex items-center gap-4 p-4 h-24">
                    <IconBadge
                        icon={<DollarSign size={20} className="text-orange-600" />}
                        gradient="bg-orange-50"
                        size="md"
                    />
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pipeline</p>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">${Math.round(pipelineValue).toLocaleString()}</h3>
                    </div>
                </Card>
            </div>

            {/* Unified Toolbar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                    {(['leads', 'opportunities', 'tasks'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${activeTab === tab
                                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto md:flex-1 md:max-w-xl md:ml-8">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <Card className="overflow-hidden p-0 min-h-[500px]">
                {activeTab === 'leads' && <LeadsTable />}
                {activeTab === 'opportunities' && <OpportunitiesTable />}
                {activeTab === 'tasks' && <Tasks embedded={true} />}
            </Card>

            {/* Create Lead/Opportunity Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {activeTab === 'leads' ? 'New Lead' : 'New Opportunity'}
                            </h2>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {activeTab === 'leads' ? (
                            <form onSubmit={handleCreateLead} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={leadForm.name}
                                        onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                                        placeholder="Lead name"
                                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
                                    <input
                                        type="text"
                                        value={leadForm.company}
                                        onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                                        placeholder="Company name"
                                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={leadForm.email}
                                            onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                                            placeholder="email@example.com"
                                            className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            value={leadForm.phone}
                                            onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                                            placeholder="+1 (555) 000-0000"
                                            className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source</label>
                                        <select
                                            value={leadForm.source}
                                            onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}
                                            className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="direct">Direct</option>
                                            <option value="website">Website</option>
                                            <option value="referral">Referral</option>
                                            <option value="social">Social Media</option>
                                            <option value="cold_call">Cold Call</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estimated Value</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={leadForm.estimated_value || ''}
                                            onChange={(e) => setLeadForm({ ...leadForm, estimated_value: parseFloat(e.target.value) || 0 })}
                                            placeholder="0.00"
                                            className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={creating} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 font-medium">
                                        {creating ? 'Creating...' : 'Create Lead'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleCreateOpportunity} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={oppForm.name}
                                        onChange={(e) => setOppForm({ ...oppForm, name: e.target.value })}
                                        placeholder="Opportunity name"
                                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Value ($)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={oppForm.value || ''}
                                            onChange={(e) => setOppForm({ ...oppForm, value: parseFloat(e.target.value) || 0 })}
                                            placeholder="0.00"
                                            className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stage</label>
                                        <select
                                            value={oppForm.stage}
                                            onChange={(e) => setOppForm({ ...oppForm, stage: e.target.value })}
                                            className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="discovery">Discovery</option>
                                            <option value="proposal">Proposal</option>
                                            <option value="negotiation">Negotiation</option>
                                            <option value="closing">Closing</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={creating} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 font-medium">
                                        {creating ? 'Creating...' : 'Create Opportunity'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </PageContainer>
    );
}
