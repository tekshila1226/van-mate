import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { 
  useGetChildrenQuery, 
  useCreateChildMutation, 
  useDeleteChildMutation,
  useUpdateChildMutation 
} from '../../redux/features/childSlice';
import { useGetActiveRoutesQuery } from '../../redux/features/routeSlice';
import { HiPlus, HiPencil, HiTrash, HiX, HiChevronDown } from 'react-icons/hi';
import { FaBus } from "react-icons/fa";

export default function Children() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentChildId, setCurrentChildId] = useState(null);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [activeChildForRoutes, setActiveChildForRoutes] = useState(null);
  const [isUpdatingRoutes, setIsUpdatingRoutes] = useState(false);
  
  // API queries
  const { data: childrenData, isLoading, isError, refetch } = useGetChildrenQuery();
  const { data: routesData, isLoading: isLoadingRoutes } = useGetActiveRoutesQuery();
  const [createChild, { isLoading: isCreating }] = useCreateChildMutation();
  const [updateChild, { isLoading: isUpdating }] = useUpdateChildMutation();
  const [deleteChild, { isLoading: isDeleting }] = useDeleteChildMutation();
  
  const [newChild, setNewChild] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    schoolName: '',
    grade: '',
    pickupAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    dropoffAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    routes: [], // Changed from single route to routes array
    specialNeeds: {
      has: false,
      details: ''
    }
  });
  
  // Reset form when modal is closed
  useEffect(() => {
    if (!isModalOpen) {
      resetForm();
    }
  }, [isModalOpen]);

  const resetForm = () => {
    setNewChild({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      schoolName: '',
      grade: '',
      pickupAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      },
      dropoffAddress: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      },
      routes: [],
      specialNeeds: {
        has: false,
        details: ''
      }
    });
    setIsEditMode(false);
    setCurrentChildId(null);
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle nested object properties
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setNewChild(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setNewChild(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };
  
  const handleRouteSelect = (e) => {
    const routeId = e.target.value;
    if (!routeId) return;
    
    // Add route if it's not already in the array
    if (!newChild.routes.includes(routeId)) {
      setNewChild(prev => ({
        ...prev,
        routes: [...prev.routes, routeId]
      }));
    }
    
    // Reset the select input
    e.target.value = '';
  };
  
  const handleRemoveRoute = (routeId) => {
    setNewChild(prev => ({
      ...prev,
      routes: prev.routes.filter(id => id !== routeId)
    }));
  };
  
  const handleEdit = (child) => {
    // Fill the form with the selected child's data
    setNewChild({
      firstName: child.firstName,
      lastName: child.lastName,
      dateOfBirth: new Date(child.dateOfBirth).toISOString().split('T')[0],
      gender: child.gender,
      schoolName: child.schoolName,
      grade: child.grade,
      pickupAddress: {
        street: child.pickupAddress?.street || '',
        city: child.pickupAddress?.city || '',
        state: child.pickupAddress?.state || '',
        zipCode: child.pickupAddress?.zipCode || ''
      },
      dropoffAddress: {
        street: child.dropoffAddress?.street || '',
        city: child.dropoffAddress?.city || '',
        state: child.dropoffAddress?.state || '',
        zipCode: child.dropoffAddress?.zipCode || ''
      },
      // Handle existing routes - could be array or single value
      routes: Array.isArray(child.routes) 
        ? child.routes 
        : (child.route ? [child.route] : []),
      specialNeeds: {
        has: child.specialNeeds?.has || false,
        details: child.specialNeeds?.details || ''
      }
    });
    
    setIsEditMode(true);
    setCurrentChildId(child._id);
    setIsModalOpen(true);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Create a copy of the child object to modify before submission
      const childToSubmit = { ...newChild };
      
      if (isEditMode) {
        await updateChild({
          id: currentChildId,
          ...childToSubmit
        }).unwrap();
        
        toast.success("Child updated successfully!");
      } else {
        await createChild(childToSubmit).unwrap();
        
        toast.success("Child added successfully!");
      }
      
      // Close form
      setIsModalOpen(false);
      
    } catch (error) {
      console.error(isEditMode ? "Failed to update child:" : "Failed to add child:", error);
      toast.error(error.data?.message || (isEditMode ? "Failed to update child. Please try again." : "Failed to add child. Please try again."));
    }
  };
  
  const handleRemove = async (id) => {
    if (window.confirm("Are you sure you want to remove this child?")) {
      try {
        await deleteChild(id).unwrap();
        toast.success("Child removed successfully");
      } catch (error) {
        console.error("Failed to remove child:", error);
        toast.error(error.data?.message || "Failed to remove child. Please try again.");
      }
    }
  };
  
  // Open route management modal for a specific child with most current data
  const openRouteModal = (child) => {
    // Make a deep copy to avoid reference issues
    setActiveChildForRoutes({...child});
    setRouteModalOpen(true);
  };
  
  // Update child's routes directly from the card
  const updateChildRoutes = async (childId, routes) => {
    setIsUpdatingRoutes(true);
    try {
      await updateChild({
        id: childId,
        routes
      }).unwrap();
      
      // Force refetch children data to get updated routes
      await refetch();
      
      toast.success("Bus routes updated successfully!");
      
    } catch (error) {
      console.error("Failed to update bus routes:", error);
      toast.error(error.data?.message || "Failed to update bus routes. Please try again.");
    } finally {
      setIsUpdatingRoutes(false);
      setRouteModalOpen(false);
      setActiveChildForRoutes(null);
    }
  };
  
  // Add a route to child from the card view modal
  const addRouteToChild = (routeId) => {
    if (!activeChildForRoutes || !routeId || routeId === "") return;
    
    const currentRoutes = Array.isArray(activeChildForRoutes.routes) 
      ? [...activeChildForRoutes.routes] // Create a copy to avoid mutation 
      : (activeChildForRoutes.route ? [activeChildForRoutes.route] : []);
      
    if (!currentRoutes.includes(routeId)) {
      // Update local state first for immediate UI feedback
      const updatedRoutes = [...currentRoutes, routeId];
      setActiveChildForRoutes(prev => ({
        ...prev,
        routes: updatedRoutes,
        // Remove single route property to avoid confusion
        route: undefined
      }));

      console.log("Updated routes:", updatedRoutes);
      
      // Then update in database
      updateChildRoutes(activeChildForRoutes._id, updatedRoutes);
    } else {
      toast.info("This route is already assigned to the child");
    }
    
    // Reset the select input
    document.querySelector('[aria-label="Add route"]').value = "";
  };
  
  // Remove a route from child 
  const removeRouteFromChild = (childId, routeId) => {
    if (!childId || !routeId) return;
    
    // Find the active child if we're working with it
    const child = activeChildForRoutes && activeChildForRoutes._id === childId 
      ? activeChildForRoutes 
      : childrenData?.data?.find(c => c._id === childId);
      
    if (!child) return;
    
    const currentRoutes = Array.isArray(child.routes) 
      ? [...child.routes] // Create a copy
      : (child.route ? [child.route] : []);
      
    const updatedRoutes = currentRoutes.filter(id => id !== routeId);
    
    // If we're in the modal, update the local state first
    if (activeChildForRoutes && activeChildForRoutes._id === childId) {
      setActiveChildForRoutes(prev => ({
        ...prev,
        routes: updatedRoutes,
        route: undefined
      }));
    }
    
    // Then update in database
    updateChildRoutes(childId, updatedRoutes);
  };

  // Function to format date of birth for display
  const formatDateOfBirth = (dateOfBirth) => {
    const date = new Date(dateOfBirth);
    return date.toLocaleDateString();
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };
  
  // Get route name by ID for display
  const getRouteName = (routeId) => {
    if (!routesData?.data) return 'Loading...';
    const route = routesData.data.find(r => r._id === routeId);
    return route ? `${route.name} (${route.type === 'morning' ? 'Morning' : 'Afternoon'})` : 'Unknown route';
  };

  return (
    <div className="space-y-6 md:pt-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Children</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
          disabled={isCreating}
        >
          <HiPlus className="w-4 h-4 mr-2" />
          Add Child
        </button>
      </div>
      
      {isLoading && (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">Loading children...</p>
        </div>
      )}
      
      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p>Failed to load children. Please try again later.</p>
        </div>
      )}
      
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-gray-200"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {isEditMode ? 'Edit Child' : 'Add New Child'}
            </h2>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Personal Information */}
              <div>
                <label htmlFor="firstName" className="block text-gray-700 text-sm font-medium mb-1">First Name*</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={newChild.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-gray-700 text-sm font-medium mb-1">Last Name*</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={newChild.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                  required
                />
              </div>
              <div>
                <label htmlFor="dateOfBirth" className="block text-gray-700 text-sm font-medium mb-1">Date of Birth*</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={newChild.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                  required
                />
              </div>
              <div>
                <label htmlFor="gender" className="block text-gray-700 text-sm font-medium mb-1">Gender*</label>
                <select
                  id="gender"
                  name="gender"
                  value={newChild.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                  required
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              {/* School Information */}
              <div>
                <label htmlFor="schoolName" className="block text-gray-700 text-sm font-medium mb-1">School*</label>
                <input
                  type="text"
                  id="schoolName"
                  name="schoolName"
                  value={newChild.schoolName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                  required
                />
              </div>
              <div>
                <label htmlFor="grade" className="block text-gray-700 text-sm font-medium mb-1">Grade*</label>
                <input
                  type="text"
                  id="grade"
                  name="grade"
                  value={newChild.grade}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                  required
                />
              </div>
              
              {/* Pickup Address */}
              <div className="col-span-2">
                <h3 className="font-medium text-gray-700 mb-2">Pickup Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      name="pickupAddress.street"
                      value={newChild.pickupAddress.street}
                      onChange={handleChange}
                      placeholder="Street"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="pickupAddress.city"
                      value={newChild.pickupAddress.city}
                      onChange={handleChange}
                      placeholder="City"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="pickupAddress.state"
                      value={newChild.pickupAddress.state}
                      onChange={handleChange}
                      placeholder="State"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="pickupAddress.zipCode"
                      value={newChild.pickupAddress.zipCode}
                      onChange={handleChange}
                      placeholder="ZIP Code"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                    />
                  </div>
                </div>
              </div>
              
              {/* Bus Routes - Modified to support multiple routes */}
              <div className="col-span-2">
                <label htmlFor="routes" className="block text-gray-700 text-sm font-medium mb-1">Bus Routes</label>
                <select
                  id="routes"
                  name="routes"
                  onChange={handleRouteSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                  defaultValue=""
                >
                  <option value="">-- Select a bus route to add --</option>
                  {routesData?.data?.map(route => (
                    <option key={route._id} value={route._id}>
                      {route.name} ({route.type === 'morning' ? 'Morning' : 'Afternoon'} - {route.school})
                    </option>
                  ))}
                </select>
                {isLoadingRoutes && <p className="text-xs text-gray-500 mt-1">Loading routes...</p>}
                
                {/* Display selected routes with remove option */}
                {newChild.routes.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Selected Routes:</p>
                    <div className="flex flex-wrap gap-2">
                      {newChild.routes.map(routeId => (
                        <div key={routeId} className="flex items-center bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm">
                          <span>{getRouteName(routeId)}</span>
                          <button 
                            type="button"
                            onClick={() => handleRemoveRoute(routeId)}
                            className="ml-2 text-indigo-500 hover:text-indigo-700"
                          >
                            <HiX className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Special Needs Checkbox */}
              <div className="col-span-2">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="specialNeeds.has"
                    name="specialNeeds.has"
                    checked={newChild.specialNeeds.has}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="specialNeeds.has" className="ml-2 block text-sm text-gray-700">
                    Child has special needs
                  </label>
                </div>
                
                {newChild.specialNeeds.has && (
                  <textarea
                    name="specialNeeds.details"
                    value={newChild.specialNeeds.details}
                    onChange={handleChange}
                    placeholder="Please provide details about special needs"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                    rows="3"
                  ></textarea>
                )}
              </div>
            </div>
            
            <div className="pt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isCreating || isUpdating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                disabled={isCreating || isUpdating}
              >
                {(isCreating || isUpdating) ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    {isEditMode ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>{isEditMode ? 'Update Child' : 'Add Child'}</>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      )}
      
      {/* Route management modal */}
      {routeModalOpen && activeChildForRoutes && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Manage Bus Routes - {activeChildForRoutes.firstName}
              </h3>
              <button 
                onClick={() => {
                  if (!isUpdatingRoutes) {
                    setRouteModalOpen(false);
                    setActiveChildForRoutes(null);
                  }
                }}
                disabled={isUpdatingRoutes}
                className={`text-gray-500 ${isUpdatingRoutes ? 'opacity-50 cursor-not-allowed' : 'hover:text-gray-700'}`}
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">Add Route</label>
              <select
                onChange={(e) => addRouteToChild(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                defaultValue=""
                disabled={isUpdatingRoutes}
                aria-label="Add route"
              >
                <option value="">-- Select a route to add --</option>
                {routesData?.data?.map(route => {
                  // Don't show routes that are already assigned
                  const currentRoutes = Array.isArray(activeChildForRoutes.routes) 
                    ? activeChildForRoutes.routes 
                    : (activeChildForRoutes.route ? [activeChildForRoutes.route] : []);
                
                  if (currentRoutes.includes(route._id)) return null;
                
                  return (
                    <option key={route._id} value={route._id}>
                      {route.name} ({route.type === 'morning' ? 'Morning' : 'Afternoon'} - {route.school})
                    </option>
                  );
                })}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Current Routes</label>
              {isUpdatingRoutes && (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  <p className="ml-2 text-sm text-gray-600">Updating routes...</p>
                </div>
              )}
              
              {!isUpdatingRoutes && Array.isArray(activeChildForRoutes.routes) && activeChildForRoutes.routes.length > 0 ? (
                <div className="space-y-2">
                  {activeChildForRoutes.routes.map(routeId => (
                    <div key={routeId} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                      <span>{getRouteName(routeId)}</span>
                      <button
                        onClick={() => removeRouteFromChild(activeChildForRoutes._id, routeId)}
                        className="text-red-500 hover:text-red-700"
                        disabled={isUpdatingRoutes}
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : !isUpdatingRoutes && activeChildForRoutes.route ? (
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                  <span>{getRouteName(activeChildForRoutes.route)}</span>
                  <button
                    onClick={() => removeRouteFromChild(activeChildForRoutes._id, activeChildForRoutes.route)}
                    className="text-red-500 hover:text-red-700"
                    disabled={isUpdatingRoutes}
                  >
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>
              ) : !isUpdatingRoutes ? (
                <p className="text-gray-500 italic">No routes assigned</p>
              ) : null}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  if (!isUpdatingRoutes) {
                    setRouteModalOpen(false);
                    setActiveChildForRoutes(null);
                  }
                }}
                disabled={isUpdatingRoutes}
                className={`px-4 py-2 ${isUpdatingRoutes ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-lg transition-colors`}
              >
                {isUpdatingRoutes ? 'Processing...' : 'Done'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {!isLoading && childrenData?.data && childrenData.data.map(child => (
          <motion.div
            key={child._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 mr-4">
                  {child.firstName.charAt(0)}{child.lastName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">{child.firstName} {child.lastName}</h3>
                  <div className="text-sm text-gray-500">{calculateAge(child.dateOfBirth)} years old • {child.grade}</div>
                  <div className="flex items-center mt-1">
                    <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800 mr-2">{child.schoolName}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-500">Date of Birth</p>
                  <p className="font-medium text-gray-800">{formatDateOfBirth(child.dateOfBirth)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-500">Gender</p>
                  <p className="font-medium text-gray-800">{child.gender.charAt(0).toUpperCase() + child.gender.slice(1)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                  <p className="text-gray-500">Pickup Address</p>
                  <p className="font-medium text-gray-800">
                    {child.pickupAddress?.street} {child.pickupAddress?.city}, {child.pickupAddress?.state} {child.pickupAddress?.zipCode}
                  </p>
                </div>
                
                {/* Bus Routes Section */}
                <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                  <div className="flex items-center justify-between">
                    <p className="text-gray-500">Bus Routes</p>
                    <button
                      onClick={() => openRouteModal(child)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                    >
                      Manage Routes <HiChevronDown className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                  <div className="mt-1">
                    {Array.isArray(child.routes) && child.routes.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {child.routes.map(routeId => (
                          <span key={routeId} className="inline-block px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs">
                            <FaBus className="inline w-3 h-3 mr-1" />
                            {getRouteName(routeId)}
                          </span>
                        ))}
                      </div>
                    ) : child.route ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs">
                          <FaBus className="inline w-3 h-3 mr-1" />
                          {getRouteName(child.route)}
                        </span>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm italic">No routes assigned</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-gray-500">Actions</p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleRemove(child._id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                      title="Remove child"
                      disabled={isDeleting}
                    >
                      <HiTrash className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleEdit(child)}
                      className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                      title="Edit child"
                    >
                      <HiPencil className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {child.specialNeeds?.has && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">Special Needs:</p>
                  <p className="text-sm text-yellow-700">{child.specialNeeds.details}</p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      
      {!isLoading && (!childrenData?.data || childrenData.data.length === 0) && (
        <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-200 text-center">
          <div className="text-gray-400 mb-4">
            <HiPlus className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-1">No children added yet</h3>
          <p className="text-gray-500 mb-4">Add your children to track their school bus transportation</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center"
          >
            <HiPlus className="w-4 h-4 mr-2" />
            Add Your First Child
          </button>
        </div>
      )}
    </div>
  );
}