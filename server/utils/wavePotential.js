function relativeAngle(windDir, orientation) {
    diff = Math.abs(windDir - orientation);
    return diff > 180 ? 360 - diff : diff;
}

function wavePotential(windDir, orientation, windSpeed){
    const angle = relativeAngle(windDir, orientation);
    const onshoreFactor = Math.cos((angle * Math.PI) / 180);
    const effectiveWind = Math.max(0, windSpeed * onshoreFactor);

    let level;
    if (effectiveWind < 3) level = "Calm / no waves";
    else if (effectiveWind < 6) level = "Weak waves";
    else if (effectiveWind < 10) level = "Moderate wave potential";
    else level = "Strong wave formation likely";

    return level
}

module.exports = { wavePotential };