import React, { useState } from 'react';
import { Upload, Check, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'react-hot-toast';
import { useCustomerStore } from '../../stores/customerStore';

const IntegrationsTab: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const { createCustomer } = useCustomerStore();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    try {
      const text = await file.text();
      
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const { data, errors } = results;
          
          if (errors.length > 0) {
            toast.error('Error parsing CSV file');
            console.error('CSV parsing errors:', errors);
            return;
          }

          let successCount = 0;
          let errorCount = 0;

          for (const row of data) {
            try {
              // Map CSV columns to customer fields
              const customerData = {
                name: row.name || row.full_name || row.customer_name,
                email: row.email || row.email_address,
                phone: row.phone || row.phone_number || row.contact,
                address: row.address || row.street_address,
                type: row.type || 'Individual',
                notes: row.notes || row.comments
              };

              // Validate required fields
              if (!customerData.name) {
                throw new Error('Name is required');
              }

              await createCustomer(customerData);
              successCount++;
            } catch (error) {
              console.error('Error importing customer:', error);
              errorCount++;
            }
          }

          toast.success(`Imported ${successCount} customers successfully${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          toast.error('Failed to parse CSV file');
        }
      });
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      // Clear the input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-white mb-4">Data Import</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="hidden md:block card bg-dark-800 border border-dark-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-md bg-primary-500/20 text-primary-400">
              <Upload size={24} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Import Customers</h3>
              <p className="text-sm text-gray-400">Import customer data from a CSV file</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-dark-600 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
                disabled={uploading}
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <Upload 
                  size={32} 
                  className={`mb-4 ${uploading ? 'animate-bounce text-primary-400' : 'text-gray-400'}`} 
                />
                <span className="text-sm text-gray-300 mb-2">
                  {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                </span>
                <span className="text-xs text-gray-400">CSV files only</span>
              </label>
            </div>

            <div className="bg-dark-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-white mb-2">CSV Format Requirements</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li className="flex items-center">
                  <Check size={16} className="text-green-400 mr-2" />
                  First row must contain column headers
                </li>
                <li className="flex items-center">
                  <Check size={16} className="text-green-400 mr-2" />
                  Required columns: name/full_name/customer_name
                </li>
                <li className="flex items-center">
                  <Check size={16} className="text-green-400 mr-2" />
                  Optional: email, phone, address, type, notes
                </li>
              </ul>
            </div>

            <div className="bg-primary-900/20 border border-primary-800/50 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle size={20} className="text-primary-400 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">Important Note</h4>
                  <p className="text-sm text-gray-400">
                    Make sure your CSV file is properly formatted and encoded in UTF-8 to avoid import errors.
                    Large files may take longer to process.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card bg-dark-800 border border-dark-700 p-6">
            <h3 className="text-lg font-medium text-white mb-4">Sample CSV Format</h3>
            <div className="bg-dark-700 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-gray-400">
                name,email,phone,address,type,notes
                John Doe,john@example.com,555-0123,123 Main St,Individual,VIP customer
                Jane Corp,contact@jane.com,555-0456,456 Corp Ave,Business,New client
              </pre>
            </div>
          </div>

          <div className="card bg-dark-800 border border-dark-700 p-6">
            <h3 className="text-lg font-medium text-white mb-4">Supported Fields</h3>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-white mb-1">Name (Required)</h4>
                <p className="text-sm text-gray-400">Accepted headers: name, full_name, customer_name</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-white mb-1">Email</h4>
                <p className="text-sm text-gray-400">Accepted headers: email, email_address</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-white mb-1">Phone</h4>
                <p className="text-sm text-gray-400">Accepted headers: phone, phone_number, contact</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-white mb-1">Address</h4>
                <p className="text-sm text-gray-400">Accepted headers: address, street_address</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-white mb-1">Type</h4>
                <p className="text-sm text-gray-400">Values: Individual, Business</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-white mb-1">Notes</h4>
                <p className="text-sm text-gray-400">Accepted headers: notes, comments</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsTab;