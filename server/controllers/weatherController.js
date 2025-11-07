const axios = require('axios')
const { simplifyAddress } = require('../utils/simplifyAddress')

const googleApiKey = process.env.GOOGLE_MAPS_API_KEY

exports.getWeatherData = async (req, res) => {
  const { searchQuery, latitude, longitude, placeName } = req.body
  try {
    let lat, lng, place_name;
    // 1. Get coordinates from Google Places API if search query is given instead of coordinates
    if (searchQuery) {
      const coords = await getCoordinates(searchQuery)
      lat = coords.lat;
      lng = coords.lng;
      place_name = coords.place_name;
      console.log(`Coordinates from google lat:${lat}, lng:${lng}`)
    } else {
      lat = latitude;
      lng = longitude;
      place_name = placeName;
    }

    // 2. Get current weather forecast
    const currentWeather = await getCurrentWeather(lat, lng)
    
    // 3. Get 7-day forecast
    const sevenDayForecast = await getSevenDayForecast(lat, lng)
    
    // 4. Get wave data
    const currentWave = await getCurrentWaveData(lat, lng)
    const sevenDayWave = await getSevenDayWaveData(lat, lng)

    // 5. Combine all data
    const beachData = combineBeachData(sevenDayForecast, sevenDayWave)

    console.log('Processed beach data:', beachData.length, 'entries')
    // 6. Send response
    return res.status(200).json({
      coordinates: { lat, lng },
      temperature: currentWeather.info.temperature_2m,
      weather_code: currentWeather.info.weather_code,
      is_day: currentWeather.info.is_day,
      wave_height: currentWave.wave_height,
      timezone: currentWeather.timezone,
      place_name: place_name,
      beachData: beachData,
      time: currentWeather.info.time
    })

  } catch (error) {
    console.log('Error fetching data:', error.message)
    res.status(500).json({ error: 'Failed to fetch place or weather data' })
  }
}

// Helper functions
async function getCoordinates(searchQuery) {
  const googleUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${googleApiKey}`
  const googleResponse = await axios.get(googleUrl)
  
  if (!googleResponse.data.results || googleResponse.data.results.length === 0) {
    throw new Error('No places found')
  }

  const place = googleResponse.data.results[0]
  const { lat, lng } = place.geometry.location
  const place_name = simplifyAddress(place.formatted_address)

  return { lat, lng, place_name }
}

async function getCurrentWeather(lat, lng) {
  const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code,is_day&timezone=auto&forecast_days=1`
  const response = await axios.get(forecastUrl)
  return {info: response.data.current, timezone: response.data.timezone}
}

async function getSevenDayForecast(lat, lng) {
  const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,weather_code,is_day&timezone=auto&forecast_days=7`
  const response = await axios.get(forecastUrl)
  return response.data.hourly
}

async function getCurrentWaveData(lat, lng) {
  const waveUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height&timezone=auto&forecast_days=1`
  const response = await axios.get(waveUrl)
  console.log('Current wave height:', response.data.current.wave_height)
  return response.data.current
}

async function getSevenDayWaveData(lat, lng) {
  const waveUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&hourly=wave_height&timezone=auto&forecast_days=7`
  const response = await axios.get(waveUrl)
  return response.data.hourly
}

function combineBeachData(forecastData, waveData) {
  return forecastData.time.map((timestamp, index) => ({
    time: timestamp,
    height: waveData.wave_height[index],
    temp: forecastData.temperature_2m[index],
    weather_code: forecastData.weather_code[index],
    is_day: forecastData.is_day[index]
  }))
}