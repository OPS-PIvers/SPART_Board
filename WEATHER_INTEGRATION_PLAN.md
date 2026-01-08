# Earth Networks Weather Integration Implementation Plan

## Overview

This document outlines the plan to integrate real-time weather data from the Earth Networks Online Weather Center (OWC) into our web application. The school's weather station (Orono IS) is equipped with a WeatherBug device, and this integration will pull live data directly from that device rather than relying on OpenWeather API.

**Project Goal:** Replace OpenWeather API with Earth Networks data source to get exact coordinate weather conditions from the school's mounted weather device.

---

## Current Setup

- **API Currently Used:** OpenWeather API
- **New Data Source:** Earth Networks Online Weather Center (OWC)
- **Station ID:** BLLST (Orono IS)
- **Location:** Orono, MN (44.9908°N, -93.5964°W)
- **Elevation:** 1027 ft
- **Source URL:** https://owc.enterprise.earthnetworks.com/OnlineWeatherCenter.aspx?aid=5940

---

## Available API Endpoints

### Base URL

```
https://owc.enterprise.earthnetworks.com/Data/GetData.ashx
```

### Endpoint Parameters

| Parameter     | Values              | Description          |
| ------------- | ------------------- | -------------------- |
| `dt`          | o, fd, fh, cl, etc. | Data type            |
| `si` or `sid` | BLLST               | Station ID           |
| `locstr`      | lat,lon             | Location coordinates |
| `units`       | english, metric     | Unit system          |

### Available Data Types

#### 1. **Current Observations** (Most Important)

```
GET /Data/GetData.ashx?dt=o&pi=3&si=BLLST&locstr=44.99082,-93.59635&units=english&verbose=false
```

**Returns:** Current temperature, wind, humidity, pressure, precipitation, dew point, etc.

#### 2. **10-Day Forecast**

```
GET /Data/GetData.ashx?dt=fd&loctype=latitudelongitude&locstr=44.99082,-93.59635&units=english
```

**Returns:** Daily high/low temperatures, conditions, precipitation chance

#### 3. **Hourly Forecast**

```
GET /Data/GetData.ashx?dt=fh&loctype=latitudelongitude&locstr=44.99082,-93.59635&units=english&fho=0&fhl=144&icn=false
```

**Returns:** Hourly forecast data for 144 hours (6 days)

#### 4. **Alerts**

```
GET /Data/GetData.ashx?dt=al&loctype=latitudelongitude&locstr=44.99082,-93.59635&days=1
```

**Returns:** Weather alerts for the location

#### 5. **Wet Bulb Globe Temperature**

```
GET /Data/GetData.ashx?dt=wbgt&sid=BLLST&pid=3&units=english
```

**Returns:** WBGT data (useful for athletic/outdoor safety)

---

## Integration Approaches

### Option 1: Direct Client-Side Integration (Simple)

**Pros:**

- Minimal setup
- No backend required
- Real-time data updates

**Cons:**

- CORS issues likely
- No caching/rate limiting
- Exposes API calls to frontend

**Best For:** Development/testing

### Option 2: Backend Proxy (Recommended)

**Pros:**

- Handles CORS issues automatically
- Enables data caching
- Rate limiting control
- More secure

**Cons:**

- Requires backend implementation
- Slightly higher latency

**Best For:** Production

### Option 3: Hybrid Approach

**Pros:**

- Direct calls for real-time updates
- Backend cache for reliability
- Best performance

**Best For:** Optimal user experience

---

## Implementation Steps

### Phase 1: Testing & Data Structure Discovery

- [ ] Test API endpoints manually in browser/Postman
- [ ] Document JSON response structure for each endpoint
- [ ] Identify required vs optional fields
- [ ] Test CORS behavior from frontend

### Phase 2: Backend Implementation (if needed)

- [ ] Create `/weather/current` endpoint in backend
- [ ] Create `/weather/forecast` endpoint
- [ ] Implement caching (5-15 minute TTL recommended)
- [ ] Add error handling and fallback mechanisms
- [ ] Set up logging for API failures

### Phase 3: Frontend Integration

- [ ] Update current weather display component
- [ ] Update forecast display component
- [ ] Implement data refresh logic (15-30 second intervals recommended)
- [ ] Add loading states and error handling
- [ ] Remove OpenWeather API dependencies

### Phase 4: Testing & Deployment

- [ ] Unit tests for API calls
- [ ] Integration tests with live API
- [ ] Test failover/error scenarios
- [ ] Load testing
- [ ] Deploy to staging environment
- [ ] Monitor for 24-48 hours
- [ ] Deploy to production

---

## Technical Specifications

### Expected Response Format (Observations)

```json
{
  "temperature": 45.1,
  "feelsLike": 42.6,
  "humidity": 67.1,
  "dewPoint": 34.8,
  "pressure": 29.62,
  "wind": {
    "current": {
      "speed": 4.8,
      "direction": "E",
      "gust": 16.9
    }
  },
  "precipitation": {
    "today": 0.04,
    "rate": 0.0
  },
  "timestamp": "2026-01-07T14:45:31Z"
}
```

_Note: Exact structure to be confirmed during testing phase_

### Refresh Intervals

| Data Type            | Recommended Interval | Reason                     |
| -------------------- | -------------------- | -------------------------- |
| Current Observations | 15-30 seconds        | Real-time conditions       |
| Hourly Forecast      | 1 hour               | Changes every hour         |
| Daily Forecast       | 6 hours              | Doesn't change frequently  |
| Alerts               | 30-60 minutes        | Important but not constant |

### Data Caching Strategy

```
Current Observations:
├── Cache TTL: 5 minutes
├── Refresh: 15-30 second UI updates from cache
└── Fallback: Show stale data with timestamp

Forecast:
├── Cache TTL: 12 hours
├── Refresh: 6 hours or on-demand
└── Fallback: Show previous day's forecast
```

---

## Code Structure

```
src/
├── services/
│   └── weatherService.js (or .ts)
│       ├── getCurrentWeather()
│       ├── getForecast()
│       ├── getAlerts()
│       └── cache management
├── components/
│   ├── CurrentWeather.jsx
│   ├── Forecast.jsx
│   └── Alerts.jsx
├── hooks/
│   └── useWeather.js (custom hook for data fetching)
└── utils/
    └── weatherUtils.js (data transformation, formatting)
```

---

## Error Handling & Fallbacks

### Network Failure Scenarios

1. **API Timeout**
   - Retry after 5 seconds (max 3 retries)
   - Show cached data if available
   - Display "Data may be outdated" message

2. **API Returns Error**
   - Log error with timestamp
   - Serve last known good data
   - Alert admin if consecutive failures

3. **Complete Data Unavailable**
   - Show "Data temporarily unavailable"
   - Provide link to OWC website
   - Retry every minute

### CORS Resolution

If direct API calls fail due to CORS:

```javascript
// Option 1: Create backend proxy
GET /api/weather/current → calls Earth Networks API

// Option 2: Use CORS proxy (temporary/testing only)
https://cors-anywhere.herokuapp.com/https://owc.enterprise.earthnetworks.com/...

// Option 3: Request CORS headers from Earth Networks
Contact: support@earthnetworks.com
```

---

## Rate Limiting Considerations

- **Estimated Limits:** Not officially documented (need to contact Earth Networks)
- **Safe Approach:**
  - Cache for 5 minutes minimum
  - Max 12 requests per minute per endpoint
  - Batch requests when possible

---

## Dependencies

### Frontend

- `axios` or `fetch` API (for HTTP requests)
- State management (Redux/Context/Zustand) for caching
- Date formatting library (optional)

### Backend (if using proxy)

- Express.js / FastAPI / equivalent
- HTTP client library
- Redis or similar for caching

---

## Timeline

| Phase | Task                     | Duration | Start    | End    |
| ----- | ------------------------ | -------- | -------- | ------ |
| 1     | Testing & Data Structure | 2-3 days | Week 1   | Week 1 |
| 2     | Backend Implementation   | 2-3 days | Week 1-2 | Week 2 |
| 3     | Frontend Integration     | 3-4 days | Week 2   | Week 2 |
| 4     | Testing & Deployment     | 2-3 days | Week 3   | Week 3 |

**Total Estimated Time:** 9-13 days

---

## Success Criteria

- [ ] All current weather metrics display correctly
- [ ] Forecast data updates as expected
- [ ] API response time < 500ms (cached)
- [ ] No broken references to OpenWeather API
- [ ] Error handling covers all failure scenarios
- [ ] Data refresh intervals working as specified
- [ ] School staff can verify accuracy against physical station
- [ ] Zero data loss during deployment
- [ ] Monitoring/logging in place for production

---

## Risks & Mitigation

| Risk                     | Probability | Impact | Mitigation                         |
| ------------------------ | ----------- | ------ | ---------------------------------- |
| CORS Issues              | High        | High   | Build backend proxy early          |
| Undocumented API Changes | Medium      | High   | Monitor OWC website                |
| Rate Limiting            | Medium      | Medium | Implement aggressive caching       |
| Data Format Differs      | High        | Medium | Test extensively before deployment |
| Earth Networks Downtime  | Low         | High   | Use OpenWeather as fallback        |

---

## Future Enhancements

- [ ] Alerts/notifications for extreme conditions
- [ ] Data export functionality (CSV/JSON)
- [ ] Webhook integration with school systems
- [ ] Advanced analytics dashboard

---

## References & Resources

- **Earth Networks OWC:** https://owc.enterprise.earthnetworks.com
- **School Station:** https://owc.enterprise.earthnetworks.com/OnlineWeatherCenter.aspx?aid=5940
- **Contact:** support@earthnetworks.com (for official API documentation/support)

---

## Appendix A: Quick Start Testing

### Test Observations Endpoint

```bash
curl "https://owc.enterprise.earthnetworks.com/Data/GetData.ashx?dt=o&pi=3&si=BLLST&locstr=44.99082,-93.59635&units=english&verbose=false"
```

### Test Forecast Endpoint

```bash
curl "https://owc.enterprise.earthnetworks.com/Data/GetData.ashx?dt=fd&loctype=latitudelongitude&locstr=44.99082,-93.59635&units=english"
```

### Sample Frontend Implementation (Direct Call)

```javascript
async function fetchWeather() {
  try {
    const response = await fetch(
      'https://owc.enterprise.earthnetworks.com/Data/GetData.ashx?dt=o&pi=3&si=BLLST&locstr=44.99082,-93.59635&units=english&verbose=false'
    );
    const data = await response.json();
    console.log('Weather Data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching weather:', error);
    // Fallback to cached data or OpenWeather
  }
}

// Refresh every 30 seconds
setInterval(fetchWeather, 30000);
```

---

**Document Version:** 1.0  
**Last Updated:** January 7, 2026  
**Author:** Development Team  
**Status:** Ready for Implementation
