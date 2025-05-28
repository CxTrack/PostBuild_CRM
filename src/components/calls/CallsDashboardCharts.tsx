import React from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface CallsDashboardChartsProps {
  totalCallsData: any;
  totalCallsOptions: any;
  callDurationData: any;
  callDurationOptions: any;
  callStatusData: any;
  callStatusOptions: any;
}

const CallsDashboardCharts: React.FC<CallsDashboardChartsProps> = ({
  totalCallsData,
  totalCallsOptions,
  callDurationData,
  callDurationOptions,
  callStatusData,
  callStatusOptions,
}) => {
  return (
    <div className="calls-dashboard-charts">
      <div className="chart-container">
        <h2>Total Calls</h2>
        <Bar data={totalCallsData} options={totalCallsOptions} />
      </div>
      <div className="chart-container">
        <h2>Call Duration</h2>
        <Line data={callDurationData} options={callDurationOptions} />
      </div>
      <div className="chart-container">
        <h2>Call Status</h2>
        <Pie data={callStatusData} options={callStatusOptions} />
      </div>
    </div>
  );
};

export default CallsDashboardCharts;