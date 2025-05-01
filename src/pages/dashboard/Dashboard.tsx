import { Link } from 'react-router-dom';
import { 
  Users, Package, FileText, ShoppingCart, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight,
  Plus, Search, Filter, Download, Trash2, Edit, Eye, Settings, Receipt,
  Calendar, Settings as SettingsIcon, Truck,
  Phone
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCustomerStore } from '../../stores/customerStore';
import { useSupplierStore } from '../../stores/supplierStore';
import { useProductStore } from '../../stores/productStore';
import { useInvoiceStore } from '../../stores/invoiceStore';
import { useCalendarStore } from '../../stores/calendarStore';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useCallStore } from '../../stores/callStore';

// Function to format relative time
const getRelativeTime = (date: string) => {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch (error) {
    console.error('Error formatting date:', error);
    return format(new Date(date), 'MMM d, yyyy h:mm a');
  }
};

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [pipelineData, setPipelineData] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { customers, fetchCustomers } = useCustomerStore();
  const { products, fetchProducts } = useProductStore();
  const { invoices, fetchInvoices, loading: invoicesLoading } = useInvoiceStore();
  const { events, fetchEvents } = useCalendarStore();
  const { totalProducts } = useProductStore();
  const { suppliers, fetchSuppliers } = useSupplierStore();
  const { calls } = useCallStore();
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [activities, setActivities] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [dashboardSettings, setDashboardSettings] = useState({
    showSalesChart: true,
    showPurchasesChart: true,
    showInventoryStatus: true,
    showTodayEvents: true
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch data when component mounts
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch recent expenses
        const { data: recentExpenses, error: expensesError } = await supabase
          .from('expenses')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (expensesError) throw expensesError;
        setExpenses(recentExpenses || []);

        // Fetch pipeline data
        const { data: pipeline, error: pipelineError } = await supabase
          .rpc('get_pipeline_summary', { 
            p_user_id: user?.id 
          });

        if (pipelineError) throw pipelineError;
        setPipelineData(pipeline || []);

        // Fetch recent activities
        const { data: recentActivities, error: activitiesError } = await supabase
          .from('recent_activities')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (activitiesError) throw activitiesError;
        setActivities(recentActivities || []);

        // Calculate total revenue from paid invoices
        const revenue = invoices
          .filter(inv => inv.status === 'Paid')
          .reduce((sum, inv) => sum + (inv.total || 0), 0);
        setTotalRevenue(revenue);

        await Promise.all([
          fetchCustomers(),
          fetchProducts(),
          fetchInvoices(),
          fetchEvents(),
          fetchSuppliers()
        ]);
        
        // Load dashboard settings
        const { data: settings } = await supabase
          .from('user_settings')
          .select('dashboard_settings')
          .eq('user_id', user?.id)
          .single();
        
        if (settings?.dashboard_settings) {
          setDashboardSettings(settings.dashboard_settings);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchCustomers, fetchProducts, fetchInvoices, fetchEvents, user?.id]);

  // Save dashboard settings
  const saveDashboardSettings = async (newSettings: typeof dashboardSettings) => {
    try {
      // First check if settings exist
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (existingSettings) {
        // Update existing settings
        await supabase
          .from('user_settings')
          .update({ dashboard_settings: newSettings })
          .eq('user_id', user?.id);
      } else {
        // Insert new settings
        await supabase
          .from('user_settings')
          .insert([{
            user_id: user?.id,
            dashboard_settings: newSettings
          }]);
      }

      setDashboardSettings(newSettings);
      toast.success('Dashboard settings saved');
    } catch (error) {
      console.error('Error saving dashboard settings:', error);
      toast.error('Failed to save dashboard settings');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        <span className="ml-3 text-gray-400">Loading dashboard data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        {/* Desktop: Show date/time */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="text-2xl font-bold text-white" id="time">
            {currentTime.toLocaleTimeString()}
          </div>
          <div className="text-gray-400" id="date">
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          {/* <button
            onClick={() => setShowSettingsModal(true)}
            className="btn btn-secondary p-2"
            title="Customize Dashboard"
          >
            <SettingsIcon size={20} />
          </button> */}
        </div>
        {/* Mobile: Show action menu */}
        <div className="md:hidden relative">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Select Option</span>
          </button>
          {showMobileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-dark-800 rounded-md shadow-lg py-1 z-50 border border-dark-700">
              <Link
                to="/invoices/create"
                className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-700"
                onClick={() => setShowMobileMenu(false)}
              >
                New Invoice
              </Link>
              <Link
                to="/purchases/create"
                className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-700"
                onClick={() => setShowMobileMenu(false)}
              >
                New Purchase
              </Link>
              <Link
                to="/expenses"
                className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-700"
                onClick={() => setShowMobileMenu(false)}
              >
                New Expense
              </Link>
              <Link
                to="/quotes/create"
                className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-700"
                onClick={() => setShowMobileMenu(false)}
              >
                New Quote
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Link to="/revenue" className="card bg-dark-800 border border-dark-700 hover:bg-dark-700/50 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                ${totalRevenue.toLocaleString()}
              </h3>
              {/* <div className="flex items-center mt-2">
                <ArrowUpRight size={16} className="text-green-500" />
                <span className="text-sm text-green-500 ml-1">12%</span>
                <span className="text-gray-500 text-sm ml-1">vs last month</span>
              </div> */}
            </div>
            <div className="p-3 rounded-lg bg-green-500/20 text-green-500">
              <DollarSign size={24} />
            </div>
          </div>
        </Link>

        <Link to="/customers" className="card bg-dark-800 border border-dark-700 hover:bg-dark-700/50 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Total Customers</p>
              <h3 className="text-2xl font-bold text-white mt-1">{customers.length}</h3>
              {/* <div className="flex items-center mt-2">
                <ArrowUpRight size={16} className="text-green-500" />
                <span className="text-sm text-green-500 ml-1">8%</span>
                <span className="text-gray-500 text-sm ml-1">vs last month</span>
              </div> */}
            </div>
            <div className="p-3 rounded-lg bg-blue-500/20 text-blue-500">
              <Users size={24} />
            </div>
          </div>
        </Link>

        <Link to="/products" className="card bg-dark-800 border border-dark-700 hover:bg-dark-700/50 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Total Products</p>
              <h3 className="text-2xl font-bold text-white mt-1">{totalProducts}</h3>
              {/* <div className="flex items-center mt-2">
                <ArrowUpRight size={16} className="text-green-500" />
                <span className="text-sm text-green-500 ml-1">5%</span>
                <span className="text-gray-500 text-sm ml-1">vs last month</span>
              </div> */}
            </div>
            <div className="p-3 rounded-lg bg-purple-500/20 text-purple-500">
              <Package size={24} />
            </div>
          </div>
        </Link>

        <Link to="/invoices" className="card bg-dark-800 border border-dark-700 hover:bg-dark-700/50 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Pending Orders</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {invoices.filter(inv => !['Paid', 'Cancelled'].includes(inv.status)).length}
              </h3>
              {/* <div className="flex items-center mt-2">
                <ArrowDownRight size={16} className="text-red-500" />
                <span className="text-sm text-red-500 ml-1">3%</span>
                <span className="text-gray-500 text-sm ml-1">vs last month</span>
              </div> */}
            </div>
            <div className="p-3 rounded-lg bg-amber-500/20 text-amber-500">
              <ShoppingCart size={24} />
            </div>
          </div>
        </Link>

        {/* <Link to="/suppliers" className="card bg-dark-800 border border-dark-700 hover:bg-dark-700/50 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Suppliers</p>
              <h3 className="text-2xl font-bold text-white mt-1">{suppliers.length}</h3>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/20 text-orange-500">
              <Truck size={24} />
            </div>
          </div>
        </Link>

        <Link to="/calls" className="card bg-dark-800 border border-dark-700 hover:bg-dark-700/50 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Total Calls</p>
              <h3 className="text-2xl font-bold text-white mt-1">{calls.length}</h3>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/20 text-orange-500">
              <Phone size={24} />
            </div>
          </div>
        </Link> */}
      </div>

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
            { stage: 'quote', label: 'Quotes', color: 'bg-yellow-500' },
            { stage: 'invoice_sent', label: 'Invoices (Sent)', color: 'bg-orange-500' },
            { stage: 'invoice_pending', label: 'Invoices (Pending)', color: 'bg-purple-500' },
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
      
      {/* Inventory and Expenses Overview */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> */} {/* when both widgets are enabled */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-12">
        {/* Inventory Table */}
        <div className="card bg-dark-800 border border-dark-700 transform transition-all duration-300 hover:shadow-lg hover:border-primary-500/30">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Low Stock Items</h2>
            <Link to="/inventory" className="btn btn-secondary flex items-center space-x-2">
              <Package size={16} />
              <span>View All</span>
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {products.filter(p => p.stock <= 10).slice(0, 5).map((product) => (
                  <tr key={product.id} className="hover:bg-dark-700/50">
                    <td className="px-4 py-3 whitespace-nowrap group">
                      <Link to={`/products/${product.id}`} className="text-sm font-medium text-white hover:text-primary-400">
                        {product.name}
                        <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-primary-400">
                          View Details →
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className="text-sm text-gray-300">{product.stock}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.stock === 0 ? 'bg-red-900/30 text-red-400' :
                        product.stock <= 5 ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-orange-900/30 text-orange-400'
                      }`}>
                        {product.stock === 0 ? 'Out of Stock' :
                         product.stock <= 5 ? 'Critical' : 'Low Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
                {products.filter(p => p.stock <= 10).length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                      No low stock items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses Table */}
        {/* <div className="card bg-dark-800 border border-dark-700 transform transition-all duration-300 hover:shadow-lg hover:border-primary-500/30">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Expenses</h2>
            <Link to="/expenses" className="btn btn-secondary flex items-center space-x-2">
              <Receipt size={16} />
              <span>View All</span>
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-dark-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {expenses.slice(0, 5).map((expense) => (
                  <tr key={expense.id} className="hover:bg-dark-700/50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 group">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap group">
                      <Link to={`/expenses/${expense.id}`} className="text-sm font-medium text-white hover:text-primary-400">
                        {expense.description}
                        <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-primary-400">
                          View Details →
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className="text-sm text-gray-300">${expense.amount.toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                      No recent expenses found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div> */}
      </div>
      
      {/* Today's Events */}
      {dashboardSettings.showTodayEvents && (
        <div className="card bg-dark-800 border border-dark-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Today's Events</h3>
          </div>
          
          {events.filter(event => {
            const today = new Date();
            const eventDate = new Date(event.start);
            return (
              eventDate.getDate() === today.getDate() &&
              eventDate.getMonth() === today.getMonth() &&
              eventDate.getFullYear() === today.getFullYear()
            );
          }).length > 0 ? (
            <div className="space-y-4">
              {events.filter(event => {
                const today = new Date();
                const eventDate = new Date(event.start);
                return (
                  eventDate.getDate() === today.getDate() &&
                  eventDate.getMonth() === today.getMonth() &&
                  eventDate.getFullYear() === today.getFullYear()
                );
              }).map((event, index) => (
                <div 
                  key={index}
                  className="flex items-center space-x-4 p-3 rounded-lg bg-dark-700/50 hover:bg-dark-700 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${
                    event.type === 'invoice' ? 'bg-primary-500/20 text-primary-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {event.type === 'invoice' ? <FileText size={20} /> : <Calendar size={20} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{event.title}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(event.start).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {event.type === 'invoice' && event.invoice_id && (
                    <Link 
                      to={`/invoices/${event.invoice_id}`}
                      className="btn btn-secondary"
                    >
                      View Invoice
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Calendar size={48} className="text-gray-600 mb-4 mx-auto" />
              <p className="text-gray-400">No events scheduled for today</p>
            </div>
          )}
        </div>
      )}
      
      {/* Recent Activity */}
      <div className="card bg-dark-800 border border-dark-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
        </div>
        {activities.length > 0 ? (
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-md bg-dark-700/50 hover:bg-dark-700 transition-colors">
                <div className={`p-2 rounded-md ${
                  activity.type === 'invoice' ? 'bg-blue-500/20 text-blue-500' :
                  activity.type === 'purchase' ? 'bg-purple-500/20 text-purple-500' :
                  activity.type === 'customer' ? 'bg-green-500/20 text-green-500' :
                  'bg-amber-500/20 text-amber-500'
                }`}>
                  {activity.type === 'invoice' && <FileText size={18} />}
                  {activity.type === 'purchase' && <ShoppingCart size={18} />}
                  {activity.type === 'customer' && <Users size={18} />}
                  {activity.type === 'product' && <Package size={18} />}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{activity.title}</p>
                  <div className="text-sm text-gray-400 mt-1">
                    {activity.customer && <div>Customer: {activity.customer}</div>}
                    {activity.supplier && <div>Supplier: {activity.supplier}</div>}
                    {activity.product && <div>Product: {activity.product}</div>}
                    {activity.amount && <div>Amount: ${activity.amount.toLocaleString()}</div>}
                    {activity.quantity && <div>Quantity: {activity.quantity.toLocaleString()}</div>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{getRelativeTime(activity.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="flex flex-col items-center justify-center">
              <FileText size={48} className="text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg mb-2">No recent activity</p>
              <p className="text-gray-500 text-sm mb-6">Your recent activities will appear here</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Dashboard Settings</h3>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-gray-300">Show Sales Chart</span>
                <input
                  type="checkbox"
                  checked={dashboardSettings.showSalesChart}
                  onChange={(e) => setDashboardSettings({
                    ...dashboardSettings,
                    showSalesChart: e.target.checked
                  })}
                  className="form-checkbox h-5 w-5 text-primary-600 rounded border-gray-600"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-gray-300">Show Purchases Chart</span>
                <input
                  type="checkbox"
                  checked={dashboardSettings.showPurchasesChart}
                  onChange={(e) => setDashboardSettings({
                    ...dashboardSettings,
                    showPurchasesChart: e.target.checked
                  })}
                  className="form-checkbox h-5 w-5 text-primary-600 rounded border-gray-600"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-gray-300">Show Inventory Status</span>
                <input
                  type="checkbox"
                  checked={dashboardSettings.showInventoryStatus}
                  onChange={(e) => setDashboardSettings({
                    ...dashboardSettings,
                    showInventoryStatus: e.target.checked
                  })}
                  className="form-checkbox h-5 w-5 text-primary-600 rounded border-gray-600"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-gray-300">Show Today's Events</span>
                <input
                  type="checkbox"
                  checked={dashboardSettings.showTodayEvents}
                  onChange={(e) => setDashboardSettings({
                    ...dashboardSettings,
                    showTodayEvents: e.target.checked
                  })}
                  className="form-checkbox h-5 w-5 text-primary-600 rounded border-gray-600"
                />
              </label>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  saveDashboardSettings(dashboardSettings);
                  setShowSettingsModal(false);
                }}
                className="btn btn-primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;