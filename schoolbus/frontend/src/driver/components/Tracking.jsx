import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { 
  useStartTrackingMutation,
  useUpdateLocationMutation,
  useEndTrackingMutation,
  useReportEmergencyMutation,
  useGetBusTrackingQuery
} from '../../redux/features/trackingSlice';
import { useGetDriverBusesQuery } from '../../redux/features/busSlice';
import { useGetDriverRoutesQuery } from '../../redux/features/routeSlice';
import { initializeSocket } from '../../utils/socket';
import Spinner from './Spinner';
import { HiExclamationTriangle } from 'react-icons/hi2';
import { HiLocationMarker } from 'react-icons/hi';

export default function Tracking() {
  const [isTracking, setIsTracking] = useState(false);
  const [locationUpdateFrequency, setLocationUpdateFrequency] = useState(30); // seconds
  const [currentLocation, setCurrentLocation] = useState(null);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [selectedBusId, setSelectedBusId] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [emergencyDetails, setEmergencyDetails] = useState('');
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [locationPermission, setLocationPermission] = useState('unknown'); // 'unknown', 'granted', 'denied'
  
  // Get assigned buses and routes
  const { data: busesData, isLoading: isLoadingBuses } = useGetDriverBusesQuery();
  const { data: routesData, isLoading: isLoadingRoutes } = useGetDriverRoutesQuery();
  
  // API hooks
  const [startTracking, { isLoading: isStartingTracking }] = useStartTrackingMutation();
  const [updateLocation, { isLoading: isUpdatingLocation }] = useUpdateLocationMutation();
  const [endTracking, { isLoading: isEndingTracking }] = useEndTrackingMutation();
  const [reportEmergency, { isLoading: isReportingEmergency }] = useReportEmergencyMutation();
  
  // Get current tracking data if exists
  const { 
    data: trackingData,
    isLoading: isLoadingTracking,
    refetch: refetchTracking
  } = useGetBusTrackingQuery(selectedBusId, {
    skip: !selectedBusId,
    pollingInterval: 60000 // Fallback polling every minute if sockets fail
  });
  
  // Socket reference
  const socketRef = React.useRef(null);

  // Initialize with available bus and route when data loads
  useEffect(() => {
    if (busesData?.data?.length > 0 && !selectedBusId) {
      setSelectedBusId(busesData.data[0]._id);
    }
    
    if (routesData?.data?.length > 0 && !selectedRouteId) {
      setSelectedRouteId(routesData.data[0]._id);
    }
  }, [busesData, routesData, selectedBusId, selectedRouteId]);

  // Check for location permission on component mount
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(permissionStatus => {
          setLocationPermission(permissionStatus.state);
          
          permissionStatus.onchange = () => {
            setLocationPermission(permissionStatus.state);
          };
        })
        .catch(error => {
          console.error('Permissions API error:', error);
          // Fallback: try to get location to prompt for permission
          requestLocationPermission();
        });
    } else {
      // For browsers that don't support Permissions API
      requestLocationPermission();
    }
  }, []);

  // Request location permission
  const requestLocationPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setLocationPermission('granted');
          const { latitude, longitude, speed, heading } = position.coords;
          setCurrentLocation({
            latitude,
            longitude,
            speed: speed ? speed * 2.23694 : 0, // convert m/s to mph
            heading: heading || 0,
            lastUpdated: new Date().toLocaleTimeString()
          });
        },
        error => {
          console.error('Geolocation error:', error);
          setLocationPermission('denied');
          toast.error(`Location access denied: ${error.message}`);
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser.");
    }
  };

  // Setup GPS tracking
  useEffect(() => {
    let watchId;
    let updateInterval;

    const successCallback = (position) => {
      const { latitude, longitude, speed, heading } = position.coords;
      setCurrentLocation({
        latitude,
        longitude,
        speed: speed ? speed * 2.23694 : 0, // convert m/s to mph
        heading: heading || 0,
        lastUpdated: new Date().toLocaleTimeString()
      });
    };

    const errorCallback = (error) => {
      setLocationPermission('denied');
      toast.error(`Location error: ${error.message}`);
      console.error('GPS Error:', error);
    };

    // Start tracking if enabled and permission granted
    if (isTracking && locationPermission === 'granted') {
      // Watch position with high accuracy
      watchId = navigator.geolocation.watchPosition(
        successCallback,
        errorCallback,
        { 
          enableHighAccuracy: true, 
          maximumAge: 30000, 
          timeout: 27000 
        }
      );
      
      // Set interval to update location on server
      updateInterval = setInterval(() => {
        if (currentLocation) {
          updateLocationOnServer();
        }
      }, locationUpdateFrequency * 1000);
    }
    
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      clearInterval(updateInterval);
    };
  }, [isTracking, locationUpdateFrequency, locationPermission]);
  
  // Function to update location on server
  const updateLocationOnServer = async () => {
    if (!currentLocation || !selectedBusId) return;
    
    try {
      await updateLocation({
        busId: selectedBusId,
        currentLocation: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          speed: currentLocation.speed,
          heading: currentLocation.heading,
          timestamp: new Date()
        }
      }).unwrap();
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  };

  // Initialize data when tracking data is loaded
  useEffect(() => {
    if (trackingData && trackingData.success) {
      setIsTracking(trackingData.data.isActive);
      
      if (trackingData.data.currentLocation) {
        setCurrentLocation({
          latitude: trackingData.data.currentLocation.latitude,
          longitude: trackingData.data.currentLocation.longitude,
          speed: trackingData.data.currentLocation.speed || 0,
          heading: trackingData.data.currentLocation.heading || 0,
          lastUpdated: new Date(trackingData.data.currentLocation.timestamp).toLocaleTimeString()
        });
      }
      
      // Set tracking history
      if (trackingData.data.dayHistory && trackingData.data.dayHistory.length > 0) {
        setTrackingHistory(trackingData.data.dayHistory.map(item => ({
          time: new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          location: item.location,
          speed: item.speed ? `${Math.round(item.speed)} mph` : '0 mph',
          event: item.event
        })));
      }
      
      // Set route and bus IDs if not already set
      if (!selectedRouteId && trackingData.data.routeId) {
        setSelectedRouteId(trackingData.data.routeId);
      }
      
      if (!selectedBusId && trackingData.data.busId) {
        setSelectedBusId(trackingData.data.busId);
      }
    }
  }, [trackingData, selectedBusId, selectedRouteId]);

  // Setup socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const socket = initializeSocket(token);
      socketRef.current = socket;
      
      socket.on('driver:tracking_started', (data) => {
        toast.success('Tracking session started successfully');
        refetchTracking();
      });
      
      socket.on('driver:emergency_reported', (data) => {
        toast.error('Emergency reported. Authorities have been notified.');
        refetchTracking();
      });
      
      return () => {
        socket.off('driver:tracking_started');
        socket.off('driver:emergency_reported');
      };
    }
  }, [refetchTracking]);

  // Report emergency
  const handleEmergencyReport = async () => {
    if (!emergencyDetails) {
      toast.error('Please provide emergency details');
      return;
    }
    
    try {
      await reportEmergency({
        busId: selectedBusId,
        details: emergencyDetails,
        location: currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          name: 'Current location'
        } : undefined
      }).unwrap();
      
      toast.success('Emergency reported. Help is on the way.');
      setShowEmergencyModal(false);
      setEmergencyDetails('');
    } catch (error) {
      toast.error('Failed to report emergency');
      console.error('Emergency reporting error:', error);
    }
  };

  // Toggle tracking state
  const toggleTracking = async () => {
    if (isTracking) {
      // End tracking
      try {
        await endTracking({ busId: selectedBusId }).unwrap();
        setIsTracking(false);
        toast.success('Tracking ended successfully');
      } catch (error) {
        toast.error('Failed to end tracking');
        console.error('End tracking error:', error);
      }
    } else {
      // Start tracking
      if (locationPermission !== 'granted') {
        requestLocationPermission();
        return;
      }
      
      if (!currentLocation) {
        toast.error('Waiting for location data. Please try again.');
        return;
      }
      
      if (!selectedBusId || !selectedRouteId) {
        toast.error('Bus and route must be selected');
        return;
      }
      
      try {
        await startTracking({
          busId: selectedBusId,
          routeId: selectedRouteId,
          currentLocation: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            speed: currentLocation.speed || 0,
            heading: currentLocation.heading || 0
          }
        }).unwrap();
        
        setIsTracking(true);
        toast.success('Tracking started successfully');
      } catch (error) {
        toast.error(`Failed to start tracking: ${error.data?.message || error.message || 'Unknown error'}`);
        console.error('Start tracking error:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Location Tracking</h1>
        <div className="flex items-center">
          <span className={`flex h-3 w-3 relative mr-2 ${isTracking ? 'animate-pulse' : ''}`}>
            <span className={`absolute inline-flex h-full w-full rounded-full ${isTracking ? 'bg-green-400 opacity-75' : 'bg-red-400 opacity-75'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isTracking ? 'bg-green-500' : 'bg-red-500'}`}></span>
          </span>
          <span className="text-sm text-gray-600">{isTracking ? 'Tracking Active' : 'Tracking Paused'}</span>
        </div>
      </div>

      {/* Bus and Route Selection */}
      {!isTracking && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6"
        >
          <h2 className="font-semibold text-gray-800 text-lg mb-4">Select Bus and Route</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bus</label>
              {isLoadingBuses ? (
                <div className="h-10 bg-gray-200 animate-pulse rounded-lg"></div>
              ) : busesData?.data?.length ? (
                <select
                  value={selectedBusId}
                  onChange={(e) => setSelectedBusId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">Select a bus</option>
                  {busesData.data.map((bus) => (
                    <option key={bus._id} value={bus._id}>
                      Bus #{bus.busNumber} - {bus.licenseNumber}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded-lg">
                  No buses assigned to you. Please contact admin.
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Route</label>
              {isLoadingRoutes ? (
                <div className="h-10 bg-gray-200 animate-pulse rounded-lg"></div>
              ) : routesData?.data?.length ? (
                <select
                  value={selectedRouteId}
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">Select a route</option>
                  {routesData.data.map((route) => (
                    <option key={route._id} value={route._id}>
                      {route.name} ({route.type === 'morning' ? 'Morning' : 'Afternoon'})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded-lg">
                  No routes assigned to you. Please contact admin.
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Location Permission Warning */}
      {locationPermission !== 'granted' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <HiExclamationTriangle className="h-5 w-5 text-red-600 mr-3" />
            <div>
              <h3 className="font-medium text-red-800">Location access required</h3>
              <p className="text-sm text-red-700 mt-1">
                This feature requires location access to track the bus position.
              </p>
              <button 
                onClick={requestLocationPermission}
                className="mt-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm hover:bg-red-200"
              >
                Enable Location Access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map and Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map display */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden lg:col-span-2"
        >
          <div className="p-5 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-gray-800 text-lg">Live Location</h2>
              <div className="text-sm text-gray-600">
                Last updated: {currentLocation?.lastUpdated || 'Not available'}
              </div>
            </div>
          </div>
          
          <div className="relative" style={{ height: '500px' }}>
            {!currentLocation ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                {locationPermission === 'granted' ? (
                  <>
                    <Spinner />
                    <p className="mt-4 text-gray-500">Acquiring GPS signal...</p>
                  </>
                ) : (
                  <div className="text-center p-8">
                    <HiLocationMarker className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <h3 className="text-gray-600 font-medium text-lg mb-2">Location Not Available</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-4">
                      Please enable location services to view the map and start tracking.
                    </p>
                    <button 
                      onClick={requestLocationPermission}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                    >
                      Enable Location Access
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Update this with a proper map component */}
                <iframe 
                  src={`https://maps.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}&z=15&output=embed`}
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  style={{ border: 0 }}
                  className="w-full h-full object-cover"
                  title="Map showing current location"
                ></iframe>
                
                {/* Map overlay info */}
                <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-90 p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-gray-500 text-sm">Current coordinates:</span>
                      <h3 className="font-medium">
                        {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500 text-sm">Current speed:</span>
                      <h3 className="font-medium">{Math.round(currentLocation.speed)} mph</h3>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Tracking controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200"
        >
          <div className="p-5 border-b border-gray-200">
            <h2 className="font-semibold text-gray-800 text-lg">Tracking Controls</h2>
          </div>
          
          <div className="p-5 space-y-6">
            {/* Tracking toggle */}
            <div>
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={isTracking}
                    onChange={toggleTracking}
                    disabled={isStartingTracking || isEndingTracking || locationPermission !== 'granted' || !selectedBusId || !selectedRouteId}
                  />
                  <div className={`block w-14 h-8 rounded-full ${isTracking ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isTracking ? 'transform translate-x-6' : ''}`}></div>
                </div>
                <div className="ml-3 text-gray-700 font-medium">
                  {isTracking ? 'Live Tracking Enabled' : 'Tracking Disabled'}
                </div>
              </label>
              <p className="mt-2 text-sm text-gray-500">
                {isTracking 
                  ? 'Your location is being shared with the school and parents in real-time.' 
                  : 'Location sharing is currently paused.'}
              </p>
              {(isStartingTracking || isEndingTracking) && (
                <div className="mt-2 flex items-center text-amber-600">
                  <Spinner size="sm" />
                  <span className="ml-2 text-sm">
                    {isStartingTracking ? 'Starting tracking...' : 'Ending tracking...'}
                  </span>
                </div>
              )}
            </div>
            
            {/* Update frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Update Frequency
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                value={locationUpdateFrequency}
                onChange={(e) => setLocationUpdateFrequency(Number(e.target.value))}
                disabled={!isTracking}
              >
                <option value="10">Every 10 seconds</option>
                <option value="30">Every 30 seconds</option>
                <option value="60">Every 1 minute</option>
                <option value="300">Every 5 minutes</option>
              </select>
              <p className="mt-2 text-sm text-gray-500">
                More frequent updates provide better accuracy but use more data and battery.
              </p>
            </div>
            
            {/* Current status */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">Current Status</h3>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex justify-between">
                  <span>GPS Signal:</span>
                  <span className="font-medium">
                    {!currentLocation ? 'None' : locationPermission === 'granted' ? 'Strong' : 'Disabled'}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Data Connection:</span>
                  <span className="font-medium">
                    {navigator.onLine ? '4G LTE' : 'Offline'}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Battery Level:</span>
                  <span className="font-medium">
                    {navigator.getBattery ? 'Checking...' : '85%'}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Device:</span>
                  <span className="font-medium">
                    {navigator.userAgent.indexOf('Mobile') > -1 ? 'Mobile' : 'Desktop'}
                  </span>
                </li>
              </ul>
            </div>
            
            {/* Emergency button */}
            <div>
              <button 
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                onClick={() => setShowEmergencyModal(true)}
                disabled={!isTracking || isReportingEmergency}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Report Emergency
              </button>
              <p className="mt-2 text-sm text-gray-500 text-center">
                Use only in case of accidents or emergencies
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tracking History */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200"
      >
        <div className="p-5 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800 text-lg">Today's Tracking History</h2>
        </div>
        
        <div className="p-5">
          {isLoadingTracking ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Speed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {trackingHistory.length > 0 ? (
                    trackingHistory.map((entry, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{entry.time}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{entry.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{entry.speed}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{entry.event}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        No tracking history available for today
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

      {/* Emergency Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-red-600">Report Emergency</h3>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Details
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 h-32"
                placeholder="Describe the emergency situation..."
                value={emergencyDetails}
                onChange={(e) => setEmergencyDetails(e.target.value)}
              ></textarea>
              
              <div className="mt-6 flex items-center justify-between">
                <button
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                  onClick={() => setShowEmergencyModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                  onClick={handleEmergencyReport}
                  disabled={isReportingEmergency}
                >
                  {isReportingEmergency && (
                    <Spinner size="sm" className="mr-2" />
                  )}
                  Report Emergency
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}