# Car Maintenance Log

A comprehensive web-based application for tracking car maintenance across multiple vehicles. Keep track of maintenance records, set reminders, view statistics, and analyze maintenance history with interactive charts.

## Features

### Car Management
- Add multiple cars with details (make, model, year, VIN, license plate, purchase date, current mileage)
- Edit and delete car information
- Switch between cars easily with a dropdown selector

### Maintenance Records
- Log maintenance entries with:
  - Date performed
  - Maintenance type (predefined or custom)
  - Cost
  - Mileage at time of service
  - Service provider/mechanic
  - Notes/description
  - Optional reminders (time-based or mileage-based)
- Edit and delete maintenance records
- Search and filter maintenance history
- Sort by date, cost, or type

### Predefined Maintenance Types
Includes common maintenance types:
- Oil Change
- Tire Rotation
- Brake Service
- Registration Renewal
- Inspection
- Battery Replacement
- Air Filter Replacement
- Transmission Service
- Coolant Flush
- Alignment

### Custom Maintenance Types
- Add your own custom maintenance types
- Set default intervals (time and/or mileage) for reminders
- Edit and delete custom types

### Reminders System
- Automatic calculation of next due dates based on:
  - Time intervals (e.g., every 3 months, annually)
  - Mileage intervals (e.g., every 5,000 miles)
- Visual indicators for overdue and upcoming maintenance
- Dashboard alerts for maintenance due soon

### Charts & Visualizations
- **Maintenance Cost Over Time**: Line chart showing cumulative spending
- **Maintenance Frequency by Type**: Bar chart showing how often each type of maintenance is performed
- **Total Spending per Car**: Pie chart comparing spending across all vehicles
- **Mileage Tracking**: Line chart tracking mileage over time

### Data Management
- All data stored locally in browser (localStorage)
- Export data as JSON file
- Import data from JSON file
- Clear all data option (with confirmation)

## Setup

1. **Download or clone** this project to your local machine

2. **Open the application**:
   - Simply open `index.html` in a modern web browser
   - Or use a local web server for better performance:
     
     Using Python 3:
     ```bash
     python -m http.server 8000
     ```
     
     Using Node.js (http-server):
     ```bash
     npx http-server -p 8000
     ```
     
     Using PHP:
     ```bash
     php -S localhost:8000
     ```

3. **Access the application**: Navigate to `http://localhost:8000` (if using a server) or open `index.html` directly

## Usage

### Getting Started

1. **Add a Car**:
   - Click the "+ Add Car" button in the header
   - Fill in the car details (at minimum: make, model, and year)
   - Click "Save"

2. **Select a Car**:
   - Use the dropdown selector in the header to choose which car you want to manage

3. **Add Maintenance Records**:
   - Navigate to the "Maintenance Log" tab
   - Click "+ Add Maintenance"
   - Fill in the maintenance details
   - Optionally set a reminder for the next service
   - Click "Save"

### Dashboard

The dashboard provides an overview of:
- Current car information
- Upcoming maintenance (with color-coded alerts)
- Recent maintenance records
- Statistics (total records, spending, etc.)

### Maintenance Log

View all maintenance records in a sortable table:
- Search by type, notes, or service provider
- Filter by maintenance type
- Sort by date, cost, or type
- Edit or delete individual records

### Charts

Visualize your maintenance data:
- Track spending trends over time
- See which maintenance types are most common
- Compare spending across multiple cars
- Monitor mileage progression

### Settings

Manage your application:
- **Car Management**: View, edit, or delete all your cars
- **Custom Maintenance Types**: Add, edit, or delete custom maintenance types
- **Data Management**: Export, import, or clear all data

## Technical Details

### Technologies Used

- **HTML5**: Structure and semantic markup
- **CSS3**: Modern styling with flexbox/grid, animations, and responsive design
- **Vanilla JavaScript**: No frameworks - pure JavaScript for all functionality
- **Chart.js**: Interactive charts and visualizations
- **LocalStorage API**: Client-side data persistence

### Data Structure

All data is stored in browser localStorage with the following structure:

```javascript
{
  cars: [
    {
      id: string,
      make: string,
      model: string,
      year: number,
      vin: string,
      licensePlate: string,
      purchaseDate: string,
      currentMileage: number,
      createdAt: string
    }
  ],
  maintenanceRecords: [
    {
      id: string,
      carId: string,
      date: string,
      type: string,
      cost: number,
      mileage: number,
      serviceProvider: string,
      notes: string,
      nextDueDate: string,
      nextDueMileage: number,
      createdAt: string
    }
  ],
  customMaintenanceTypes: [
    {
      id: string,
      name: string,
      defaultInterval: number,
      defaultMileageInterval: number
    }
  ]
}
```

### Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

**Note**: Modern browsers with localStorage support are required.

## Features in Detail

### Reminders

When adding or editing maintenance, you can set reminders:
- **Time-based**: Set how many months until the next service (e.g., oil change every 3 months)
- **Mileage-based**: Set how many miles until the next service (e.g., tire rotation every 5,000 miles)
- Both can be set simultaneously

The dashboard will show:
- **Overdue** items in red (past due date or mileage)
- **Upcoming** items in orange (due within 30 days or 500 miles)

### Data Export/Import

- **Export**: Download all your data as a JSON file for backup
- **Import**: Restore data from a previously exported JSON file
- Useful for backing up your maintenance records or transferring data between devices

## Tips

1. **Update Current Mileage**: Regularly update your car's current mileage in the car settings for accurate reminder calculations
2. **Set Reminders**: When adding maintenance, set reminders to never miss important services
3. **Use Notes**: Add detailed notes about each service for future reference
4. **Track Service Providers**: Record where you had work done to keep track of preferred mechanics
5. **Export Regularly**: Export your data periodically as a backup

## Troubleshooting

- **Data not saving**: Ensure your browser allows localStorage and isn't in private/incognito mode
- **Charts not displaying**: Check browser console for errors, ensure Chart.js loaded correctly
- **Import not working**: Verify the JSON file format matches the expected structure
- **Reminders not showing**: Make sure you've set both a date and mileage reminder, and that the car's current mileage is updated

## License

This project is open source and available for educational purposes.

## Future Enhancements

Potential features for future versions:
- Receipt photo uploads
- Email/SMS reminders
- Maintenance schedule templates
- Service provider ratings
- Maintenance cost predictions
- Cloud sync across devices

