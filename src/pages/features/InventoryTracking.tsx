import React from 'react';
import { Link } from 'react-router-dom';
import { Package, BarChart2, TrendingUp, AlertTriangle, RefreshCw, Truck } from 'lucide-react';

const InventoryTracking: React.FC = () => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-2xl p-8 md:p-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Smart Inventory Management
            </h1>
            <p className="text-primary-200 text-lg mb-6">
              Track stock levels, monitor product movement, and optimize your inventory with our powerful management system.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="btn btn-primary bg-white text-primary-900 hover:bg-gray-100">
                Start Free
              </Link>
              <Link to="/login" className="btn btn-secondary border border-white text-white hover:bg-primary-700">
                View Demo
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <img 
              src="https://images.unsplash.com/photo-1553413077-190dd305871c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80" 
              alt="Inventory Management" 
              className="rounded-lg shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Powerful Inventory Features</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Everything you need to manage your inventory efficiently and prevent stockouts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Package className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Real-time Stock Tracking</h3>
            <p className="text-gray-400">
              Monitor your inventory levels in real-time across multiple locations to prevent stockouts and overstock situations.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <AlertTriangle className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Low Stock Alerts</h3>
            <p className="text-gray-400">
              Receive automatic notifications when inventory levels fall below your specified thresholds to ensure timely reordering.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <BarChart2 className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Inventory Analytics</h3>
            <p className="text-gray-400">
              Gain insights into inventory turnover, product performance, and seasonal trends to optimize your stock levels.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Truck className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Purchase Order Management</h3>
            <p className="text-gray-400">
              Create and track purchase orders, manage supplier information, and streamline your procurement process.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <RefreshCw className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Automated Reordering</h3>
            <p className="text-gray-400">
              Set up automatic reorder points and generate purchase orders when stock levels reach the reorder threshold.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <TrendingUp className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Demand Forecasting</h3>
            <p className="text-gray-400">
              Use historical data and advanced algorithms to predict future demand and optimize your inventory levels.
            </p>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="bg-dark-800 rounded-2xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Intuitive Inventory Dashboard</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Our user-friendly dashboard gives you a complete overview of your inventory at a glance.
          </p>
        </div>
        
        <div className="rounded-xl overflow-hidden shadow-2xl">
          <img 
            src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80" 
            alt="Inventory Dashboard" 
            className="w-full"
          />
        </div>
      </section>

      {/* Benefits Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Benefits of Our Inventory System</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            See how our inventory management solution can transform your business operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-dark-800 p-6 rounded-xl">
            <h3 className="text-xl font-semibold text-white mb-4">Reduce Carrying Costs</h3>
            <p className="text-gray-400 mb-4">
              Optimize your inventory levels to reduce storage costs, insurance, and capital tied up in excess inventory.
            </p>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Lower warehouse space requirements</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Reduced insurance costs</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Less capital tied up in inventory</span>
              </li>
            </ul>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <h3 className="text-xl font-semibold text-white mb-4">Prevent Stockouts</h3>
            <p className="text-gray-400 mb-4">
              Ensure you never miss a sale due to out-of-stock items with real-time tracking and automated alerts.
            </p>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Automated low stock notifications</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Timely reordering suggestions</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Improved customer satisfaction</span>
              </li>
            </ul>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <h3 className="text-xl font-semibold text-white mb-4">Streamline Operations</h3>
            <p className="text-gray-400 mb-4">
              Automate manual processes and improve efficiency across your inventory management workflow.
            </p>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Automated purchase orders</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Barcode scanning capabilities</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Reduced manual data entry</span>
              </li>
            </ul>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <h3 className="text-xl font-semibold text-white mb-4">Data-Driven Decisions</h3>
            <p className="text-gray-400 mb-4">
              Make informed inventory decisions based on accurate data and powerful analytics.
            </p>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Detailed inventory reports</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Product performance metrics</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Seasonal trend analysis</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to Optimize Your Inventory Management?</h2>
        <p className="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
          Join thousands of businesses that use our platform to streamline their inventory operations and boost profitability.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/register" className="btn btn-primary bg-white text-primary-900 hover:bg-gray-100 px-6 py-3">
            Start Your Free Account
          </Link>
          <Link to="/login" className="btn btn-secondary border border-white text-white hover:bg-primary-700 px-6 py-3">
            Learn More
          </Link>
        </div>
      </section>
    </div>
  );
};

export default InventoryTracking;