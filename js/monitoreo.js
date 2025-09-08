// URL base de la API
const API_URL = 'https://68bb0de584055bce63f104ef.mockapi.io/api/v1/dispositivos_IoT';

// Elementos del DOM
const itemsTable = document.getElementById('itemsTable');
const alertContainer = document.getElementById('alertContainer');
const refreshBtn = document.getElementById('refreshBtn');
const pollingToggle = document.getElementById('pollingToggle');
const pollingStatus = document.getElementById('pollingStatus');
const lastUpdate = document.getElementById('lastUpdate');

// Variables para el polling
let pollingInterval;
let isPollingActive = true;

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    startPolling();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    refreshBtn.addEventListener('click', loadItems);
    pollingToggle.addEventListener('change', togglePolling);
}

// Iniciar polling
function startPolling() {
    // Cargar datos inmediatamente
    loadItems();
    
    // Configurar intervalo para polling cada 2 segundos
    pollingInterval = setInterval(() => {
        if (isPollingActive) {
            loadItems();
        }
    }, 2000);
}

// Alternar polling
function togglePolling() {
    isPollingActive = pollingToggle.checked;
    
    if (isPollingActive) {
        pollingStatus.textContent = 'Conectado';
        pollingStatus.classList.remove('bg-warning');
        pollingStatus.classList.add('bg-light');
        showAlert('Actualización automática activada', 'success');
    } else {
        pollingStatus.textContent = 'Pausado';
        pollingStatus.classList.remove('bg-light');
        pollingStatus.classList.add('bg-warning');
        showAlert('Actualización automática pausada', 'warning');
    }
}

// Cargar los últimos 10 registros
async function loadItems() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error al cargar los datos');
        
        const items = await response.json();
        
        // Ordenar por fecha (más recientes primero) y tomar los últimos 10
        const sortedItems = items.sort((a, b) => new Date(b.date) - new Date(a.date));
        const lastTenItems = sortedItems.slice(0, 10);
        
        if (lastTenItems.length === 0) {
            itemsTable.innerHTML = '<tr><td colspan="5" class="text-center">No hay registros para mostrar</td></tr>';
            return;
        }
        
        renderItemsTable(lastTenItems);
        
        // Actualizar última actualización
        lastUpdate.textContent = `Última actualización: ${new Date().toLocaleTimeString()}`;
    } catch (error) {
        console.error('Error:', error);
        itemsTable.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar los datos</td></tr>';
        showAlert('Error al cargar los registros', 'danger');
        
        // Actualizar estado
        pollingStatus.textContent = 'Error de conexión';
        pollingStatus.classList.remove('bg-light', 'bg-warning');
        pollingStatus.classList.add('bg-danger');
    }
}

// Renderizar la tabla de registros
function renderItemsTable(items) {
    // Guardar el HTML actual para comparar después
    const oldTableHTML = itemsTable.innerHTML;
    
    // Generar nuevo HTML
    itemsTable.innerHTML = items.map(item => `
        <tr>
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>
                <span class="badge 
                    ${item.status.includes('ADELANTE') ? 'bg-success' : ''}
                    ${item.status.includes('ATRAS') ? 'bg-danger' : ''}
                    ${item.status === 'DETENER' ? 'bg-secondary' : ''}
                    ${item.status.includes('GIRO') ? 'bg-warning' : ''}">
                    ${item.status}
                </span>
            </td>
            <td>${item.ip}</td>
            <td>${item.date}</td>
        </tr>
    `).join('');
    
    // Aplicar efecto de highlight si los datos cambiaron
    if (oldTableHTML !== itemsTable.innerHTML) {
        const rows = itemsTable.getElementsByTagName('tr');
        if (rows.length > 0) {
            rows[0].classList.add('highlight');
            setTimeout(() => {
                if (rows[0]) rows[0].classList.remove('highlight');
            }, 1000);
        }
    }
}

// Mostrar alerta
function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto-eliminar la alerta después de 5 segundos
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

// Limpiar intervalo cuando se cierra la página
window.addEventListener('beforeunload', () => {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
});