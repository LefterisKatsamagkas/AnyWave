const supabase = require('../lib/supabaseClient');
const axios = require('axios');

exports.get_liked_beaches = async (req, res) => {
    try {
        const { user_id } = req.body;
        if (!user_id) {
            return res.status(400).json({ error: "user_id is required" });
        }

        const { data: likedBeaches, error } = await supabase
            .from('user_favorites')
            .select("beach_name, latitude, longitude")
            .eq("user_id", user_id);

        if (error) throw error;

        if (!likedBeaches || likedBeaches.length === 0) {
            return res.status(200).json({ message: "No liked beaches", data: [] });
        }

        const fav_beaches = await Promise.all(likedBeaches.map(async (beach) => {
            const { latitude: lat, longitude: lng, beach_name } = beach;

            try {
                const weather_url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,is_day&timezone=auto&forecast_days=1`;
                const wave_url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height&timezone=auto&forecast_days=1`;

                const [weather_response, wave_response] = await Promise.all([
                    axios.get(weather_url),
                    axios.get(wave_url)
                ]);

                const { temperature_2m, weather_code, is_day } = weather_response.data.current;
                const { wave_height } = wave_response.data.current;

                return { beach_name, temperature: temperature_2m, weather_code, is_day, wave_height, lat, lng };
            } catch (err) {
                console.error(`Error fetching data for ${beach_name}:`, err.message);
                return { beach_name, error: "Failed to fetch weather data" };
            }
        }));

        res.status(200).json({ fav_beaches });
    } catch (error) {
        console.error("Error fetching fav beaches:", error);
        res.status(400).json({ error: error.message });
    }
};
