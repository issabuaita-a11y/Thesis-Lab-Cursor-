// Predefined maintenance types
const PREDEFINED_MAINTENANCE_TYPES = [
    'Oil Change',
    'Tire Rotation',
    'Brake Service',
    'Registration Renewal',
    'Inspection',
    'Battery Replacement',
    'Air Filter Replacement',
    'Transmission Service',
    'Coolant Flush',
    'Alignment'
];

// Data Storage Manager
class DataManager {
    constructor() {
        this.storageKey = 'carMaintenanceData';
        this.init();
    }

    init() {
        if (!this.load()) {
            this.save({
                cars: [],
                maintenanceRecords: [],
                customMaintenanceTypes: []
            });
        }
    }

    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading data:', error);
            return null;
        }
    }

    save(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    getData() {
        return this.load();
    }

    updateData(updates) {
        const data = this.load();
        const newData = { ...data, ...updates };
        return this.save(newData);
    }

    clearAll() {
        localStorage.removeItem(this.storageKey);
        this.init();
    }
}

// Car Maintenance App
class CarMaintenanceApp {
    constructor() {
        this.dataManager = new DataManager();
        this.currentCarId = null;
        this.currentView = 'dashboard';
        this.charts = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCars();
        this.loadMaintenanceTypes();
        this.updateCarSelector();
        this.showView('dashboard');
    }

    // Data Getters
    getCars() {
        return this.dataManager.getData().cars || [];
    }

    getMaintenanceRecords() {
        return this.dataManager.getData().maintenanceRecords || [];
    }

    getCustomTypes() {
        return this.dataManager.getData().customMaintenanceTypes || [];
    }

    getAllMaintenanceTypes() {
        const custom = this.getCustomTypes().map(t => t.name);
        return [...PREDEFINED_MAINTENANCE_TYPES, ...custom];
    }

    // Car Management
    addCar(carData) {
        const cars = this.getCars();
        const newCar = {
            id: this.generateId(),
            ...carData,
            createdAt: new Date().toISOString()
        };
        cars.push(newCar);
        this.dataManager.updateData({ cars });
        this.updateCarSelector();
        this.loadCars();
        return newCar;
    }

    updateCar(carId, carData) {
        const cars = this.getCars();
        const index = cars.findIndex(c => c.id === carId);
        if (index !== -1) {
            cars[index] = { ...cars[index], ...carData };
            this.dataManager.updateData({ cars });
            this.updateCarSelector();
            this.loadCars();
            if (this.currentCarId === carId) {
                this.updateDashboard();
            }
            return cars[index];
        }
        return null;
    }

    deleteCar(carId) {
        const cars = this.getCars();
        const filteredCars = cars.filter(c => c.id !== carId);
        const records = this.getMaintenanceRecords();
        const filteredRecords = records.filter(r => r.carId !== carId);
        
        this.dataManager.updateData({ 
            cars: filteredCars,
            maintenanceRecords: filteredRecords
        });
        
        if (this.currentCarId === carId) {
            this.currentCarId = null;
            document.getElementById('carSelector').value = '';
        }
        
        this.updateCarSelector();
        this.loadCars();
        this.updateDashboard();
        this.updateMaintenanceView();
    }

    loadCars() {
        const cars = this.getCars();
        const carsList = document.getElementById('carsList');
        
        if (cars.length === 0) {
            carsList.innerHTML = '<p class="empty-state">No cars added yet</p>';
            return;
        }

        carsList.innerHTML = cars.map(car => `
            <div class="car-item">
                <div class="item-info">
                    <div class="item-name">${car.year} ${car.make} ${car.model}</div>
                    <div class="item-details">
                        ${car.vin ? `VIN: ${car.vin} • ` : ''}
                        ${car.licensePlate ? `Plate: ${car.licensePlate} • ` : ''}
                        ${car.currentMileage ? `Mileage: ${car.currentMileage.toLocaleString()} mi` : ''}
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="btn btn-secondary btn-small" onclick="app.editCar('${car.id}')">Edit</button>
                    <button class="btn btn-danger btn-small" onclick="app.confirmDeleteCar('${car.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    updateCarSelector() {
        const selector = document.getElementById('carSelector');
        const cars = this.getCars();
        
        selector.innerHTML = '<option value="">Select a car...</option>' +
            cars.map(car => 
                `<option value="${car.id}">${car.year} ${car.make} ${car.model}</option>`
            ).join('');

        if (this.currentCarId) {
            selector.value = this.currentCarId;
        }
    }

    // Maintenance Management
    addMaintenance(maintenanceData) {
        const records = this.getMaintenanceRecords();
        const newRecord = {
            id: this.generateId(),
            ...maintenanceData,
            createdAt: new Date().toISOString()
        };
        records.push(newRecord);
        this.dataManager.updateData({ maintenanceRecords: records });
        this.updateMaintenanceView();
        this.updateDashboard();
        this.updateCharts();
        return newRecord;
    }

    updateMaintenance(recordId, maintenanceData) {
        const records = this.getMaintenanceRecords();
        const index = records.findIndex(r => r.id === recordId);
        if (index !== -1) {
            records[index] = { ...records[index], ...maintenanceData };
            this.dataManager.updateData({ maintenanceRecords: records });
            this.updateMaintenanceView();
            this.updateDashboard();
            this.updateCharts();
            return records[index];
        }
        return null;
    }

    deleteMaintenance(recordId) {
        const records = this.getMaintenanceRecords();
        const filtered = records.filter(r => r.id !== recordId);
        this.dataManager.updateData({ maintenanceRecords: filtered });
        this.updateMaintenanceView();
        this.updateDashboard();
        this.updateCharts();
    }

    getMaintenanceForCar(carId) {
        return this.getMaintenanceRecords().filter(r => r.carId === carId);
    }

    // Custom Types Management
    addCustomType(typeData) {
        const customTypes = this.getCustomTypes();
        const newType = {
            id: this.generateId(),
            ...typeData
        };
        customTypes.push(newType);
        this.dataManager.updateData({ customMaintenanceTypes: customTypes });
        this.loadCustomTypes();
        this.loadMaintenanceTypes();
        return newType;
    }

    updateCustomType(typeId, typeData) {
        const customTypes = this.getCustomTypes();
        const index = customTypes.findIndex(t => t.id === typeId);
        if (index !== -1) {
            customTypes[index] = { ...customTypes[index], ...typeData };
            this.dataManager.updateData({ customMaintenanceTypes: customTypes });
            this.loadCustomTypes();
            this.loadMaintenanceTypes();
            return customTypes[index];
        }
        return null;
    }

    deleteCustomType(typeId) {
        const customTypes = this.getCustomTypes();
        const filtered = customTypes.filter(t => t.id !== typeId);
        this.dataManager.updateData({ customMaintenanceTypes: filtered });
        this.loadCustomTypes();
        this.loadMaintenanceTypes();
    }

    loadCustomTypes() {
        const customTypes = this.getCustomTypes();
        const list = document.getElementById('customTypesList');
        
        if (customTypes.length === 0) {
            list.innerHTML = '<p class="empty-state">No custom types added</p>';
            return;
        }

        list.innerHTML = customTypes.map(type => `
            <div class="custom-type-item">
                <div class="item-info">
                    <div class="item-name">${type.name}</div>
                    <div class="item-details">
                        ${type.defaultInterval ? `Interval: ${type.defaultInterval} months • ` : ''}
                        ${type.defaultMileageInterval ? `Mileage: ${type.defaultMileageInterval.toLocaleString()} mi` : ''}
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="btn btn-secondary btn-small" onclick="app.editCustomType('${type.id}')">Edit</button>
                    <button class="btn btn-danger btn-small" onclick="app.confirmDeleteCustomType('${type.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    loadMaintenanceTypes() {
        const select = document.getElementById('maintenanceType');
        const types = this.getAllMaintenanceTypes();
        
        select.innerHTML = '<option value="">Select type...</option>' +
            types.map(type => `<option value="${type}">${type}</option>`).join('');
    }

    // Reminders
    getUpcomingMaintenance(carId) {
        const records = this.getMaintenanceRecords().filter(r => r.carId === carId);
        const today = new Date();
        const upcoming = [];

        records.forEach(record => {
            if (record.nextDueDate) {
                const dueDate = new Date(record.nextDueDate);
                const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                
                if (daysUntil < 0) {
                    upcoming.push({ ...record, status: 'overdue', daysUntil });
                } else if (daysUntil <= 30) {
                    upcoming.push({ ...record, status: 'upcoming', daysUntil });
                }
            }

            if (record.nextDueMileage) {
                const car = this.getCars().find(c => c.id === carId);
                if (car && car.currentMileage) {
                    const milesRemaining = record.nextDueMileage - car.currentMileage;
                    if (milesRemaining <= 500) {
                        upcoming.push({ 
                            ...record, 
                            status: milesRemaining < 0 ? 'overdue' : 'upcoming',
                            milesRemaining 
                        });
                    }
                }
            }
        });

        return upcoming.sort((a, b) => {
            if (a.status === 'overdue' && b.status !== 'overdue') return -1;
            if (a.status !== 'overdue' && b.status === 'overdue') return 1;
            return (a.daysUntil || 0) - (b.daysUntil || 0);
        });
    }

    // Views
    showView(viewName) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        
        document.getElementById(`${viewName}View`).classList.add('active');
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
        
        this.currentView = viewName;

        if (viewName === 'dashboard') {
            this.updateDashboard();
        } else if (viewName === 'maintenance') {
            this.updateMaintenanceView();
        } else if (viewName === 'charts') {
            this.updateCharts();
        } else if (viewName === 'settings') {
            this.loadCars();
            this.loadCustomTypes();
        }
    }

    updateDashboard() {
        if (!this.currentCarId) {
            document.getElementById('currentCarInfo').innerHTML = '<p class="empty-state">No car selected</p>';
            document.getElementById('upcomingMaintenance').innerHTML = '<p class="empty-state">No upcoming maintenance</p>';
            document.getElementById('recentMaintenance').innerHTML = '<p class="empty-state">No maintenance records</p>';
            document.getElementById('dashboardStats').innerHTML = '<p class="empty-state">No data available</p>';
            return;
        }

        const car = this.getCars().find(c => c.id === this.currentCarId);
        if (!car) return;

        // Current Car Info
        document.getElementById('currentCarInfo').innerHTML = `
            <div class="car-info-item">
                <span class="car-info-label">Make/Model:</span>
                <span>${car.year} ${car.make} ${car.model}</span>
            </div>
            ${car.vin ? `
            <div class="car-info-item">
                <span class="car-info-label">VIN:</span>
                <span>${car.vin}</span>
            </div>` : ''}
            ${car.licensePlate ? `
            <div class="car-info-item">
                <span class="car-info-label">License Plate:</span>
                <span>${car.licensePlate}</span>
            </div>` : ''}
            ${car.currentMileage ? `
            <div class="car-info-item">
                <span class="car-info-label">Current Mileage:</span>
                <span>${car.currentMileage.toLocaleString()} mi</span>
            </div>` : ''}
        `;

        // Upcoming Maintenance
        const upcoming = this.getUpcomingMaintenance(this.currentCarId);
        if (upcoming.length === 0) {
            document.getElementById('upcomingMaintenance').innerHTML = '<p class="empty-state">No upcoming maintenance</p>';
        } else {
            document.getElementById('upcomingMaintenance').innerHTML = upcoming.slice(0, 5).map(item => {
                const statusClass = item.status === 'overdue' ? 'overdue' : 'upcoming';
                const dateStr = item.nextDueDate ? new Date(item.nextDueDate).toLocaleDateString() : '';
                const mileageStr = item.milesRemaining !== undefined ? `${Math.abs(item.milesRemaining).toLocaleString()} mi ${item.milesRemaining < 0 ? 'overdue' : 'remaining'}` : '';
                return `
                    <div class="maintenance-item ${statusClass}">
                        <div class="maintenance-item-info">
                            <div class="maintenance-item-type">${item.type}</div>
                            <div class="maintenance-item-date">
                                ${dateStr} ${mileageStr ? '• ' + mileageStr : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Recent Maintenance
        const recent = this.getMaintenanceForCar(this.currentCarId)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
        
        if (recent.length === 0) {
            document.getElementById('recentMaintenance').innerHTML = '<p class="empty-state">No maintenance records</p>';
        } else {
            document.getElementById('recentMaintenance').innerHTML = recent.map(item => `
                <div class="maintenance-item">
                    <div class="maintenance-item-info">
                        <div class="maintenance-item-type">${item.type}</div>
                        <div class="maintenance-item-date">
                            ${new Date(item.date).toLocaleDateString()} • 
                            ${item.cost ? '$' + item.cost.toFixed(2) : 'No cost'}
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Statistics
        const allRecords = this.getMaintenanceForCar(this.currentCarId);
        const totalCost = allRecords.reduce((sum, r) => sum + (r.cost || 0), 0);
        const totalRecords = allRecords.length;
        const thisYear = new Date().getFullYear();
        const thisYearCost = allRecords
            .filter(r => new Date(r.date).getFullYear() === thisYear)
            .reduce((sum, r) => sum + (r.cost || 0), 0);

        document.getElementById('dashboardStats').innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${totalRecords}</div>
                <div class="stat-label">Total Records</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">$${totalCost.toFixed(2)}</div>
                <div class="stat-label">Total Spent</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">$${thisYearCost.toFixed(2)}</div>
                <div class="stat-label">This Year</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${upcoming.length}</div>
                <div class="stat-label">Upcoming</div>
            </div>
        `;
    }

    updateMaintenanceView() {
        if (!this.currentCarId) {
            document.getElementById('maintenanceTableBody').innerHTML = 
                '<tr><td colspan="6" class="empty-state">Select a car to view maintenance records</td></tr>';
            return;
        }

        let records = this.getMaintenanceForCar(this.currentCarId);

        // Apply search filter
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        if (searchTerm) {
            records = records.filter(r => 
                r.type.toLowerCase().includes(searchTerm) ||
                (r.notes && r.notes.toLowerCase().includes(searchTerm)) ||
                (r.serviceProvider && r.serviceProvider.toLowerCase().includes(searchTerm))
            );
        }

        // Apply type filter
        const typeFilter = document.getElementById('typeFilter').value;
        if (typeFilter) {
            records = records.filter(r => r.type === typeFilter);
        }

        // Apply sorting
        const sortValue = document.getElementById('sortSelect').value;
        records.sort((a, b) => {
            switch(sortValue) {
                case 'date-desc':
                    return new Date(b.date) - new Date(a.date);
                case 'date-asc':
                    return new Date(a.date) - new Date(b.date);
                case 'cost-desc':
                    return (b.cost || 0) - (a.cost || 0);
                case 'cost-asc':
                    return (a.cost || 0) - (b.cost || 0);
                case 'type':
                    return a.type.localeCompare(b.type);
                default:
                    return 0;
            }
        });

        // Update type filter options
        const typeFilterSelect = document.getElementById('typeFilter');
        const currentValue = typeFilterSelect.value;
        const types = [...new Set(records.map(r => r.type))].sort();
        typeFilterSelect.innerHTML = '<option value="">All Types</option>' +
            types.map(t => `<option value="${t}">${t}</option>`).join('');
        typeFilterSelect.value = currentValue;

        // Render table
        if (records.length === 0) {
            document.getElementById('maintenanceTableBody').innerHTML = 
                '<tr><td colspan="6" class="empty-state">No maintenance records found</td></tr>';
        } else {
            document.getElementById('maintenanceTableBody').innerHTML = records.map(record => `
                <tr>
                    <td>${new Date(record.date).toLocaleDateString()}</td>
                    <td>${record.type}</td>
                    <td>${record.cost ? '$' + record.cost.toFixed(2) : '-'}</td>
                    <td>${record.mileage ? record.mileage.toLocaleString() + ' mi' : '-'}</td>
                    <td>${record.serviceProvider || '-'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-secondary btn-small" onclick="app.editMaintenance('${record.id}')">Edit</button>
                            <button class="btn btn-danger btn-small" onclick="app.confirmDeleteMaintenance('${record.id}')">Delete</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
    }

    updateCharts() {
        if (!this.currentCarId) {
            Object.values(this.charts).forEach(chart => {
                if (chart) chart.destroy();
            });
            this.charts = {};
            return;
        }

        const records = this.getMaintenanceForCar(this.currentCarId).sort((a, b) => 
            new Date(a.date) - new Date(b.date)
        );

        // Cost Over Time Chart
        this.updateCostChart(records);

        // Frequency by Type Chart
        this.updateFrequencyChart(records);

        // Spending per Car Chart
        this.updateSpendingChart();

        // Mileage Tracking Chart
        this.updateMileageChart(records);
    }

    updateCostChart(records) {
        const ctx = document.getElementById('costChart');
        if (this.charts.costChart) {
            this.charts.costChart.destroy();
        }

        const dates = records.map(r => new Date(r.date).toLocaleDateString());
        const costs = records.map(r => r.cost || 0);
        const cumulativeCosts = costs.reduce((acc, cost, i) => {
            acc.push((acc[i - 1] || 0) + cost);
            return acc;
        }, []);

        this.charts.costChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Cumulative Cost',
                    data: cumulativeCosts,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    }

    updateFrequencyChart(records) {
        const ctx = document.getElementById('frequencyChart');
        if (this.charts.frequencyChart) {
            this.charts.frequencyChart.destroy();
        }

        const typeCounts = {};
        records.forEach(r => {
            typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
        });

        const types = Object.keys(typeCounts);
        const counts = Object.values(typeCounts);

        this.charts.frequencyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: types,
                datasets: [{
                    label: 'Frequency',
                    data: counts,
                    backgroundColor: '#764ba2',
                    borderColor: '#667eea',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    updateSpendingChart() {
        const ctx = document.getElementById('spendingChart');
        if (this.charts.spendingChart) {
            this.charts.spendingChart.destroy();
        }

        const cars = this.getCars();
        const carSpending = cars.map(car => {
            const records = this.getMaintenanceRecords().filter(r => r.carId === car.id);
            return {
                name: `${car.year} ${car.make} ${car.model}`,
                total: records.reduce((sum, r) => sum + (r.cost || 0), 0)
            };
        }).filter(c => c.total > 0);

        if (carSpending.length === 0) {
            ctx.parentElement.innerHTML = '<p class="empty-state">No spending data available</p>';
            return;
        }

        this.charts.spendingChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: carSpending.map(c => c.name),
                datasets: [{
                    data: carSpending.map(c => c.total),
                    backgroundColor: [
                        '#667eea',
                        '#764ba2',
                        '#48bb78',
                        '#ed8936',
                        '#f56565',
                        '#4299e1'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': $' + context.parsed.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    }

    updateMileageChart(records) {
        const ctx = document.getElementById('mileageChart');
        if (this.charts.mileageChart) {
            this.charts.mileageChart.destroy();
        }

        const mileageRecords = records.filter(r => r.mileage).sort((a, b) => 
            new Date(a.date) - new Date(b.date)
        );

        if (mileageRecords.length === 0) {
            ctx.parentElement.innerHTML = '<p class="empty-state">No mileage data available</p>';
            return;
        }

        const dates = mileageRecords.map(r => new Date(r.date).toLocaleDateString());
        const mileages = mileageRecords.map(r => r.mileage);

        this.charts.mileageChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Mileage',
                    data: mileages,
                    borderColor: '#48bb78',
                    backgroundColor: 'rgba(72, 187, 120, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString() + ' mi';
                            }
                        }
                    }
                }
            }
        });
    }

    // Modal Management
    openCarModal(carId = null) {
        const modal = document.getElementById('carModal');
        const form = document.getElementById('carForm');
        const title = document.getElementById('carModalTitle');

        if (carId) {
            const car = this.getCars().find(c => c.id === carId);
            if (car) {
                title.textContent = 'Edit Car';
                document.getElementById('carId').value = car.id;
                document.getElementById('carMake').value = car.make || '';
                document.getElementById('carModel').value = car.model || '';
                document.getElementById('carYear').value = car.year || '';
                document.getElementById('carVin').value = car.vin || '';
                document.getElementById('carLicensePlate').value = car.licensePlate || '';
                document.getElementById('carPurchaseDate').value = car.purchaseDate || '';
                document.getElementById('carCurrentMileage').value = car.currentMileage || '';
            }
        } else {
            title.textContent = 'Add Car';
            form.reset();
            document.getElementById('carId').value = '';
        }

        modal.classList.add('active');
    }

    closeCarModal() {
        document.getElementById('carModal').classList.remove('active');
        document.getElementById('carForm').reset();
    }

    openMaintenanceModal(recordId = null) {
        const modal = document.getElementById('maintenanceModal');
        const form = document.getElementById('maintenanceForm');
        const title = document.getElementById('maintenanceModalTitle');

        if (!this.currentCarId) {
            alert('Please select a car first');
            return;
        }

        if (recordId) {
            const record = this.getMaintenanceRecords().find(r => r.id === recordId);
            if (record) {
                title.textContent = 'Edit Maintenance';
                document.getElementById('maintenanceId').value = record.id;
                document.getElementById('maintenanceDate').value = record.date || '';
                document.getElementById('maintenanceType').value = record.type || '';
                document.getElementById('maintenanceCost').value = record.cost || '';
                document.getElementById('maintenanceMileage').value = record.mileage || '';
                document.getElementById('maintenanceProvider').value = record.serviceProvider || '';
                document.getElementById('maintenanceNotes').value = record.notes || '';
                document.getElementById('setReminder').checked = !!(record.nextDueDate || record.nextDueMileage);
                document.getElementById('reminderInterval').value = '';
                document.getElementById('reminderMileage').value = '';
                document.getElementById('reminderFields').style.display = 
                    document.getElementById('setReminder').checked ? 'block' : 'none';
            }
        } else {
            title.textContent = 'Add Maintenance';
            form.reset();
            document.getElementById('maintenanceId').value = '';
            document.getElementById('maintenanceDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('setReminder').checked = false;
            document.getElementById('reminderFields').style.display = 'none';
        }

        this.loadMaintenanceTypes();
        modal.classList.add('active');
    }

    closeMaintenanceModal() {
        document.getElementById('maintenanceModal').classList.remove('active');
        document.getElementById('maintenanceForm').reset();
    }

    openCustomTypeModal(typeId = null) {
        const modal = document.getElementById('customTypeModal');
        const form = document.getElementById('customTypeForm');
        const title = document.getElementById('customTypeModalTitle');

        if (typeId) {
            const type = this.getCustomTypes().find(t => t.id === typeId);
            if (type) {
                title.textContent = 'Edit Custom Type';
                document.getElementById('customTypeId').value = type.id;
                document.getElementById('customTypeName').value = type.name || '';
                document.getElementById('customTypeInterval').value = type.defaultInterval || '';
                document.getElementById('customTypeMileage').value = type.defaultMileageInterval || '';
            }
        } else {
            title.textContent = 'Add Custom Type';
            form.reset();
            document.getElementById('customTypeId').value = '';
        }

        modal.classList.add('active');
    }

    closeCustomTypeModal() {
        document.getElementById('customTypeModal').classList.remove('active');
        document.getElementById('customTypeForm').reset();
    }

    confirmDeleteCar(carId) {
        this.showConfirmModal(
            'Delete Car',
            'Are you sure you want to delete this car? All maintenance records will also be deleted.',
            () => {
                this.deleteCar(carId);
                this.closeConfirmModal();
            }
        );
    }

    confirmDeleteMaintenance(recordId) {
        this.showConfirmModal(
            'Delete Maintenance Record',
            'Are you sure you want to delete this maintenance record?',
            () => {
                this.deleteMaintenance(recordId);
                this.closeConfirmModal();
            }
        );
    }

    confirmDeleteCustomType(typeId) {
        this.showConfirmModal(
            'Delete Custom Type',
            'Are you sure you want to delete this custom maintenance type?',
            () => {
                this.deleteCustomType(typeId);
                this.closeConfirmModal();
            }
        );
    }

    showConfirmModal(title, message, onConfirm) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        const modal = document.getElementById('confirmModal');
        modal.classList.add('active');

        const okBtn = document.getElementById('confirmOk');
        const cancelBtn = document.getElementById('confirmCancel');

        const handleConfirm = () => {
            onConfirm();
            okBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
        };

        const handleCancel = () => {
            this.closeConfirmModal();
            okBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
        };

        okBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
    }

    closeConfirmModal() {
        document.getElementById('confirmModal').classList.remove('active');
    }

    editCar(carId) {
        this.openCarModal(carId);
    }

    editMaintenance(recordId) {
        this.openMaintenanceModal(recordId);
    }

    editCustomType(typeId) {
        this.openCustomTypeModal(typeId);
    }

    // Data Export/Import
    exportData() {
        const data = this.dataManager.getData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `car-maintenance-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.cars && data.maintenanceRecords && data.customMaintenanceTypes) {
                    this.dataManager.save(data);
                    this.updateCarSelector();
                    this.loadCars();
                    this.loadCustomTypes();
                    this.loadMaintenanceTypes();
                    this.updateDashboard();
                    this.updateMaintenanceView();
                    this.updateCharts();
                    alert('Data imported successfully!');
                } else {
                    alert('Invalid data format');
                }
            } catch (error) {
                alert('Error importing data: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    // Utility
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Event Listeners
    setupEventListeners() {
        // Car selector
        document.getElementById('carSelector').addEventListener('change', (e) => {
            this.currentCarId = e.target.value || null;
            this.updateDashboard();
            this.updateMaintenanceView();
            this.updateCharts();
        });

        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.showView(e.target.dataset.view);
            });
        });

        // Add car button
        document.getElementById('addCarBtn').addEventListener('click', () => {
            this.openCarModal();
        });

        // Car form
        document.getElementById('carForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const carId = document.getElementById('carId').value;
            const carData = {
                make: document.getElementById('carMake').value,
                model: document.getElementById('carModel').value,
                year: parseInt(document.getElementById('carYear').value),
                vin: document.getElementById('carVin').value,
                licensePlate: document.getElementById('carLicensePlate').value,
                purchaseDate: document.getElementById('carPurchaseDate').value,
                currentMileage: document.getElementById('carCurrentMileage').value ? 
                    parseInt(document.getElementById('carCurrentMileage').value) : null
            };

            if (carId) {
                this.updateCar(carId, carData);
            } else {
                this.addCar(carData);
            }
            this.closeCarModal();
        });

        // Add maintenance button
        document.getElementById('addMaintenanceBtn').addEventListener('click', () => {
            this.openMaintenanceModal();
        });

        // Maintenance form
        document.getElementById('maintenanceForm').addEventListener('submit', (e) => {
            e.preventDefault();
            if (!this.currentCarId) {
                alert('Please select a car first');
                return;
            }

            const recordId = document.getElementById('maintenanceId').value;
            const setReminder = document.getElementById('setReminder').checked;
            const maintenanceDate = new Date(document.getElementById('maintenanceDate').value);
            
            let nextDueDate = null;
            let nextDueMileage = null;

            if (setReminder) {
                const interval = parseInt(document.getElementById('reminderInterval').value);
                const mileageInterval = parseInt(document.getElementById('reminderMileage').value);

                if (interval) {
                    const nextDate = new Date(maintenanceDate);
                    nextDate.setMonth(nextDate.getMonth() + interval);
                    nextDueDate = nextDate.toISOString().split('T')[0];
                }

                if (mileageInterval) {
                    const currentMileage = parseInt(document.getElementById('maintenanceMileage').value) || 0;
                    nextDueMileage = currentMileage + mileageInterval;
                }
            }

            const maintenanceData = {
                carId: this.currentCarId,
                date: document.getElementById('maintenanceDate').value,
                type: document.getElementById('maintenanceType').value,
                cost: document.getElementById('maintenanceCost').value ? 
                    parseFloat(document.getElementById('maintenanceCost').value) : null,
                mileage: document.getElementById('maintenanceMileage').value ? 
                    parseInt(document.getElementById('maintenanceMileage').value) : null,
                serviceProvider: document.getElementById('maintenanceProvider').value,
                notes: document.getElementById('maintenanceNotes').value,
                nextDueDate,
                nextDueMileage
            };

            if (recordId) {
                this.updateMaintenance(recordId, maintenanceData);
            } else {
                this.addMaintenance(maintenanceData);
            }
            this.closeMaintenanceModal();
        });

        // Reminder checkbox
        document.getElementById('setReminder').addEventListener('change', (e) => {
            document.getElementById('reminderFields').style.display = 
                e.target.checked ? 'block' : 'none';
        });

        // Filters
        document.getElementById('searchInput').addEventListener('input', () => {
            this.updateMaintenanceView();
        });

        document.getElementById('typeFilter').addEventListener('change', () => {
            this.updateMaintenanceView();
        });

        document.getElementById('sortSelect').addEventListener('change', () => {
            this.updateMaintenanceView();
        });

        // Add custom type button
        document.getElementById('addCustomTypeBtn').addEventListener('click', () => {
            this.openCustomTypeModal();
        });

        // Custom type form
        document.getElementById('customTypeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const typeId = document.getElementById('customTypeId').value;
            const typeData = {
                name: document.getElementById('customTypeName').value,
                defaultInterval: document.getElementById('customTypeInterval').value ? 
                    parseInt(document.getElementById('customTypeInterval').value) : null,
                defaultMileageInterval: document.getElementById('customTypeMileage').value ? 
                    parseInt(document.getElementById('customTypeMileage').value) : null
            };

            if (typeId) {
                this.updateCustomType(typeId, typeData);
            } else {
                this.addCustomType(typeData);
            }
            this.closeCustomTypeModal();
        });

        // Data management
        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importDataBtn').addEventListener('click', () => {
            document.getElementById('importFileInput').click();
        });

        document.getElementById('importFileInput').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.importData(e.target.files[0]);
                e.target.value = '';
            }
        });

        document.getElementById('clearDataBtn').addEventListener('click', () => {
            this.showConfirmModal(
                'Clear All Data',
                'Are you sure you want to clear all data? This action cannot be undone!',
                () => {
                    this.dataManager.clearAll();
                    this.currentCarId = null;
                    this.updateCarSelector();
                    this.loadCars();
                    this.loadCustomTypes();
                    this.loadMaintenanceTypes();
                    this.updateDashboard();
                    this.updateMaintenanceView();
                    this.updateCharts();
                    this.closeConfirmModal();
                    alert('All data has been cleared');
                }
            );
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                }
                if (e.target.classList.contains('modal-close') || e.target.classList.contains('modal-cancel')) {
                    if (modal.id === 'carModal') this.closeCarModal();
                    if (modal.id === 'maintenanceModal') this.closeMaintenanceModal();
                    if (modal.id === 'customTypeModal') this.closeCustomTypeModal();
                }
            });
        });

        // Close modal on background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CarMaintenanceApp();
});

