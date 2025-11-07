export const getWaveDescription = (waveHeight) => {
    const conditions = [
        { max: 0.3, description: 'No waves', color: 'text-gray-400', bg: 'bg-gray-500/30' },
        { max: 0.6, description: 'Very small waves', color: 'text-blue-300', bg: 'bg-blue-500/30' },
        { max: 1.0, description: 'Small waves', color: 'text-green-300', bg: 'bg-green-500/30' },
        { max: 1.5, description: 'Comfortable waves', color: 'text-yellow-300', bg: 'bg-yellow-500/30' },
        { max: 2.0, description: 'Moderate waves', color: 'text-orange-300', bg: 'bg-orange-500/30' },
        { max: 2.5, description: 'Strong waves', color: 'text-red-300', bg: 'bg-red-500/30' },
        { max: 3.5, description: 'Powerful waves', color: 'text-purple-300', bg: 'bg-purple-500/30' },
        { max: Infinity, description: 'Dangerous waves', color: 'text-red-500', bg: 'bg-red-700/50' }
    ];
    
    return conditions.find(condition => waveHeight <= condition.max);
};