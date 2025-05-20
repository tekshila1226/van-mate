import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { HiSearch, HiPlusCircle, HiPencil, HiTrash, HiUserCircle, HiChevronDown, HiChevronRight } from 'react-icons/hi';
import { toast } from 'react-hot-toast';
import { 
  useGetAllRoutesQuery, 
  useGetAvailableDriversQuery, 
  useDeleteRouteMutation, 
  useAssignDriverToRouteMutation,
  useUnassignDriverFromRouteMutation
} from '../../redux/features/routeSlice';
import Spinner from '../components/Spinner';
import CreateRouteModal from './CreateRouteModal';

export default function Routes() {
  // RTK Query hooks
  const { data: routesData, isLoading: routesLoading, error: routesError } = useGetAllRoutesQuery();
  const { data: driversData, isLoading: driversLoading, error: driversError } = useGetAvailableDriversQuery();
  const [deleteRoute, { isLoading: isDeleting }] = useDeleteRouteMutation();
  const [assignDriver, { isLoading: isAssigning }] = useAssignDriverToRouteMutation();
  const [unassignDriver, { isLoading: isUnassigning }] = useUnassignDriverFromRouteMutation();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedRoute, setExpandedRoute] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Filter routes
  const filteredRoutes = routesData?.data ? routesData.data.filter(route => {
    const matchesSearch = route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          route.school.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || route.type === filterType;
    return matchesSearch && matchesType;
  }) : [];

  // Handle route deletion
  const handleDeleteRoute = async (routeId) => {
    if (window.confirm("Are you sure you want to delete this route?")) {
      try {
        await deleteRoute(routeId).unwrap();
        toast.success("Route deleted successfully");
      } catch (error) {
        console.error('Delete route error:', error);
        toast.error(error.data?.message || "Failed to delete route");
      }
    }
  };

  // Toggle route expansion
  const handleRouteExpand = (routeId) => {
    setExpandedRoute(expandedRoute === routeId ? null : routeId);
  };

  // Open assign driver modal
  const handleAssignDriver = (route) => {
    setSelectedRoute(route);
    setShowAssignModal(true);
  };

  // Submit driver assignment
  const confirmAssignDriver = async () => {
    if (selectedDriver) {
      try {
        await assignDriver({
          routeId: selectedRoute._id,
          driverId: selectedDriver._id
        }).unwrap();
        
        toast.success(`Driver ${selectedDriver.firstName} ${selectedDriver.lastName} assigned to route ${selectedRoute.name}`);
        setShowAssignModal(false);
        setSelectedRoute(null);
        setSelectedDriver(null);
      } catch (error) {
        console.error('Assign driver error:', error);
        toast.error(error.data?.message || "Failed to assign driver");
      }
    } else {
      toast.error("Please select a driver");
    }
  };

  // Handle driver unassignment
  const handleUnassignDriver = async (routeId) => {
    if (window.confirm("Are you sure you want to unassign the driver from this route?")) {
      try {
        await unassignDriver(routeId).unwrap();
        toast.success("Driver unassigned successfully");
      } catch (error) {
        console.error('Unassign driver error:', error);
        toast.error(error.data?.message || "Failed to unassign driver");
      }
    }
  };

  // Handle API errors
  useEffect(() => {
    if (routesError) {
      toast.error(routesError.data?.message || "Failed to load routes");
    }
    
    if (driversError) {
      toast.error(driversError.data?.message || "Failed to load drivers");
    }
  }, [routesError, driversError]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Route Management</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <HiPlusCircle className="-ml-1 mr-2 h-5 w-5" />
          Add New Route
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex space-x-2">
            <button 
              onClick={() => setFilterType('all')} 
              className={`px-4 py-2 rounded ${filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All Routes
            </button>
            <button 
              onClick={() => setFilterType('morning')} 
              className={`px-4 py-2 rounded ${filterType === 'morning' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Morning
            </button>
            <button 
              onClick={() => setFilterType('afternoon')} 
              className={`px-4 py-2 rounded ${filterType === 'afternoon' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Afternoon
            </button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search routes..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Routes List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Routes
            <span className="ml-2 text-sm font-normal text-gray-500">
              {routesData ? `(${filteredRoutes.length} routes, ${filteredRoutes.filter(r => r.driver).length} assigned)` : ''}
            </span>
          </h2>
        </div>

        {routesLoading ? (
          <div className="p-12 flex justify-center">
            <Spinner />
          </div>
        ) : routesError ? (
          <div className="p-6 text-center text-red-500">
            Failed to load routes. Please try refreshing the page.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route Details
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    School
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statistics
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
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
                {filteredRoutes.length > 0 ? (
                  filteredRoutes.map((route) => (
                    <React.Fragment key={route._id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center cursor-pointer" onClick={() => handleRouteExpand(route._id)}>
                            {expandedRoute === route._id ? (
                              <HiChevronDown className="h-5 w-5 text-gray-400 mr-2" />
                            ) : (
                              <HiChevronRight className="h-5 w-5 text-gray-400 mr-2" />
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{route.name}</div>
                              <div className="text-sm text-gray-500 capitalize">{route.type} Route</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{route.school}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{route.stops?.length || 0} stops</div>
                          <div className="text-sm text-gray-500">{route.students?.length || 0} students</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {route.driver ? (
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                {route.driver.firstName?.charAt(0)}{route.driver.lastName?.charAt(0)}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {route.driver.firstName} {route.driver.lastName}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAssignDriver(route)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-blue-300 text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              disabled={isAssigning}
                            >
                              + Assign Driver
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            route.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {route.isActive ? 'active' : 'inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            {/* <button 
                              className="text-blue-600 hover:text-blue-900"
                              onClick={() => {
                                // Navigate to edit route page or show edit modal
                              }}
                            >
                              <HiPencil className="h-5 w-5" />
                            </button> */}
                            {route.driver && (
                              <button 
                                onClick={() => handleUnassignDriver(route._id)}
                                className="text-yellow-600 hover:text-yellow-900"
                                disabled={isUnassigning}
                              >
                                <HiUserCircle className="h-5 w-5" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteRoute(route._id)}
                              className="text-red-600 hover:text-red-900"
                              disabled={isDeleting}
                            >
                              <HiTrash className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRoute === route._id && (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 bg-gray-50">
                            <div className="text-sm text-gray-500">
                              <h3 className="font-medium text-gray-700 mb-2">Route Details</h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <p className="font-medium">Stops:</p>
                                  {route.stops && route.stops.length > 0 ? (
                                    <ul className="list-disc list-inside mt-1">
                                      {route.stops.map((stop, index) => (
                                        <li key={index}>
                                          {stop.name} - {stop.arrivalTime}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-gray-400 mt-1">No stops defined</p>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">Students:</p>
                                  {route.students && route.students.length > 0 ? (
                                    <ul className="list-disc list-inside mt-1">
                                      {route.students.slice(0, 3).map((student, index) => (
                                        <li key={index}>
                                          {student.firstName} {student.lastName} - Grade {student.grade}
                                        </li>
                                      ))}
                                      {route.students.length > 3 && (
                                        <li>+ {route.students.length - 3} more</li>
                                      )}
                                    </ul>
                                  ) : (
                                    <p className="text-gray-400 mt-1">No students assigned</p>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">Buses:</p>
                                  {route.buses && route.buses.length > 0 ? (
                                    <ul className="list-disc list-inside mt-1">
                                      {route.buses.map((bus, index) => (
                                        <li key={index}>
                                          {bus}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-gray-400 mt-1">No buses assigned</p>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">Actions:</p>
                                  <div className="mt-2 space-y-2">
                                    <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 w-full text-left">
                                      View on Map
                                    </button>
                                    <button className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 w-full text-left">
                                      Edit Route Details
                                    </button>
                                    <button className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 w-full text-left">
                                      Print Route Sheet
                                    </button>
                                  </div>
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
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No routes found matching your search
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Driver Modal */}
      {showAssignModal && selectedRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Driver to Route</h3>
            <p className="text-sm text-gray-500 mb-6">
              Select a driver to assign to <span className="font-medium">{selectedRoute.name}</span>
            </p>

            {driversLoading ? (
              <div className="flex justify-center my-8">
                <Spinner />
              </div>
            ) : driversError ? (
              <div className="text-center text-red-500 my-8">
                Failed to load drivers. Please try again.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto mb-6">
                {driversData?.drivers?.length > 0 ? (
                  <div className="space-y-2">
                    {driversData.drivers.map(driver => (
                      <div 
                        key={driver._id}
                        onClick={() => setSelectedDriver(driver)}
                        className={`p-3 border rounded-lg cursor-pointer flex items-center ${
                          selectedDriver?._id === driver._id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          {driver.firstName.charAt(0)}{driver.lastName.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium">{driver.firstName} {driver.lastName}</p>
                          <p className="text-xs text-gray-500">ID: {driver._id}</p>
                        </div>
                        {selectedDriver?._id === driver._id && (
                          <div className="ml-auto">
                            <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 my-8">No available drivers found</p>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedRoute(null);
                  setSelectedDriver(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  selectedDriver && !isAssigning
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-blue-400 cursor-not-allowed'
                }`}
                onClick={confirmAssignDriver}
                disabled={!selectedDriver || isAssigning}
              >
                {isAssigning ? 'Assigning...' : 'Assign Driver'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Route Modal */}
      {showAddModal && (
        <CreateRouteModal 
          onClose={() => setShowAddModal(false)} 
        />
      )}
    </div>
  );
}