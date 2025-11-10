import React from 'react';
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
            await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/logout`);
            
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
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/weather`, { searchQuery: searchText });
            
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
        <div className='bg-slate-800 h-screen flex flex-col'>
            {/* Background Video */}
            <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
            >
                <source src="/AnyWave/videos/beach-bg.mp4" type="video/mp4" />
            </video>

            {/* Header */}
            <div className='flex flex-row md:justify-between items-center p-2 md:p-4 gap-4 relative z-50'>
                {/* SearchBar */}
                <div className='flex items-center justify-center gap-2 w-[600px] md:w-[600px] md:pr-4'>
                    <button onClick={() => {navigate('/')}}>
                        <img src='/AnyWave/images/anywave.png' className='w-14 md:w-20'></img>
                    </button>
                    <div className="relative w-full">
                        <input
                            type='text' 
                            placeholder='Search for a beach...'
                            className='rounded-3xl px-4 py-[3px] text-sm md:text-base w-full border border-blue-700 bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 placeholder-gray-400'
                            onChange={(e) => setSearchText(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                        >
                        </input>
                        {isLoading && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-400 border-t-transparent"></div>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Auth Button */}
                {isLoggedIn ? (
                    <div className="relative">
                        <button 
                            className='rounded-3xl bg-white py-1 md:py-2 px-3 md:px-4 text-xs md:text-base self-end'
                            onClick={() => setShowDropdown(!showDropdown)}
                        >
                            {user?.user_metadata?.full_name?.split(' ')[0] || 'Username'}
                        </button>

                        {showDropdown && (
                            <>
                                <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={() => setShowDropdown(false)}
                                />
                                <div className="absolute right-0 mt-2 w-24 md:w-48 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-200">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-1 md:py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 flex items-center gap-2"
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
                        className='rounded-3xl bg-white py-1 md:py-2 px-3 md:px-4 text-xs md:text-base self-end whitespace-nowrap'
                    >
                        Sign in
                    </button>
                )}
            </div>

            {/* Info Table */}
            <div className='flex flex-col w-full h-full md:max-w-6xl self-center overflow-hidden relative flex-grow'>
                {/* Map and Info */}
                <div className='flex flex-1 flex-col md:flex-row flex-grow md:flex-grow-0 border-2 md:border-t-8 md:border-x-8 border-gray-400/60 rounded-t-2xl'>
                    {/* Map */}
                    {isBeachSelected && selectedBeach.lat && selectedBeach.lng && (
                        <div className="flex-1 w-full h-1/2 md:h-auto z-10 rounded-t-lg md:rounded-tr-none overflow-hidden">
                            <MapContainer
                                center={[selectedBeach.lat, selectedBeach.lng]}
                                zoom={12}
                                className="h-full w-full"
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
                    
                    {/* Info */}
                    {isBeachSelected && selectedBeach.temperature && selectedBeach.wave_height && (
                        <div className='flex-1 md:h-full md:flex-[0.6] flex flex-col items-center border-l-2 border-gray-500 p-4 gap-1 md:gap-2 backdrop-blur-sm bg-gray-800/70 lg md:rounded-tr-lg'>
                            {/* Place and Favorited */}
                            <div className='flex justify-center items-center text-base md:text-2xl text-white space-x-2'>
                                <FontAwesomeIcon icon={faLocationDot} className='text-red-400 text-sm md:text-base'></FontAwesomeIcon>
                                <h1 className="truncate font-bold">{selectedBeach.place_name}</h1>
                                <button onClick={toggleFavorite}>
                                    <FontAwesomeIcon 
                                        icon={selectedBeach.isFavorited ? faHeartSolid : faHeartRegular} 
                                        className='text-red-600 text-2xl md:text-4xl'
                                    />
                                </button>
                            </div>
                            {/* Date */}
                            <h2 className='w-full bg-gray-700/50 text-sm md:text-xl text-white rounded-lg p-2 text-center'>
                                {formatDate(selectedBeach.local_date)}
                            </h2>
                            {/* Weather Icon */}
                            <img 
                                src={getWeatherIcon(selectedBeach.weather_code, selectedBeach.is_day)} 
                                className='w-12 md:w-20 h-12 md:h-20'
                            />
                            {/* Temperature */}
                            <div className='flex text-white text-sm md:text-lg justify-between w-full bg-blue-500/30 rounded-lg p-2'>
                                <div className="flex items-center gap-2">
                                    <FontAwesomeIcon icon={faTemperatureHalf} className='text-yellow-400 text-sm md:text-lg'></FontAwesomeIcon>
                                    Temperature
                                </div>
                                <span className="text-lg md:text-xl font-bold">{selectedBeach.temperature}°C</span>
                            </div>
                            {/* Wave Height */}
                            <div className='flex text-white text-sm md:text-lg justify-between w-full bg-blue-600/30 rounded-lg p-2'>
                                <div className="flex items-center gap-2">
                                    <FontAwesomeIcon icon={faWater} className='text-blue-400 text-sm md:text-lg'></FontAwesomeIcon>
                                    Wave Height
                                </div>
                                <span className="text-lg md:text-xl font-bold">{selectedBeach.wave_height}m</span>
                            </div>
                            {/* Beach Conditions */}
                            <div className='flex flex-col w-full border-t border-t-gray-500 text-white text-xs md:text-base text-center mt-1 md:mt-4 pt-1 md:pt-4'>
                                <h2>Current Beach Conditions</h2>
                                {selectedBeach.wave_height && (
                                    <h2 className="text-gray-300 mt-1">
                                        {getWaveDescription(selectedBeach.wave_height)?.description}
                                    </h2>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Cards */}
                {isBeachSelected && (
                    <div className='flex flex-[0.45] md:flex-[0.7] flex-col border-b-2 md:border-b-8 border-x-2 md:border-x-8 border-gray-400/60 p-2 overflow-y-auto backdrop-blur-sm bg-gray-800/70 rounded-b-2xl'>
                        <div className='flex justify-between items-center pb-2 px-4'>
                            <h2 className='text-sm md:text-lg font-bold text-cyan-200'>
                                {selectedDay === selectedBeach.time ? 'Today' : new Date(selectedDay).toLocaleDateString('en-GB', { weekday: 'long' })}'s Forecast
                            </h2>
                            <div className="relative">
                                {selectedDay && (
                                    <button
                                        onClick={() => setShow6Dropdown(!show6Dropdown)}
                                        className='bg-white/90 hover:bg-slate-300 text-gray-800 font-medium py-1 px-3 md:py-2 md:px-4 rounded-full shadow-md hover:shadow-lg transition-all duration-300 backdrop-blur-sm border border-white/20 flex items-center gap-1 md:gap-2 text-xs md:text-base'
                                    >
                                        {new Date(selectedDay).toLocaleDateString('en-GB', { 
                                            day: 'numeric',
                                            month: 'numeric' 
                                        })}
                                    </button>
                                )}

                                {show6Dropdown && next6.length > 0 && (
                                    <div className="absolute top-full right-0 mt-2 w-full bg-gray-800 rounded-lg shadow-xl border border-gray-600 z-50 max-h-36 md:max-h-40 overflow-y-auto overflow-x-hidden">
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
                        <div className='flex flex-row flex-wrap justify-center gap-2 md:gap-3 pb-2 overflow-y-auto'>
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
                                            <FontAwesomeIcon icon={faTemperatureHalf} className="text-yellow-300 text-xs md:text-sm" />
                                            <span className="text-xs md:text-sm font-bold text-white">{item.temp}°C</span>
                                        </div>

                                        {/* Wave Height */}
                                        <div className="flex items-center justify-between">
                                            <FontAwesomeIcon icon={faWater} className="text-blue-300 text-xs md:text-sm" />
                                            <span className="text-xs md:text-sm font-bold text-white">{item.height}m</span>
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
                )}
            </div>
        </div>
    )}