import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

interface PipelineWidgetProps {
}

const PipelineWidget: React.FC<PipelineWidgetProps> = ({ }) => {
    const [pipelineData, setPipelineData] = useState<any[]>([]);
    const { user } = useAuthStore();

    useEffect(() => {

        const loadData = async () => {
            const { data: pipeline, error: pipelineError } = await supabase
                .rpc('get_pipeline_summary', {
                    p_user_id: user?.id
                });

            if (pipelineError) throw pipelineError;
            setPipelineData(pipeline || []);
        }

        loadData();
        console.log(pipelineData);
        
    });

    return (
        <>
            <div className="card bg-dark-800 border border-dark-700">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-white flex items-center">
                        <span>Pipeline Overview</span>
                        <div className="ml-2 px-2 py-1 text-xs bg-primary-500/20 text-primary-400 rounded-full">
                            {pipelineData?.length || 0} Stages
                        </div>
                    </h2>
                    <Link to="/pipeline" className="btn btn-secondary flex items-center space-x-2">
                        <FileText size={16} />
                        <span>View Details</span>
                    </Link>
                </div>

                <div className="space-y-4">
                    {[
                        { stage: 'lead', label: 'Leads', color: 'bg-gray-500' },
                        { stage: 'opportunity', label: 'Opportunities', color: 'bg-blue-500' },
                        // { stage: 'quote', label: 'Quotes', color: 'bg-yellow-500' },
                        // { stage: 'invoice_sent', label: 'Invoices (Sent)', color: 'bg-orange-500' },
                        // { stage: 'invoice_pending', label: 'Invoices (Pending)', color: 'bg-purple-500' },
                        { stage: 'closed_won', label: 'Closed (Won)', color: 'bg-green-500' }
                    ].map((stage) => {
                        const stageData = pipelineData?.find(p => p.pipeline_stage === stage.stage) || {
                            total_value: 0,
                            deal_count: 0,
                            completion_percentage: 0
                        };
                        const value = stageData?.total_value || 0;
                        const count = stageData?.deal_count || 0;
                        const percentage = stageData?.completion_percentage || 0;

                        return (
                            <Link
                                key={stage.stage}
                                to={`/pipeline/${stage.stage}`}
                                className="group relative block p-2 rounded-lg transition-all duration-300 hover:bg-dark-700/50 hover:shadow-lg hover:scale-[1.02] transform"
                            >
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm text-gray-300">{stage.label}</span>
                                    <span className="text-sm text-gray-400">
                                        {count} {count === 1 ? 'deal' : 'deals'} · ${value.toLocaleString()}
                                    </span>
                                </div>
                                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${stage.color} transition-all duration-500 group-hover:opacity-90 group-hover:shadow-md`}
                                        style={{ width: `${percentage * 100}%` }}
                                    />
                                </div>
                                <div className="absolute inset-0 rounded-lg border-2 border-transparent transition-colors duration-300 group-hover:border-primary-500/30"></div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

export default PipelineWidget;