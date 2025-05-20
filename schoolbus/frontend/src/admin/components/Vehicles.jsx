import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { HiSearch, HiPlusCircle, HiPencil, HiTrash, HiRefresh, HiChevronDown, HiChevronRight } from 'react-icons/hi';
import { toast } from 'react-hot-toast';
import { useGetAllBusesQuery, useCreateBusMutation, useUpdateBusMutation, useDeleteBusMutation } from '../../redux/features/busSlice';
import Spinner from './Spinner';

export default function Vehicles() {
  // RTK Query hooks
  const { data: busesData, isLoading, error, refetch } = useGetAllBusesQuery();
  const [createBus, { isLoading: isCreating }] = useCreateBusMutation();
  const [updateBus, { isLoading: isUpdating }] = useUpdateBusMutation();
  const [deleteBus, { isLoading: isDeleting }] = useDeleteBusMutation();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expandedBus, setExpandedBus] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [formData, setFormData] = useState({
    busNumber: '',
    licensePlate: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    capacity: 30,
    status: 'active',
    fuelType: 'diesel',
    fuelCapacity: 100,
    currentFuelLevel: 100,
    features: [],
    gpsDevice: {
      deviceId: '',
      isActive: true
    }
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!showAddModal && !showEditModal) {
      resetForm();
    }
  }, [showAddModal, showEditModal]);

  // Handle API errors
  useEffect(() => {
    if (error) {
      toast.error(error.data?.message || 'Failed to load vehicles');
    }
  }, [error]);

  // Filter buses
  const filteredBuses = busesData?.data ? busesData.data.filter(bus => {
    const matchesSearch = 
      bus.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
      bus.make.toLowerCase().includes(searchTerm.toLowerCase()) || 
      bus.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || bus.status === filterStatus;
    return matchesSearch && matchesStatus;
  }) : [];

  // Form reset
  const resetForm = () => {
    setFormData({
      busNumber: '',
      licensePlate: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      capacity: 30,
      status: 'active',
      fuelType: 'diesel',
      fuelCapacity: 100,
      currentFuelLevel: 100,
      features: [],
      gpsDevice: {
        deviceId: '',
        isActive: true
      }
    });
  };

  // Form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle number inputs
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value, 10)
    }));
  };

  // Handle feature inputs
  const handleFeatureChange = (e) => {
    const value = e.target.value;
    const isChecked = e.target.checked;
    
    setFormData(prev => ({
      ...prev,
      features: isChecked 
        ? [...prev.features, value] 
        : prev.features.filter(feature => feature !== value)
    }));
  };

  // Form submit for creating new bus
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await createBus(formData).unwrap();
      toast.success('Vehicle added successfully');
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Create bus error:', error);
      toast.error(error.data?.message || 'Failed to add vehicle');
    }
  };

  // Form submit for updating bus
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      await updateBus({
        id: selectedBus._id,
        busData: formData
      }).unwrap();
      toast.success('Vehicle updated successfully');
      setShowEditModal(false);
      setSelectedBus(null);
      resetForm();
    } catch (error) {
      console.error('Update bus error:', error);
      toast.error(error.data?.message || 'Failed to update vehicle');
    }
  };

  // Delete bus
  const handleDeleteBus = async (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      try {
        await deleteBus(id).unwrap();
        toast.success('Vehicle deleted successfully');
      } catch (error) {
        console.error('Delete bus error:', error);
        toast.error(error.data?.message || 'Failed to delete vehicle');
      }
    }
  };

  // Toggle expanded view
  const handleBusExpand = (busId) => {
    setExpandedBus(expandedBus === busId ? null : busId);
  };

  // Open edit modal
  const handleEditBus = (bus) => {
    setSelectedBus(bus);
    setFormData({
      busNumber: bus.busNumber,
      licensePlate: bus.licensePlate,
      make: bus.make,
      model: bus.model,
      year: bus.year,
      capacity: bus.capacity,
      status: bus.status,
      fuelType: bus.fuelType,
      fuelCapacity: bus.fuelCapacity || 100,
      currentFuelLevel: bus.currentFuelLevel || 100,
      features: bus.features || [],
      gpsDevice: {
        deviceId: bus.gpsDevice?.deviceId || '',
        isActive: bus.gpsDevice?.isActive !== undefined ? bus.gpsDevice.isActive : true
      }
    });
    setShowEditModal(true);
  };

  // Get status badge color
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Vehicle Management</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <HiPlusCircle className="-ml-1 mr-2 h-5 w-5" />
          Add New Vehicle
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex space-x-2">
            <button 
              onClick={() => setFilterStatus('all')} 
              className={`px-4 py-2 rounded ${filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All Vehicles
            </button>
            <button 
              onClick={() => setFilterStatus('active')} 
              className={`px-4 py-2 rounded ${filterStatus === 'active' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Active
            </button>
            <button 
              onClick={() => setFilterStatus('maintenance')} 
              className={`px-4 py-2 rounded ${filterStatus === 'maintenance' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Maintenance
            </button>
            <button 
              onClick={() => setFilterStatus('inactive')} 
              className={`px-4 py-2 rounded ${filterStatus === 'inactive' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Inactive
            </button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search vehicles..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Vehicles List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              Vehicles
              <span className="ml-2 text-sm font-normal text-gray-500">
                {busesData ? `(${filteredBuses.length} vehicles)` : ''}
              </span>
            </h2>
            <button 
              onClick={() => refetch()} 
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <HiRefresh className="mr-1 h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Spinner />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">
            Failed to load vehicles. Please try refreshing the page.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bus Details
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Specifications
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBuses.length > 0 ? (
                  filteredBuses.map((bus) => (
                    <React.Fragment key={bus._id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center cursor-pointer" onClick={() => handleBusExpand(bus._id)}>
                            {expandedBus === bus._id ? (
                              <HiChevronDown className="h-5 w-5 text-gray-400 mr-2" />
                            ) : (
                              <HiChevronRight className="h-5 w-5 text-gray-400 mr-2" />
                            )}
                            <div>
                              <div className="font-medium text-gray-900">Bus #{bus.busNumber}</div>
                              <div className="text-sm text-gray-500">License: {bus.licensePlate}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{bus.make} {bus.model}</div>
                          <div className="text-sm text-gray-500">Year: {bus.year}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{bus.capacity} seats</div>
                          <div className="text-sm text-gray-500">{bus.fuelType || 'Diesel'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(bus.status)}`}>
                            {bus.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEditBus(bus)}
                              className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                              disabled={isUpdating}
                            >
                              <HiPencil className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteBus(bus._id)}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              disabled={isDeleting}
                            >
                              <HiTrash className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedBus === bus._id && (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 bg-gray-50">
                            <div className="text-sm text-gray-500">
                              <h3 className="font-medium text-gray-700 mb-2">Vehicle Details</h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <p className="font-medium">Specifications:</p>
                                  <ul className="mt-1 space-y-1">
                                    <li><span className="text-gray-600">Make:</span> {bus.make}</li>
                                    <li><span className="text-gray-600">Model:</span> {bus.model}</li>
                                    <li><span className="text-gray-600">Year:</span> {bus.year}</li>
                                    <li><span className="text-gray-600">License:</span> {bus.licensePlate}</li>
                                  </ul>
                                </div>
                                <div>
                                  <p className="font-medium">Fuel & Capacity:</p>
                                  <ul className="mt-1 space-y-1">
                                    <li><span className="text-gray-600">Fuel Type:</span> {bus.fuelType || 'Diesel'}</li>
                                    <li><span className="text-gray-600">Capacity:</span> {bus.capacity} seats</li>
                                    <li><span className="text-gray-600">Fuel Level:</span> {bus.currentFuelLevel || 'N/A'}</li>
                                    <li><span className="text-gray-600">GPS Active:</span> {bus.gpsDevice?.isActive ? 'Yes' : 'No'}</li>
                                  </ul>
                                </div>
                                <div>
                                  <p className="font-medium">Maintenance:</p>
                                  <ul className="mt-1 space-y-1">
                                    <li><span className="text-gray-600">Last Maintenance:</span> {bus.lastMaintenance ? new Date(bus.lastMaintenance).toLocaleDateString() : 'Not recorded'}</li>
                                    <li><span className="text-gray-600">Next Maintenance:</span> {bus.nextMaintenance ? new Date(bus.nextMaintenance).toLocaleDateString() : 'Not scheduled'}</li>
                                    <li><span className="text-gray-600">Features:</span> {bus.features?.join(', ') || 'No features listed'}</li>
                                    <li><span className="text-gray-600">Status:</span> {bus.status}</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No vehicles found matching your search
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-xl"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Vehicle</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Basic information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bus Number</label>
                  <input
                    type="text"
                    name="busNumber"
                    value={formData.busNumber}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Plate</label>
                  <input
                    type="text"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                  <input
                    type="text"
                    name="make"
                    value={formData.make}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="number"
                    name="year"
                    min="2000"
                    max="2030"
                    value={formData.year}
                    onChange={handleNumberChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (seats)</label>
                  <input
                    type="number"
                    name="capacity"
                    min="1"
                    max="100"
                    value={formData.capacity}
                    onChange={handleNumberChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Under Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                  <select
                    name="fuelType"
                    value={formData.fuelType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="diesel">Diesel</option>
                    <option value="gasoline">Gasoline</option>
                    <option value="electric">Electric</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GPS Device ID</label>
                  <input
                    type="text"
                    name="gpsDevice.deviceId"
                    value={formData.gpsDevice.deviceId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    id="gpsActive"
                    name="gpsDevice.isActive"
                    checked={formData.gpsDevice.isActive}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        gpsDevice: {
                          ...prev.gpsDevice,
                          isActive: e.target.checked
                        }
                      }));
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="gpsActive" className="ml-2 block text-sm text-gray-700">
                    GPS Device Active
                  </label>
                </div>
              </div>

              {/* Features section */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-800 mb-2">Bus Features</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['Air Conditioning', 'Security Camera', 'WiFi', 'Seat Belts', 'GPS Tracking', 'First Aid Kit'].map(feature => (
                    <div key={feature} className="flex items-center">
                      <input
                        type="checkbox"
                        id={feature.replace(/\s+/g, '-').toLowerCase()}
                        value={feature}
                        checked={formData.features.includes(feature)}
                        onChange={handleFeatureChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={feature.replace(/\s+/g, '-').toLowerCase()} className="ml-2 block text-sm text-gray-700">
                        {feature}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isCreating}
                >
                  {isCreating ? 'Adding...' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {showEditModal && selectedBus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-xl"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Vehicle</h3>
            
            <form onSubmit={handleUpdate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Basic information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bus Number</label>
                  <input
                    type="text"
                    name="busNumber"
                    value={formData.busNumber}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Plate</label>
                  <input
                    type="text"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                  <input
                    type="text"
                    name="make"
                    value={formData.make}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="number"
                    name="year"
                    min="2000"
                    max="2030"
                    value={formData.year}
                    onChange={handleNumberChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (seats)</label>
                  <input
                    type="number"
                    name="capacity"
                    min="1"
                    max="100"
                    value={formData.capacity}
                    onChange={handleNumberChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Under Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                  <select
                    name="fuelType"
                    value={formData.fuelType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="diesel">Diesel</option>
                    <option value="gasoline">Gasoline</option>
                    <option value="electric">Electric</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GPS Device ID</label>
                  <input
                    type="text"
                    name="gpsDevice.deviceId"
                    value={formData.gpsDevice.deviceId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    id="gpsActiveEdit"
                    name="gpsDevice.isActive"
                    checked={formData.gpsDevice.isActive}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        gpsDevice: {
                          ...prev.gpsDevice,
                          isActive: e.target.checked
                        }
                      }));
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="gpsActiveEdit" className="ml-2 block text-sm text-gray-700">
                    GPS Device Active
                  </label>
                </div>

                {/* Maintenance dates */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Maintenance</label>
                  <input
                    type="date"
                    name="lastMaintenance"
                    value={formData.lastMaintenance ? new Date(formData.lastMaintenance).toISOString().split('T')[0] : ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Next Scheduled Maintenance</label>
                  <input
                    type="date"
                    name="nextMaintenance"
                    value={formData.nextMaintenance ? new Date(formData.nextMaintenance).toISOString().split('T')[0] : ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              {/* Features section */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-800 mb-2">Bus Features</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['Air Conditioning', 'Security Camera', 'WiFi', 'Seat Belts', 'GPS Tracking', 'First Aid Kit'].map(feature => (
                    <div key={feature} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`edit-${feature.replace(/\s+/g, '-').toLowerCase()}`}
                        value={feature}
                        checked={formData.features.includes(feature)}
                        onChange={handleFeatureChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`edit-${feature.replace(/\s+/g, '-').toLowerCase()}`} className="ml-2 block text-sm text-gray-700">
                        {feature}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedBus(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Update Vehicle'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}