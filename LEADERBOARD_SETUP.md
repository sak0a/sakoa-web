# TF2 Dodgeball Server Leaderboard Setup

This document explains how to set up and configure the leaderboard feature for the TF2 Dodgeball Server website.

## Features

The leaderboard displays player statistics from your MariaDB database with the following features:

- **Filtering Options**: Sort by points, topspeed, playtime, kills, or deaths
- **Ascending/Descending Order**: Choose highest-first or lowest-first sorting
- **Tiered Display**:
  - **Top 3**: Special podium-style cards with gold, silver, bronze styling
  - **Positions 4-10**: Standard list format with key stats
  - **Positions 11-50**: Scrollable table view
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Data refreshes when filters change
- **Fallback Support**: Shows mock data if database is unavailable

## Database Requirements

The leaderboard expects a MariaDB/MySQL database with a table named `sakaStats` containing:

```sql
CREATE TABLE IF NOT EXISTS sakaStats (
    steamid VARCHAR(100), 
    name VARCHAR(128), 
    kills INT, 
    deaths INT, 
    lastLogout INT, 
    firstLogin INT, 
    lastLogin INT, 
    playtime INT, 
    points INT, 
    topspeed INT, 
    deflections INT
);
```

## Configuration

### 1. Database Connection

Create a `.env` file in your project root (copy from `.env.example`):

```env
DB_HOST=your_database_host
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=sakaStats
```

### 2. Environment Variables

The following environment variables are supported:

- `DB_HOST`: Database server hostname/IP (default: localhost)
- `DB_PORT`: Database port (default: 3306)
- `DB_USER`: Database username (default: root)
- `DB_PASSWORD`: Database password (default: empty)
- `DB_NAME`: Database name (default: sakaStats)

## API Endpoints

### GET /api/leaderboard

Retrieves player leaderboard data.

**Query Parameters:**
- `sortBy` (optional): Field to sort by - `points`, `topspeed`, `playtime`, `kills`, `deaths` (default: `points`)
- `order` (optional): Sort order - `asc`, `desc` (default: `desc`)
- `limit` (optional): Maximum number of players to return, max 50 (default: 50)

**Example:**
```
GET /api/leaderboard?sortBy=topspeed&order=desc&limit=25
```

**Response:**
```json
{
  "success": true,
  "data": {
    "players": [
      {
        "rank": 1,
        "steamid": "76561198000000001",
        "name": "PlayerName",
        "kills": 1250,
        "deaths": 180,
        "kd_ratio": 6.94,
        "playtime": 432000,
        "playtimeHours": 120,
        "points": 15420,
        "topspeed": 3200,
        "deflections": 890,
        "lastLoginDate": "2024-01-15",
        "firstLoginDate": "2023-06-01"
      }
    ],
    "sortBy": "topspeed",
    "order": "desc",
    "total": 25
  }
}
```

## Troubleshooting

### Database Connection Issues

If the database connection fails, the leaderboard will:
1. Display a warning message to users
2. Show mock data for demonstration purposes
3. Log detailed error information to the server console

### Common Issues

1. **"Unknown database" error**: Ensure the database name in your `.env` file matches your actual database
2. **Connection refused**: Check that your database server is running and accessible
3. **Authentication failed**: Verify your database credentials in the `.env` file
4. **Empty leaderboard**: Ensure your `sakaStats` table has data and player names are not empty

### Development Mode

When running in development mode without a database connection, the leaderboard will automatically display mock data to demonstrate functionality.

## Customization

### Styling

The leaderboard uses the site's existing color scheme:
- Primary color: `#734C96` (purple)
- Secondary color: `#23104D` (dark purple)
- Background: Dark theme with gradients

### Adding New Sort Fields

To add new sortable fields:

1. Update the `validSortFields` array in `/server/api/leaderboard.js`
2. Add the field label in the `getStatLabel()` function in `/components/Leaderboard.vue`
3. Add formatting logic in the `formatStatValue()` function if needed
4. Add the new option to the select dropdown in the component template

## Performance Considerations

- The API limits results to 50 players maximum
- Database queries include proper indexing on sortable fields
- Connection pooling is handled automatically by the mysql2 library
- Failed connections fall back to cached/mock data to maintain user experience
