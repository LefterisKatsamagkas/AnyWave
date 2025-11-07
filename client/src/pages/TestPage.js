import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faLocationDot, faTemperatureHalf, faWater, faChevronDown, faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getWaveDescription } from '../utils/waveConditions';
import { formatDate } from '../utils/formatDate';
import { formatDateCards } from '../utils/formatDateCards';
import { supabase } from '../lib/supabaseClient';
import { getWeatherIcon } from '../utils/weatherIcons';
import { useBeach } from '../context/beachContext';
import { useNavigate } from 'react-router-dom';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

export default function BeachPage() {
    const [searchText, setSearchText] = useState('');
    const { selectedBeach, setSelectedBeach, isLoading, setIsLoading, isTransitioning, setIsTransitioning } = useBeach();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [show6Dropdown, setShow6Dropdown] = useState(false);
    const [selectedDay, setSelectedDay] = useState(null);
    const [next6, setNext6] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
            setUser(JSON.parse(localStorage.getItem('user')));
        }
        const verify = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session && token) {
            localStorage.removeItem('token');
            setIsLoggedIn(false);
            }
        };
        verify();
    }, []);

    
    useEffect(() => {
    if (selectedBeach) {
        console.log(selectedBeach)
        setSelectedDay(selectedBeach.time);
    }
    }, [selectedBeach]);


    useEffect(() => {
        const checkIfBeachFavorited = async () => {
            if (!user?.id || !selectedBeach?.lat || !selectedBeach?.lng) {
                setSelectedBeach(prev => ({
                    ...prev,
                    isFavorited: false
                }))
                return;
            }

            const { data, error } = await supabase
                .from('user_favorites')
                .select('id')
                .eq('user_id', user.id)
                .eq('latitude', selectedBeach.lat)
                .eq('longitude', selectedBeach.lng)
                .maybeSingle();

            if (error) {
                console.log('Error checking if beach is favorited:', error);
                setSelectedBeach(prev => ({
                    ...prev,
                    isFavorited: false
                }))
                return;
            }

            setSelectedBeach(prev => ({
                    ...prev,
                    isFavorited: !!data
                }))
        };

        checkIfBeachFavorited();
    }, [user?.id, selectedBeach?.lat, selectedBeach?.lng]);

    useEffect(() => {
        const startDate = new Date(selectedBeach.time)
        startDate.setHours(0, 0, 0, 0)

        const nextDays = Array.from({ length: 6 }, (_, i) => {
            const newDate = new Date(startDate)
            newDate.setDate(startDate.getDate() + i + 1)

            // format as YYYY-MM-DDTHH:mm
            const year = newDate.getFullYear()
            const month = String(newDate.getMonth() + 1).padStart(2, '0')
            const day = String(newDate.getDate()).padStart(2, '0')
            const hours = String(newDate.getHours()).padStart(2, '0')
            const minutes = String(newDate.getMinutes()).padStart(2, '0')

            return `${year}-${month}-${day}T${hours}:${minutes}`
        })

        setNext6(nextDays);
    }, [selectedBeach?.time])

    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:5000/api/auth/logout');
            
            setIsLoggedIn(false);
            setUser(null);
            setShowDropdown(false);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
        } catch (error) {
            console.error('Logout error:', error);
            setIsLoggedIn(false);
            setUser(null);
            setShowDropdown(false);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    };

    const handleSearch = async () => {
        if (!searchText.trim()) return;
        
        setIsLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/api/weather', { searchQuery: searchText });
            
            if (response.data.coordinates && response.data.temperature && response.data.wave_height) {
                setSelectedBeach({
                    lat: response.data.coordinates.lat,
                    lng: response.data.coordinates.lng,
                    temperature: response.data.temperature,
                    weather_code: response.data.weather_code,
                    is_day: response.data.is_day,
                    wave_height: response.data.wave_height,
                    time: response.data.time,
                    local_date: response.data.timezone,
                    place_name: response.data.place_name,
                    formatted_address: response.data.formatted_address,
                    beachData: response.data.beachData || []
                });
            }
            
            setIsTransitioning(true);
            setTimeout(() => {
                setIsTransitioning(false);
            }, 600);
            
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const toggleFavorite = async () => {
        if (!isLoggedIn) {
            navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
            return
        }

        if (selectedBeach.isFavorited) {
            try {
                const { error } = await supabase
                .from('user_favorites')
                .delete()
                .eq('user_id', user.id)
                .eq('latitude', selectedBeach.lat)
                .eq('longitude', selectedBeach.lng);

                if (error) throw error;

                setSelectedBeach(prev => ({
                    ...prev,
                    isFavorited: false
                }))

            } catch (error) {
                console.log('Error removing from favorites', error);
            }
        }
        else {
            try {
                const { error } = await supabase
                .from('user_favorites')
                .insert([{
                    user_id: user.id,
                    beach_name: selectedBeach.place_name,
                    latitude: selectedBeach.lat,
                    longitude: selectedBeach.lng
                }])
                .select();
                
                if (error) throw error;
    
                setSelectedBeach(prev => ({
                    ...prev,
                    isFavorited: true
                }))
                
            } catch (error) {
                setSelectedBeach(prev => ({
                    ...prev,
                    isFavorited: false
                }))
                console.log(error);
            }
        }
    }

    // Check if a beach is selected (has coordinates)
    const isBeachSelected = selectedBeach.lat !== null && selectedBeach.lng !== null;

    useEffect(() => {
        if (!isBeachSelected) {
            navigate("/");
        }
  }, [selectedBeach, navigate]);

    function getNextHours(targetTime, count = 8) {
        let target = targetTime.slice(0,-2) + "00";
        const targetIndex = selectedBeach.beachData.findIndex(beach => beach.time === target);
        if (targetIndex === -1) return null;
        
        // Get more items initially, then filter every 3rd one
        const allNextItems = selectedBeach.beachData.slice(targetIndex + 1, targetIndex + 1 + (count * 3));
        const result = allNextItems.filter((_, index) => index % 3 === 0).slice(0, count);
        
        return result;
    }
    

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center relative">
            {/* Background Video */}
            <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
            >
                <source src="/videos/beach-bg.mp4" type="video/mp4" />
            </video>

            {/* Auth Dropdown - Top Right */}
            <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
                {isLoggedIn ? (
                    <div className="relative">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="bg-white/90 hover:bg-white text-gray-800 font-medium py-2 px-3 md:py-2 md:px-4 rounded-full shadow-md hover:shadow-lg transition-all duration-300 backdrop-blur-sm border border-white/20 flex items-center gap-2"
                        >
                            <span className="max-w-20 md:max-w-32 truncate text-sm md:text-base">
                                {user?.user_metadata?.full_name?.split(' ')[0] || 'User'}
                            </span>
                            <FontAwesomeIcon 
                                icon={faChevronDown} 
                                className={`text-xs md:text-sm transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {showDropdown && (
                            <>
                                <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={() => setShowDropdown(false)}
                                />
                                <div className="absolute right-0 mt-2 w-40 md:w-48 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-200">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 flex items-center gap-2"
                                    >
                                        <span>Sign out</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                <button
                onClick={() => navigate("/login")}
                className="bg-white/90 hover:bg-white text-gray-800 font-medium py-2 px-4 md:py-2 md:px-6 rounded-full shadow-md hover:shadow-lg transition-all duration-300 backdrop-blur-sm border border-white/20 text-sm md:text-base"
                >
                Sign in
                </button>
                )}
            </div>

            {/* Search Bar Container with Smooth Transition */}
            <div className={`
                transition-all duration-600 ease-in-out z-50 absolute top-4 left-4 flex items-center space-x-2 md:space-x-4 w-9/12 md:w-4/12 ${isTransitioning ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}`}>
                <button className="flex-shrink-0 transition-transform duration-600 ease-in-out" onClick={() => navigate('/')}>
                    <img
                        src="/images/anywave.png"
                        alt="AnyWave Logo"
                        className="h-8 md:h-12 w-auto pointer-events-none transition-all duration-600"
                    />
                </button>
                
                <div className="w-full transition-all duration-600">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search for a beach..."
                            className={`
                                w-full py-2 md:py-2 rounded-full bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 placeholder-gray-400 transition-all duration-600 text-sm md:text-md pl-4 md:pl-6 pr-8 md:pr-10'
                                ${isLoading ? 'pr-10 md:pr-12' : ''}
                            `}
                            onChange={(e) => setSearchText(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                        />
                        
                        {/* Search Button/Loader */}
                        <div className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2">
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-2 border-blue-400 border-t-transparent"></div>
                            ) : (
                                <button onClick={handleSearch}>
                                    <FontAwesomeIcon
                                        icon={faSearch}
                                        className="text-gray-400 hover:text-blue-400 transition-colors duration-300 text-xs md:text-sm"
                                    />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>


            {/* Beach Info & Map */}
            {isBeachSelected && !isLoading && (
                <div className={`
                    relative flex flex-col w-full min-h-[85vh] max-w-6xl mt-12 md:mt-16 mx-2 md:mx-0 border-4 md:border-8 border-gray-400/60 rounded-lg
                    transition-all duration-600 ease-in-out z-40
                    ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
                `}>
                    {/* First Row - Map and Info side by side */}
                    <div className="flex flex-col md:flex-row flex-1">
                        {/* Map - 2/3 width */}
                        {selectedBeach.lat && selectedBeach.lng && (
                            <div className="h-48 md:h-full w-full md:w-2/3">
                                <MapContainer
                                    center={[selectedBeach.lat, selectedBeach.lng]}
                                    zoom={12}
                                    className="h-full w-full shadow-lg overflow-hidden border-b md:border-r border-gray-400/60"
                                    style={{ height: '100%' }}
                                >
                                    <TileLayer
                                        attribution=''
                                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                    />
                                    <Marker position={[selectedBeach.lat, selectedBeach.lng]}>
                                        <Popup>
                                            <div className="text-sm">
                                                <strong className="text-base">{selectedBeach.place_name}</strong><br />
                                                {selectedBeach.formatted_address && (
                                                    <span className="text-gray-600">{selectedBeach.formatted_address}</span>
                                                )}
                                                <br />
                                                Lat: {selectedBeach.lat.toFixed(5)}<br />
                                                Lng: {selectedBeach.lng.toFixed(5)}
                                            </div>
                                        </Popup>
                                    </Marker>
                                </MapContainer>
                            </div>
                        )}
                        
                        {/* Info panel - 1/3 width */}
                        {selectedBeach.temperature && selectedBeach.wave_height && (
                            <div className='p-3 md:p-4 h-full w-full md:w-1/3 backdrop-blur-sm bg-gray-800/70 text-white flex flex-col'>
                                {/* Location Header */}
                                <div className="mb-3 md:mb-4">
                                    <h1 className="text-lg md:text-2xl font-bold flex items-center gap-2">
                                        <FontAwesomeIcon icon={faLocationDot} className="text-red-400 text-sm md:text-base" />
                                        <span className="truncate">{selectedBeach.place_name}</span>
                                        <button onClick={toggleFavorite} className="flex-shrink-0">
                                            <FontAwesomeIcon icon={selectedBeach.isFavorited ? (faHeartSolid) : (faHeartRegular)} className={`text-2xl md:text-4xl ${selectedBeach.isFavorited && ('text-red-600')}`} />
                                        </button>
                                    </h1>
                                    {selectedBeach.formatted_address && (
                                        <p className="text-gray-300 text-xs mt-1 truncate">{selectedBeach.formatted_address}</p>
                                    )}
                                </div>

                                {/* Date & Time */}
                                <div className="mb-3 md:mb-4 p-2 bg-gray-700/50 rounded-lg">
                                    <p className="text-sm md:text-lg font-semibold text-center">
                                        {formatDate(selectedBeach.local_date)}
                                    </p>
                                </div>

                                {/* Current Weather Icon */}
                                <div className="text-center mb-2 md:mb-3">
                                    <img 
                                        src={getWeatherIcon(selectedBeach.weather_code, selectedBeach.is_day)} 
                                        alt="Current weather"
                                        className="w-12 h-12 md:w-20 md:h-20 mx-auto"
                                    />
                                </div>

                                {/* Weather Data */}
                                <div className="space-y-2 md:space-y-3 flex-grow">
                                    <div className="flex items-center justify-between p-2 md:p-3 bg-blue-500/30 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <FontAwesomeIcon icon={faTemperatureHalf} className="text-yellow-300 text-sm md:text-lg" />
                                            <span className="font-semibold text-sm md:text-base">Temperature</span>
                                        </div>
                                        <span className="text-lg md:text-xl font-bold">{selectedBeach.temperature}°C</span>
                                    </div>

                                    <div className="flex items-center justify-between p-2 md:p-3 bg-blue-600/30 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <FontAwesomeIcon icon={faWater} className="text-cyan-300 text-sm md:text-lg" />
                                            <div>
                                                <span className="font-semibold text-sm md:text-base">Wave Height</span>
                                                {selectedBeach.wave_height && (
                                                    <div className={`px-2 py-1 rounded-full mt-1 text-xs ${getWaveDescription(selectedBeach.wave_height)?.bg} ${getWaveDescription(selectedBeach.wave_height)?.color}`}>
                                                        {getWaveDescription(selectedBeach.wave_height)?.condition}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-lg md:text-xl font-bold">{selectedBeach.wave_height}m</span>
                                    </div>
                                </div>

                                {/* Current Beach Conditions */}
                                <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-gray-600">
                                    <div className="text-center">
                                        <p className="text-sm md:text-base text-gray-300">Current Beach Conditions</p>
                                        {selectedBeach.wave_height && (
                                            <p className="text-sm md:text-base text-gray-300 mt-1">
                                                {getWaveDescription(selectedBeach.wave_height)?.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Second Row - Forecast Section */}
                    <div className='p-3 md:p-4 w-full backdrop-blur-sm bg-gray-800/70 text-white border-t border-gray-400/60'>
                        <div className='flex flex-row justify-between items-center pb-2'>
                            <h3 className="text-base md:text-lg font-bold text-cyan-200">
                                {selectedDay === selectedBeach.time ? (
                                    'Today'
                                ) : (
                                    new Date(selectedDay).toLocaleDateString('en-GB', { 
                                    weekday: 'long' 
                                })
                                )}'s Forecast
                            </h3>
                            <div className="relative">
                            {selectedDay && (
                                <button
                                onClick={() => setShow6Dropdown(!show6Dropdown)}
                                className="bg-white/90 hover:bg-slate-300 text-gray-800 font-medium py-1 px-3 md:py-2 md:px-4 rounded-full shadow-md hover:shadow-lg transition-all duration-300 backdrop-blur-sm border border-white/20 flex items-center gap-1 md:gap-2 text-xs md:text-base"
                                >
                                {new Date(selectedDay).toLocaleDateString('en-GB', { 
                                    day: 'numeric',
                                    month: 'numeric' 
                                })}
                                </button>
                            )}

                            {show6Dropdown && next6.length > 0 && (
                            <div className="absolute top-full left-0 mt-2 w-full bg-gray-800 rounded-lg shadow-xl border border-gray-600 z-50 max-h-40 overflow-y-auto overflow-x-hidden">
                                <div 
                                    className="px-3 py-2 md:px-4 md:py-2 hover:bg-cyan-600/50 cursor-pointer text-white transition-colors duration-150"
                                    onClick={() => {
                                        setSelectedDay(selectedBeach.time)
                                        setShow6Dropdown(false)
                                    }}
                                >
                                    <span className="text-cyan-200 font-medium text-sm md:text-base">
                                        {new Date(selectedBeach.time).toLocaleDateString('en-GB', { 
                                            day: 'numeric',
                                            month: 'numeric' 
                                        })}
                                    </span>
                                </div>
                                
                                {next6.map((day, i) => (
                                    <div
                                        key={i}
                                        className="px-3 py-2 md:px-4 md:py-2 hover:bg-cyan-600/50 cursor-pointer text-white transition-colors duration-150"
                                        onClick={() => {
                                            setSelectedDay(day)
                                            setShow6Dropdown(false)
                                        }}
                                    >
                                        <span className="text-gray-300 text-sm md:text-base">
                                            {new Date(day).toLocaleDateString('en-GB', { 
                                                day: 'numeric',
                                                month: 'numeric' 
                                            })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                            </div>
                        </div>
                        <div className="flex flex-row flex-wrap justify-center gap-2 md:gap-3 pb-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                            {selectedBeach.beachData?.length > 0 && selectedDay && getNextHours(selectedDay)?.map(item => (
                                <div 
                                    key={item.time} 
                                    className="flex-shrink-0 w-20 md:w-28 bg-gray-700/50 rounded-lg p-2 md:p-3 border border-gray-600/50 hover:bg-gray-600/50 transition-all duration-300 shadow-lg"
                                >
                                    {/* Time */}
                                    <div className="text-center mb-1 md:mb-2 border-b border-gray-600 pb-1 md:pb-2">
                                        <p className="text-xs font-semibold text-cyan-200">
                                            {new Date(item.time).toLocaleTimeString('en-US', { 
                                                hour: '2-digit', 
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>

                                    {/* Weather Icon */}
                                    <div className="text-center mb-1 md:mb-2">
                                        <img 
                                            src={getWeatherIcon(item.weather_code, item.is_day)} 
                                            alt="Weather condition"
                                            className="w-6 h-6 md:w-8 md:h-8 mx-auto"
                                        />
                                    </div>

                                    {/* Temperature and Waves Side by Side */}
                                    <div className="space-y-1 md:space-y-2">
                                        {/* Temperature */}
                                        <div className="flex items-center justify-between">
                                            <FontAwesomeIcon icon={faTemperatureHalf} className="text-yellow-300 text-xs" />
                                            <span className="text-xs font-bold">{item.temp}°C</span>
                                        </div>

                                        {/* Wave Height */}
                                        <div className="flex items-center justify-between">
                                            <FontAwesomeIcon icon={faWater} className="text-blue-300 text-xs" />
                                            <span className="text-xs font-bold">{item.height}m</span>
                                        </div>
                                    </div>

                                    {/* Wave Condition */}
                                    {item.height && (
                                        <div className={`text-xs px-1 py-1 rounded-full mt-1 md:mt-2 text-center ${getWaveDescription(item.height)?.bg} ${getWaveDescription(item.height)?.color}`}>
                                            {getWaveDescription(item.height)?.condition}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}