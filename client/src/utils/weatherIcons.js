export const getWeatherIcon = (weatherCode, isDay = true) => {
  const iconMap = {
    0: isDay === 1 ? 'day_clear' : 'night_clear',
    1: isDay === 1 ? 'day_mainly_clear' : 'night_mainly_clear',
    2: isDay === 1 ? 'day_partial_cloud' : 'night_partial_cloud',
    3: 'overcast',
    45: 'fog',
    48: 'fog',
    51: isDay === 1 ? 'day_rain' : 'night_rain',
    53: isDay === 1 ? 'day_rain' : 'night_rain',
    55: isDay === 1 ? 'day_rain' : 'night_rain',
    56: isDay === 1 ? 'day_rain' : 'night_rain',
    57: isDay === 1 ? 'day_rain' : 'night_rain',
    61: 'slight_rain',
    63: 'moderate_rain',
    65: 'heavy_rain',
    66: isDay === 1 ? 'day_sleet' : 'night_sleet',
    67: 'sleet',
    71: isDay === 1 ? 'day_snow' : 'night_snow',
    73: 'snow',
    75: 'snow',
    80: isDay === 1 ? 'day_rain' : 'night_rain',
    81: 'heavy_rain',
    82: 'heavy_rain',
    95: 'rain_thunder',
    96: 'thunderstorm_hail',
    99: 'thunderstorm_hail'
  };
  
  const iconName = iconMap[weatherCode] || 'overcast';
  return `/weather_icons/${iconName}.svg`;
};