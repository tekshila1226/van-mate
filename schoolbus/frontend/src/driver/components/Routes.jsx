import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { HiChevronDown, HiChevronUp, HiPhone } from 'react-icons/hi2';
import { HiMail, HiOutlineSearch, HiLocationMarker, HiExclamation } from 'react-icons/hi';
import { useSelector } from 'react-redux';
import { 
  useGetDriverRoutesQuery,
  useGetRouteByIdQuery 
} from '../../redux/features/routeSlice';
import { useGetRouteStudentsQuery } from '../../redux/features/childSlice';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Spinner from './Spinner';
import { toast } from 'react-hot-toast';
import L from 'leaflet';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const schoolIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/8074/8074788.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35]
});

// Student icon for stops
const studentIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2302/2302834.png',
  iconSize: [25, 25],
  iconAnchor: [12, 25],
  popupAnchor: [0, -25]
});

export default function Routes() {
  const { user } = useSelector(state => state.auth);
  const [activeTab, setActiveTab] = useState('morning');
  const [expandedRoute, setExpandedRoute] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mapCenter, setMapCenter] = useState([37.7749, -122.4194]); // Default center
  const [mapZoom, setMapZoom] = useState(13);
  const [mapKey, setMapKey] = useState(Date.now()); // Used to force map reload

  // Ensure user ID is available before making API requests
  const driverId = user?.id || user?._id;

  // Fetch driver's routes - only if we have a valid driver ID
  const { 
    data: routesData, 
    isLoading: isRoutesLoading, 
    error: routesError 
  } = useGetDriverRoutesQuery(driverId, {
    skip: !driverId // Skip the query if no driver ID is available
  });

  // Fetch details for expanded route
  const { 
    data: routeDetails, 
    isLoading: isRouteDetailsLoading,
    error: routeDetailsError 
  } = useGetRouteByIdQuery(expandedRoute, { 
    skip: !expandedRoute 
  });

  // Fetch students for expanded route
  const { 
    data: studentsData, 
    isLoading: isStudentsLoading,
    error: studentsError 
  } = useGetRouteStudentsQuery(expandedRoute, {
    skip: !expandedRoute
  });

  // Handle errors
  useEffect(() => {
    if (routesError) {
      console.error("Routes error:", routesError);
      toast.error(`Failed to load routes: ${routesError.status === 403 ? 'Unauthorized access' : 'Server error'}`);
    }
    if (routeDetailsError) {
      console.error("Route details error:", routeDetailsError);
      toast.error('Failed to load route details. Please try again.');
    }
    if (studentsError) {
      console.error("Students error:", studentsError);
      toast.error('Failed to load student data. Please try again.');
    }
  }, [routesError, routeDetailsError, studentsError]);

  // Set map center and zoom when route details change
  useEffect(() => {
    if (routeDetails && routeDetails.data && routeDetails.data.stops && routeDetails.data.stops.length > 0) {
      // Force map to reload when route changes
      setMapKey(Date.now());
      
      // Calculate center based on all stops
      const latitudes = routeDetails.data.stops.map(stop => stop.coordinates.latitude);
      const longitudes = routeDetails.data.stops.map(stop => stop.coordinates.longitude);
      
      const avgLat = latitudes.reduce((acc, lat) => acc + lat, 0) / latitudes.length;
      const avgLng = longitudes.reduce((acc, lng) => acc + lng, 0) / longitudes.length;
      
      setMapCenter([avgLat, avgLng]);
      
      // Calculate bounds and set zoom level
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);
      
      // Adjust zoom based on the route size (simple algorithm)
      const latDiff = maxLat - minLat;
      const lngDiff = maxLng - minLng;
      const maxDiff = Math.max(latDiff, lngDiff);
      
      // Adjust zoom based on route size
      if (maxDiff > 0.1) setMapZoom(11);
      else if (maxDiff > 0.05) setMapZoom(12);
      else if (maxDiff > 0.02) setMapZoom(13);
      else setMapZoom(14);
    }
  }, [routeDetails]);

  // Filter students based on search
  const filteredStudents = studentsData?.data ? studentsData.data.filter(student => 
    student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.address && student.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.grade && student.grade.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];

  // Get current routes for the selected tab
  const getCurrentTabRoutes = () => {
    if (!routesData || !routesData.data) return [];
    return routesData.data.filter(route => route.type === activeTab);
  };

  const toggleRouteExpansion = (routeId) => {
    if (expandedRoute === routeId) {
      setExpandedRoute(null);
    } else {
      setExpandedRoute(routeId);
    }
  };

  // Create route line for map
  const getRoutePolyline = () => {
    if (!routeDetails || !routeDetails.data || !routeDetails.data.stops) return [];
    
    return routeDetails.data.stops.map(stop => [
      stop.coordinates.latitude,
      stop.coordinates.longitude
    ]);
  };

  // Format time (e.g., "08:30" to "8:30 AM")
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    
    let [hours, minutes] = timeString.split(':');
    hours = parseInt(hours);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  // Check for overall loading state
  const isLoading = isRoutesLoading || (!driverId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  // Adjust students display to handle multiple routes
  const renderStudents = () => {
    if (isStudentsLoading) {
      return (
        <div className="flex items-center justify-center h-32">
          <Spinner />
        </div>
      );
    }
    
    if (!filteredStudents || filteredStudents.length === 0) {
      return (
        <div className="col-span-full text-center py-8 text-gray-500">
          No students found matching your search criteria.
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map(student => (
          <div key={student._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-semibold">
                {student.firstName?.[0] || ''}{student.lastName?.[0] || ''}
              </div>
              <div className="ml-3">
                <h5 className="font-medium text-gray-800">{student.firstName} {student.lastName}</h5>
                <p className="text-xs text-gray-500">Grade: {student.grade || 'N/A'}</p>
              </div>
            </div>
            
            <div className="text-sm">
              <p className="mb-1">
                <span className="text-gray-500">Address:</span> {getAddressForStudent(student)}
              </p>
              <p className="mb-1">
                <span className="text-gray-500">Parent:</span> {student.parent?.firstName} {student.parent?.lastName}
              </p>
              
              {/* Add assigned routes badges */}
              {student.routes && student.routes.length > 0 && (
                <div className="mt-2 mb-2">
                  <span className="text-gray-500">Other routes:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {student.routes
                      .filter(routeId => routeId !== expandedRoute) // Don't show current route
                      .map(routeId => (
                        <span key={routeId} className="inline-block px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-xs">
                          {getRouteName(routeId)}
                        </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex mt-2 pt-2 border-t border-gray-100">
                {student.parent?.phone && (
                  <a href={`tel:${student.parent.phone}`} className="flex items-center text-blue-600 text-xs mr-3">
                    <HiPhone className="mr-1" /> Call
                  </a>
                )}
                {student.parent?.email && (
                  <a href={`mailto:${student.parent.email}`} className="flex items-center text-blue-600 text-xs">
                    <HiMail className="mr-1" /> Email
                  </a>
                )}
              </div>
              
              {student.medicalNotes && (
                <div className="mt-2 p-2 bg-red-50 text-red-700 text-xs rounded">
                  <div className="flex items-start">
                    <HiExclamation className="h-4 w-4 mr-1 mt-0.5 text-red-600" />
                    <span>
                      <strong>Medical:</strong> {student.medicalNotes}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Add special needs indicator */}
              {student.specialNeeds?.has && (
                <div className="mt-2 p-2 bg-yellow-50 text-yellow-700 text-xs rounded">
                  <div className="flex items-start">
                    <HiExclamation className="h-4 w-4 mr-1 mt-0.5 text-yellow-600" />
                    <span>
                      <strong>Special needs:</strong> {student.specialNeeds.details}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Helper function to get appropriate address based on route type
  const getAddressForStudent = (student) => {
    if (activeTab === 'morning') {
      // For morning routes, show pickup address
      return formatAddress(student.pickupAddress);
    } else {
      // For afternoon routes, show dropoff address
      return formatAddress(student.dropoffAddress);
    }
  };

  // Helper function to format address object
  const formatAddress = (address) => {
    if (!address) return 'No address';
    
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.zipCode) parts.push(address.zipCode);
    
    return parts.length > 0 ? parts.join(', ') : 'No address';
  };

  // Helper function to get route name by ID
  const getRouteName = (routeId) => {
    if (!routesData?.data) return 'Unknown route';
    const route = routesData.data.find(r => r._id === routeId);
    return route ? route.name || `Route #${route.routeNumber}` : 'Unknown route';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Routes & Students</h1>
      </div>

      {/* Routes Tab Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('morning')}
            className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors ${
              activeTab === 'morning'
                ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Morning Routes
          </button>
          <button
            onClick={() => setActiveTab('afternoon')}
            className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-colors ${
              activeTab === 'afternoon'
                ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Afternoon Routes
          </button>
        </div>

        <div className="p-5">
          {/* Route Cards */}
          <div className="space-y-4">
            {getCurrentTabRoutes().length > 0 ? (
              getCurrentTabRoutes().map(route => (
                <motion.div
                  key={route._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Route Header */}
                  <div 
                    className={`p-4 flex justify-between items-center cursor-pointer ${
                      expandedRoute === route._id ? 'bg-amber-50' : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => toggleRouteExpansion(route._id)}
                  >
                    <div>
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${route.isActive ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                        <h3 className="font-semibold text-gray-800">
                          {route.name || `Route #${route.routeNumber}`}
                        </h3>
                      </div>
                      <div className="flex mt-1 text-xs text-gray-500">
                        <span className="mr-3">
                          {route.estimatedDuration ? `~${route.estimatedDuration} mins` : 'No duration set'}
                        </span>
                        {route.totalDistance && (
                          <>
                            <span className="mr-3">|</span>
                            <span>{route.totalDistance} miles</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={`px-3 py-1 ${route.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} text-xs rounded-full mr-3`}>
                        {route.isActive ? 'active' : 'inactive'}
                      </span>
                      {expandedRoute === route._id ? (
                        <HiChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <HiChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </div>

                  {/* Route Details */}
                  {expandedRoute === route._id && (
                    <div className="p-4 border-t border-gray-200">
                      {isRouteDetailsLoading ? (
                        <div className="flex items-center justify-center h-64">
                          <Spinner />
                        </div>
                      ) : (
                        <>
                          {/* Map View */}
                          <div className="bg-gray-100 h-80 rounded-lg mb-4 relative overflow-hidden">
                            {routeDetails && routeDetails.data && routeDetails.data.stops && routeDetails.data.stops.length > 0 ? (
                              <MapContainer 
                                key={mapKey}
                                center={mapCenter} 
                                zoom={mapZoom} 
                                style={{ height: '100%', width: '100%' }}
                              >
                                <TileLayer
                                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                
                                {/* Route line */}
                                <Polyline 
                                  positions={getRoutePolyline()} 
                                  color="blue" 
                                  weight={5}
                                  opacity={0.7}
                                />
                                
                                {/* Stops markers */}
                                {routeDetails.data.stops.map((stop, index) => (
                                  <Marker 
                                    key={index}
                                    position={[stop.coordinates.latitude, stop.coordinates.longitude]}
                                    icon={stop.isSchool ? schoolIcon : (index === 0 ? L.Icon.Default.prototype : studentIcon)}
                                  >
                                    <Popup>
                                      <div>
                                        <strong>{stop.name}</strong>
                                        <p>{formatTime(stop.arrivalTime)}</p>
                                        <p>{stop.students || 0} students</p>
                                        {stop.address && <p className="text-xs">{stop.address}</p>}
                                      </div>
                                    </Popup>
                                  </Marker>
                                ))}
                              </MapContainer>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <HiLocationMarker className="h-12 w-12 mb-2 text-gray-400" />
                                <p>No map data available for this route.</p>
                                <p className="text-sm">Contact administrator for route details.</p>
                              </div>
                            )}
                            {routeDetails?.data?.stops?.length > 0 && (
                              <div className="absolute bottom-4 right-4">
                                <a 
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${
                                    routeDetails?.data?.stops?.[routeDetails.data.stops.length-1]?.coordinates?.latitude || ''
                                  },${
                                    routeDetails?.data?.stops?.[routeDetails.data.stops.length-1]?.coordinates?.longitude || ''
                                  }&waypoints=${
                                    routeDetails?.data?.stops?.slice(0, -1).map(stop => 
                                      `${stop.coordinates.latitude},${stop.coordinates.longitude}`
                                    ).join('|') || ''
                                  }`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-4 py-2 bg-blue-600 text-white shadow-md rounded-lg text-sm font-medium hover:bg-blue-700"
                                >
                                  Open in Google Maps
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Stops and Students Tabs */}
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-800 mb-2">Stops</h4>
                            <div className="overflow-x-auto">
                              <table className="min-w-full">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Location</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Arrival</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Departure</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Students</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {routeDetails?.data?.stops?.map((stop, index) => (
                                    <tr key={index} className={stop.isSchool ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <span className={stop.isSchool ? 'font-medium text-blue-700' : ''}>
                                          {stop.name}
                                        </span>
                                        <p className="text-xs text-gray-500">{stop.address}</p>
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        {formatTime(stop.arrivalTime)}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        {formatTime(stop.departureTime)}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        {stop.students || 0}
                                      </td>
                                    </tr>
                                  ))}
                                  {(!routeDetails?.data?.stops || routeDetails.data.stops.length === 0) && (
                                    <tr>
                                      <td colSpan="4" className="px-4 py-3 text-center text-sm text-gray-500">
                                        No stops defined for this route.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Students List */}
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-medium text-gray-800">Students</h4>
                              
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="Search students..."
                                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                              </div>
                            </div>
                            
                            {renderStudents()}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <HiLocationMarker className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No {activeTab} routes assigned</h3>
                <p className="text-sm">
                  {activeTab === 'morning' 
                    ? 'You have no morning routes assigned to you.' 
                    : 'You have no afternoon routes assigned to you.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
