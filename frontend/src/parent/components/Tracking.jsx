import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { useGetChildrenQuery } from '../../redux/features/childSlice';
import { useGetChildBusTrackingQuery } from '../../redux/features/trackingSlice';
import { initializeSocket, joinChildTracking } from '../../utils/socket';
import { HiBell, HiClock, HiExclamationTriangle, HiPhone } from 'react-icons/hi2';
import { HiMail } from 'react-icons/hi';

export default function Tracking() {
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busLocation, setBusLocation] = useState(null);
  const [travelHistory, setTravelHistory] = useState([]);
  
  // Fetch children from API
  const { data: childrenData, isLoading: isLoadingChildren } = useGetChildrenQuery();
  
  // Get selected child's bus tracking data
  const { 
    data: trackingData, 
    isLoading: isLoadingTracking,
    refetch: refetchTracking
  } = useGetChildBusTrackingQuery(selectedChildId, {
    skip: !selectedChildId,
    pollingInterval: 30000 // Fallback polling every 30 seconds if websockets fail
  });
  
  // Setup socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const socket = initializeSocket(token);
      
      // Listen for bus location updates
      socket.on('bus:location_update', (data) => {
        if (data && data.currentLocation) {
          setBusLocation(prevState => ({
            ...prevState,
            ...data.currentLocation,
            nextStop: data.nextStop,
            lastUpdated: new Date().toLocaleTimeString(),
            status: data.status,
            delayMinutes: data.delayMinutes || 0
          }));
        }
      });
      
      // Listen for pickup events
      socket.on('parent:child_pickup', (data) => {
        toast.success(`${data.childName} has been picked up by the bus`);
        setTravelHistory(prev => [
          {
            time: new Date().toLocaleTimeString(),
            event: `Picked up from ${data.location}`,
            location: data.location,
            status: 'On time'
          },
          ...prev
        ]);
        refetchTracking();
      });
      
      // Listen for dropoff events
      socket.on('parent:child_dropoff', (data) => {
        toast.success(`${data.childName} has been dropped off at ${data.location}`);
        setTravelHistory(prev => [
          {
            time: new Date().toLocaleTimeString(),
            event: `Dropped off at ${data.location}`,
            location: data.location,
            status: data.delayMinutes > 0 ? `${data.delayMinutes} min late` : 'On time'
          },
          ...prev
        ]);
        refetchTracking();
      });
      
      // Listen for emergency alerts
      socket.on('parent:emergency', (data) => {
        toast.error(`Emergency alert: ${data.details}`);
        refetchTracking();
      });
      
      return () => {
        socket.off('bus:location_update');
        socket.off('parent:child_pickup');
        socket.off('parent:child_dropoff');
        socket.off('parent:emergency');
      };
    }
  }, [refetchTracking]);
  
  // Join child's tracking room when selected child changes
  useEffect(() => {
    if (selectedChildId) {
      joinChildTracking(selectedChildId);
    }
  }, [selectedChildId]);
  
  // Initialize selected child when data loads
  useEffect(() => {
    if (childrenData?.data?.length > 0 && !selectedChildId) {
      setSelectedChildId(childrenData.data[0]._id);
    }
  }, [childrenData, selectedChildId]);
  
  // Update bus location and tracking info when tracking data changes
  useEffect(() => {
    if (trackingData) {
      setIsLoading(false);
      
      if (trackingData.data?.isActive === false) {
        // Handle case when bus is not actively tracking
        setBusLocation(null);
        setTravelHistory([]);
      } else if (trackingData.data?.currentLocation) {
        // Set bus location data
        setBusLocation({
          latitude: trackingData.data.currentLocation.latitude,
          longitude: trackingData.data.currentLocation.longitude,
          speed: `${Math.round(trackingData.data.currentLocation.speed)} mph`,
          lastUpdated: new Date(trackingData.data.currentLocation.timestamp).toLocaleTimeString(),
          nextStop: trackingData.data.nextStop?.name,
          distanceToStop: trackingData.data.nextStop?.distanceInMeters ? 
            `${(trackingData.data.nextStop.distanceInMeters / 1609.34).toFixed(1)} miles` : undefined,
          estimatedArrival: trackingData.data.nextStop?.estimatedArrival ? 
            new Date(trackingData.data.nextStop.estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
            'Unknown',
          status: trackingData.data.status || 'unknown',
          delayMinutes: trackingData.data.delayMinutes || 0
        });
        
        // Set travel history data
        if (trackingData.data.dayHistory && trackingData.data.dayHistory.length > 0) {
          setTravelHistory(trackingData.data.dayHistory.map(item => ({
            time: new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            event: item.event,
            location: item.location,
            status: item.event.includes('EMERGENCY') ? 'Emergency' : 'On time'
          })));
        }
      }
    }
  }, [trackingData]);
  
  // Format status for display
  const formatStatus = (status) => {
    switch(status) {
      case 'preparing': return 'Preparing';
      case 'en_route_to_school': return 'En Route to School';
      case 'at_school': return 'At School';
      case 'en_route_to_home': return 'En Route to Home';
      case 'completed': return 'Route Completed';
      case 'emergency': return 'Emergency';
      default: return 'Unknown';
    }
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'preparing': return 'bg-yellow-500';
      case 'en_route_to_school': return 'bg-blue-500';
      case 'at_school': return 'bg-green-500';
      case 'en_route_to_home': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      case 'emergency': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="space-y-6 md:pt-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Live Bus Tracking</h1>
        <div className="flex items-center">
          <span className="flex h-3 w-3 relative mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm text-gray-600">Live updates</span>
        </div>
      </div>
      
      {/* Child selector */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <label htmlFor="childSelect" className="block text-sm font-medium text-gray-700 mb-2">
          Select a child to track their bus:
        </label>
        {isLoadingChildren ? (
          <div className="animate-pulse h-10 bg-gray-200 rounded-md w-72"></div>
        ) : (
          <select
            id="childSelect"
            value={selectedChildId || ''}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="w-full md:w-72 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
          >
            {childrenData?.data?.map(child => (
              <option key={child._id} value={child._id}>
                {child.firstName} {child.lastName}
                {trackingData?.childInfo ? ` (${trackingData.childInfo.busNumber})` : ''}
              </option>
            ))}
          </select>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 h-[500px] relative">
          {isLoading || isLoadingTracking ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
              <p className="text-gray-600">Loading map...</p>
            </div>
          ) : !busLocation ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
              <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg max-w-md">
                <h3 className="font-medium text-lg mb-2">Bus Not Currently Tracking</h3>
                <p>The bus for this route is not currently sharing its location.</p>
                <p className="mt-2 text-sm">This could be because:</p>
                <ul className="list-disc pl-5 mt-1 text-sm">
                  <li>The route hasn't started yet</li>
                  <li>The driver hasn't activated tracking</li>
                  <li>The route has already been completed</li>
                </ul>
              </div>
            </div>
          ) : (
            <>
              {/* This would be replaced with a proper map component like Google Maps or Mapbox in a real app */}
              <div className="w-full h-full bg-blue-50 relative overflow-hidden">
                <img 
                  src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+f00(${busLocation.longitude},${busLocation.latitude})/${busLocation.longitude},${busLocation.latitude},13,0/800x500@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`}
                  alt="Map showing bus location" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-90 p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-gray-500 text-sm">Current location:</span>
                      <h3 className="font-medium">
                        {busLocation.latitude.toFixed(6)}, {busLocation.longitude.toFixed(6)}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500 text-sm">Last updated:</span>
                      <h3 className="font-medium">{busLocation.lastUpdated}</h3>
                    </div>
                  </div>
                </div>
                <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-lg shadow-md">
                  <div className="flex items-center">
                    <span className={`flex h-3 w-3 mr-2 ${getStatusColor(busLocation.status)} rounded-full`}></span>
                    <span className="font-medium text-sm">
                      {trackingData?.childInfo?.busNumber || 'Bus'}
                      {busLocation.status === 'emergency' && (
                        <span className="ml-2 text-red-600 font-bold animate-pulse flex items-center">
                          <HiExclamationTriangle className="w-4 h-4 mr-1" /> Emergency
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Bus details */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="p-5">
            <h2 className="text-lg font-semibold mb-4">Bus Details</h2>
            
            {isLoadingTracking || !trackingData ? (
              <div className="space-y-4">
                <div className="animate-pulse h-16 bg-gray-200 rounded-md"></div>
                <div className="animate-pulse h-24 bg-gray-200 rounded-md"></div>
                <div className="animate-pulse h-24 bg-gray-200 rounded-md"></div>
              </div>
            ) : !busLocation ? (
              // Add this new condition to handle when bus location is null
              <div className="p-4 bg-yellow-50 rounded-lg text-center">
                <div className="w-12 h-12 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center mx-auto mb-3 text-xl">
                  🚌
                </div>
                <h3 className="font-medium text-yellow-800 mb-2">
                  {trackingData.childInfo.busNumber} - Not Currently Tracking
                </h3>
                <p className="text-sm text-yellow-700 mb-2">
                  This bus is not currently sharing its location.
                </p>
                <p className="text-xs text-yellow-600">
                  The driver may not have started the route yet or has completed it.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center mr-3 text-xl">
                    🚌
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">
                      {trackingData.childInfo.busNumber}
                    </h3>
                    <div className="flex items-center text-sm">
                      <span className={`inline-block w-2 h-2 rounded-full ${getStatusColor(busLocation.status)} mr-2`}></span>
                      <span className="text-gray-600">{formatStatus(busLocation.status)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-500 text-sm">Status</p>
                    <p className="font-medium text-gray-800">
                      {formatStatus(busLocation.status)}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-500 text-sm">Current Speed</p>
                    <p className="font-medium text-gray-800">{busLocation.speed}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-500 text-sm">Next Stop</p>
                    <p className="font-medium text-gray-800">{busLocation.nextStop || 'N/A'}</p>
                    {busLocation.distanceToStop && (
                      <p className="text-xs text-gray-500">{busLocation.distanceToStop} away</p>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-500 text-sm">Estimated Arrival</p>
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-800">{busLocation.estimatedArrival}</p>
                      {busLocation.delayMinutes > 0 && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                          {busLocation.delayMinutes} min delay
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between border-t border-gray-200 pt-4 mt-2">
                    <button 
                      className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium flex items-center"
                      onClick={() => {
                        const driverPhone = trackingData.data?.driverId?.phone;
                        if (driverPhone) {
                          window.location.href = `tel:${driverPhone}`;
                        } else {
                          toast.error("Driver phone number not available");
                        }
                      }}
                    >
                      <HiPhone className="w-4 h-4 mr-1" />
                      Contact Driver
                    </button>
                    <button 
                      className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center"
                      onClick={() => toast.success("Message sent to driver")}
                    >
                      <HiMail className="w-4 h-4 mr-1" />
                      Send Message
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Travel history */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5">
          <h2 className="text-lg font-semibold mb-4">Today's Travel History</h2>
          <div className="overflow-x-auto">
            {travelHistory.length === 0 ? (
              <div className="text-center py-8">
                <span className="inline-block bg-gray-100 rounded-full p-3">
                  <HiBell className="w-6 h-6 text-gray-500" />
                </span>
                <p className="mt-2 text-gray-600">No travel events recorded today</p>
              </div>
            ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Time</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Event</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Location</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {travelHistory.map((event, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800">{event.time}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{event.event}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{event.location}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={event.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const statusColors = {
    'On time': 'bg-green-100 text-green-800',
    'Late': 'bg-red-100 text-red-800',
    'Emergency': 'bg-red-200 text-red-800'
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
      {status}
    </span>
  );
}