import { createContext, useContext, useState } from "react";

const BeachContext = createContext();

export function BeachProvider({ children }) {
    const [selectedBeach, setSelectedBeach] = useState({
            lat:null, lng:null,
            temperature: null,
            weather_code: null,
            is_day: null, 
            wave_height: null, 
            local_date: null,
            time: null, 
            place_name: null,
            formatted_address: null, 
            beachData: [],
            is_favorited: false
        });
    const [isLoading, setIsLoading] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    return (
        <BeachContext.Provider value={{
            selectedBeach,
            setSelectedBeach,
            isLoading,
            setIsLoading,
            isTransitioning,
            setIsTransitioning
        }}>
            {children}
        </BeachContext.Provider>
    )
    
}

export function useBeach() {
    const context = useContext(BeachContext);
    if (!context ) {
        throw new Error('useBeach must be used within a BeachProvider');
    }
    return context;
}
