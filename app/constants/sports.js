export const SPORTS = [
    'Soccer', 'Basketball', 'Tennis', 'Volleyball', 'Pickleball',
    'Baseball', 'Football', 'Handball', 'Softball', 'Dodgeball', 'Kickball',
];

export const SPORT_COLORS = {
    Soccer: '#4CAF50', Basketball: '#FF9800', Tennis: '#2196F3',
    Volleyball: '#9C27B0', Pickleball: '#e94560', Baseball: '#795548',
    Football: '#607D8B', Handball: '#E91E63', Softball: '#FFC107',
    Dodgeball: '#009688', Kickball: '#FF9800',
};

export const SPORT_ICONS = {
    Soccer: 'football-outline', Basketball: 'basketball-outline',
    Tennis: 'tennisball-outline', Volleyball: 'baseball-outline',
    Pickleball: 'baseball-outline', Baseball: 'baseball-outline',
    Football: 'american-football-outline', Handball: 'hand-left-outline',
    Softball: 'baseball-outline', Dodgeball: 'radio-button-on-outline',
    Kickball: 'football-outline',
};

export const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

export const cap = str => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

export const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export const formatDateLong = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

export const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
};

export const COUNTRY_FLAGS = {
    'United States': '🇺🇸', 'Mexico': '🇲🇽', 'Guatemala': '🇬🇹', 'Canada': '🇨🇦',
    'Brazil': '🇧🇷', 'Argentina': '🇦🇷', 'Colombia': '🇨🇴', 'Spain': '🇪🇸',
    'United Kingdom': '🇬🇧', 'France': '🇫🇷', 'Germany': '🇩🇪', 'Italy': '🇮🇹',
    'Honduras': '🇭🇳', 'El Salvador': '🇸🇻', 'Nicaragua': '🇳🇮', 'Costa Rica': '🇨🇷',
    'Venezuela': '🇻🇪', 'Peru': '🇵🇪', 'Chile': '🇨🇱', 'Ecuador': '🇪🇨',
    'Japan': '🇯🇵', 'South Korea': '🇰🇷', 'China': '🇨🇳', 'India': '🇮🇳',
    'Nigeria': '🇳🇬', 'Ghana': '🇬🇭', 'South Africa': '🇿🇦', 'Kenya': '🇰🇪',
    'Dominican Republic': '🇩🇴', 'Puerto Rico': '🇵🇷', 'Jamaica': '🇯🇲',
    'Australia': '🇦🇺', 'Portugal': '🇵🇹', 'Netherlands': '🇳🇱', 'Turkey': '🇹🇷',
};
