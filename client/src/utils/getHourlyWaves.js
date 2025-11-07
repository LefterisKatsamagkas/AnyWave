example = '2025-10-20T17:00';
hour = parseInt(example.slice(11,13));
times = []
for (let i = 0; i < 7; i++) {
    new_time = hour + i + 1;
    if (new_time >= 24) {
        new_time = (new_time)%24;
        
    }
}