const date = new Date();
const londonTime = date.toLocaleString("en-US", {
  timeZone: "Europe/London",
});
console.log("London:", londonTime);
// Convert your parallel arrays into an array of objects
const timestamps = ['2025-10-15T08:00:00.000Z', '2025-10-15T09:00:00.000Z', '2025-10-15T10:00:00.000Z'];
const waveHeights = [2.1, 2.4, 2.8];

// Best storage format
const wavesData = timestamps.map((timestamp, index) => ({
  time: timestamp,
  height: waveHeights[index]
}));

// Query function
function getNextSixWaves(targetTime, count = 6) {
  const targetIndex = wavesData.findIndex(wave => wave.time === targetTime);
  
  if (targetIndex === -1) return null;
  
  return wavesData.slice(targetIndex + 1, targetIndex + 1 + count);
}

// Usage
const result = getNextSixWaves('2025-10-15T08:00:00.000Z', 6);
console.log(result);