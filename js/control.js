// URL base de la API
const API_URL = 'https://68bb0de584055bce63f104ef.mockapi.io/api/v1/dispositivos_IoT';

// Elementos del DOM
const itemsTable = document.getElementById('itemsTable');
const alertContainer = document.getElementById('alertContainer');
const refreshBtn = document.getElementById('refreshBtn');
const itemForm = document.getElementById('itemForm');
const statusSelect = document.getElementById('status');
const currentStatus = document.getElementById('currentStatus');
const controlPanel = document.getElementById('controlPanel');
const loadingSpinner = document.getElementById('loadingSpinner');

// Estado de la aplicación
const appState = {
    isLoading: false,
    isOnline: true,
    lastUpdate: null
};

// Cache de datos
let dataCache = [];

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// Inicializar la aplicación
async function initApp() {
    setupEventListeners();
    createControlButtons();
    checkConnection();
    await loadItems();
    startAutoRefresh();
}

// Configurar event listeners
function setupEventListeners() {
    refreshBtn.addEventListener('click', () => loadItems(true));
    itemForm.addEventListener('submit', handleFormSubmit);
    
    // Event listeners para teclas de acceso rápido
    document.addEventListener('keydown', handleKeyPress);
    
    // Verificar conexión cuando cambia la conectividad
    window.addEventListener('online', () => {
        appState.isOnline = true;
        updateConnectionStatus();
        showAlert('Conexión restablecida', 'success');
        loadItems(true);
    });
    
    window.addEventListener('offline', () => {
        appState.isOnline = false;
        updateConnectionStatus();
        showAlert('Sin conexión a internet', 'warning');
    });
}

// Manejar teclas de acceso rápido
function handleKeyPress(e) {
    // Solo activar si no se está escribiendo en un campo de texto
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        switch(e.key) {
            case '1': sendCommand('ADELANTE'); break;
            case '2': sendCommand('ATRAS'); break;
            case '3': sendCommand('DETENER'); break;
            case 'r': case 'R': loadItems(true); break;
            case 'Escape': clearAlerts(); break;
        }
    }
}

// Crear botones de control con iconos
function createControlButtons() {
    const buttonGroups = [
        ['ADELANTE', 'success', 'fa-arrow-up'],
        ['ATRAS', 'danger', 'fa-arrow-down'],
        ['DETENER', 'secondary', 'fa-stop'],
        ['ADELANTE DERECHA', 'primary', 'fa-arrow-up-right'],
        ['ADELANTE IZQUIERDA', 'primary', 'fa-arrow-up-left'],
        ['ATRAS DERECHA', 'warning', 'fa-arrow-down-right'],
        ['ATRAS IZQUIERDA', 'warning', 'fa-arrow-down-left'],
        ['GIRO 90 GRADOS DERECHA', 'info', 'fa-redo-alt'],
        ['GIRO 90 GRADOS IZQUIERDA', 'info', 'fa-undo-alt'],
        ['GIRO 360 GRADOS DERECHA', 'dark', 'fa-sync-alt'],
        ['GIRO 360 GRADOS IZQUIERDA', 'dark', 'fa-sync-alt']
    ];

    controlPanel.innerHTML = ''; // Limpiar antes de agregar

    buttonGroups.forEach(([estado, color, icon]) => {
        const col = document.createElement('div');
        col.className = 'col-6 col-md-4 col-lg-3 mb-3';
        
        const button = document.createElement('button');
        button.className = `btn btn-${color} w-100 control-btn d-flex flex-column align-items-center`;
        button.innerHTML = `<i class="fas ${icon} mb-1"></i> ${estado}`;
        button.type = 'button';
        button.title = `Comando: ${estado} (Click o presiona la tecla correspondiente)`;
        button.addEventListener('click', () => {
            sendCommand(estado);
        });
        
        // Tooltip de Bootstrap
        button.setAttribute('data-bs-toggle', 'tooltip');
        button.setAttribute('data-bs-placement', 'top');
        
        col.appendChild(button);
        controlPanel.appendChild(col);
    });

    // Inicializar tooltips
    const tooltipTriggerList = [].slice.call(controlPanel.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Verificar conexión a internet
function checkConnection() {
    appState.isOnline = navigator.onLine;
    updateConnectionStatus();
}

// Actualizar indicador de estado de conexión
function updateConnectionStatus() {
    const statusIndicator = document.getElementById('connectionStatus') || createConnectionIndicator();
    statusIndicator.className = `badge ${appState.isOnline ? 'bg-success' : 'bg-danger'}`;
    statusIndicator.innerHTML = `<i class="fas ${appState.isOnline ? 'fa-wifi' : 'fa-exclamation-triangle'}"></i> ${appState.isOnline ? 'Conectado' : 'Sin conexión'}`;
}

// Crear indicador de conexión si no existe
function createConnectionIndicator() {
    const indicator = document.createElement('span');
    indicator.id = 'connectionStatus';
    indicator.className = 'badge bg-success';
    
    const navbar = document.querySelector('.navbar-nav');
    const li = document.createElement('li');
    li.className = 'nav-item';
    li.appendChild(indicator);
    
    navbar.appendChild(li);
    return indicator;
}

// Iniciar actualización automática
function startAutoRefresh() {
    setInterval(() => {
        if (appState.isOnline && document.visibilityState === 'visible') {
            loadItems(false); // Actualizar silenciosamente
        }
    }, 10000); // Actualizar cada 10 segundos
}

// Enviar comando
async function sendCommand(comando) {
    if (!appState.isOnline) {
        showAlert('No hay conexión a internet. No se puede enviar el comando.', 'warning');
        return;
    }

    setLoadingState(true);
    
    try {
        const formData = {
            name: `Dispositivo_${Math.floor(Math.random() * 1000)}`,
            status: comando,
            ip: await getClientIP(),
            date: new Date().toLocaleString("es-MX", {timeZone: "America/Mexico_City"})
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Error al enviar el comando');

        showAlert(`Comando "${comando}" enviado correctamente`, 'success');
        updateCurrentStatus(comando);
        await loadItems(true);
        
        // Efecto de confirmación en el botón presionado
        const buttons = controlPanel.querySelectorAll('.control-btn');
        buttons.forEach(btn => {
            if (btn.textContent.includes(comando)) {
                btn.classList.add('active');
                setTimeout(() => btn.classList.remove('active'), 500);
            }
        });
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al enviar el comando', 'danger');
    } finally {
        setLoadingState(false);
    }
}

// Obtener IP del cliente con cache
async function getClientIP() {
    // Intentar obtener IP real
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error al obtener IP real:', error);
        
        // Generar IP aleatoria como fallback
        return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    }
}

// Manejar envío del formulario
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!statusSelect.value) {
        showAlert('Por favor seleccione un estado', 'warning');
        return;
    }
    
    if (!appState.isOnline) {
        showAlert('No hay conexión a internet. No se puede enviar el comando.', 'warning');
        return;
    }
    
    setLoadingState(true);
    
    try {
        const formData = {
            name: `Dispositivo_${Math.floor(Math.random() * 1000)}`,
            status: statusSelect.value,
            ip: await getClientIP(),
            date: new Date().toLocaleString("es-MX", {timeZone: "America/Mexico_City"})
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Error al crear el registro');

        showAlert('Registro creado con éxito', 'success');
        updateCurrentStatus(statusSelect.value);
        statusSelect.value = '';
        await loadItems(true);
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al crear el registro', 'danger');
    } finally {
        setLoadingState(false);
    }
}

// Cargar los últimos 5 registros
async function loadItems(forceRefresh = false) {
    if (!appState.isOnline && !forceRefresh) {
        // Mostrar datos cacheados si estamos offline
        if (dataCache.length > 0) {
            renderItemsTable(dataCache.slice(0, 5));
            if (dataCache.length > 0) {
                updateCurrentStatus(dataCache[0].status);
            }
        }
        return;
    }

    setLoadingState(true, true);
    
    try {
        const response = await fetch(`${API_URL}?page=1&limit=10&sortBy=createdAt&order=desc`);
        if (!response.ok) throw new Error('Error al cargar los datos');
        
        const items = await response.json();
        
        // Actualizar cache
        dataCache = items;
        
        // Ordenar por fecha (más recientes primero) y tomar los últimos 5
        const sortedItems = items.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
        const lastFiveItems = sortedItems.slice(0, 5);
        
        if (lastFiveItems.length === 0) {
            itemsTable.innerHTML = '<tr><td colspan="6" class="text-center">No hay registros para mostrar</td></tr>';
            return;
        }
        
        renderItemsTable(lastFiveItems);
        
        // Actualizar estado actual con el último registro
        if (sortedItems.length > 0) {
            updateCurrentStatus(sortedItems[0].status);
        }
        
        // Actualizar timestamp
        appState.lastUpdate = new Date();
        updateLastUpdateTime();
        
    } catch (error) {
        console.error('Error:', error);
        
        // Mostrar datos cacheados si hay error
        if (dataCache.length > 0) {
            renderItemsTable(dataCache.slice(0, 5));
            if (dataCache.length > 0) {
                updateCurrentStatus(dataCache[0].status);
            }
            showAlert('Mostrando datos cacheados. Error al cargar nuevos registros', 'warning');
        } else {
            itemsTable.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar los datos</td></tr>';
            showAlert('Error al cargar los registros', 'danger');
        }
    } finally {
        setLoadingState(false, true);
    }
}

// Actualizar estado actual
function updateCurrentStatus(status) {
    currentStatus.textContent = status;
    
    // Limpiar todas las clases de estado previas
    currentStatus.className = 'display-6';
    
    // Aplicar nueva clase según el estado
    if (status.includes('ADELANTE')) {
        currentStatus.classList.add('text-success');
    } else if (status.includes('ATRAS')) {
        currentStatus.classList.add('text-danger');
    } else if (status === 'DETENER') {
        currentStatus.classList.add('text-secondary');
    } else if (status.includes('GIRO') || status.includes('DERECHA') || status.includes('IZQUIERDA')) {
        currentStatus.classList.add('text-warning');
    }
    
    // Actualizar también el último estado en la UI si existe
    if (lastStatusEl) {
        lastStatusEl.textContent = status;
    }
}

// Renderizar la tabla de registros
function renderItemsTable(items) {
    itemsTable.innerHTML = items.map(item => `
        <tr>
            <td>${item.id}</td>
            <td>${item.name || 'Dispositivo IoT'}</td>
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
            <td>${formatDate(item.date || item.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteItem('${item.id}')">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </td>
        </tr>
    `).join('');
}

// Formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString("es-MX", {
        timeZone: "America/Mexico_City",
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Actualizar hora de última actualización
function updateLastUpdateTime() {
    const lastUpdateEl = document.getElementById('lastUpdate');
    if (lastUpdateEl && appState.lastUpdate) {
        lastUpdateEl.textContent = `Última actualización: ${appState.lastUpdate.toLocaleTimeString()}`;
    }
}

// Eliminar un registro
async function deleteItem(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro?')) return;
    
    if (!appState.isOnline) {
        showAlert('No hay conexión a internet. No se puede eliminar el registro.', 'warning');
        return;
    }
    
    setLoadingState(true);
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Error al eliminar el registro');
        
        showAlert('Registro eliminado con éxito', 'success');
        await loadItems(true);
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al eliminar el registro', 'danger');
    } finally {
        setLoadingState(false);
    }
}

// Controlar estado de carga
function setLoadingState(isLoading, isTable = false) {
    appState.isLoading = isLoading;
    
    if (isTable) {
        const spinner = itemsTable.querySelector('.spinner-border');
        if (isLoading && !spinner) {
            itemsTable.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <div class="spinner-border spinner-border-sm" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                        Cargando datos...
                    </td>
                </tr>
            `;
        }
    } else {
        const buttons = document.querySelectorAll('button:not([data-bs-dismiss="alert"])');
        buttons.forEach(button => {
            if (isLoading) {
                button.disabled = true;
                const originalText = button.innerHTML;
                button.setAttribute('data-original-text', originalText);
                button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
            } else {
                button.disabled = false;
                const originalText = button.getAttribute('data-original-text');
                if (originalText) {
                    button.innerHTML = originalText;
                }
            }
        });
    }
}

// Mostrar alerta
function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                         type === 'danger' ? 'fa-exclamation-circle' : 
                         type === 'warning' ? 'fa-exclamation-triangle' : 
                         'fa-info-circle'} me-2"></i>
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

// Limpiar todas las alertas
function clearAlerts() {
    alertContainer.innerHTML = '';
}

// Hacer funciones globales para los eventos onclick
window.deleteItem = deleteItem;