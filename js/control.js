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

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    createControlButtons();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    refreshBtn.addEventListener('click', loadItems);
    itemForm.addEventListener('submit', handleFormSubmit);
}

// Crear botones de control
function createControlButtons() {
    const buttonGroups = [
        ['ADELANTE', 'success'],
        ['ATRAS', 'danger'],
        ['DETENER', 'secondary'],
        ['ADELANTE DERECHA', 'primary'],
        ['ADELANTE IZQUIERDA', 'primary'],
        ['ATRAS DERECHA', 'warning'],
        ['ATRAS IZQUIERDA', 'warning'],
        ['GIRO 90 GRADOS DERECHA', 'info'],
        ['GIRO 90 GRADOS IZQUIERDA', 'info'],
        ['GIRO 360 GRADOS DERECHA', 'dark'],
        ['GIRO 360 GRADOS IZQUIERDA', 'dark']
    ];

    buttonGroups.forEach(([estado, color]) => {
        const col = document.createElement('div');
        col.className = 'col-6 col-md-4 col-lg-3 mb-3';
        
        const button = document.createElement('button');
        button.className = `btn btn-${color} w-100 control-btn`;
        button.textContent = estado;
        button.type = 'button';
        button.addEventListener('click', () => {
            sendCommand(estado);
        });
        
        col.appendChild(button);
        controlPanel.appendChild(col);
    });
}

// Enviar comando
async function sendCommand(comando) {
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
        loadItems();
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al enviar el comando', 'danger');
    }
}

// Obtener IP del cliente (simulada)
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error al obtener IP:', error);
        return '192.168.1.1'; // IP por defecto en caso de error
    }
}

// Manejar envío del formulario
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!statusSelect.value) {
        showAlert('Por favor seleccione un estado', 'warning');
        return;
    }
    
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
        loadItems();
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al crear el registro', 'danger');
    }
}

// Cargar los últimos 5 registros
async function loadItems() {
    try {
        itemsTable.innerHTML = '<tr><td colspan="6" class="text-center">Cargando datos...</td></tr>';
        
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error al cargar los datos');
        
        const items = await response.json();
        
        // Ordenar por fecha (más recientes primero) y tomar los últimos 5
        const sortedItems = items.sort((a, b) => new Date(b.date) - new Date(a.date));
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
    } catch (error) {
        console.error('Error:', error);
        itemsTable.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar los datos</td></tr>';
        showAlert('Error al cargar los registros', 'danger');
    }
}

// Actualizar estado actual
function updateCurrentStatus(status) {
    currentStatus.textContent = status;
    
    // Aplicar clase según el tipo de estado
    currentStatus.className = 'display-6';
    if (status.includes('ADELANTE')) {
        currentStatus.classList.add('status-ADELANTE');
    } else if (status.includes('ATRAS')) {
        currentStatus.classList.add('status-ATRAS');
    } else if (status === 'DETENER') {
        currentStatus.classList.add('status-DETENER');
    } else if (status.includes('GIRO')) {
        currentStatus.classList.add('status-GIRO');
    }
}

// Renderizar la tabla de registros
function renderItemsTable(items) {
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
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteItem('${item.id}')">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </td>
        </tr>
    `).join('');
}

// Eliminar un registro
async function deleteItem(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro?')) return;
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Error al eliminar el registro');
        
        showAlert('Registro eliminado con éxito', 'success');
        loadItems();
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al eliminar el registro', 'danger');
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