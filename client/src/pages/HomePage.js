import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faChevronDown, faWater, faTemperatureHalf } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../lib/supabaseClient';
import { useBeach } from '../context/beachContext';
import { useNavigate } from 'react-router-dom';
import BackgroundVideo from '../components/BackgroundVideo';
import { getWeatherIcon } from '../utils/weatherIcons';
import { getWaveDescription } from '../utils/waveConditions';

export default function HomePage() {
    const [searchText, setSearchText] = useState('');
    const { setSelectedBeach, isLoading, setIsLoading, setIsTransitioning } = useBeach();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [likedBeaches, setLikedBeaches] = useState([]);
    const [beachesLoading, setBeachesLoading] = useState(false);

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
        const fetchFavoriteBeaches = async () => {
            try {
                setBeachesLoading(true);
                const response = await axios.post("http://localhost:5000/api/beaches/liked-beaches", { user_id: user.id });
                setLikedBeaches(response.data.fav_beaches);
            } catch (error) {
                console.log("Error fetching favorite beaches", error);
            } finally {
                setBeachesLoading(false);
            }
        }
        if (isLoggedIn) {
            fetchFavoriteBeaches();
        }
    }, [isLoggedIn, user?.id]);

    const handleLogout = async () => {
        console.log('logout');
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

    const handleSearch = async (input) => {
        if (!input.trim()) return;
        
        setIsLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/api/weather', { searchQuery: input });
            
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
            navigate('/beach-info');
        }
    };

    const handleBeachClicked = async (input) => {
        setIsLoading(true);
        console.log('input', input);
        const { lat: latitude, lng: longitude, beach_name: placeName} = input;
        try {
            const response = await axios.post('http://localhost:5000/api/weather', { latitude, longitude, placeName});

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
            navigate('/beach-info');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch(searchText);
        }
    };

    // Loading skeleton component
    const BeachCardSkeleton = () => (
        <div className="w-40 md:w-72 h-40 md:h-72 bg-slate-500/80 backdrop-blur-sm rounded-3xl flex items-center justify-center text-white animate-pulse border border-gray-600/50">
            <div className="text-center">
                <div className="h-4 md:h-6 bg-gray-600 rounded mx-auto w-24 md:w-32 mb-2"></div>
                <div className="w-10 h-10 md:w-16 md:h-16 bg-gray-600 rounded-full mx-auto mb-2"></div>
                <div className="space-y-1 md:space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <div className="w-3 h-3 md:w-4 md:h-4 bg-gray-600 rounded"></div>
                        <div className="h-2 md:h-3 bg-gray-600 rounded w-12 md:w-16"></div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <div className="w-3 h-3 md:w-4 md:h-4 bg-gray-600 rounded"></div>
                        <div className="h-2 md:h-3 bg-gray-600 rounded w-12 md:w-16"></div>
                    </div>
                </div>
                <div className="h-4 md:h-6 bg-gray-600 rounded-full mt-2 md:mt-3 w-full"></div>
            </div>
        </div>
    );

    return (
        <div className='relative h-screen'>
            {/* Background Video */}
            <BackgroundVideo/>
            
            {/* Content overlay */}
            <div className='absolute inset-0 flex flex-col'>
                {/* Header */}
                <div className='flex justify-end p-2 md:p-4 z-10'>
                    {isLoggedIn ? (
                        <>
                            <button 
                                onClick={() => setShowDropdown(!showDropdown)}
                                className='rounded-3xl bg-white/90 hover:bg-white py-1 md:py-2 px-3 md:px-4 text-xs md:text-base shadow-md hover:shadow-lg transition-all duration-300 backdrop-blur-sm border border-white/20 flex items-center gap-2'
                            >
                                <span className="max-w-24 truncate">
                                    {user?.user_metadata?.full_name?.split(' ')[0] || 'User'}
                                </span>
                                <FontAwesomeIcon
                                    icon={faChevronDown} 
                                    className={`text-xs transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
                                />
                            </button>
                            {showDropdown && (
                                <div className="absolute right-2 md:right-4 mt-10 md:mt-12 w-32 md:w-40 bg-white rounded-lg shadow-xl py-2 border border-gray-200 z-50">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-3 md:px-4 py-2 text-xs md:text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <button
                            onClick={() => navigate("/login")}
                            className='rounded-3xl bg-white/90 hover:bg-white py-1 md:py-2 px-3 md:px-4 text-xs md:text-base shadow-md hover:shadow-lg transition-all duration-300 backdrop-blur-sm border border-white/20'
                        >
                            Sign in
                        </button>
                    )}
                </div>

                {/* Logo and search bar */}
                <div className='flex flex-col justify-center items-center max-w-[350px] md:max-w-[650px] w-full mx-auto pt-4 pb-4 md:pt-10 z-10'>
                    <img src="/images/anywave.png" className='w-24 md:w-80 pb-4 pointer-events-none'/>
                    <div className='relative w-full'>
                        <input 
                            type="text"
                            placeholder="Search for a beach..."
                            className={`
                                w-full border rounded-2xl border-blue-700 md:py-2 pl-7 md:pl-10 md:text-lg text-base
                                bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 placeholder-gray-400
                                ${isLoading ? 'pr-10 md:pr-12' : ''}
                            `}
                            onChange={(e) => setSearchText(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                        />
                        <img
                            src="/images/favicon.png"
                            className='w-5 md:w-8 absolute top-[3px] md:top-[6.5px] left-[4px] md:left-[6.5px] select-none pointer-events-none'
                        />
                        {/* Search Button/Loader */}
                        <div className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2">
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-2 border-blue-400 border-t-transparent"></div>
                            ) : (
                                <button onClick={() => handleSearch(searchText)}>
                                    <FontAwesomeIcon
                                        icon={faSearch}
                                        className="text-gray-400 hover:text-blue-400 transition-colors duration-300 text-xs md:text-sm"
                                    />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Scrollable cards section */}
                <div className='w-full p-4 md:p-10 overflow-y-auto flex-1 z-10'>
                    {/* Loading State for Beaches */}
                    {isLoggedIn && beachesLoading && (
                        <div className='flex flex-wrap justify-center gap-4'>
                            {[...Array(4)].map((_, index) => (
                                <BeachCardSkeleton key={index} />
                            ))}
                        </div>
                    )}

                    {/* Loaded Beaches */}
                    {isLoggedIn && !beachesLoading && likedBeaches?.length > 0 && (
                        <div className='flex flex-wrap justify-center gap-4'>
                            {likedBeaches.map((beach) => (
                                <div 
                                    key={beach.beach_name} 
                                    className="w-40 md:w-72 h-40 md:h-72 bg-slate-500/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center text-white border border-gray-600/50 hover:bg-slate-400/70 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer p-4"
                                    onClick={() => {
                                        handleBeachClicked({lat: beach.lat, lng: beach.lng, beach_name: beach.beach_name});
                                    }}
                                >
                                    {/* Beach Name */}
                                    <div className="text-center mb-2 md:mb-3 border-b border-gray-600 pb-2 w-full">
                                        <p className="text-sm md:text-base font-semibold text-cyan-200 truncate">
                                            {beach.beach_name}
                                        </p>
                                    </div>

                                    {/* Weather Icon */}
                                    <div className="text-center mb-2 md:mb-3">
                                        <img 
                                            src={getWeatherIcon(beach.weather_code, beach.is_day)} 
                                            alt="Weather condition"
                                            className="w-10 h-10 md:w-12 md:h-12 mx-auto"
                                        />
                                    </div>

                                    {/* Temperature and Waves */}
                                    <div className="space-y-1 md:space-y-2 w-full px-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1 md:gap-2">
                                                <FontAwesomeIcon icon={faTemperatureHalf} className="text-yellow-300 text-xs md:text-sm" />
                                                <span className="text-xs md:text-sm">Temp</span>
                                            </div>
                                            <span className="text-xs md:text-sm font-bold">{beach.temperature}°C</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1 md:gap-2">
                                                <FontAwesomeIcon icon={faWater} className="text-blue-300 text-xs md:text-sm" />
                                                <span className="text-xs md:text-sm">Waves</span>
                                            </div>
                                            <span className="text-xs md:text-sm font-bold">{beach.wave_height}m</span>
                                        </div>
                                    </div>

                                    {/* Wave Condition */}
                                    {beach.wave_height && (
                                        <div className={`text-xs px-3 py-1 rounded-full mt-2 md:mt-3 text-center font-medium w-full ${getWaveDescription(beach.wave_height)?.bg} ${getWaveDescription(beach.wave_height)?.color}`}>
                                            {getWaveDescription(beach.wave_height)?.condition}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}