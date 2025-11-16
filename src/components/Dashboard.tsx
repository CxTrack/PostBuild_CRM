import React, { useEffect, useState } from 'react';
import { useProfileStore } from '../stores/profileStore';
import DefaultDashboard from './dashboards/default-dashboard';
import MortgageDashboard from './dashboards/mortgage-dashboard';
//import SelectIndustryModalDialog from './industry/SelectIndustryDialog';

const Dashboard: React.FC = () => {
  const { profile, fetchProfile } = useProfileStore();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile, refreshKey]);

  if (!profile) {
    return <div>Loading...</div>;
  }


  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const industryId = Number(profile.industry_id);

  // Show dialog if industry is not yet selected
 //const shouldShowIndustryDialog = profile.industry_id === null;

  // if (shouldShowIndustryDialog) {
  //   return (
  //     <SelectIndustryModalDialog
  //       isOpen={true}
  //       onClose={() => handleRefresh()}
  //     />
  //   );
  // }

  switch (industryId) {
    case 1:
      return <MortgageDashboard />;
    // case 2:
    //   return <div>Industry 2 Dashboard</div>;
    case 3:
      return <DefaultDashboard />;
    default:
      return <DefaultDashboard />;
  }
};

export default Dashboard;
