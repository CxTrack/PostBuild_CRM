/**
 * CSV Import Wizard
 * Multi-step modal for importing customer data from CSV
 * Steps: Upload → Map Fields → AI Review → Preview → Import
 */

import React, { useState, useRef, useCallback } from 'react';
import {
    X, Upload, FileText, ArrowRight, Check, AlertTriangle,
    ChevronRight, RefreshCw, Database, ArrowLeft, Download,
    Sparkles, Shield, Zap, Eye, EyeOff, ChevronDown, ChevronUp
} from 'lucide-react';
import { useCustomerStore } from '@/stores/customerStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import {
    parseCSV,
    autoDetectMapping,
    getCRMFields,
    transformRowToCustomer,
    findDuplicates,
    validateImportData,
    DuplicateMatch,
    computeCSVStats,
    prepareSampleRows,
    applyCleanupFixes,
    applyMappingSuggestions,
    AICleanupResult
} from '@/utils/csv.utils';
import { getAuthToken, getSupabaseUrl } from '@/utils/auth.utils';
import toast from 'react-hot-toast';

interface CSVImporterProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type ImportStep = 'upload' | 'map' | 'ai_review' | 'preview' | 'importing' | 'complete';

export const CSVImporter: React.FC<CSVImporterProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const [step, setStep] = useState<ImportStep>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [csvData, setCsvData] = useState<{ headers: string[], rows: Record<string, string>[] } | null>(null);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [duplicateAction, setDuplicateAction] = useState<'skip' | 'update' | 'create'>('skip');
    const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
    const [importStats, setImportStats] = useState({ created: 0, updated: 0, skipped: 0, failed: 0 });

    // AI Review state
    const [aiAnalysis, setAiAnalysis] = useState<AICleanupResult | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [appliedFixes, setAppliedFixes] = useState<Set<string>>(new Set());
    const [acceptedMappings, setAcceptedMappings] = useState<Set<string>>(new Set());
    const [aiTokenInfo, setAiTokenInfo] = useState<{ used: number; remaining: number } | null>(null);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['quality', 'mappings', 'fixes', 'missing', 'data_quality']));

    const { customers, createCustomer, updateCustomer } = useCustomerStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setStep('upload');
        setFile(null);
        setCsvData(null);
        setMapping({});
        setDuplicates([]);
        setImportStats({ created: 0, updated: 0, skipped: 0, failed: 0 });
        setAiAnalysis(null);
        setAiLoading(false);
        setAiError(null);
        setAppliedFixes(new Set());
        setAcceptedMappings(new Set());
        setAiTokenInfo(null);
    };

    const handleClose = () => {
        if (step === 'importing') return;
        resetState();
        onClose();
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
            toast.error('Please upload a valid CSV file');
            return;
        }

        setFile(selectedFile);

        // Parse CSV
        const text = await selectedFile.text();
        const parsed = parseCSV(text);

        if (parsed.headers.length === 0) {
            toast.error('CSV file appears to be empty or invalid');
            setFile(null);
            return;
        }

        if (parsed.rows.length > 10000) {
            toast.error('CSV files with more than 10,000 rows are not supported');
            setFile(null);
            return;
        }

        setCsvData(parsed);

        // Auto-detect mapping
        const detectedMapping = autoDetectMapping(parsed.headers);
        setMapping(detectedMapping);

        setStep('map');
    };

    const handleMappingChange = (csvHeader: string, crmField: string) => {
        setMapping(prev => ({ ...prev, [csvHeader]: crmField }));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv'))) {
            const text = await droppedFile.text();
            const parsed = parseCSV(text);

            if (parsed.rows.length > 10000) {
                toast.error('CSV files with more than 10,000 rows are not supported');
                return;
            }

            setFile(droppedFile);
            setCsvData(parsed);
            setMapping(autoDetectMapping(parsed.headers));
            setStep('map');
        } else {
            toast.error('Please upload a valid CSV file');
        }
    };

    // Run AI analysis when advancing from Map Fields
    const continueToAIReview = useCallback(async () => {
        if (!csvData) return;

        // Validate that at least one field is mapped
        if (Object.values(mapping).every(v => !v)) {
            toast.error('Please map at least one field to continue');
            return;
        }

        setStep('ai_review');
        setAiLoading(true);
        setAiError(null);

        try {
            const token = await getAuthToken();
            if (!token) {
                setAiError('Please sign in to use AI analysis');
                setAiLoading(false);
                return;
            }

            const stats = computeCSVStats(csvData.rows, csvData.headers);
            const sampleRows = prepareSampleRows(csvData.rows);
            const org = useOrganizationStore.getState().currentOrganization;

            const response = await fetch(`${getSupabaseUrl()}/functions/v1/csv-cleanup`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    headers: csvData.headers,
                    sampleRows,
                    totalRowCount: csvData.rows.length,
                    columnStats: stats,
                    currentMapping: mapping,
                    industry: org?.industry_template || 'general_business',
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.error === 'token_limit_reached') {
                    setAiError('Not enough AI tokens for analysis. You can skip this step and import directly.');
                    setAiTokenInfo({ used: 0, remaining: 0 });
                } else {
                    setAiError(data.error || 'AI analysis failed. You can skip this step.');
                }
                setAiLoading(false);
                return;
            }

            setAiAnalysis(data.analysis);
            if (data.tokensUsed !== undefined) {
                setAiTokenInfo({ used: data.tokensUsed, remaining: data.tokensRemaining || 0 });
            }

            // Auto-accept all high-confidence mapping suggestions
            if (data.analysis?.unmapped_columns) {
                const autoAccepted = new Set<string>();
                for (const suggestion of data.analysis.unmapped_columns) {
                    if (suggestion.confidence >= 0.8) {
                        autoAccepted.add(suggestion.csvHeader);
                    }
                }
                setAcceptedMappings(autoAccepted);
            }
        } catch (err: any) {
            setAiError(err.message || 'AI analysis failed. You can skip this step.');
        } finally {
            setAiLoading(false);
        }
    }, [csvData, mapping]);

    // Skip AI review and go straight to preview
    const skipToPreview = () => {
        if (csvData) {
            const foundDuplicates = findDuplicates(csvData.rows, mapping, customers);
            setDuplicates(foundDuplicates);
        }
        setStep('preview');
    };

    // Apply AI fixes and proceed to preview
    const applyAndContinue = () => {
        if (!csvData) return;

        let updatedRows = csvData.rows;
        let updatedMapping = { ...mapping };

        // Apply accepted mapping suggestions
        if (aiAnalysis?.unmapped_columns && acceptedMappings.size > 0) {
            updatedMapping = applyMappingSuggestions(updatedMapping, aiAnalysis.unmapped_columns, acceptedMappings);
        }

        // Apply selected format fixes
        if (aiAnalysis?.format_issues && appliedFixes.size > 0) {
            const result = applyCleanupFixes(updatedRows, updatedMapping, aiAnalysis.format_issues, appliedFixes);
            updatedRows = result.rows;
            updatedMapping = result.mapping;
        }

        // Update state
        setCsvData({ ...csvData, rows: updatedRows });
        setMapping(updatedMapping);

        // Find duplicates with updated data/mapping
        const foundDuplicates = findDuplicates(updatedRows, updatedMapping, customers);
        setDuplicates(foundDuplicates);

        setStep('preview');
    };

    const continueToPreview = () => {
        // Validate that at least one field is mapped
        if (Object.values(mapping).every(v => !v)) {
            toast.error('Please map at least one field to continue');
            return;
        }

        // Check for duplicates
        if (csvData) {
            const foundDuplicates = findDuplicates(csvData.rows, mapping, customers);
            setDuplicates(foundDuplicates);
        }

        setStep('preview');
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(section)) next.delete(section);
            else next.add(section);
            return next;
        });
    };

    const toggleFix = (fixId: string) => {
        setAppliedFixes(prev => {
            const next = new Set(prev);
            if (next.has(fixId)) next.delete(fixId);
            else next.add(fixId);
            return next;
        });
    };

    const toggleMappingSuggestion = (csvHeader: string) => {
        setAcceptedMappings(prev => {
            const next = new Set(prev);
            if (next.has(csvHeader)) next.delete(csvHeader);
            else next.add(csvHeader);
            return next;
        });
    };

    const executeImport = async () => {
        if (!csvData) return;

        setStep('importing');
        let created = 0;
        let updated = 0;
        let skipped = 0;
        let failed = 0;

        const duplicateIndices = new Set(duplicates.map(d => d.csvRowIndex));

        try {
            // Process non-duplicates
            for (let i = 0; i < csvData.rows.length; i++) {
                const row = csvData.rows[i];

                // Handle confirmed duplicates based on action
                if (duplicateIndices.has(i)) {
                    const duplicate = duplicates.find(d => d.csvRowIndex === i);

                    if (duplicateAction === 'skip') {
                        skipped++;
                        continue;
                    }

                    if (duplicateAction === 'update' && duplicate) {
                        try {
                            const updates = transformRowToCustomer(row, mapping);
                            await updateCustomer(duplicate.existingCustomer.id, updates);
                            updated++;
                        } catch (err) {
                            failed++;
                        }
                        continue;
                    }

                    // If 'create', fall through to creation logic
                }

                // Create new customer
                try {
                    const newCustomer = transformRowToCustomer(row, mapping);
                    // Add required fields
                    if (!newCustomer.organization_id) {
                        // Let the store/backend handle ID generation and org ID
                    }
                    await createCustomer(newCustomer as any);
                    created++;
                } catch (err) {
                    failed++;
                }
            }

            setImportStats({ created, updated, skipped, failed });
            setStep('complete');
            onSuccess();
        } catch (error) {
            toast.error('An error occurred during import');
            setStep('preview');
        }
    };

    const crmFields = getCRMFields();

    // Quality score color helpers
    const getScoreColor = (score: number) => {
        if (score >= 0.8) return 'text-green-600 dark:text-green-400';
        if (score >= 0.5) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getScoreBg = (score: number) => {
        if (score >= 0.8) return 'bg-green-100 dark:bg-green-900/30';
        if (score >= 0.5) return 'bg-yellow-100 dark:bg-yellow-900/30';
        return 'bg-red-100 dark:bg-red-900/30';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 0.8) return 'Good';
        if (score >= 0.5) return 'Fair';
        return 'Needs Work';
    };

    const getSeverityColor = (severity: string) => {
        if (severity === 'error') return 'text-red-600 dark:text-red-400';
        if (severity === 'warning') return 'text-yellow-600 dark:text-yellow-400';
        return 'text-blue-600 dark:text-blue-400';
    };

    const getSeverityBg = (severity: string) => {
        if (severity === 'error') return 'bg-red-50 dark:bg-red-900/20';
        if (severity === 'warning') return 'bg-yellow-50 dark:bg-yellow-900/20';
        return 'bg-blue-50 dark:bg-blue-900/20';
    };

    if (!isOpen) return null;

    // Step index mapping for the progress bar
    const stepLabels = ['Upload', 'Map Fields', 'AI Review', 'Preview', 'Finish'];
    const stepKeys: ImportStep[] = ['upload', 'map', 'ai_review', 'preview', 'complete'];
    const currentStepIndex = stepKeys.indexOf(step === 'importing' ? 'preview' : step);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Import Customers</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Add contacts from CSV</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">

                    {/* Progress Steps */}
                    <div className="flex items-center justify-center mb-8">
                        {stepLabels.map((label, i) => {
                            const isCurrent = currentStepIndex === i;
                            const isCompleted = currentStepIndex > i;

                            return (
                                <div key={label} className="flex items-center">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${isCompleted ? 'bg-green-500 border-green-500 text-white' :
                                        isCurrent ? 'border-primary-600 text-primary-600' :
                                            'border-gray-300 text-gray-300'
                                        }`}>
                                        {isCompleted ? <Check size={16} /> : i === 2 ? <Sparkles size={14} /> : <span>{i + 1}</span>}
                                    </div>
                                    <span className={`ml-2 text-sm font-medium ${isCurrent ? 'text-primary-600' : 'text-gray-500'
                                        }`}>{label}</span>
                                    {i < stepLabels.length - 1 && (
                                        <div className={`w-8 lg:w-12 h-0.5 mx-2 lg:mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'
                                            }`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* STEP 1: UPLOAD */}
                    {step === 'upload' && (
                        <div
                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center hover:border-primary-500 dark:hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all cursor-pointer"
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                accept=".csv"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            <div className="w-20 h-20 bg-primary-100 dark:bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary-600 dark:text-primary-400">
                                <Upload size={40} />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                Drop your CSV file here
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                or click to browse from your computer
                            </p>
                            <div className="flex justify-center gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1"><FileText size={16} /> .CSV format</span>
                                <span className="flex items-center gap-1"><Database size={16} /> Max 10,000 rows</span>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: MAP FIELDS */}
                    {step === 'map' && csvData && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
                                <AlertTriangle className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={20} />
                                <div>
                                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Smart Mapping Active</h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        We've automatically matched fields based on your CSV headers. Please review and adjust as needed.
                                    </p>
                                </div>
                            </div>

                            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                                        <tr>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">CSV Header</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Preview (Row 1)</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Map To Field</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {csvData.headers.map((header) => {
                                            const sampleValue = csvData.rows[0]?.[header] || '';

                                            return (
                                                <tr key={header} className="bg-white dark:bg-gray-800">
                                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{header}</td>
                                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                                        {sampleValue}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <select
                                                            value={mapping[header] || ''}
                                                            onChange={(e) => handleMappingChange(header, e.target.value)}
                                                            className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-primary-500 ${mapping[header]
                                                                ? 'border-green-300 bg-green-50 dark:bg-green-900/10 text-green-800 dark:text-green-300'
                                                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                                                                }`}
                                                        >
                                                            <option value="">Do not import</option>
                                                            {crmFields.map(field => (
                                                                <option key={field.key} value={field.key}>
                                                                    {field.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: AI REVIEW */}
                    {step === 'ai_review' && (
                        <div className="space-y-4">
                            {/* Loading state */}
                            {aiLoading && (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Sparkles size={28} className="text-purple-600 dark:text-purple-400 animate-pulse" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Analyzing your data with AI...</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                        Checking formatting, detecting issues, and suggesting improvements
                                    </p>
                                    <div className="mt-4 w-48 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto overflow-hidden">
                                        <div className="h-full bg-purple-500 rounded-full animate-[pulse_1.5s_ease-in-out_infinite]" style={{ width: '60%' }} />
                                    </div>
                                </div>
                            )}

                            {/* Error state */}
                            {!aiLoading && aiError && (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <AlertTriangle size={28} className="text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{aiError}</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                                        You can still import your data without AI analysis.
                                    </p>
                                    <div className="flex gap-3 justify-center">
                                        <button
                                            onClick={continueToAIReview}
                                            className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 border border-purple-300 dark:border-purple-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                                        >
                                            <RefreshCw size={14} className="inline mr-1.5" />
                                            Retry
                                        </button>
                                        <button
                                            onClick={skipToPreview}
                                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Skip to Preview
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* AI Analysis Results */}
                            {!aiLoading && !aiError && aiAnalysis && (
                                <>
                                    {/* Quality Score Card */}
                                    <div className={`${getScoreBg(aiAnalysis.overall_quality_score)} rounded-xl p-5 flex items-center gap-4`}>
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${getScoreColor(aiAnalysis.overall_quality_score)} bg-white dark:bg-gray-800 shadow-sm`}>
                                            {Math.round(aiAnalysis.overall_quality_score * 100)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className={`text-lg font-bold ${getScoreColor(aiAnalysis.overall_quality_score)}`}>
                                                    Data Quality: {getScoreLabel(aiAnalysis.overall_quality_score)}
                                                </h3>
                                                <Shield size={18} className={getScoreColor(aiAnalysis.overall_quality_score)} />
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{aiAnalysis.summary}</p>
                                        </div>
                                        {aiTokenInfo && (
                                            <div className="text-right text-xs text-gray-500 dark:text-gray-400 shrink-0">
                                                <Zap size={12} className="inline mr-0.5" />
                                                {aiTokenInfo.used.toLocaleString()} tokens used
                                                <br />
                                                {aiTokenInfo.remaining.toLocaleString()} remaining
                                            </div>
                                        )}
                                    </div>

                                    {/* Unmapped Column Suggestions */}
                                    {aiAnalysis.unmapped_columns.length > 0 && (
                                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                            <button
                                                onClick={() => toggleSection('mappings')}
                                                className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Sparkles size={16} className="text-purple-500" />
                                                    <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                                        AI Mapping Suggestions
                                                    </span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                                        {aiAnalysis.unmapped_columns.length}
                                                    </span>
                                                </div>
                                                {expandedSections.has('mappings') ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                            </button>
                                            {expandedSections.has('mappings') && (
                                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                                    {aiAnalysis.unmapped_columns.map((suggestion) => {
                                                        const fieldLabel = crmFields.find(f => f.key === suggestion.suggestedCrmField)?.label || suggestion.suggestedCrmField;
                                                        const isAccepted = acceptedMappings.has(suggestion.csvHeader);

                                                        return (
                                                            <div key={suggestion.csvHeader} className="px-5 py-3 flex items-center gap-3 bg-white dark:bg-gray-800">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                                                            "{suggestion.csvHeader}"
                                                                        </span>
                                                                        <ArrowRight size={14} className="text-gray-400 shrink-0" />
                                                                        <span className="text-primary-600 dark:text-primary-400 font-medium text-sm">
                                                                            {fieldLabel}
                                                                        </span>
                                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${suggestion.confidence >= 0.8
                                                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                                            : suggestion.confidence >= 0.5
                                                                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                                            }`}>
                                                                            {Math.round(suggestion.confidence * 100)}%
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{suggestion.reason}</p>
                                                                </div>
                                                                <button
                                                                    onClick={() => toggleMappingSuggestion(suggestion.csvHeader)}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${isAccepted
                                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
                                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                                        }`}
                                                                >
                                                                    {isAccepted ? (
                                                                        <><Check size={12} className="inline mr-1" />Accepted</>
                                                                    ) : (
                                                                        'Accept'
                                                                    )}
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Format Issues / Fixes */}
                                    {aiAnalysis.format_issues.length > 0 && (
                                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                            <button
                                                onClick={() => toggleSection('fixes')}
                                                className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Zap size={16} className="text-yellow-500" />
                                                    <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                                        Formatting Fixes Available
                                                    </span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                                                        {aiAnalysis.format_issues.length}
                                                    </span>
                                                </div>
                                                {expandedSections.has('fixes') ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                            </button>
                                            {expandedSections.has('fixes') && (
                                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                                    {aiAnalysis.format_issues.map((fix) => {
                                                        const fixId = `${fix.column}_${fix.suggestedFix}`;
                                                        const isApplied = appliedFixes.has(fixId);

                                                        return (
                                                            <div key={fixId} className="px-5 py-4 bg-white dark:bg-gray-800">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="font-medium text-gray-900 dark:text-white text-sm">
                                                                                {fix.description}
                                                                            </span>
                                                                            <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                                                                                {fix.affectedCount} rows
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-xs mt-1.5">
                                                                            <span className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded font-mono">
                                                                                {fix.example.before}
                                                                            </span>
                                                                            <ArrowRight size={12} className="text-gray-400 shrink-0" />
                                                                            <span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded font-mono">
                                                                                {typeof fix.example.after === 'object' ? JSON.stringify(fix.example.after) : fix.example.after}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => toggleFix(fixId)}
                                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${isApplied
                                                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
                                                                            : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-700 hover:bg-primary-200 dark:hover:bg-primary-900/50'
                                                                            }`}
                                                                    >
                                                                        {isApplied ? (
                                                                            <><Check size={12} className="inline mr-1" />Applied</>
                                                                        ) : (
                                                                            'Fix All'
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Missing Data */}
                                    {aiAnalysis.missing_data.length > 0 && (
                                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                            <button
                                                onClick={() => toggleSection('missing')}
                                                className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Eye size={16} className="text-blue-500" />
                                                    <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                                        Missing Data
                                                    </span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                                        {aiAnalysis.missing_data.length} fields
                                                    </span>
                                                </div>
                                                {expandedSections.has('missing') ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                            </button>
                                            {expandedSections.has('missing') && (
                                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                                    {aiAnalysis.missing_data.map((item) => {
                                                        const fieldLabel = crmFields.find(f => f.key === item.crmField)?.label || item.crmField;
                                                        const pct = Math.round((item.missingCount / item.totalCount) * 100);

                                                        return (
                                                            <div key={item.crmField} className={`px-5 py-3 ${getSeverityBg(item.severity)}`}>
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`font-medium text-sm ${getSeverityColor(item.severity)}`}>
                                                                            {fieldLabel}
                                                                        </span>
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                            {item.missingCount} of {item.totalCount} rows missing ({pct}%)
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.suggestion}</p>
                                                                {/* Progress bar showing completeness */}
                                                                <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full ${item.severity === 'error' ? 'bg-red-500' : item.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`}
                                                                        style={{ width: `${100 - pct}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Data Quality Issues */}
                                    {aiAnalysis.data_quality.length > 0 && (
                                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                            <button
                                                onClick={() => toggleSection('data_quality')}
                                                className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle size={16} className="text-red-500" />
                                                    <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                                        Data Quality Warnings
                                                    </span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                                                        {aiAnalysis.data_quality.length}
                                                    </span>
                                                </div>
                                                {expandedSections.has('data_quality') ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                            </button>
                                            {expandedSections.has('data_quality') && (
                                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                                    {aiAnalysis.data_quality.map((issue, idx) => (
                                                        <div key={idx} className="px-5 py-3 bg-white dark:bg-gray-800">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-medium text-sm text-gray-900 dark:text-white">{issue.issue}</span>
                                                                <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                                                                    {issue.affectedCount} rows
                                                                </span>
                                                            </div>
                                                            {issue.examples.length > 0 && (
                                                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                                    {issue.examples.slice(0, 3).map((ex, i) => (
                                                                        <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded font-mono">
                                                                            {ex}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{issue.suggestedFix}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* All clear message if no issues */}
                                    {aiAnalysis.unmapped_columns.length === 0 &&
                                        aiAnalysis.format_issues.length === 0 &&
                                        aiAnalysis.missing_data.length === 0 &&
                                        aiAnalysis.data_quality.length === 0 && (
                                            <div className="text-center py-6">
                                                <Check size={32} className="text-green-500 mx-auto mb-2" />
                                                <p className="text-green-700 dark:text-green-300 font-medium">Your data looks great! No issues detected.</p>
                                            </div>
                                        )}
                                </>
                            )}
                        </div>
                    )}

                    {/* STEP 4: PREVIEW */}
                    {step === 'preview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl text-center">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{csvData?.rows.length}</div>
                                    <div className="text-sm text-gray-500">Total Contacts</div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl text-center">
                                    <div className="text-2xl font-bold text-green-600">{Object.keys(mapping).filter(k => mapping[k]).length}</div>
                                    <div className="text-sm text-gray-500">Fields Mapped</div>
                                </div>
                                <div className={`p-4 rounded-xl text-center ${duplicates.length > 0 ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-gray-50 dark:bg-gray-700/50'
                                    }`}>
                                    <div className={`text-2xl font-bold ${duplicates.length > 0 ? 'text-orange-600' : 'text-gray-900 dark:text-white'
                                        }`}>{duplicates.length}</div>
                                    <div className="text-sm text-gray-500">Duplicates</div>
                                </div>
                            </div>

                            {duplicates.length > 0 && (
                                <div className="border border-orange-200 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-900/10 rounded-xl p-6">
                                    <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-4 flex items-center gap-2">
                                        <AlertTriangle size={20} />
                                        Duplicate Action
                                    </h4>
                                    <div className="space-y-3">
                                        <label className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-orange-100 dark:border-orange-900/30 cursor-pointer hover:border-orange-300">
                                            <input
                                                type="radio"
                                                name="duplicateAction"
                                                value="skip"
                                                checked={duplicateAction === 'skip'}
                                                onChange={(e) => setDuplicateAction(e.target.value as any)}
                                                className="mt-1"
                                            />
                                            <div>
                                                <span className="block font-medium text-gray-900 dark:text-white">Skip duplicates</span>
                                                <span className="text-sm text-gray-500">Do not import existing contacts (safest)</span>
                                            </div>
                                        </label>
                                        <label className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-orange-100 dark:border-orange-900/30 cursor-pointer hover:border-orange-300">
                                            <input
                                                type="radio"
                                                name="duplicateAction"
                                                value="update"
                                                checked={duplicateAction === 'update'}
                                                onChange={(e) => setDuplicateAction(e.target.value as any)}
                                                className="mt-1"
                                            />
                                            <div>
                                                <span className="block font-medium text-gray-900 dark:text-white">Update existing</span>
                                                <span className="text-sm text-gray-500">Overwrite existing records with new data</span>
                                            </div>
                                        </label>
                                        <label className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-orange-100 dark:border-orange-900/30 cursor-pointer hover:border-orange-300">
                                            <input
                                                type="radio"
                                                name="duplicateAction"
                                                value="create"
                                                checked={duplicateAction === 'create'}
                                                onChange={(e) => setDuplicateAction(e.target.value as any)}
                                                className="mt-1"
                                            />
                                            <div>
                                                <span className="block font-medium text-gray-900 dark:text-white">Create specific duplicates</span>
                                                <span className="text-sm text-gray-500">Import as new records anyway</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 5: IMPORTING / COMPLETE */}
                    {step === 'importing' && (
                        <div className="text-center py-12">
                            <div className="animate-spin w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Importing Contacts...</h3>
                            <p className="text-gray-500">Please wait while we process your file.</p>
                        </div>
                    )}

                    {step === 'complete' && (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400">
                                <Check size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Import Complete!</h3>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{importStats.created}</div>
                                    <div className="text-sm text-green-700 dark:text-green-300">Created</div>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{importStats.updated}</div>
                                    <div className="text-sm text-blue-700 dark:text-blue-300">Updated</div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                                    <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{importStats.skipped}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-300">Skipped</div>
                                </div>
                                {importStats.failed > 0 && (
                                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl">
                                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{importStats.failed}</div>
                                        <div className="text-sm text-red-700 dark:text-red-300">Failed</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                    {step === 'upload' ? (
                        <button
                            onClick={() => { }}
                            className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center gap-1"
                        >
                            <Download size={16} /> Download CSV Template
                        </button>
                    ) : step !== 'importing' && step !== 'complete' && (
                        <button
                            onClick={() => {
                                if (step === 'preview') setStep(aiAnalysis ? 'ai_review' : 'map');
                                else if (step === 'ai_review') setStep('map');
                                else setStep('upload');
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft size={18} /> Back
                        </button>
                    )}

                    <div className="flex gap-3 ml-auto">
                        {step === 'complete' ? (
                            <button
                                onClick={handleClose}
                                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Done
                            </button>
                        ) : step === 'upload' ? (
                            // Upload handled by dropzone/click
                            null
                        ) : step === 'map' ? (
                            <button
                                onClick={continueToAIReview}
                                className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Sparkles size={16} /> AI Review <ArrowRight size={18} />
                            </button>
                        ) : step === 'ai_review' ? (
                            <div className="flex gap-2">
                                {!aiLoading && (
                                    <button
                                        onClick={skipToPreview}
                                        className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    >
                                        Skip
                                    </button>
                                )}
                                {!aiLoading && !aiError && aiAnalysis && (
                                    <button
                                        onClick={applyAndContinue}
                                        className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                                    >
                                        {appliedFixes.size > 0 || acceptedMappings.size > 0 ? 'Apply & Continue' : 'Continue'} <ArrowRight size={18} />
                                    </button>
                                )}
                            </div>
                        ) : step === 'preview' ? (
                            <button
                                onClick={executeImport}
                                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Import {csvData ? csvData.rows.length : 0} Customers <Check size={18} />
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CSVImporter;
