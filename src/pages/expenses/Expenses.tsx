import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Search, Filter, Download, Trash2, Edit, Eye, Upload, Camera, Receipt } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { toast } from 'react-hot-toast'; 
import { supabase } from '../../lib/supabase';

interface Expense {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: string;
  description: string;
  receipt_url?: string;
  status: 'pending' | 'approved' | 'rejected';
}

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scanning, setScanning] = useState(false);
  const [scannedText, setScannedText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Fetch expenses on component mount
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setExpenses(data || []);
      } catch (error) {
        console.error('Error fetching expenses:', error);
        toast.error('Failed to load expenses');
      }
    };

    fetchExpenses();
  }, []);

  // Function to start camera
  const startCamera = async () => {
    try {
      // First check if the browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support camera access');
      }

      // Check if the device has a camera
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(device => device.kind === 'videoinput');
      
      if (!hasCamera) {
        throw new Error('No camera found on your device');
      }

      // Try to get camera access with fallbacks
      let stream;
      try {
        // First try to get the environment-facing (rear) camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
      } catch (err) {
        // If that fails, try any available camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      
      setShowCamera(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          toast.error('Camera access denied. Please check your camera permissions.');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          toast.error('No camera found on your device.');
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          toast.error('Could not access your camera. It may be in use by another application.');
        } else {
          toast.error(error.message || 'Could not access camera. Please try again.');
        }
      }
    }
  };

  // Function to stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  // Function to capture photo
  const capturePhoto = async () => {
    if (!videoRef.current) return;

    try {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      // Draw the video frame to the canvas
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not get canvas context');
      
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => 
        canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.95)
      );
      
      // Create a File object
      const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' });
      
      // Process the image
      await processImage(file);
      
      // Stop the camera after capturing
      stopCamera();
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast.error('Failed to capture photo');
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processImage = useCallback(async (file: File) => {
    setScanning(true);
    try {
      let textContent = '';

      if (file.type === 'application/pdf') {
        // Handle PDF file
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await loadingTask({ data: arrayBuffer }).promise;
        
        // Extract text from all pages
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          textContent += content.items.map((item: any) => item.str).join(' ') + '\n';
        }
      } else if (file.type.startsWith('image/')) {
        // Handle image file
        const worker = await createWorker('eng');
        const reader = new FileReader();
        
        textContent = await new Promise((resolve, reject) => {
          reader.onload = async (e) => {
            if (e.target?.result) {
              try {
                const { data: { text } } = await worker.recognize(e.target.result);
                resolve(text);
              } catch (error) {
                reject(error);
              } finally {
                await worker.terminate();
              }
            }
          };
          reader.readAsDataURL(file);
        });
      } else {
        throw new Error('Unsupported file type');
      }
      
      // Extract relevant information using regex
      const amountMatch = textContent.match(/\$?\d+\.\d{2}/);
      const dateMatch = textContent.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/);
      const merchantMatch = textContent.match(/(?:store|merchant|vendor):\s*([^\n]+)/i);
      
      // Create expense object from extracted data
      const newExpense: Expense = {
        id: Date.now().toString(),
        date: dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0],
        merchant: merchantMatch ? merchantMatch[1] : 'Unknown Merchant',
        amount: amountMatch ? parseFloat(amountMatch[0].replace('$', '')) : 0,
        category: 'Uncategorized',
        description: textContent.slice(0, 100),
        status: 'pending'
      };
      
      setExpenses(prev => [...prev, newExpense]);
      toast.success('Document scanned successfully');
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process document');
    } finally {
      setScanning(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      await processImage(file);
    } else {
      toast.error('Please upload an image or PDF file');
    }
  }, [processImage]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processImage(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Expenses</h1>
        <div className="flex space-x-2">
          <div className="flex gap-2">
            <select 
              className="bg-dark-800 border border-dark-700 text-white rounded-md px-3 py-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            
            <select 
              className="bg-dark-800 border border-dark-700 text-white rounded-md px-3 py-2"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="travel">Travel</option>
              <option value="meals">Meals & Entertainment</option>
              <option value="office">Office Supplies</option>
              <option value="utilities">Utilities</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex gap-2">
            <select 
              className="bg-dark-800 border border-dark-700 text-white rounded-md px-3 py-2"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            
            <select 
              className="bg-dark-800 border border-dark-700 text-white rounded-md px-3 py-2"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="travel">Travel</option>
              <option value="meals">Meals & Entertainment</option>
              <option value="office">Office Supplies</option>
              <option value="utilities">Utilities</option>
              <option value="other">Other</option>
            </select>
          </div>
          <button
            onClick={() => setShowCamera(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Expense summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-dark-800 border border-dark-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Total Expenses</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                ${expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
              </h3>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/20 text-blue-500">
              <Receipt size={24} />
            </div>
          </div>
        </div>

        <div className="card bg-dark-800 border border-dark-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Pending</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                ${expenses.filter(e => e.status === 'pending')
                  .reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
              </h3>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/20 text-yellow-500">
              <Receipt size={24} />
            </div>
          </div>
        </div>

        <div className="card bg-dark-800 border border-dark-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Approved</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                ${expenses.filter(e => e.status === 'approved')
                  .reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
              </h3>
            </div>
            <div className="p-3 rounded-lg bg-green-500/20 text-green-500">
              <Receipt size={24} />
            </div>
          </div>
        </div>

        <div className="card bg-dark-800 border border-dark-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Rejected</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                ${expenses.filter(e => e.status === 'rejected')
                  .reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
              </h3>
            </div>
            <div className="p-3 rounded-lg bg-red-500/20 text-red-500">
              <Receipt size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Receipt upload/scan section */}
      <div 
        className={`card bg-dark-800 border-2 ${dragActive ? 'border-primary-500 bg-primary-500/10' : 'border-dark-700'} p-8 transition-all duration-300`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="mb-4">
              <Receipt size={48} className={`${dragActive ? 'text-primary-400' : 'text-gray-600'}`} />
            </div>
            <h3 className="text-lg font-medium text-white mb-2 flex items-center justify-center">
              {scanning ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-500 mr-2"></span>
                  Scanning Document...
                </>
              ) : (
                'Upload or Scan Document'
              )}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Drag and drop your receipt or PDF here, or use the buttons below
            </p>
            <div className="flex space-x-4">
              <div>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="receipt-upload"
                  disabled={scanning}
                />
                <label
                  htmlFor="receipt-upload"
                  className="btn btn-secondary flex items-center space-x-2 cursor-pointer hover:bg-dark-600 transition-colors duration-300"
                >
                  <Upload size={16} className={scanning ? 'animate-bounce' : ''} />
                  <span>Browse Files</span>
                </label>
              </div>
              <button
                onClick={startCamera}
                className="btn btn-secondary flex items-center space-x-2"
                disabled={scanning}
              >
                <Camera size={16} />
                <span>Take Photo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-4 w-full max-w-2xl">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                <button
                  onClick={stopCamera}
                  className="btn btn-danger"
                >
                  Cancel
                </button>
                <button
                  onClick={capturePhoto}
                  className="btn btn-primary"
                >
                  Take Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expenses list */}
      <div className="card bg-dark-800 border border-dark-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-white">Recent Expenses</h2>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search expenses..."
              className="input w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-secondary flex items-center space-x-2">
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Merchant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-dark-700/50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap group">
                    <div className="text-sm font-medium text-white">{expense.merchant}</div>
                    <div className="text-sm text-gray-400">{expense.description}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                    {expense.category}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                    ${expense.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      expense.status === 'approved' ? 'bg-green-900/30 text-green-400' :
                      expense.status === 'rejected' ? 'bg-red-900/30 text-red-400' :
                      'bg-yellow-900/30 text-yellow-400'
                    }`}>
                      {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="text-gray-400 hover:text-white transition-colors duration-200">
                        <Eye size={16} />
                      </button>
                      <button className="text-gray-400 hover:text-white transition-colors duration-200">
                        <Edit size={16} />
                      </button>
                      <button className="text-gray-400 hover:text-red-500 transition-colors duration-200">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {expenses.length === 0 && (
            <div className="text-center py-12">
              <Receipt size={48} className="text-gray-600 mb-4 mx-auto" />
              <p className="text-gray-400 text-lg mb-2">No expenses found</p>
              <p className="text-gray-500 text-sm">Upload a receipt or add an expense manually to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Expenses;