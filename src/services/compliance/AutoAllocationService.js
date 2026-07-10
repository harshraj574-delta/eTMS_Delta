import axios from 'axios';

// Configuration
// const ROUTING_ENGINE_BASE_URL = 'http://localhost:5001';
const ROUTING_ENGINE_BASE_URL = 'https://ftqbvxxmpm.ap-south-1.awsapprunner.com';
const REOPTIMIZE_API_URL = `${ROUTING_ENGINE_BASE_URL}/api/v2/route-generation/reoptimize`;
const GENERATE_API_URL = `${ROUTING_ENGINE_BASE_URL}/api/v2/route-generation/generate`;
const ALLOCATE_ASYNC_API_URL = `${ROUTING_ENGINE_BASE_URL}/api/v2/route-generation/allocate/async`;
const JOBS_API_URL = `${ROUTING_ENGINE_BASE_URL}/api/v2/route-generation/jobs`;
const IN_PROGRESS_API_URL = `${ROUTING_ENGINE_BASE_URL}/api/v2/route-generation/in-progress`;
const MAX_EMPLOYEES_PER_ROUTE = 12;
const DEFAULT_RADIUS_KM = 2;
const PICKUP_TIME_PER_EMPLOYEE = 420;
const NUM_SECTORS = 8;
const SECTOR_SIZE = 360 / NUM_SECTORS;

// Scoring weights for route matching
const WEIGHTS = {
  SECTOR_EXACT: 50,      // Same sector
  SECTOR_ADJACENT: 25,   // Adjacent sector
  DISTANCE_IN_RANGE: 30, // Within route's distance range
  DISTANCE_EXTENDABLE: 15, // Slightly extends route appropriately
  PROXIMITY_BASE: 20,    // Base proximity score
};

const normalizeGender = (gender) => {
  if (!gender) return "M";
  const g = gender.toString().trim().toUpperCase();
  return (g === "FEMALE" || g === "F") ? "F" : "M";
};

const toRad = (deg) => deg * (Math.PI / 180);

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Calculate bearing from facility to a point (0=North, 90=East, 180=South, 270=West)
 */
const calculateBearing = (facilityLat, facilityLng, pointLat, pointLng) => {
  const dLng = toRad(pointLng - facilityLng);
  const lat1 = toRad(facilityLat);
  const lat2 = toRad(pointLat);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
};

const getSectorIndex = (bearing) => Math.floor(bearing / SECTOR_SIZE) % NUM_SECTORS;

/**
 * Calculate angular difference between two sectors (accounts for wrap-around)
 */
const getSectorDifference = (sector1, sector2) => {
  const diff = Math.abs(sector1 - sector2);
  return Math.min(diff, NUM_SECTORS - diff);
};

/**
 * Analyze a route's directional characteristics relative to facility
 */
const analyzeRouteDirection = (route, facilityGeo) => {
  if (!route.employees.length) return null;

  const employeeMetrics = route.employees.map(emp => {
    const bearing = calculateBearing(facilityGeo.geoY, facilityGeo.geoX, emp.geoY, emp.geoX);
    const distFromFacility = calculateDistance(facilityGeo.geoY, facilityGeo.geoX, emp.geoY, emp.geoX);
    return { bearing, distFromFacility, sectorIndex: getSectorIndex(bearing) };
  });

  // Count employees per sector
  const sectorCounts = new Array(NUM_SECTORS).fill(0);
  employeeMetrics.forEach(e => sectorCounts[e.sectorIndex]++);

  // Find dominant sector (most employees)
  const dominantSector = sectorCounts.indexOf(Math.max(...sectorCounts));

  // Calculate bearing statistics using circular mean
  const sinSum = employeeMetrics.reduce((sum, e) => sum + Math.sin(toRad(e.bearing)), 0);
  const cosSum = employeeMetrics.reduce((sum, e) => sum + Math.cos(toRad(e.bearing)), 0);
  const avgBearing = (Math.atan2(sinSum, cosSum) * 180 / Math.PI + 360) % 360;

  // Distance range
  const distances = employeeMetrics.map(e => e.distFromFacility);
  const minDist = Math.min(...distances);
  const maxDist = Math.max(...distances);

  return {
    dominantSector,
    avgBearing,
    minDist,
    maxDist,
    sectorCounts,
    employeeMetrics
  };
};

export const groupRoutesByRouteId = (routeData, facilityGeo = null) => {
  const routes = {};

  routeData.forEach(emp => {
    const routeId = emp.routeId;
    if (!routes[routeId]) {
      routes[routeId] = {
        routeId,
        locationName: emp.locationName,
        shiftDate: emp.shiftDate,
        employees: [],
        currentCount: 0,
        analysis: null
      };
    }
    routes[routeId].employees.push({
      empCode: emp.empCode,
      employeeId: emp.employeeId,
      stopNo: emp.stopno,
      geoX: emp.geoX,
      geoY: emp.geoY,
      gender: normalizeGender(emp.Gender)
    });
    routes[routeId].currentCount++;
  });

  // Analyze direction for each route if facility coordinates provided
  if (facilityGeo) {
    Object.values(routes).forEach(route => {
      route.analysis = analyzeRouteDirection(route, facilityGeo);
    });
  }

  return routes;
};

/**
 * Find best route for an employee considering direction, distance, and proximity
 */
export const findBestRouteForEmployee = (employee, routes, facilityGeo, tripType, maxRadiusKm = DEFAULT_RADIUS_KM) => {
  const empLat = employee.GeoY;
  const empLon = employee.GeoX;

  if (!empLat || !empLon || empLat === 0 || empLon === 0) {
    console.log(`[Allocation] Employee ${employee.empCode} has invalid coordinates`);
    return null;
  }

  const empBearing = calculateBearing(facilityGeo.geoY, facilityGeo.geoX, empLat, empLon);
  const empSector = getSectorIndex(empBearing);
  const empDistFromFacility = calculateDistance(facilityGeo.geoY, facilityGeo.geoX, empLat, empLon);
  const isPickup = tripType === 'P' || tripType?.toUpperCase() === 'PICKUP';

  let bestMatch = null;
  let bestScore = -Infinity;

  Object.values(routes).forEach(route => {
    // Skip full routes
    if (route.currentCount >= MAX_EMPLOYEES_PER_ROUTE) return;

    const analysis = route.analysis;
    if (!analysis) return;

    // 1. SECTOR SCORE - prioritize routes going in the same direction
    const sectorDiff = getSectorDifference(empSector, analysis.dominantSector);
    let sectorScore = 0;
    if (sectorDiff === 0) {
      sectorScore = WEIGHTS.SECTOR_EXACT;
    } else if (sectorDiff === 1) {
      sectorScore = WEIGHTS.SECTOR_ADJACENT;
    } else {
      sectorScore = -20 * sectorDiff; // Penalize distant sectors
    }

    // 2. DISTANCE SCORE - check if employee fits the route's distance profile
    let distanceScore = 0;
    const { minDist, maxDist } = analysis;
    const distanceBuffer = 1; // 1km buffer

    if (empDistFromFacility >= minDist - distanceBuffer && empDistFromFacility <= maxDist + distanceBuffer) {
      // Within or close to route's distance range
      distanceScore = WEIGHTS.DISTANCE_IN_RANGE;
    } else if (isPickup && empDistFromFacility > maxDist) {
      // For PICKUP: farther employees are picked first, so extending outward is acceptable
      const overshoot = empDistFromFacility - maxDist;
      distanceScore = overshoot <= 3 ? WEIGHTS.DISTANCE_EXTENDABLE - (overshoot * 3) : -10;
    } else if (!isPickup && empDistFromFacility < minDist) {
      // For DROP: closer employees are dropped first, so extending inward is acceptable
      const undershoot = minDist - empDistFromFacility;
      distanceScore = undershoot <= 3 ? WEIGHTS.DISTANCE_EXTENDABLE - (undershoot * 3) : -10;
    } else {
      distanceScore = -15; // Wrong direction of extension
    }

    // 3. PROXIMITY SCORE - still consider physical proximity to route employees
    let minProximity = Infinity;
    route.employees.forEach(routeEmp => {
      const dist = calculateDistance(empLat, empLon, routeEmp.geoY, routeEmp.geoX);
      if (dist < minProximity) minProximity = dist;
    });

    let proximityScore = 0;
    if (minProximity <= maxRadiusKm) {
      proximityScore = WEIGHTS.PROXIMITY_BASE * (1 - minProximity / maxRadiusKm);
    } else if (minProximity <= maxRadiusKm * 2) {
      // Allow slightly larger radius if sector matches well
      proximityScore = sectorDiff <= 1 ? 5 : -30;
    } else {
      proximityScore = -50; // Too far from any route employee
    }

    const totalScore = sectorScore + distanceScore + proximityScore;

    if (totalScore > bestScore && totalScore > 0) {
      bestScore = totalScore;
      bestMatch = {
        route,
        score: totalScore,
        breakdown: { sectorScore, distanceScore, proximityScore },
        minProximity,
        empSector,
        routeSector: analysis.dominantSector,
        empDistFromFacility
      };
    }
  });

  return bestMatch;
};

/**
 * Legacy proximity-only matching (fallback)
 */
export const findNearestRouteForEmployee = (employee, routes, maxRadiusKm = DEFAULT_RADIUS_KM) => {
  let nearestRoute = null;
  let minDistance = Infinity;

  const empLat = employee.GeoY;
  const empLon = employee.GeoX;

  if (!empLat || !empLon || empLat === 0 || empLon === 0) return null;

  Object.values(routes).forEach(route => {
    if (route.currentCount >= MAX_EMPLOYEES_PER_ROUTE) return;

    route.employees.forEach(routeEmp => {
      const distance = calculateDistance(empLat, empLon, routeEmp.geoY, routeEmp.geoX);
      if (distance <= maxRadiusKm && distance < minDistance) {
        minDistance = distance;
        nearestRoute = { route, nearestEmployee: routeEmp, distance };
      }
    });
  });

  return nearestRoute;
};

/**
 * Main allocation algorithm with directional awareness
 */
export const allocateEmployeesToRoutes = (
  existingRouteData,
  exceptionEmployees,
  facilityGeo = null,
  tripType = 'PICKUP'
) => {
  // Group routes and analyze directions if facility provided
  const routes = groupRoutesByRouteId(existingRouteData, facilityGeo);

  const allocated = [];
  const unallocated = [];
  const allocationDetails = [];

  // Sort exception employees by distance from facility (farthest first for PICKUP, nearest first for DROP)
  // This helps allocate employees in an order that makes sense for the route direction
  const isPickup = tripType === 'P' || tripType?.toUpperCase() === 'PICKUP';
  const sortedEmployees = facilityGeo
    ? [...exceptionEmployees].sort((a, b) => {
      const distA = calculateDistance(facilityGeo.geoY, facilityGeo.geoX, a.GeoY, a.GeoX);
      const distB = calculateDistance(facilityGeo.geoY, facilityGeo.geoX, b.GeoY, b.GeoX);
      return isPickup ? distB - distA : distA - distB;
    })
    : exceptionEmployees;

  sortedEmployees.forEach(emp => {
    let matchResult = null;

    // Try direction-aware matching first if facility coordinates available
    if (facilityGeo) {
      matchResult = findBestRouteForEmployee(emp, routes, facilityGeo, tripType);
    }

    // Fallback to proximity-only matching
    if (!matchResult) {
      const proximityResult = findNearestRouteForEmployee(emp, routes);
      if (proximityResult) {
        matchResult = {
          route: proximityResult.route,
          score: 0,
          breakdown: { sectorScore: 0, distanceScore: 0, proximityScore: 0 },
          minProximity: proximityResult.distance,
          fallback: true
        };
      }
    }

    if (matchResult && matchResult.route.currentCount < MAX_EMPLOYEES_PER_ROUTE) {
      const route = matchResult.route;
      const newStopNo = route.employees.length + 1;

      route.employees.push({
        empCode: emp.empCode,
        employeeId: emp.id || emp.employeeeId,
        stopNo: newStopNo,
        geoX: emp.GeoX,
        geoY: emp.GeoY,
        gender: normalizeGender(emp.Gender),
        isNewlyAdded: true
      });
      route.currentCount++;

      // Re-analyze route direction after adding employee
      if (facilityGeo) {
        route.analysis = analyzeRouteDirection(route, facilityGeo);
      }

      allocated.push(emp);
      allocationDetails.push({
        empCode: emp.empCode,
        empName: emp.empName,
        assignedToRoute: route.routeId,
        score: matchResult.score,
        scoreBreakdown: matchResult.breakdown,
        proximity: matchResult.minProximity?.toFixed(2) + ' km',
        empSector: matchResult.empSector,
        routeSector: matchResult.routeSector,
        fallback: matchResult.fallback || false,
        newStopNo
      });

      console.log(
        `[Allocation] ${emp.empCode} → route ${route.routeId} ` +
        `(score: ${matchResult.score?.toFixed(1)}, sector: ${matchResult.empSector}→${matchResult.routeSector}, ` +
        `proximity: ${matchResult.minProximity?.toFixed(2)}km)`
      );
    } else {
      unallocated.push(emp);
      console.log(`[Allocation] ${emp.empCode} - no suitable route found`);
    }
  });

  return {
    allocatedRoutes: routes,
    allocatedEmployees: allocated,
    unallocatedEmployees: unallocated,
    allocationDetails
  };
};

export const buildRecalculateJson = (routes, facilityGeo, shiftTime, city, tripType) => {
  const routeArray = Object.values(routes)
    .filter(route => route.employees.some(emp => emp.isNewlyAdded))
    .map(route => ({
      routeId: route.routeId,
      employees: route.employees.map(emp => ({
        empCode: emp.empCode,
        geoX: emp.geoX,
        geoY: emp.geoY,
        gender: emp.gender || "M",
        isNewlyAdded: emp.isNewlyAdded || false  // Include flag for backend insertion logic
      }))
    }));

  if (routeArray.length === 0) return null;

  return {
    routes: routeArray,
    facility: { geoX: facilityGeo.geoX, geoY: facilityGeo.geoY },
    shiftTime,
    pickupTimePerEmployee: PICKUP_TIME_PER_EMPLOYEE,
    reportingTime: parseInt(shiftTime),
    city: city.toLowerCase(),
    tripType: tripType === 'P' ? 'PICKUP' : 'DROP'
  };
};

export const callGenerateApi = async (inputJson) => {
  console.log('[AutoAllocation] Calling generate API');
  const response = await fetch(GENERATE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    mode: 'cors',
    credentials: 'omit',
    body: JSON.stringify(inputJson)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Generate API failed: ${response.status} ${response.statusText}. ${errorText}`);
  }

  return response.json();
};

export const callRecalculateApi = async (inputJson) => {
  console.log('[AutoAllocation] Calling reoptimize API');
  const response = await axios.post(REOPTIMIZE_API_URL, inputJson, {
    headers: { 'Content-Type': 'application/json' }
  });
  return response.data;
};

// --- Async Allocation Job Helpers (routing engine runs the whole pipeline) ---

export const startAsyncAutoAllocation = async ({ facilityid, sDate, triptype, shifttime, updatedBy, empCodes }) => {
  const response = await fetch(ALLOCATE_ASYNC_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    mode: 'cors',
    credentials: 'omit',
    // mainBackendUrl empty: the engine uses its MAIN_BACKEND_URL env var
    // empCodes (optional, comma-separated): allocate only these employees
    body: JSON.stringify({ facilityid, sDate, triptype, shifttime, updatedBy, mainBackendUrl: '', empCodes: empCodes || '' })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to start auto allocation: ${response.status} ${errorText}`);
  }

  return response.json();
};

export const getAllocationJobStatus = async (jobId) => {
  const response = await fetch(`${JOBS_API_URL}/${jobId}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    mode: 'cors',
    credentials: 'omit'
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch job status: ${response.status} ${errorText}`);
  }

  return response.json();
};

export const checkInProgressJob = async ({ facilityid, sDate, triptype }) => {
  const params = new URLSearchParams({ facilityid: String(facilityid), sDate, triptype });
  try {
    const response = await fetch(`${IN_PROGRESS_API_URL}?${params}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      mode: 'cors',
      credentials: 'omit'
    });
    if (!response.ok) return { inProgress: false };
    return response.json();
  } catch (_) {
    // Non-fatal: if the check fails, let the caller proceed normally
    return { inProgress: false };
  }
};

export default {
  calculateDistance,
  calculateBearing,
  getSectorIndex,
  groupRoutesByRouteId,
  findBestRouteForEmployee,
  findNearestRouteForEmployee,
  allocateEmployeesToRoutes,
  buildRecalculateJson,
  callGenerateApi,
  callRecalculateApi,
  startAsyncAutoAllocation,
  getAllocationJobStatus,
  checkInProgressJob,
  MAX_EMPLOYEES_PER_ROUTE,
  DEFAULT_RADIUS_KM,
  NUM_SECTORS
};