// npm install axios
const axios = require('axios');
require('dotenv').config();

const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;

// ---- Utilities ----
const toRad = d => d * Math.PI / 180;
const toDeg = r => r * 180 / Math.PI;

// Haversine distance (meters)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Bearing from point A to B (deg from north)
function bearing(lat1, lon1, lat2, lon2) {
  const y = Math.sin(toRad(lon2-lon1)) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1))*Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1))*Math.cos(toRad(lat2))*Math.cos(toRad(lon2-lon1));
  return (toDeg(Math.atan2(y,x)) + 360) % 360;
}

// Destination point given start, bearing (deg), distance (m) -> lat/lon
function destinationPoint(lat, lon, brngDeg, distMeters) {
  const R = 6371000;
  const brng = toRad(brngDeg);
  const φ1 = toRad(lat);
  const λ1 = toRad(lon);
  const δ = distMeters / R;
  const φ2 = Math.asin( Math.sin(φ1)*Math.cos(δ) + Math.cos(φ1)*Math.sin(δ)*Math.cos(brng) );
  const λ2 = λ1 + Math.atan2(Math.sin(brng)*Math.sin(δ)*Math.cos(φ1),
                             Math.cos(δ) - Math.sin(φ1)*Math.sin(φ2));
  return [ (toDeg(φ2)), (toDeg(λ2)) ];
}

// Project point P onto segment AB, return nearest point and t (0..1)
function projectPointOnSegment(latP, lonP, latA, lonA, latB, lonB) {
  // Convert lat/lon to ECEF-ish using simple local approximation (meters)
  // For small distances this is OK.
  const mx = (lon) => lon * 111320 * Math.cos(toRad(latP)); // approximate meter per deg lon at latP
  const my = (lat) => lat * 110574; // meter per deg lat approx
  const Ax = mx(lonA), Ay = my(latA);
  const Bx = mx(lonB), By = my(latB);
  const Px = mx(lonP), Py = my(latP);
  const vx = Bx - Ax, vy = By - Ay;
  const wx = Px - Ax, wy = Py - Ay;
  const vlen2 = vx*vx + vy*vy;
  let t = vlen2 === 0 ? 0 : (vx*wx + vy*wy) / vlen2;
  if (t < 0) t = 0;
  if (t > 1) t = 1;
  const nx = Ax + vx * t, ny = Ay + vy * t;
  // convert back to lat/lon approx:
  const nearestLat = ny / 110574;
  const nearestLon = nx / (111320 * Math.cos(toRad(latP)));
  const dist = Math.sqrt((Px-nx)**2 + (Py-ny)**2);
  return { lat: nearestLat, lon: nearestLon, t, distMeters: dist };
}

// ---- Overpass helpers ----
async function overpassQuery(query) {
  const url = 'https://overpass-api.de/api/interpreter';
  const res = await axios.post(url, query, { headers: { 'Content-Type': 'text/plain' }, timeout: 20000 });
  return res.data;
}

// Build Overpass query for coastline / beach ways around point
function buildCoastQuery(lat, lon, radiusMeters = 800) {
  // fetch coastline and beach ways with geometry
  return `[out:json][timeout:25];
(
  way["natural"="coastline"](around:${radiusMeters},${lat},${lon});
  way["natural"="beach"](around:${radiusMeters},${lat},${lon});
);
out geom;`;
}

// Build Overpass query to check for water features near a point
async function isWater(lat, lon) {
  const url = `https://maps.googleapis.com/maps/api/elevation/json?locations=${lat},${lon}&key=${googleApiKey}`;
  try {
    const response = await axios.get(url);
    const data = response.data;

    if (data.status === "OK") {
      const elevation = data.results[0].elevation;
      return elevation <= 0;
    } else {
      throw new Error(`Google Maps API error: ${data.status}`);
    }
  } catch (error) {
    console.error(error);
    return false;
  }
}

// ---- Main function: get shoreline orientation toward sea ----
async function getShorelineOrientation(beachLat, beachLon) {
  // 1) Get coastline/beach ways
  const q = buildCoastQuery(beachLat, beachLon, 1000);
  const res = await overpassQuery(q);

  if (!res.elements || res.elements.length === 0) {
    throw new Error('No coastline/beach ways found nearby. Increase radius or use OSM data dump.');
  }

  // 2) Iterate ways and segments to find closest segment
  let best = { distMeters: Infinity };
  for (const el of res.elements) {
    if (!el.geometry || el.geometry.length < 2) continue;
    for (let i = 0; i < el.geometry.length - 1; i++) {
      const A = el.geometry[i];
      const B = el.geometry[i+1];
      const proj = projectPointOnSegment(beachLat, beachLon, A.lat, A.lon, B.lat, B.lon);
      if (proj.distMeters < best.distMeters) {
        best = {
          distMeters: proj.distMeters,
          way: el,
          segA: A,
          segB: B,
          proj
        };
      }
    }
  }

  // 3) Compute tangent bearing of the closest segment (A -> B)
  const segBearing = bearing(best.segA.lat, best.segA.lon, best.segB.lat, best.segB.lon); // 0..360
  // Two candidate normals pointing toward sea: segBearing + 90 and segBearing - 90
  const normal1 = (segBearing + 90) % 360;
  const normal2 = (segBearing + 270) % 360; // same as -90

  // 4) sample two points a short distance from the projected point along the normals
  const sampleDist = 150; // meters
  const sample1 = destinationPoint(best.proj.lat, best.proj.lon, normal1, sampleDist);
  const sample2 = destinationPoint(best.proj.lat, best.proj.lon, normal2, sampleDist);

  // 5) Query Overpass to see which sample point is near water

  const hasWater1 = await isWater(sample1[0], sample1[1]);
  const hasWater2 = await isWater(sample2[0], sample2[1]);

  console.log(sample1, sample2)
  console.log(hasWater1, hasWater2);

  // 6) Decide:
  let shoreDir; // direction pointing toward sea
  if (hasWater1 && !hasWater2) {
    shoreDir = normal1;
  } else if (!hasWater1 && hasWater2) {
    shoreDir = normal2;
  } else if (hasWater1 && hasWater2) {
    // both sample points have water nearby - choose the one with closer water element
    // (simpler fallback: choose normal1)
    shoreDir = normal1;
  } else {
    // neither sample point found water - fallback: choose the normal that points farther from the beach point toward lower elevation or just use normal1
    shoreDir = normal1;
  }

  return shoreDir.toFixed(2);
}

module.exports = {
  getShorelineOrientation
};

