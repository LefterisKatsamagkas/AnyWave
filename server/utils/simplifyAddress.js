function simplifyAddress(formattedAddress) {
    if (!formattedAddress) return '';
    const parts = formattedAddress.split(', ').filter(part => part.trim() !== '');
    if (parts.length <= 1) return formattedAddress;
    return `${parts[0]}, ${parts[parts.length - 1]}`;
};

module.exports = { simplifyAddress };