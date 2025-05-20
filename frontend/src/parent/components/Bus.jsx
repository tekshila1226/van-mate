import React, { useState, useEffect } from 'react';
import { useGetChildrenQuery } from '../../redux/features/childSlice';
import { useGetActiveRoutesQuery } from '../../redux/features/routeSlice';
import { useGetAllBusesQuery } from '../../redux/features/busSlice';
import { useUpdateChildMutation } from '../../redux/features/childSlice';
import { toast } from 'react-hot-toast';
import { HiUserGroup, HiCalendar, HiClock, HiCheck } from 'react-icons/hi';
import { TbBusStop } from "react-icons/tb";
import { motion } from 'motion/react';

export default function Bus() {
    const [selectedChild, setSelectedChild] = useState(null);
    const [availableBuses, setAvailableBuses] = useState([]);
    const [busAssignments, setBusAssignments] = useState({});
    const [isAssigning, setIsAssigning] = useState(false);

    // Fetch data
    const { data: childrenData, isLoading: childrenLoading } = useGetChildrenQuery();
    const { data: routesData, isLoading: routesLoading } = useGetActiveRoutesQuery();
    const { data: busesData, isLoading: busesLoading } = useGetAllBusesQuery();
    const [updateChild] = useUpdateChildMutation();

    // Organize buses by routes when data is loaded
    useEffect(() => {
        if (childrenData?.data && routesData?.data && busesData?.data) {
            // Initialize the bus assignments based on existing assignments
            const assignments = {};
            childrenData.data.forEach(child => {
                assignments[child._id] = child.busAssignment || {};
            });
            setBusAssignments(assignments);
        }
    }, [childrenData, routesData, busesData]);

    // Find available buses when a child is selected
    useEffect(() => {
        if (selectedChild && routesData?.data && busesData?.data) {
            console.log('Selected child:', selectedChild._id);
            
            // Get all routes assigned to this child
            const childRoutes = Array.isArray(selectedChild.routes)
                ? selectedChild.routes
                : (selectedChild.route ? [selectedChild.route] : []);
            
            console.log('Child routes:', childRoutes);

            if (childRoutes.length === 0) {
                setAvailableBuses([]);
                return;
            }

            // Find all buses assigned to these routes
            const routeBuses = [];
            childRoutes.forEach(routeId => {
                const route = routesData.data.find(r => r._id === routeId);
                console.log('Found route:', route?.name, 'with buses:', route?.buses);
                
                if (route && Array.isArray(route.buses)) {
                    // Convert bus IDs to strings for comparison
                    routeBuses.push(...route.buses);
                }
            });
            
            console.log('All route buses:', routeBuses);

            // Get bus details for all buses in these routes by converting IDs to strings for comparison
            const busDetails = busesData.data.filter(bus => {
                // Convert IDs to strings for proper comparison
                return routeBuses.some(routeBusId => 
                    routeBusId.toString() === bus._id.toString()
                );
            }).map(bus => ({
                ...bus,
                availableSeats: bus.capacity - (bus.assignedStudents?.length || 0)
            }));
            
            console.log('Filtered bus details:', busDetails);
            setAvailableBuses(busDetails);
        } else {
            setAvailableBuses([]);
        }
    }, [selectedChild, routesData, busesData]);

    // Assign a bus to a child
    const assignBusToChild = async (childId, busId) => {
        if (!childId || !busId) return;

        setIsAssigning(true);
        try {
            // Update the child record with the bus assignment
            await updateChild({
                id: childId,
                busAssignment: {
                    ...busAssignments[childId],
                    bus: busId,
                    assignedAt: new Date().toISOString()
                }
            }).unwrap();

            // Update local state
            setBusAssignments(prev => ({
                ...prev,
                [childId]: {
                    ...prev[childId],
                    bus: busId,
                    assignedAt: new Date().toISOString()
                }
            }));

            toast.success('Bus assigned successfully');
        } catch (error) {
            console.error('Error assigning bus:', error);
            toast.error(error.data?.message || 'Failed to assign bus');
        } finally {
            setIsAssigning(false);
        }
    };

    // Get route name by ID
    const getRouteName = (routeId) => {
        if (!routesData?.data) return 'Unknown route';
        const route = routesData.data.find(r => r._id === routeId);
        return route ? route.name : 'Unknown route';
    };

    // Check if a bus is already assigned to a child
    const isBusAssigned = (childId, busId) => {
        return busAssignments[childId]?.bus === busId;
    };

    const isLoading = childrenLoading || routesLoading || busesLoading;

    return (
        <div className="space-y-6 md:pt-20">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Assign School Bus</h1>

            {isLoading ? (
                <div className="text-center py-10">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <p className="mt-2 text-gray-600">Loading data...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Children List */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Select a Child</h2>

                            {childrenData?.data?.length > 0 ? (
                                <div className="space-y-3">
                                    {childrenData.data.map(child => (
                                        <div
                                            key={child._id}
                                            onClick={() => setSelectedChild(child)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedChild?._id === child._id
                                                    ? 'border-indigo-500 bg-indigo-50'
                                                    : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-lg font-bold text-indigo-600 mr-3">
                                                    {child.firstName.charAt(0)}{child.lastName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800">{child.firstName} {child.lastName}</p>
                                                    <p className="text-sm text-gray-500">{child.grade} • {child.schoolName}</p>
                                                </div>
                                            </div>

                                            {/* Show assigned routes */}
                                            {Array.isArray(child.routes) && child.routes.length > 0 ? (
                                                <div className="mt-2">
                                                    <p className="text-xs text-gray-500 mb-1">Assigned Routes:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {child.routes.map(routeId => (
                                                            <span key={routeId} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                                                                {getRouteName(routeId)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : child.route ? (
                                                <div className="mt-2">
                                                    <p className="text-xs text-gray-500 mb-1">Assigned Route:</p>
                                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                                                        {getRouteName(child.route)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <p className="mt-2 text-xs text-red-500">No routes assigned</p>
                                            )}

                                            {/* Show assigned bus if any */}
                                            {busAssignments[child._id]?.bus && (
                                                <div className="mt-2 flex items-center text-green-600 text-xs">
                                                    <HiCheck className="mr-1" />
                                                    <span>Bus assigned</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-500">
                                    <p>No children found. Please add a child first.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Available Buses */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">
                                {selectedChild ? 'Available Buses' : 'Select a Child to View Available Buses'}
                            </h2>

                            {!selectedChild ? (
                                <div className="text-center py-12 text-gray-500">
                                    <TbBusStop className="w-12 h-12 mx-auto text-gray-300" />
                                    <p className="mt-2">Please select a child from the list</p>
                                </div>
                            ) : Array.isArray(selectedChild.routes) && selectedChild.routes.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <p>This child has no routes assigned.</p>
                                    <p className="mt-2 text-sm">Please assign routes first in the "My Children" section.</p>
                                </div>
                            ) : availableBuses.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <p>No buses available for the selected routes.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {availableBuses.map(bus => (
                                        <motion.div
                                            key={bus._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="border border-gray-200 rounded-lg overflow-hidden"
                                        >
                                            <div className="bg-gray-50 p-4 border-b border-gray-200">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center">
                                                        <div className="p-2 bg-yellow-100 rounded-lg text-yellow-700 mr-3">
                                                            <TbBusStop className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-gray-800">Bus #{bus.busNumber}</h3>
                                                            <p className="text-sm text-gray-500">{bus.make} {bus.model} ({bus.year})</p>
                                                        </div>
                                                    </div>

                                                    <div className="text-right">
                                                        <div className="text-sm font-semibold">
                                                            <span className={`${bus.availableSeats > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {bus.availableSeats}
                                                            </span>
                                                            <span className="text-gray-500">/{bus.capacity} seats</span>
                                                        </div>
                                                        <p className="text-xs text-gray-500">License: {bus.licensePlate}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-4">
                                                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                                                    <div className="flex items-center">
                                                        <HiUserGroup className="w-4 h-4 text-gray-400 mr-2" />
                                                        <span className="text-gray-600">
                                                            {bus.capacity - bus.availableSeats} students
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <HiCalendar className="w-4 h-4 text-gray-400 mr-2" />
                                                        <span className="text-gray-600">
                                                            Mon-Fri
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center col-span-2">
                                                        <HiClock className="w-4 h-4 text-gray-400 mr-2" />
                                                        <span className="text-gray-600">
                                                            Morning & Afternoon routes
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        {bus.features && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {bus.features.map((feature, index) => (
                                                                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                                                        {feature}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={() => assignBusToChild(selectedChild._id, bus._id)}
                                                        disabled={isBusAssigned(selectedChild._id, bus._id) || isAssigning || bus.availableSeats <= 0}
                                                        className={`px-4 py-2 rounded-lg text-sm font-medium ${isBusAssigned(selectedChild._id, bus._id)
                                                                ? 'bg-green-100 text-green-700'
                                                                : bus.availableSeats <= 0
                                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                            }`}
                                                    >
                                                        {isBusAssigned(selectedChild._id, bus._id)
                                                            ? 'Assigned'
                                                            : bus.availableSeats <= 0
                                                                ? 'Full'
                                                                : 'Assign Bus'}
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}