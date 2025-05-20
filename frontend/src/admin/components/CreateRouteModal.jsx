import React, { useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { useCreateRouteMutation } from '../../redux/features/routeSlice';
import { useGetAllBusesQuery } from '../../redux/features/busSlice';
import Spinner from './Spinner';
import { HiX } from 'react-icons/hi';

export default function CreateRouteModal({ onClose }) {
  const [createRoute, { isLoading }] = useCreateRouteMutation();
  const { data: busesData, isLoading: busesLoading, error: busesError } = useGetAllBusesQuery();

  const [formData, setFormData] = useState({
    name: '',
    routeNumber: '',
    type: 'morning',
    school: '',
    description: '',
    stops: [{
      name: '',
      address: '',
      arrivalTime: '',
      departureTime: '',
      sequence: 1,
      coordinates: { latitude: 0, longitude: 0 }
    }]
  });

  const [errors, setErrors] = useState({});
  const [selectedBuses, setSelectedBuses] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleStopChange = (index, field, value) => {
    const newStops = [...formData.stops];

    if (field === 'latitude' || field === 'longitude') {
      newStops[index].coordinates[field] = value;
    } else {
      newStops[index][field] = value;
    }

    setFormData(prev => ({ ...prev, stops: newStops }));
  };

  const addStop = () => {
    const newStops = [...formData.stops];
    newStops.push({
      name: '',
      address: '',
      arrivalTime: '',
      departureTime: '',
      sequence: newStops.length + 1,
      coordinates: { latitude: 0, longitude: 0 }
    });
    setFormData(prev => ({ ...prev, stops: newStops }));
  };

  const removeStop = (index) => {
    if (formData.stops.length === 1) {
      toast.error("Route must have at least one stop");
      return;
    }

    const newStops = formData.stops.filter((_, i) => i !== index);
    // Update sequences
    newStops.forEach((stop, i) => {
      stop.sequence = i + 1;
    });

    setFormData(prev => ({ ...prev, stops: newStops }));
  };

  const handleBusSelect = (busId) => {
    if (!selectedBuses.includes(busId)) {
      setSelectedBuses([...selectedBuses, busId]);
    }
  };

  const handleRemoveBus = (busId) => {
    setSelectedBuses(selectedBuses.filter(id => id !== busId));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Route name is required';
    if (!formData.routeNumber.trim()) newErrors.routeNumber = 'Route number is required';
    if (!formData.school.trim()) newErrors.school = 'School name is required';

    // Check the selectedBuses array instead
    if (selectedBuses.length === 0) {
      newErrors.buses = 'At least one bus must be assigned to the route';
    }

    // Validate stops
    const stopErrors = formData.stops.map(stop => {
      const errors = {};
      if (!stop.name.trim()) errors.name = 'Stop name is required';
      if (!stop.address.trim()) errors.address = 'Address is required';
      if (!stop.arrivalTime) errors.arrivalTime = 'Arrival time is required';
      if (!stop.departureTime) errors.departureTime = 'Departure time is required';

      return Object.keys(errors).length > 0 ? errors : null;
    });

    if (stopErrors.some(error => error !== null)) {
      newErrors.stops = stopErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      await createRoute({
        ...formData,
        buses: selectedBuses, // This is the only buses field we need
        startDate: new Date(),
        isActive: true
      }).unwrap();

      toast.success('Route created successfully');
      onClose();
    } catch (error) {
      console.error('Create route error:', error);
      toast.error(error.data?.message || 'Failed to create route');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-xl"
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Route</h3>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                  }`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route Number</label>
              <input
                type="text"
                name="routeNumber"
                value={formData.routeNumber}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.routeNumber ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                  }`}
              />
              {errors.routeNumber && <p className="text-red-500 text-xs mt-1">{errors.routeNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="special">Special</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
              <input
                type="text"
                name="school"
                value={formData.school}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.school ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                  }`}
              />
              {errors.school && <p className="text-red-500 text-xs mt-1">{errors.school}</p>}
            </div>

            {/* Bus selection section */}
            <div className="mb-6 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buses <span className="text-red-500">*</span>
              </label>
              {busesLoading ? (
                <div className="p-2 flex justify-center">
                  <Spinner size="small" />
                </div>
              ) : busesError ? (
                <div className="p-2 text-center text-red-500 text-sm">
                  Failed to load buses. Please try again.
                </div>
              ) : (
                <select
                  onChange={(e) => handleBusSelect(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.buses ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                    }`}
                  defaultValue=""
                >
                  <option value="">-- Select buses to assign --</option>
                  {busesData?.data?.map(bus => (
                    <option key={bus._id} value={bus._id}>
                      {bus.busNumber} - {bus.make} {bus.model} ({bus.capacity} seats)
                    </option>
                  ))}
                </select>
              )}
              {errors.buses && <p className="text-red-500 text-xs mt-1">{errors.buses}</p>}

              {selectedBuses.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700">Selected Buses:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedBuses.map(busId => {
                      const bus = busesData?.data?.find(b => b._id === busId);
                      return (
                        <div key={busId} className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                          <span>{bus?.busNumber || busId}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBus(busId)}
                            className="ml-2 text-blue-500 hover:text-blue-700"
                          >
                            <HiX className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          {/* Stops Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-md font-medium text-gray-800">Route Stops</h4>
              <button
                type="button"
                onClick={addStop}
                className="px-3 py-1.5 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 text-sm font-medium"
              >
                + Add Stop
              </button>
            </div>

            <div className="space-y-4">
              {formData.stops.map((stop, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-medium">Stop #{stop.sequence}</h5>
                    <button
                      type="button"
                      onClick={() => removeStop(index)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Stop Name</label>
                      <input
                        type="text"
                        value={stop.name}
                        onChange={(e) => handleStopChange(index, 'name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.stops && errors.stops[index]?.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                          }`}
                      />
                      {errors.stops && errors.stops[index]?.name && <p className="text-red-500 text-xs mt-1">{errors.stops[index].name}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        value={stop.address}
                        onChange={(e) => handleStopChange(index, 'address', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.stops && errors.stops[index]?.address ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                          }`}
                      />
                      {errors.stops && errors.stops[index]?.address && <p className="text-red-500 text-xs mt-1">{errors.stops[index].address}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Arrival Time</label>
                      <input
                        type="time"
                        value={stop.arrivalTime}
                        onChange={(e) => handleStopChange(index, 'arrivalTime', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.stops && errors.stops[index]?.arrivalTime ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                          }`}
                      />
                      {errors.stops && errors.stops[index]?.arrivalTime && <p className="text-red-500 text-xs mt-1">{errors.stops[index].arrivalTime}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Departure Time</label>
                      <input
                        type="time"
                        value={stop.departureTime}
                        onChange={(e) => handleStopChange(index, 'departureTime', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.stops && errors.stops[index]?.departureTime ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
                          }`}
                      />
                      {errors.stops && errors.stops[index]?.departureTime && <p className="text-red-500 text-xs mt-1">{errors.stops[index].departureTime}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Latitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={stop.coordinates.latitude}
                        onChange={(e) => handleStopChange(index, 'latitude', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Longitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={stop.coordinates.longitude}
                        onChange={(e) => handleStopChange(index, 'longitude', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading || busesLoading}
            >
              {isLoading ? 'Creating...' : 'Create Route'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}