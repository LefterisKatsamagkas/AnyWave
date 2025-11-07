export function formatDate(timezone) {
    const now = new Date();
    const datePart = now.toLocaleDateString('en-GB', {
        timeZone: timezone,
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const timePart = now.toLocaleTimeString('en-GB', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    return `${datePart} | ${timePart}`;
};

